#!/usr/bin/env node
/**
 * CloudPress Initial Setup Script
 * Run: node scripts/setup.js
 */

const { execSync } = require('child_process');

console.log('🚀 CloudPress Setup Starting...\n');

async function run(cmd, desc) {
  console.log(`▶ ${desc}...`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`  ✅ Done\n`);
    return out;
  } catch (e) {
    console.error(`  ❌ Failed: ${e.message}\n`);
    return null;
  }
}

async function main() {
  // 1. Create D1 database
  await run(
    'wrangler d1 create cloudpress-main',
    'Creating D1 database'
  );

  // 2. Create KV namespace
  await run(
    'wrangler kv:namespace create KV',
    'Creating KV namespace'
  );

  // 3. Run migrations
  await run(
    'wrangler d1 execute cloudpress-main --file=./migrations/001_init.sql',
    'Running database migrations'
  );

  console.log(`
✅ Setup complete!

Next steps:
1. Update wrangler.toml with your D1 database ID and KV namespace ID
2. Configure Supabase accounts in the admin panel
3. Run: wrangler deploy

Admin panel: https://admin.cloudpress.app
Dashboard:   https://app.cloudpress.app
  `);
}

main().catch(console.error);
