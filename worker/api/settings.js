/**
 * Settings API
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function handleSettingsAPI(request, env, ctx, user, path) {
  const method = request.method;
  const parts = path.split('/');
  const section = parts[1];

  // GET /api/settings/cloudflare
  if (method === 'GET' && section === 'cloudflare') {
    return getCloudflareSettings(env, user);
  }

  // POST /api/settings/cloudflare
  if (method === 'POST' && section === 'cloudflare') {
    return saveCloudflareSettings(request, env, user);
  }

  // GET /api/settings/supabase
  if (method === 'GET' && section === 'supabase') {
    return getSupabaseSettings(env, user);
  }

  // POST /api/settings/supabase/:accountIndex/:projectIndex
  if (method === 'POST' && section === 'supabase' && parts[2] !== undefined && parts[3] !== undefined) {
    return saveSupabaseAccount(request, env, user, parseInt(parts[2]), parseInt(parts[3]));
  }

  // GET /api/settings/profile
  if (method === 'GET' && section === 'profile') {
    return getProfile(env, user);
  }

  // PUT /api/settings/profile
  if (method === 'PUT' && section === 'profile') {
    return updateProfile(request, env, user);
  }

  // PUT /api/settings/password
  if (method === 'PUT' && section === 'password') {
    return updatePassword(request, env, user);
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function getCloudflareSettings(env, user) {
  const config = await env.KV.get(`user:cf:${user.id}`, 'json');
  if (!config) return Response.json({ configured: false });

  return Response.json({
    configured: true,
    email: config.email,
    account_id: config.account_id,
    // Don't return API key
    has_global_api_key: !!config.global_api_key,
  });
}

async function saveCloudflareSettings(request, env, user) {
  const { email, global_api_key, account_id } = await request.json();

  if (!email || !global_api_key) {
    return Response.json({ error: 'Email and Global API Key required' }, { status: 400 });
  }

  // Validate API key by making a test request
  try {
    const response = await fetch(`${CF_API}/user`, {
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': global_api_key,
      }
    });
    const data = await response.json();

    if (!data.success) {
      return Response.json({ error: 'Invalid Cloudflare credentials' }, { status: 400 });
    }

    const cfUser = data.result;

    // Get account ID if not provided
    let resolvedAccountId = account_id;
    if (!resolvedAccountId) {
      const accountsResp = await fetch(`${CF_API}/accounts`, {
        headers: { 'X-Auth-Email': email, 'X-Auth-Key': global_api_key }
      });
      const accountsData = await accountsResp.json();
      if (accountsData.success && accountsData.result.length > 0) {
        resolvedAccountId = accountsData.result[0].id;
      }
    }

    await env.KV.put(`user:cf:${user.id}`, JSON.stringify({
      email,
      global_api_key,
      account_id: resolvedAccountId,
      cf_user_id: cfUser.id,
      verified_at: new Date().toISOString(),
    }));

    return Response.json({
      success: true,
      message: 'Cloudflare API configured successfully',
      account_id: resolvedAccountId,
    });
  } catch (error) {
    return Response.json({ error: 'Failed to verify Cloudflare credentials: ' + error.message }, { status: 400 });
  }
}

async function getSupabaseSettings(env, user) {
  // Only admins can view all Supabase accounts
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  
  // Mask sensitive keys
  const safeAccounts = accounts.map(acc => ({
    ...acc,
    projects: acc.projects.map(p => ({
      ...p,
      service_key: p.service_key ? '***' + p.service_key.slice(-6) : null,
      anon_key: p.anon_key ? '***' + p.anon_key.slice(-6) : null,
    }))
  }));

  return Response.json({ accounts: safeAccounts });
}

async function saveSupabaseAccount(request, env, user, accountIndex, projectIndex) {
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, project_id, project_url, anon_key, service_key } = await request.json();

  if (!project_url || !anon_key || !service_key) {
    return Response.json({ error: 'Project URL, anon key, and service key required' }, { status: 400 });
  }

  // Verify Supabase credentials
  try {
    const resp = await fetch(`${project_url}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${service_key}`,
        'apikey': service_key,
      }
    });

    if (!resp.ok && resp.status !== 404) {
      return Response.json({ error: 'Invalid Supabase credentials' }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: 'Failed to verify Supabase: ' + e.message }, { status: 400 });
  }

  const accounts = await env.KV.get('supabase:accounts', 'json') || [];

  if (!accounts[accountIndex]) {
    return Response.json({ error: 'Account slot not found' }, { status: 404 });
  }

  accounts[accountIndex].email = email;
  accounts[accountIndex].configured = true;
  accounts[accountIndex].projects[projectIndex] = {
    ...accounts[accountIndex].projects[projectIndex],
    id: project_id,
    url: project_url,
    anon_key,
    service_key,
  };

  await env.KV.put('supabase:accounts', JSON.stringify(accounts));

  return Response.json({ success: true, message: 'Supabase account configured' });
}

async function getProfile(env, user) {
  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    created_at: user.created_at,
    last_login: user.last_login,
  });
}

async function updateProfile(request, env, user) {
  const { name } = await request.json();
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 });

  await env.DB.prepare(
    'UPDATE users SET name = ?, updated_at = ? WHERE id = ?'
  ).bind(name, new Date().toISOString(), user.id).run();

  return Response.json({ success: true });
}

async function updatePassword(request, env, user) {
  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return Response.json({ error: 'Current and new password required' }, { status: 400 });
  }

  if (new_password.length < 8) {
    return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const dbUser = await env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.id).first();

  const isValid = await verifyPassword(current_password, dbUser.password_hash);
  if (!isValid) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const newHash = await hashPassword(new_password);
  await env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
  ).bind(newHash, new Date().toISOString(), user.id).run();

  return Response.json({ success: true });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256',
  }, key, 256);
  const hashArray = Array.from(new Uint8Array(derived));
  const saltArray = Array.from(salt);
  return btoa(JSON.stringify({ hash: hashArray, salt: saltArray, iterations: 100000 }));
}

async function verifyPassword(password, storedHash) {
  try {
    const { hash, salt, iterations } = JSON.parse(atob(storedHash));
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({
      name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: 'SHA-256',
    }, key, 256);
    const hashArray = Array.from(new Uint8Array(derived));
    return hashArray.every((v, i) => v === hash[i]);
  } catch { return false; }
}
