-- CloudPress Main Database Schema
-- Run: wrangler d1 execute cloudpress-main --file=./migrations/001_init.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'superadmin')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  last_login TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deleting', 'error', 'suspended')),
  db_suffix TEXT NOT NULL UNIQUE,
  region TEXT DEFAULT 'auto',
  php_version TEXT DEFAULT '8.2',
  worker_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Site domains table
CREATE TABLE IF NOT EXISTS site_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  is_primary INTEGER DEFAULT 0 CHECK(is_primary IN (0, 1)),
  ssl_status TEXT DEFAULT 'pending' CHECK(ssl_status IN ('pending', 'active', 'error')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_by TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

-- Traffic stats
CREATE TABLE IF NOT EXISTS traffic_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT,
  date TEXT NOT NULL,
  requests INTEGER DEFAULT 0,
  bandwidth_bytes INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  cache_hit_ratio REAL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
  plan TEXT,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_site_domains_domain ON site_domains(domain);
CREATE INDEX IF NOT EXISTS idx_site_domains_site_id ON site_domains(site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_traffic_date ON traffic_stats(date);
CREATE INDEX IF NOT EXISTS idx_traffic_site ON traffic_stats(site_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
