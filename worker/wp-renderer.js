/**
 * WordPress Page Renderer
 * Uses PHP-WASM to execute WordPress PHP files
 */

export async function renderWordPressPage(request, env, site, siteConfig, url) {
  const method = request.method;
  const headers = Object.fromEntries(request.headers.entries());
  let body = null;

  if (method === 'POST') {
    body = await request.text();
  }

  // Get WordPress files from storage or KV
  const wpConfig = await buildWPConfig(env, site, siteConfig);

  // Use PHP-WASM worker binding if available
  if (env.PHP_WORKER) {
    return await env.PHP_WORKER.fetch(new Request(request.url, {
      method,
      headers: {
        ...headers,
        'X-WP-Config': JSON.stringify(wpConfig),
        'X-Site-ID': site.id,
        'X-DB-DSN': site.db_dsn || '',
      },
      body: body ? body : undefined,
    }));
  }

  // Fallback: WordPress API-based rendering
  return await renderViaWPAPI(request, env, site, siteConfig, url, wpConfig);
}

async function renderViaWPAPI(request, env, site, siteConfig, url, wpConfig) {
  // Check if this is a WordPress REST API request
  if (url.pathname.startsWith('/wp-json/')) {
    return handleWPRestAPI(request, env, site, url);
  }

  // For WordPress pages, we serve pre-rendered HTML or use server-side rendering
  // In production, WordPress PHP runs in a separate PHP-WASM worker
  const path = url.pathname;
  const isAdmin = path.startsWith('/wp-admin') || path.startsWith('/wp-login.php');

  if (isAdmin) {
    return handleWPAdmin(request, env, site, url);
  }

  // Serve WordPress frontend
  return serveWordPressFrontend(request, env, site, siteConfig, url);
}

async function serveWordPressFrontend(request, env, site, siteConfig, url) {
  // Get cached rendered page or render fresh
  const db = env.DB;
  
  // Query post/page from D1
  const slug = url.pathname.replace(/^\/|\/$/g, '') || 'home';
  
  let post;
  if (slug === 'home' || slug === '') {
    post = await db.prepare(`
      SELECT * FROM wp_posts_${site.db_suffix}
      WHERE post_status = 'publish' AND post_type IN ('post', 'page')
      ORDER BY post_date DESC LIMIT 1
    `).first();
  } else {
    post = await db.prepare(`
      SELECT * FROM wp_posts_${site.db_suffix}
      WHERE post_name = ? AND post_status = 'publish'
      LIMIT 1
    `).bind(slug).first();
  }

  const theme = await env.KV.get(`site:theme:${site.id}`, 'json') || { name: 'twentytwentyfour' };
  const posts = await db.prepare(`
    SELECT * FROM wp_posts_${site.db_suffix}
    WHERE post_status = 'publish' AND post_type = 'post'
    ORDER BY post_date DESC LIMIT 10
  `).all();

  const siteTitle = siteConfig.site_title || 'My WordPress Site';
  const siteDesc = siteConfig.site_description || '';

  return new Response(generateWordPressHTML(post, posts.results, siteTitle, siteDesc, theme, url), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Powered-By': 'CloudPress',
    }
  });
}

async function handleWPAdmin(request, env, site, url) {
  // WordPress admin requires PHP execution
  // Return a proxy to the PHP worker or admin interface
  const adminToken = request.headers.get('X-WP-Admin-Token');
  const cookie = request.headers.get('cookie') || '';
  
  if (!cookie.includes('wordpress_logged_in') && !adminToken) {
    return serveWPLogin(site);
  }

  return serveWPAdminPanel(request, env, site, url);
}

function serveWPLogin(site) {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WordPress 로그인 - ${site.site_name || 'My Site'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f0f1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .login-wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 20px; }
  .login-header h1 a { color: #1d2327; text-decoration: none; font-size: 24px; font-weight: 700; }
  .login-form-card { background: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.13); padding: 26px 24px; width: 320px; }
  .login-form-card label { display: block; font-size: 14px; font-weight: 600; color: #1d2327; margin-bottom: 4px; }
  .login-form-card input { width: 100%; padding: 10px 12px; border: 1px solid #8c8f94; border-radius: 4px; font-size: 15px; }
  .login-form-card .submit-btn { margin-top: 20px; width: 100%; background: #2271b1; color: white; border: none; padding: 12px; font-size: 15px; font-weight: 600; border-radius: 4px; cursor: pointer; }
  .login-form-card .submit-btn:hover { background: #135e96; }
  .form-group { margin-bottom: 16px; }
</style>
</head>
<body>
<div class="login-wrapper">
  <div class="login-header"><h1><a href="/">WordPress</a></h1></div>
  <div class="login-form-card">
    <form method="post" action="/wp-login.php">
      <div class="form-group">
        <label for="user_login">사용자명 또는 이메일</label>
        <input type="text" id="user_login" name="log" required autocomplete="username">
      </div>
      <div class="form-group">
        <label for="user_pass">비밀번호</label>
        <input type="password" id="user_pass" name="pwd" required autocomplete="current-password">
      </div>
      <button type="submit" class="submit-btn">로그인</button>
    </form>
  </div>
</div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function serveWPAdminPanel(request, env, site, url) {
  // Full WordPress admin - requires PHP worker
  return new Response('WordPress Admin requires PHP Worker binding', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

async function handleWPRestAPI(request, env, site, url) {
  const db = env.DB;
  const suffix = site.db_suffix;
  const path = url.pathname.replace('/wp-json/', '');

  if (path === 'wp/v2/posts') {
    const posts = await db.prepare(`
      SELECT id, post_title, post_content, post_excerpt, post_date, post_name, post_author
      FROM wp_posts_${suffix}
      WHERE post_status = 'publish' AND post_type = 'post'
      ORDER BY post_date DESC LIMIT 10
    `).all();

    return Response.json(posts.results.map(p => ({
      id: p.id,
      title: { rendered: p.post_title },
      content: { rendered: p.post_content },
      excerpt: { rendered: p.post_excerpt },
      date: p.post_date,
      slug: p.post_name,
    })));
  }

  return Response.json({ code: 'rest_no_route', message: 'Not found' }, { status: 404 });
}

function generateWordPressHTML(post, recentPosts, siteTitle, siteDesc, theme, url) {
  const content = post ? post.post_content : '<p>Welcome to WordPress on CloudPress!</p>';
  const title = post ? post.post_title : siteTitle;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} - ${escapeHtml(siteTitle)}</title>
<meta name="description" content="${escapeHtml(siteDesc)}">
<link rel="stylesheet" href="/wp-content/themes/${theme.name}/style.css">
<link rel="pingback" href="/xmlrpc.php">
</head>
<body class="home blog">
<div id="page" class="site">
  <header id="masthead" class="site-header">
    <div class="site-branding">
      <p class="site-title"><a href="/" rel="home">${escapeHtml(siteTitle)}</a></p>
      <p class="site-description">${escapeHtml(siteDesc)}</p>
    </div>
    <nav id="site-navigation" class="main-navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/sample-page/">Sample Page</a></li>
      </ul>
    </nav>
  </header>
  <div id="content" class="site-content">
    <main id="primary" class="site-main">
      <article class="post">
        <header class="entry-header">
          <h1 class="entry-title">${escapeHtml(title)}</h1>
        </header>
        <div class="entry-content">
          ${content}
        </div>
      </article>
    </main>
    <aside id="secondary" class="widget-area">
      <section class="widget">
        <h2 class="widget-title">Recent Posts</h2>
        <ul>
          ${recentPosts.map(p => `<li><a href="/${p.post_name}/">${escapeHtml(p.post_title)}</a></li>`).join('')}
        </ul>
      </section>
    </aside>
  </div>
  <footer id="colophon" class="site-footer">
    <div class="site-info">
      Powered by <a href="https://cloudpress.app">CloudPress</a> &amp; WordPress
    </div>
  </footer>
</div>
<script src="/wp-includes/js/jquery/jquery.min.js"></script>
</body>
</html>`;
}

async function buildWPConfig(env, site, siteConfig) {
  return {
    siteurl: `https://${site.primary_domain}`,
    blogname: siteConfig.site_title || 'My WordPress Site',
    blogdescription: siteConfig.site_description || '',
    db_suffix: site.db_suffix,
    php_version: siteConfig.php_version || '8.2',
    debug: false,
    cache: siteConfig.cache_enabled || true,
    max_upload_size: siteConfig.max_upload_mb || 64,
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
