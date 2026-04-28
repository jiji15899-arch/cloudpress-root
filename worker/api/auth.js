/**
 * Authentication API
 */

export async function handleAuthAPI(request, env, ctx, action) {
  const method = request.method;

  if (action === 'login' && method === 'POST') {
    return login(request, env);
  }

  if (action === 'register' && method === 'POST') {
    return register(request, env);
  }

  if (action === 'logout' && method === 'POST') {
    return logout(request, env);
  }

  if (action === 'refresh' && method === 'POST') {
    return refreshToken(request, env);
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function login(request, env) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND status = ?'
  ).bind(email.toLowerCase(), 'active').first();

  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify password using Web Crypto
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Create session
  const token = await generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.KV.put(`session:${token}`, JSON.stringify({
    user_id: user.id,
    email: user.email,
    role: user.role,
    expires_at: expiresAt,
  }), { expirationTtl: 7 * 24 * 3600 });

  await env.DB.prepare(
    'UPDATE users SET last_login = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id).run();

  return Response.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    expires_at: expiresAt,
  });
}

async function register(request, env) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (existing) {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }

  const userId = generateId();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, plan, created_at)
    VALUES (?, ?, ?, ?, 'user', 'active', 'free', ?)
  `).bind(userId, name, email.toLowerCase(), passwordHash, now).run();

  // Set default plan in KV
  await env.KV.put(`user:plan:${userId}`, JSON.stringify({
    name: 'free',
    max_sites: 1,
    max_domains: 3,
    bandwidth_gb: 10,
    storage_gb: 2,
  }));

  return Response.json({ success: true, message: 'Account created successfully' }, { status: 201 });
}

async function logout(request, env) {
  const token = extractToken(request);
  if (token) {
    await env.KV.delete(`session:${token}`);
  }
  return Response.json({ success: true });
}

async function refreshToken(request, env) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'No token' }, { status: 401 });

  const session = await env.KV.get(`session:${token}`, 'json');
  if (!session) return Response.json({ error: 'Invalid token' }, { status: 401 });

  const newToken = await generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await env.KV.put(`session:${newToken}`, JSON.stringify({
    ...session,
    expires_at: expiresAt,
  }), { expirationTtl: 7 * 24 * 3600 });

  await env.KV.delete(`session:${token}`);

  return Response.json({ success: true, token: newToken, expires_at: expiresAt });
}

// Auth middleware
export async function requireAuth(request, env) {
  const token = extractToken(request);
  if (!token) return null;

  const session = await env.KV.get(`session:${token}`, 'json');
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await env.KV.delete(`session:${token}`);
    return null;
  }

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ? AND status = ?'
  ).bind(session.user_id, 'active').first();

  return user;
}

function extractToken(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

async function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt,
    iterations: 100000,
    hash: 'SHA-256',
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
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations,
      hash: 'SHA-256',
    }, key, 256);

    const hashArray = Array.from(new Uint8Array(derived));
    return hashArray.every((v, i) => v === hash[i]);
  } catch {
    return false;
  }
}

function generateId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
