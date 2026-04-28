/**
 * Cloudflare Worker Deployment
 * Deploys per-site WordPress workers
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function deployWordPressWorker(cfConfig, siteId, domain, env) {
  const { email, global_api_key, account_id } = cfConfig;

  const workerScript = generateWorkerScript(siteId, domain);

  // Deploy worker script
  const deployResp = await fetch(
    `${CF_API}/accounts/${account_id}/workers/scripts/cloudpress-site-${siteId}`,
    {
      method: 'PUT',
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': global_api_key,
        'Content-Type': 'application/javascript',
      },
      body: workerScript,
    }
  );

  if (!deployResp.ok) {
    const err = await deployResp.text();
    throw new Error(`Worker deploy failed: ${err}`);
  }

  // Create worker route for the domain
  try {
    const zoneId = await getZoneId(cfConfig, domain);
    if (zoneId) {
      await fetch(`${CF_API}/zones/${zoneId}/workers/routes`, {
        method: 'POST',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': global_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern: `${domain}/*`,
          script: `cloudpress-site-${siteId}`,
        })
      });
    }
  } catch (e) {
    console.error('Route creation failed:', e);
  }

  return { success: true, worker_id: `cloudpress-site-${siteId}` };
}

export async function deleteWorker(cfConfig, siteId) {
  const { email, global_api_key, account_id } = cfConfig;

  const resp = await fetch(
    `${CF_API}/accounts/${account_id}/workers/scripts/cloudpress-site-${siteId}`,
    {
      method: 'DELETE',
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': global_api_key,
      }
    }
  );

  return resp.ok;
}

async function getZoneId(cfConfig, domain) {
  const { email, global_api_key } = cfConfig;

  // Extract root domain
  const parts = domain.split('.');
  const rootDomain = parts.slice(-2).join('.');

  const resp = await fetch(`${CF_API}/zones?name=${rootDomain}`, {
    headers: {
      'X-Auth-Email': email,
      'X-Auth-Key': global_api_key,
    }
  });

  const data = await resp.json();
  if (data.success && data.result.length > 0) {
    return data.result[0].id;
  }
  return null;
}

function generateWorkerScript(siteId, allowedDomain) {
  return `
/**
 * CloudPress WordPress Worker - Site: ${siteId}
 * Auto-generated - Do not edit manually
 */

const SITE_ID = '${siteId}';
const ALLOWED_DOMAINS = ['${allowedDomain}', 'www.${allowedDomain}'];
const CLOUDPRESS_WORKER = 'https://cloudpress.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = request.headers.get('host') || '';

    // Security: Only allow configured domains (Host header validation)
    if (!ALLOWED_DOMAINS.includes(host)) {
      return new Response('Domain not authorized', { 
        status: 403,
        headers: { 'X-CloudPress-Security': 'domain-mismatch' }
      });
    }

    // Forward to CloudPress main worker with site context
    const cloudpressUrl = new URL(request.url);
    cloudpressUrl.host = 'cloudpress-main.workers.dev';

    const modifiedRequest = new Request(cloudpressUrl.toString(), {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-CloudPress-Site': SITE_ID,
        'X-CloudPress-Host': host,
        'X-Forwarded-Host': host,
      },
      body: request.body,
    });

    const response = await fetch(modifiedRequest);

    // Add security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
`;
}

export async function listWorkers(cfConfig) {
  const { email, global_api_key, account_id } = cfConfig;

  const resp = await fetch(`${CF_API}/accounts/${account_id}/workers/scripts`, {
    headers: {
      'X-Auth-Email': email,
      'X-Auth-Key': global_api_key,
    }
  });

  const data = await resp.json();
  if (!data.success) throw new Error('Failed to list workers');

  return data.result.filter(w => w.id.startsWith('cloudpress-site-'));
}

export async function getWorkerUsage(cfConfig, scriptName) {
  const { email, global_api_key, account_id } = cfConfig;

  const resp = await fetch(
    `${CF_API}/accounts/${account_id}/workers/scripts/${scriptName}/usage-model`,
    {
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': global_api_key,
      }
    }
  );

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.result;
}
