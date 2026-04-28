/**
 * Sites API - WordPress site management
 */

import { allocateStorage, deleteStorageSite } from '../storage.js';
import { createD1Tables, deleteD1Tables } from '../db.js';
import { deployWordPressWorker, deleteWorker } from '../cloudflare.js';
import { generateSiteId, generateDbSuffix } from '../utils.js';

export async function handleSitesAPI(request, env, ctx, user, path) {
  const url = new URL(request.url);
  const method = request.method;
  const parts = path.split('/');
  const siteId = parts[1];

  // GET /api/sites - list user's sites
  if (method === 'GET' && !siteId) {
    return listSites(env, user);
  }

  // POST /api/sites - create new site
  if (method === 'POST' && !siteId) {
    return createSite(request, env, user);
  }

  // GET /api/sites/:id - get single site
  if (method === 'GET' && siteId) {
    return getSite(env, user, siteId);
  }

  // PUT /api/sites/:id - update site
  if (method === 'PUT' && siteId) {
    return updateSite(request, env, user, siteId);
  }

  // DELETE /api/sites/:id - delete site
  if (method === 'DELETE' && siteId) {
    return deleteSite(env, ctx, user, siteId);
  }

  // POST /api/sites/:id/purge-cache - purge site cache
  if (method === 'POST' && siteId && parts[2] === 'purge-cache') {
    return purgeSiteCache(env, user, siteId);
  }

  // POST /api/sites/:id/domains - add domain
  if (method === 'POST' && siteId && parts[2] === 'domains') {
    return addDomain(request, env, user, siteId);
  }

  // DELETE /api/sites/:id/domains/:domain - remove domain
  if (method === 'DELETE' && siteId && parts[2] === 'domains' && parts[3]) {
    return removeDomain(env, user, siteId, decodeURIComponent(parts[3]));
  }

  // GET /api/sites/:id/files - file manager
  if (method === 'GET' && siteId && parts[2] === 'files') {
    return listFiles(env, user, siteId, url.searchParams.get('path') || '/');
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function listSites(env, user) {
  const { results } = await env.DB.prepare(`
    SELECT s.*, 
      GROUP_CONCAT(sd.domain) as domains,
      (SELECT sd2.domain FROM site_domains sd2 WHERE sd2.site_id = s.id AND sd2.is_primary = 1 LIMIT 1) as primary_domain
    FROM sites s
    LEFT JOIN site_domains sd ON s.id = sd.site_id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).bind(user.id).all();

  const sites = results.map(site => ({
    ...site,
    domains: site.domains ? site.domains.split(',') : [],
  }));

  return Response.json({ sites });
}

async function createSite(request, env, user) {
  const body = await request.json();
  const { site_name, domain, region, php_version, wordpress_version, admin_email, admin_user, admin_pass } = body;

  if (!site_name || !domain || !admin_email || !admin_user || !admin_pass) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate domain format
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-\.]{0,61}[a-zA-Z0-9]$/.test(domain)) {
    return Response.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  // Check if domain already in use
  const existingDomain = await env.DB.prepare(
    'SELECT id FROM site_domains WHERE domain = ?'
  ).bind(domain).first();

  if (existingDomain) {
    return Response.json({ error: 'Domain already in use' }, { status: 409 });
  }

  // Check user site limit
  const siteCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM sites WHERE user_id = ?'
  ).bind(user.id).first();

  const plan = await env.KV.get(`user:plan:${user.id}`, 'json') || { max_sites: 1 };
  if (siteCount.count >= plan.max_sites) {
    return Response.json({ error: 'Site limit reached for your plan' }, { status: 403 });
  }

  const siteId = generateSiteId();
  const dbSuffix = generateDbSuffix(siteId);

  try {
    // 1. Allocate Supabase storage
    let storageConfig;
    try {
      storageConfig = await allocateStorage(env, siteId);
    } catch (e) {
      return Response.json({ error: 'Storage allocation failed: ' + e.message }, { status: 503 });
    }

    // 2. Create D1 tables for this WordPress site
    await createD1Tables(env, siteId, dbSuffix, {
      siteUrl: `https://${domain}`,
      blogName: site_name,
      adminEmail: admin_email,
      adminUser: admin_user,
      adminPass: admin_pass,
    });

    // 3. Create KV namespace entries
    await env.KV.put(`site:config:${siteId}`, JSON.stringify({
      site_title: site_name,
      site_description: '',
      php_version: php_version || '8.2',
      wordpress_version: wordpress_version || '6.4',
      cache_enabled: true,
      cache_ttl: 3600,
      max_upload_mb: 64,
      region: region || 'auto',
    }));

    await env.KV.put(`site:storage:${siteId}`, JSON.stringify(storageConfig));

    // 4. Deploy Cloudflare Worker for this site
    const userCFConfig = await env.KV.get(`user:cf:${user.id}`, 'json');
    if (userCFConfig) {
      try {
        await deployWordPressWorker(userCFConfig, siteId, domain, env);
      } catch (e) {
        console.error('Worker deployment failed:', e);
        // Non-fatal - user can manually configure
      }
    }

    // 5. Save to database
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO sites (id, user_id, site_name, status, db_suffix, region, php_version, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
    `).bind(siteId, user.id, site_name, dbSuffix, region || 'auto', php_version || '8.2', now, now).run();

    await env.DB.prepare(`
      INSERT INTO site_domains (site_id, domain, is_primary, created_at)
      VALUES (?, ?, 1, ?)
    `).bind(siteId, domain, now).run();

    // 6. Configure WAF for the new site
    const wafConfig = await env.KV.get('waf:config', 'json') || {};
    wafConfig[`site_${siteId}`] = { enabled: true, ddos_protection: true };
    await env.KV.put('waf:config', JSON.stringify(wafConfig));

    return Response.json({
      success: true,
      site: {
        id: siteId,
        site_name,
        primary_domain: domain,
        status: 'active',
        php_version: php_version || '8.2',
        created_at: now,
        setup_instructions: {
          dns: `Add an A record for ${domain} pointing to 192.0.2.1 (Cloudflare Anycast)`,
          nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Site creation error:', error);
    // Cleanup on failure
    try {
      await deleteStorageSite(env, siteId);
    } catch (e) {}
    return Response.json({ error: 'Site creation failed: ' + error.message }, { status: 500 });
  }
}

async function getSite(env, user, siteId) {
  const site = await env.DB.prepare(`
    SELECT s.*, GROUP_CONCAT(sd.domain || ':' || sd.is_primary) as domain_data
    FROM sites s
    LEFT JOIN site_domains sd ON s.id = sd.site_id
    WHERE s.id = ? AND s.user_id = ?
    GROUP BY s.id
  `).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  const domains = site.domain_data ? site.domain_data.split(',').map(d => {
    const [domain, isPrimary] = d.split(':');
    return { domain, is_primary: isPrimary === '1' };
  }) : [];

  const config = await env.KV.get(`site:config:${siteId}`, 'json') || {};

  return Response.json({ site: { ...site, domains, config } });
}

async function updateSite(request, env, user, siteId) {
  const site = await env.DB.prepare(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  const body = await request.json();
  const allowedFields = ['site_name', 'php_version', 'status'];

  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0 && !body.config) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await env.DB.prepare(`
      UPDATE sites SET ${setClause}, updated_at = ? WHERE id = ?
    `).bind(...Object.values(updates), new Date().toISOString(), siteId).run();
  }

  if (body.config) {
    const existing = await env.KV.get(`site:config:${siteId}`, 'json') || {};
    await env.KV.put(`site:config:${siteId}`, JSON.stringify({ ...existing, ...body.config }));
  }

  return Response.json({ success: true });
}

async function deleteSite(env, ctx, user, siteId) {
  const site = await env.DB.prepare(
    'SELECT * FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  // Mark as deleting
  await env.DB.prepare(
    'UPDATE sites SET status = ? WHERE id = ?'
  ).bind('deleting', siteId).run();

  // Run cleanup in background
  ctx.waitUntil(cleanupSite(env, site));

  return Response.json({ success: true, message: 'Site deletion initiated' });
}

async function cleanupSite(env, site) {
  const siteId = site.id;

  try {
    // 1. Delete Supabase storage
    await deleteStorageSite(env, siteId);

    // 2. Delete D1 tables
    await deleteD1Tables(env, siteId, site.db_suffix);

    // 3. Delete KV entries
    const kvKeys = [
      `site:config:${siteId}`,
      `site:storage:${siteId}`,
      `site:theme:${siteId}`,
      `site:domain:${site.primary_domain}`,
    ];
    await Promise.all(kvKeys.map(k => env.KV.delete(k)));

    // 4. Delete Worker (if Cloudflare API configured)
    const userCFConfig = await env.KV.get(`user:cf:${site.user_id}`, 'json');
    if (userCFConfig) {
      await deleteWorker(userCFConfig, siteId).catch(console.error);
    }

    // 5. Remove from database
    await env.DB.prepare('DELETE FROM site_domains WHERE site_id = ?').bind(siteId).run();
    await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(siteId).run();

  } catch (e) {
    console.error('Site cleanup error:', e);
    await env.DB.prepare(
      'UPDATE sites SET status = ? WHERE id = ?'
    ).bind('error', siteId).run();
  }
}

async function purgeSiteCache(env, user, siteId) {
  const site = await env.DB.prepare(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  // Delete all cache keys for this site
  const cacheList = await env.KV.list({ prefix: `wp:${siteId}:` });
  const staticList = await env.KV.list({ prefix: `static:${siteId}:` });

  await Promise.all([
    ...cacheList.keys.map(k => env.KV.delete(k.name)),
    ...staticList.keys.map(k => env.KV.delete(k.name)),
  ]);

  return Response.json({
    success: true,
    purged: cacheList.keys.length + staticList.keys.length
  });
}

async function addDomain(request, env, user, siteId) {
  const site = await env.DB.prepare(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  const { domain, is_primary } = await request.json();

  // Check if domain already in use
  const existing = await env.DB.prepare(
    'SELECT id FROM site_domains WHERE domain = ?'
  ).bind(domain).first();

  if (existing) return Response.json({ error: 'Domain already in use' }, { status: 409 });

  if (is_primary) {
    await env.DB.prepare(
      'UPDATE site_domains SET is_primary = 0 WHERE site_id = ?'
    ).bind(siteId).run();
  }

  await env.DB.prepare(`
    INSERT INTO site_domains (site_id, domain, is_primary, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(siteId, domain, is_primary ? 1 : 0, new Date().toISOString()).run();

  // Cache domain mapping
  await env.KV.put(`site:domain:${domain}`, siteId);

  return Response.json({ success: true, domain, is_primary: !!is_primary });
}

async function removeDomain(env, user, siteId, domain) {
  const site = await env.DB.prepare(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  const domainRecord = await env.DB.prepare(
    'SELECT * FROM site_domains WHERE site_id = ? AND domain = ?'
  ).bind(siteId, domain).first();

  if (!domainRecord) return Response.json({ error: 'Domain not found' }, { status: 404 });
  if (domainRecord.is_primary) return Response.json({ error: 'Cannot remove primary domain' }, { status: 400 });

  await env.DB.prepare(
    'DELETE FROM site_domains WHERE site_id = ? AND domain = ?'
  ).bind(siteId, domain).run();

  await env.KV.delete(`site:domain:${domain}`);

  return Response.json({ success: true });
}

async function listFiles(env, user, siteId, dirPath) {
  const site = await env.DB.prepare(
    'SELECT * FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) return Response.json({ error: 'Storage not configured' }, { status: 503 });

  const { supabase_url, service_key, bucket } = storageConfig;
  const prefix = dirPath === '/' ? '' : dirPath.replace(/^\//, '');

  const response = await fetch(`${supabase_url}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${service_key}`,
      'apikey': service_key,
    },
    body: JSON.stringify({ prefix, limit: 200, delimiter: '/' })
  });

  if (!response.ok) return Response.json({ error: 'Failed to list files' }, { status: 502 });

  const files = await response.json();
  return Response.json({ files, path: dirPath });
}
