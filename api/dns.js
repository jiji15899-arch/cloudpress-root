/**
 * DNS Management API
 * Cloudflare DNS integration with auto-crawling
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function handleDNSAPI(request, env, ctx, user, path) {
  const method = request.method;
  const parts = path.split('/');

  // GET /api/dns/zones - list all CF zones (auto-crawl)
  if (method === 'GET' && parts[1] === 'zones') {
    return listZones(env, user);
  }

  // GET /api/dns/zones/:zoneId/records - list DNS records
  if (method === 'GET' && parts[1] === 'zones' && parts[2] && parts[3] === 'records') {
    return listRecords(env, user, parts[2]);
  }

  // POST /api/dns/zones/:zoneId/records - create DNS record
  if (method === 'POST' && parts[1] === 'zones' && parts[2] && parts[3] === 'records') {
    return createRecord(request, env, user, parts[2]);
  }

  // PUT /api/dns/zones/:zoneId/records/:recordId - update DNS record
  if (method === 'PUT' && parts[1] === 'zones' && parts[2] && parts[3] === 'records' && parts[4]) {
    return updateRecord(request, env, user, parts[2], parts[4]);
  }

  // DELETE /api/dns/zones/:zoneId/records/:recordId - delete DNS record
  if (method === 'DELETE' && parts[1] === 'zones' && parts[2] && parts[3] === 'records' && parts[4]) {
    return deleteRecord(env, user, parts[2], parts[4]);
  }

  // POST /api/dns/external-domain - add external domain with nameserver info
  if (method === 'POST' && parts[1] === 'external-domain') {
    return addExternalDomain(request, env, user);
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function getCFConfig(env, user) {
  const config = await env.KV.get(`user:cf:${user.id}`, 'json');
  if (!config || !config.global_api_key || !config.email) {
    throw new Error('Cloudflare API not configured. Please add your Global API Key in Settings.');
  }
  return config;
}

async function cfRequest(config, path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'X-Auth-Email': config.email,
      'X-Auth-Key': config.global_api_key,
      'Content-Type': 'application/json',
    }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${CF_API}${path}`, options);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare API error');
  }

  return data;
}

async function listZones(env, user) {
  try {
    const config = await getCFConfig(env, user);
    const data = await cfRequest(config, '/zones?per_page=50');

    const zones = data.result.map(zone => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      nameservers: zone.name_servers,
      paused: zone.paused,
    }));

    // Cache zones for quick access
    await env.KV.put(`user:cf:zones:${user.id}`, JSON.stringify(zones), { expirationTtl: 300 });

    return Response.json({ zones });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function listRecords(env, user, zoneId) {
  try {
    const config = await getCFConfig(env, user);
    const data = await cfRequest(config, `/zones/${zoneId}/dns_records?per_page=100`);

    const records = data.result.map(record => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      modified_on: record.modified_on,
    }));

    return Response.json({ records });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function createRecord(request, env, user, zoneId) {
  try {
    const config = await getCFConfig(env, user);
    const body = await request.json();

    const data = await cfRequest(config, `/zones/${zoneId}/dns_records`, 'POST', {
      type: body.type,
      name: body.name,
      content: body.content,
      ttl: body.ttl || 1,
      proxied: body.proxied !== false,
      priority: body.priority,
    });

    return Response.json({ success: true, record: data.result }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function updateRecord(request, env, user, zoneId, recordId) {
  try {
    const config = await getCFConfig(env, user);
    const body = await request.json();

    const data = await cfRequest(config, `/zones/${zoneId}/dns_records/${recordId}`, 'PATCH', {
      type: body.type,
      name: body.name,
      content: body.content,
      ttl: body.ttl,
      proxied: body.proxied,
    });

    return Response.json({ success: true, record: data.result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function deleteRecord(env, user, zoneId, recordId) {
  try {
    const config = await getCFConfig(env, user);
    await cfRequest(config, `/zones/${zoneId}/dns_records/${recordId}`, 'DELETE');
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

async function addExternalDomain(request, env, user) {
  const { domain } = await request.json();

  if (!domain) return Response.json({ error: 'Domain required' }, { status: 400 });

  // Try to add to Cloudflare
  try {
    const config = await getCFConfig(env, user);
    const data = await cfRequest(config, '/zones', 'POST', {
      name: domain,
      account: { id: config.account_id },
      jump_start: true,
    });

    const zone = data.result;
    return Response.json({
      success: true,
      zone_id: zone.id,
      nameservers: zone.name_servers,
      instructions: `Please update your domain registrar's nameservers to:\n1. ${zone.name_servers[0]}\n2. ${zone.name_servers[1]}`,
    });
  } catch (error) {
    // Return nameserver info even without CF API
    return Response.json({
      success: false,
      nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      instructions: `To use ${domain} with CloudPress:\n1. Log into your domain registrar\n2. Update nameservers to:\n   - ns1.cloudflare.com\n   - ns2.cloudflare.com\n3. Or add an A record pointing to our IP`,
      error: error.message,
    });
  }
}
