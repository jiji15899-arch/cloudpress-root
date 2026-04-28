/**
 * CloudPress - WordPress Hosting on Cloudflare Workers
 * Main Worker Entry Point
 */

import { handleWordPress } from './wordpress-runtime.js';
import { handleDashboard } from './dashboard.js';
import { handleAdmin } from './admin.js';
import { handleAPI } from './api/index.js';
import { getConfig, isWordPressDomain } from './config.js';
import { applyWAF } from './waf.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = request.headers.get('host') || '';

    // WAF & DDoS Protection
    const wafResult = await applyWAF(request, env);
    if (wafResult) return wafResult;

    // Admin dashboard domain
    if (host === env.ADMIN_DOMAIN || host === `www.${env.ADMIN_DOMAIN}`) {
      if (url.pathname.startsWith('/api/')) {
        return handleAPI(request, env, ctx);
      }
      return handleDashboard(request, env, ctx);
    }

    // Super admin panel
    if (host === env.SUPERADMIN_DOMAIN) {
      return handleAdmin(request, env, ctx);
    }

    // WordPress site routing
    const site = await getSiteByDomain(host, env);
    if (site) {
      return handleWordPress(request, env, ctx, site);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    // Cleanup expired cache, sessions, etc.
    ctx.waitUntil(runScheduledTasks(env));
  }
};

async function getSiteByDomain(host, env) {
  const cacheKey = `site:domain:${host}`;
  const cached = await env.KV.get(cacheKey, 'json');
  if (cached) return cached;

  const db = env.DB;
  const result = await db.prepare(`
    SELECT s.*,
      d.domain AS accessed_domain,
      d.is_primary,
      (SELECT sd2.domain FROM site_domains sd2
       WHERE sd2.site_id = s.id AND sd2.is_primary = 1 LIMIT 1) AS primary_domain
    FROM sites s
    JOIN site_domains d ON s.id = d.site_id
    WHERE d.domain = ? AND s.status = 'active'
    LIMIT 1
  `).bind(host).first();

  if (result) {
    await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
  }
  return result;
}

async function runScheduledTasks(env) {
  // Cleanup old sessions
  await env.DB.prepare(
    `DELETE FROM sessions WHERE expires_at < datetime('now')`
  ).run();

  // Cleanup expired cache keys
  const expiredCacheKeys = await env.KV.list({ prefix: 'cache:expired:' });
  for (const key of expiredCacheKeys.keys) {
    await env.KV.delete(key.name);
  }
}
