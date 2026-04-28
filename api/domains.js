/**
 * Domains API
 */

export async function handleDomainsAPI(request, env, ctx, user, path) {
  const method = request.method;
  const parts = path.split('/');

  if (method === 'GET' && !parts[1]) {
    return listUserDomains(env, user);
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function listUserDomains(env, user) {
  const { results } = await env.DB.prepare(`
    SELECT sd.domain, sd.is_primary, sd.created_at, s.id as site_id, s.site_name
    FROM site_domains sd
    JOIN sites s ON sd.site_id = s.id
    WHERE s.user_id = ?
    ORDER BY sd.created_at DESC
  `).bind(user.id).all();

  return Response.json({ domains: results });
}
