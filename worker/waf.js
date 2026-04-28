/**
 * WAF & DDoS Protection for CloudPress
 * Applied to all incoming requests
 */

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 300; // requests per window per IP
const ATTACK_THRESHOLD = 1000; // DDoS threshold per IP

// Known bad user agents
const BAD_BOTS = [
  'masscan', 'zgrab', 'sqlmap', 'nikto', 'nmap', 'dirbuster',
  'gobuster', 'wfuzz', 'hydra', 'medusa', 'burpsuite', 'scrapy',
  'semrushbot', 'ahrefsbot', 'dotbot', 'majestic', 'mj12bot',
];

// SQL injection patterns
const SQL_PATTERNS = [
  /(\bSELECT\b.*\bFROM\b)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bINSERT\b.*\bINTO\b)/i,
  /(\bDROP\b.*\bTABLE\b)/i,
  /(\bDELETE\b.*\bFROM\b)/i,
  /('|(\-\-)|(\/\*))/,
  /(exec(\s|\+)+(s|x)p\w+)/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
];

// Path traversal
const PATH_TRAVERSAL = /(\.\.|%2e%2e|%2e\.|\.\%2e)/i;

export async function applyWAF(request, env) {
  const url = new URL(request.url);
  const ip = request.headers.get('cf-connecting-ip') || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0';
  const userAgent = request.headers.get('user-agent') || '';
  const country = request.headers.get('cf-ipcountry') || '';

  // Check IP blocklist
  const isBlocked = await env.KV.get(`waf:blocked:${ip}`);
  if (isBlocked) {
    return wafBlock(403, 'Your IP has been blocked', ip);
  }

  // Check country blocklist (admin-configurable)
  const blockedCountries = await env.KV.get('waf:blocked_countries', 'json') || [];
  if (blockedCountries.includes(country)) {
    return wafBlock(403, 'Access not allowed from your region', ip);
  }

  // Rate limiting
  const rateLimitKey = `waf:rate:${ip}`;
  const rateData = await env.KV.get(rateLimitKey, 'json') || { count: 0, window: Date.now() };
  const now = Date.now();

  if (now - rateData.window > RATE_LIMIT_WINDOW * 1000) {
    rateData.count = 1;
    rateData.window = now;
  } else {
    rateData.count++;
  }

  await env.KV.put(rateLimitKey, JSON.stringify(rateData), { expirationTtl: RATE_LIMIT_WINDOW * 2 });

  if (rateData.count > ATTACK_THRESHOLD) {
    // Auto-block IP for 1 hour
    await env.KV.put(`waf:blocked:${ip}`, '1', { expirationTtl: 3600 });
    await logWAFEvent(env, ip, 'ddos_blocked', url.pathname);
    return wafBlock(429, 'Too Many Requests - DDoS Protection Active', ip);
  }

  if (rateData.count > RATE_LIMIT_MAX) {
    return wafBlock(429, 'Rate limit exceeded. Please slow down.', ip);
  }

  // Bad bot detection
  const uaLower = userAgent.toLowerCase();
  for (const bot of BAD_BOTS) {
    if (uaLower.includes(bot)) {
      await logWAFEvent(env, ip, 'bad_bot_blocked', userAgent);
      return wafBlock(403, 'Bot access not allowed', ip);
    }
  }

  // Empty user agent (likely scanner)
  if (!userAgent && !url.pathname.startsWith('/wp-json/')) {
    return wafBlock(403, 'Invalid request', ip);
  }

  // Path traversal detection
  if (PATH_TRAVERSAL.test(url.pathname) || PATH_TRAVERSAL.test(url.search)) {
    await logWAFEvent(env, ip, 'path_traversal', url.pathname);
    return wafBlock(403, 'Invalid path', ip);
  }

  // SQL injection in query string
  const queryString = url.search;
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(queryString)) {
      await logWAFEvent(env, ip, 'sqli_attempt', queryString);
      return wafBlock(403, 'Request blocked by WAF', ip);
    }
  }

  // Block access to sensitive WordPress files
  const sensitiveFiles = [
    '/wp-config.php', '/wp-config-sample.php', '/.env',
    '/xmlrpc.php', '/.git/', '/wp-content/debug.log',
    '/readme.html', '/license.txt',
  ];

  for (const file of sensitiveFiles) {
    if (url.pathname === file || url.pathname.startsWith(file)) {
      // Allow xmlrpc.php only for legit WordPress APIs
      if (file === '/xmlrpc.php' && request.method === 'POST') break;
      await logWAFEvent(env, ip, 'sensitive_file_access', url.pathname);
      return wafBlock(403, 'Access denied', ip);
    }
  }

  // WordPress login brute-force protection
  if (url.pathname === '/wp-login.php' && request.method === 'POST') {
    const loginKey = `waf:login:${ip}`;
    const loginData = await env.KV.get(loginKey, 'json') || { attempts: 0, window: now };

    if (now - loginData.window > 900000) { // 15 min window
      loginData.attempts = 1;
      loginData.window = now;
    } else {
      loginData.attempts++;
    }

    await env.KV.put(loginKey, JSON.stringify(loginData), { expirationTtl: 1800 });

    if (loginData.attempts > 10) {
      await logWAFEvent(env, ip, 'brute_force_blocked', '/wp-login.php');
      return wafBlock(429, 'Too many login attempts. Please try again later.', ip);
    }
  }

  // All checks passed
  return null;
}

function wafBlock(status, message, ip) {
  return new Response(JSON.stringify({
    error: message,
    status,
    timestamp: new Date().toISOString(),
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-WAF': 'CloudPress-WAF/1.0',
      'Retry-After': status === 429 ? '60' : undefined,
    }
  });
}

async function logWAFEvent(env, ip, type, detail) {
  const key = `waf:log:${Date.now()}:${ip}`;
  await env.KV.put(key, JSON.stringify({
    ip, type, detail,
    timestamp: new Date().toISOString(),
  }), { expirationTtl: 86400 * 7 }); // Keep for 7 days
}
