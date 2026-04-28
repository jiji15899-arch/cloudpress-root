/**
 * D1 Database Management
 * Creates and manages WordPress tables per site
 */

export async function initializeMainDB(env) {
  const db = env.DB;

  // Users table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      plan TEXT DEFAULT 'free',
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `).run();

  // Sites table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      site_name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      db_suffix TEXT NOT NULL,
      region TEXT DEFAULT 'auto',
      php_version TEXT DEFAULT '8.2',
      worker_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // Site domains table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      is_primary INTEGER DEFAULT 0,
      ssl_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    )
  `).run();

  // Sessions table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();

  // Announcements table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT
    )
  `).run();

  // Traffic stats table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS traffic_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT,
      date TEXT NOT NULL,
      requests INTEGER DEFAULT 0,
      bandwidth_bytes INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `).run();

  // Invoices/billing table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      plan TEXT,
      period_start TEXT,
      period_end TEXT,
      created_at TEXT NOT NULL
    )
  `).run();

  console.log('Main DB initialized');
}

export async function createD1Tables(env, siteId, dbSuffix, wpConfig) {
  const db = env.DB;
  const s = dbSuffix;

  // WordPress posts table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_posts_${s} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_author INTEGER DEFAULT 1,
      post_date TEXT NOT NULL,
      post_date_gmt TEXT NOT NULL,
      post_content TEXT DEFAULT '',
      post_title TEXT DEFAULT '',
      post_excerpt TEXT DEFAULT '',
      post_status TEXT DEFAULT 'publish',
      comment_status TEXT DEFAULT 'open',
      ping_status TEXT DEFAULT 'open',
      post_password TEXT DEFAULT '',
      post_name TEXT DEFAULT '',
      to_ping TEXT DEFAULT '',
      pinged TEXT DEFAULT '',
      post_modified TEXT NOT NULL,
      post_modified_gmt TEXT NOT NULL,
      post_content_filtered TEXT DEFAULT '',
      post_parent INTEGER DEFAULT 0,
      guid TEXT DEFAULT '',
      menu_order INTEGER DEFAULT 0,
      post_type TEXT DEFAULT 'post',
      post_mime_type TEXT DEFAULT '',
      comment_count INTEGER DEFAULT 0
    )
  `).run();

  // WordPress postmeta table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_postmeta_${s} (
      meta_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      meta_key TEXT DEFAULT '',
      meta_value TEXT
    )
  `).run();

  // WordPress users table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_users_${s} (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      user_login TEXT NOT NULL,
      user_pass TEXT NOT NULL,
      user_nicename TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_url TEXT DEFAULT '',
      user_registered TEXT NOT NULL,
      user_activation_key TEXT DEFAULT '',
      user_status INTEGER DEFAULT 0,
      display_name TEXT NOT NULL
    )
  `).run();

  // WordPress usermeta table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_usermeta_${s} (
      umeta_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meta_key TEXT DEFAULT '',
      meta_value TEXT
    )
  `).run();

  // WordPress options table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_options_${s} (
      option_id INTEGER PRIMARY KEY AUTOINCREMENT,
      option_name TEXT UNIQUE NOT NULL,
      option_value TEXT NOT NULL,
      autoload TEXT DEFAULT 'yes'
    )
  `).run();

  // WordPress terms table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_terms_${s} (
      term_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      term_group INTEGER DEFAULT 0
    )
  `).run();

  // WordPress term_taxonomy table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_term_taxonomy_${s} (
      term_taxonomy_id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_id INTEGER NOT NULL,
      taxonomy TEXT NOT NULL,
      description TEXT DEFAULT '',
      parent INTEGER DEFAULT 0,
      count INTEGER DEFAULT 0
    )
  `).run();

  // WordPress term_relationships table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_term_relationships_${s} (
      object_id INTEGER NOT NULL,
      term_taxonomy_id INTEGER NOT NULL,
      term_order INTEGER DEFAULT 0,
      PRIMARY KEY (object_id, term_taxonomy_id)
    )
  `).run();

  // WordPress comments table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_comments_${s} (
      comment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_post_ID INTEGER DEFAULT 0,
      comment_author TEXT NOT NULL,
      comment_author_email TEXT DEFAULT '',
      comment_author_url TEXT DEFAULT '',
      comment_author_IP TEXT DEFAULT '',
      comment_date TEXT NOT NULL,
      comment_date_gmt TEXT NOT NULL,
      comment_content TEXT NOT NULL,
      comment_karma INTEGER DEFAULT 0,
      comment_approved TEXT DEFAULT '1',
      comment_agent TEXT DEFAULT '',
      comment_type TEXT DEFAULT 'comment',
      comment_parent INTEGER DEFAULT 0,
      user_id INTEGER DEFAULT 0
    )
  `).run();

  // WordPress links table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS wp_links_${s} (
      link_id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_url TEXT NOT NULL,
      link_name TEXT NOT NULL,
      link_image TEXT DEFAULT '',
      link_target TEXT DEFAULT '',
      link_description TEXT DEFAULT '',
      link_visible TEXT DEFAULT 'Y',
      link_owner INTEGER DEFAULT 1,
      link_rating INTEGER DEFAULT 0,
      link_updated TEXT NOT NULL,
      link_rel TEXT DEFAULT '',
      link_notes TEXT DEFAULT '',
      link_rss TEXT DEFAULT ''
    )
  `).run();

  // Seed WordPress data
  await seedWordPressData(db, s, wpConfig);
}

async function seedWordPressData(db, s, config) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Insert WordPress core options
  const options = [
    ['siteurl', config.siteUrl],
    ['blogname', config.blogName],
    ['blogdescription', 'Just another WordPress site'],
    ['admin_email', config.adminEmail],
    ['blogpublic', '1'],
    ['default_comment_status', 'open'],
    ['permalink_structure', '/%postname%/'],
    ['active_plugins', 'a:0:{}'],
    ['template', 'twentytwentyfour'],
    ['stylesheet', 'twentytwentyfour'],
    ['wp_user_roles', ''],
    ['db_version', '57154'],
    ['posts_per_page', '10'],
    ['date_format', 'F j, Y'],
    ['time_format', 'g:i a'],
    ['timezone_string', 'UTC'],
    ['show_on_front', 'posts'],
    ['upload_path', ''],
    ['upload_url_path', ''],
  ];

  for (const [name, value] of options) {
    await db.prepare(`
      INSERT OR IGNORE INTO wp_options_${s} (option_name, option_value) VALUES (?, ?)
    `).bind(name, value).run();
  }

  // Create admin user (password hashed with WordPress MD5 scheme)
  const adminPassHash = await wpHashPassword(config.adminPass);
  await db.prepare(`
    INSERT OR IGNORE INTO wp_users_${s}
    (user_login, user_pass, user_nicename, user_email, user_url, user_registered, display_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    config.adminUser,
    adminPassHash,
    config.adminUser,
    config.adminEmail,
    config.siteUrl,
    now,
    config.adminUser
  ).run();

  // Admin user meta (capabilities)
  const adminUser = await db.prepare(
    `SELECT ID FROM wp_users_${s} WHERE user_login = ?`
  ).bind(config.adminUser).first();

  if (adminUser) {
    const capabilities = `a:1:{s:13:"administrator";b:1;}`;
    await db.prepare(`
      INSERT OR IGNORE INTO wp_usermeta_${s} (user_id, meta_key, meta_value)
      VALUES (?, 'wp_capabilities', ?)
    `).bind(adminUser.ID, capabilities).run();

    await db.prepare(`
      INSERT OR IGNORE INTO wp_usermeta_${s} (user_id, meta_key, meta_value)
      VALUES (?, 'wp_user_level', '10')
    `).bind(adminUser.ID).run();
  }

  // Create default "Hello World" post
  await db.prepare(`
    INSERT OR IGNORE INTO wp_posts_${s}
    (post_author, post_date, post_date_gmt, post_content, post_title, post_status,
     post_name, post_modified, post_modified_gmt, post_type, guid)
    VALUES (1, ?, ?, ?, 'Hello world!', 'publish', 'hello-world', ?, ?, 'post', ?)
  `).bind(
    now, now,
    '<p>Welcome to <a href="https://cloudpress.app">CloudPress</a>! This is your first post. Edit or delete it, then start writing!</p>',
    now, now,
    `${config.siteUrl}/?p=1`
  ).run();

  // Create sample page
  await db.prepare(`
    INSERT OR IGNORE INTO wp_posts_${s}
    (post_author, post_date, post_date_gmt, post_content, post_title, post_status,
     post_name, post_modified, post_modified_gmt, post_type, guid)
    VALUES (1, ?, ?, ?, 'Sample Page', 'publish', 'sample-page', ?, ?, 'page', ?)
  `).bind(
    now, now,
    '<p>This is an example page. It\'s different from a blog post because it will stay in one place and will show up in your site navigation (in most themes).</p>',
    now, now,
    `${config.siteUrl}/?page_id=2`
  ).run();

  // Create default category
  await db.prepare(`
    INSERT OR IGNORE INTO wp_terms_${s} (name, slug, term_group) VALUES ('Uncategorized', 'uncategorized', 0)
  `).run();

  await db.prepare(`
    INSERT OR IGNORE INTO wp_term_taxonomy_${s} (term_id, taxonomy, description, parent, count)
    VALUES (1, 'category', '', 0, 1)
  `).run();
}

export async function deleteD1Tables(env, siteId, dbSuffix) {
  const db = env.DB;
  const s = dbSuffix;

  const tables = [
    `wp_posts_${s}`, `wp_postmeta_${s}`, `wp_users_${s}`,
    `wp_usermeta_${s}`, `wp_options_${s}`, `wp_terms_${s}`,
    `wp_term_taxonomy_${s}`, `wp_term_relationships_${s}`,
    `wp_comments_${s}`, `wp_links_${s}`,
  ];

  for (const table of tables) {
    await db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  }
}

// WordPress-compatible password hashing
async function wpHashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return '$P$B' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 31);
}
