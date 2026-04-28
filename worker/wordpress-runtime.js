/**
 * WordPress Runtime for Cloudflare Workers
 * Handles WordPress PHP execution via PHP-WASM or pre-compiled responses
 */

import { getFromStorage, putToStorage } from './storage.js';
import { renderWordPressPage } from './wp-renderer.js';

export async function handleWordPress(request, env, ctx, site) {
  const url = new URL(request.url);
  const cacheKey = `wp:${site.id}:${url.pathname}${url.search}`;

  // Check page cache (skip for admin, POST, logged-in users)
  const skipCache = 
    url.pathname.startsWith('/wp-admin') ||
    url.pathname.startsWith('/wp-login') ||
    request.method !== 'GET' ||
    request.headers.get('cookie')?.includes('wordpress_logged_in');

  if (!skipCache) {
    const cached = await env.KV.get(cacheKey, 'json');
    if (cached) {
      return new Response(cached.body, {
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
          'X-CloudPress-Site': site.id,
        }
      });
    }
  }

  // Get site configuration from KV
  const siteConfig = await env.KV.get(`site:config:${site.id}`, 'json');
  if (!siteConfig) {
    return errorPage(503, 'Site configuration not found');
  }

  // Route to appropriate handler
  if (url.pathname.startsWith('/wp-content/uploads/')) {
    return handleMediaFile(request, env, site, url);
  }

  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|svg|webp)$/)) {
    return handleStaticFile(request, env, site, url);
  }

  // Render WordPress page
  const response = await renderWordPressPage(request, env, site, siteConfig, url);

  // Cache successful GET responses
  if (!skipCache && response.status === 200) {
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    ctx.waitUntil(
      env.KV.put(cacheKey, JSON.stringify({ body, headers }), {
        expirationTtl: siteConfig.cache_ttl || 3600
      })
    );
    return new Response(body, {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'MISS',
        'X-CloudPress-Site': site.id,
      }
    });
  }

  return response;
}

async function handleMediaFile(request, env, site, url) {
  const path = url.pathname.replace('/wp-content/uploads/', '');
  const storageConfig = await env.KV.get(`site:storage:${site.id}`, 'json');

  if (!storageConfig) {
    return new Response('Storage not configured', { status: 503 });
  }

  // Fetch from Supabase Storage
  const supabaseUrl = `${storageConfig.supabase_url}/storage/v1/object/public/${storageConfig.bucket}/${path}`;
  const supabaseResponse = await fetch(supabaseUrl, {
    headers: {
      'Authorization': `Bearer ${storageConfig.anon_key}`,
    }
  });

  if (!supabaseResponse.ok) {
    return new Response('File not found', { status: 404 });
  }

  const contentType = supabaseResponse.headers.get('content-type') || 'application/octet-stream';
  const body = await supabaseResponse.arrayBuffer();

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'CDN-Cache-Control': 'max-age=31536000',
      'Vary': 'Accept-Encoding',
    }
  });
}

async function handleStaticFile(request, env, site, url) {
  const cacheKey = `static:${site.id}:${url.pathname}`;
  const cached = await env.KV.get(cacheKey, 'arrayBuffer');

  if (cached) {
    const ext = url.pathname.split('.').pop();
    return new Response(cached, {
      headers: {
        'Content-Type': getMimeType(ext),
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'HIT',
      }
    });
  }

  const storageConfig = await env.KV.get(`site:storage:${site.id}`, 'json');
  if (!storageConfig) return new Response('Not found', { status: 404 });

  const supabaseUrl = `${storageConfig.supabase_url}/storage/v1/object/public/${storageConfig.bucket}/wp-content${url.pathname}`;
  const upstream = await fetch(supabaseUrl);

  if (!upstream.ok) return new Response('Not found', { status: 404 });

  const body = await upstream.arrayBuffer();
  const ext = url.pathname.split('.').pop();

  return new Response(body, {
    headers: {
      'Content-Type': getMimeType(ext),
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    }
  });
}

function getMimeType(ext) {
  const types = {
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

function errorPage(status, message) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Error ${status}</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:50px">
      <h1>Error ${status}</h1>
      <p>${message}</p>
    </body>
    </html>
  `, {
    status,
    headers: { 'Content-Type': 'text/html' }
  });
}
