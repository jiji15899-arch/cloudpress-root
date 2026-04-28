/**
 * CloudPress API Router
 */

import { handleSitesAPI } from './sites.js';
import { handleDNSAPI } from './dns.js';
import { handleAuthAPI } from './auth.js';
import { handleStorageAPI } from './storage-api.js';
import { handleSettingsAPI } from './settings.js';
import { handleDomainsAPI } from './domains.js';
import { requireAuth } from '../auth.js';

export async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let response;

    // Public endpoints
    if (path.startsWith('auth/')) {
      response = await handleAuthAPI(request, env, ctx, path.replace('auth/', ''));
    } else {
      // Protected endpoints - require auth
      const user = await requireAuth(request, env);
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }

      if (path.startsWith('sites')) {
        response = await handleSitesAPI(request, env, ctx, user, path);
      } else if (path.startsWith('dns')) {
        response = await handleDNSAPI(request, env, ctx, user, path);
      } else if (path.startsWith('domains')) {
        response = await handleDomainsAPI(request, env, ctx, user, path);
      } else if (path.startsWith('storage')) {
        response = await handleStorageAPI(request, env, ctx, user, path);
      } else if (path.startsWith('settings')) {
        response = await handleSettingsAPI(request, env, ctx, user, path);
      } else if (path === 'user') {
        response = Response.json({ user: sanitizeUser(user) });
      } else if (path === 'stats') {
        response = await handleStatsAPI(request, env, user);
      } else {
        response = Response.json({ error: 'Not found' }, { status: 404 });
      }
    }

    // Add CORS headers to all responses
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleStatsAPI(request, env, user) {
  const sites = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM sites WHERE user_id = ?
  `).bind(user.id).first();

  const domains = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM site_domains sd
    JOIN sites s ON sd.site_id = s.id
    WHERE s.user_id = ?
  `).bind(user.id).first();

  const traffic = await env.KV.get(`stats:traffic:${user.id}`, 'json') || { requests: 0, bandwidth: 0 };

  return Response.json({
    sites: sites?.count || 0,
    domains: domains?.count || 0,
    traffic,
  });
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}
