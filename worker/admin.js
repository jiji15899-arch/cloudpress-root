/**
 * Super Admin Panel
 * Full service management dashboard
 */

import { requireAuth } from './auth.js';

export async function handleAdmin(request, env, ctx) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return handleAdminAPI(request, env, ctx, url);
  }

  return new Response(getAdminHTML(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function handleAdminAPI(request, env, ctx, url) {
  const path = url.pathname.replace('/api/', '');
  const method = request.method;

  // Verify admin session
  const user = await requireAuth(request, env);
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (path === 'admin/stats') return getAdminStats(env);
  if (path === 'admin/users') return getAdminUsers(env, url);
  if (path === 'admin/sites') return getAdminSites(env, url);
  if (path === 'admin/announcements' && method === 'GET') return getAnnouncements(env);
  if (path === 'admin/announcements' && method === 'POST') return createAnnouncement(request, env);
  if (path.startsWith('admin/users/') && method === 'PUT') return updateUser(request, env, path.split('/')[2]);
  if (path.startsWith('admin/sites/') && method === 'PUT') return updateSiteAdmin(request, env, path.split('/')[2]);
  if (path === 'admin/supabase') return getSupabaseStatus(env);
  if (path === 'admin/supabase' && method === 'POST') return configureSupabase(request, env);

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function getAdminStats(env) {
  const [users, sites, traffic] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) as active FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) as active FROM sites').first(),
    env.KV.get('stats:global:traffic', 'json').catch(() => null),
  ]);

  const supabaseAccounts = await env.KV.get('supabase:accounts', 'json') || [];
  const configuredAccounts = supabaseAccounts.filter(a => a.configured).length;
  const totalBuckets = supabaseAccounts.reduce((acc, a) => acc + a.projects.reduce((p, proj) => p + proj.bucket_count, 0), 0);

  return Response.json({
    users: { total: users?.total || 0, active: users?.active || 0 },
    sites: { total: sites?.total || 0, active: sites?.active || 0 },
    traffic: traffic || { requests: 0, bandwidth: 0 },
    storage: {
      configured_accounts: configuredAccounts,
      total_accounts: 18,
      total_buckets: totalBuckets,
      max_buckets: 36,
    }
  });
}

async function getAdminUsers(env, url) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(`
    SELECT id, name, email, role, status, plan, created_at, last_login
    FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const count = await env.DB.prepare('SELECT COUNT(*) as total FROM users').first();

  return Response.json({ users: results, total: count?.total || 0, page, limit });
}

async function getAdminSites(env, url) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(`
    SELECT s.*, u.email as user_email, u.name as user_name,
      (SELECT domain FROM site_domains WHERE site_id = s.id AND is_primary = 1 LIMIT 1) as primary_domain
    FROM sites s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const count = await env.DB.prepare('SELECT COUNT(*) as total FROM sites').first();

  return Response.json({ sites: results, total: count?.total || 0, page, limit });
}

async function getAnnouncements(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20"
  ).all();
  return Response.json({ announcements: results });
}

async function createAnnouncement(request, env) {
  const { title, content, type, expires_at } = await request.json();
  if (!title || !content) return Response.json({ error: 'Title and content required' }, { status: 400 });

  await env.DB.prepare(`
    INSERT INTO announcements (title, content, type, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(title, content, type || 'info', expires_at || null, new Date().toISOString()).run();

  return Response.json({ success: true });
}

async function updateUser(request, env, userId) {
  const { status, plan, role } = await request.json();
  await env.DB.prepare(
    'UPDATE users SET status = ?, plan = ?, role = ?, updated_at = ? WHERE id = ?'
  ).bind(status, plan, role, new Date().toISOString(), userId).run();

  if (plan) {
    const planLimits = {
      free: { max_sites: 1, max_domains: 3, bandwidth_gb: 10, storage_gb: 2 },
      starter: { max_sites: 3, max_domains: 10, bandwidth_gb: 50, storage_gb: 10 },
      pro: { max_sites: 10, max_domains: 30, bandwidth_gb: 200, storage_gb: 50 },
      business: { max_sites: 50, max_domains: 100, bandwidth_gb: 1000, storage_gb: 200 },
    };
    await env.KV.put(`user:plan:${userId}`, JSON.stringify(planLimits[plan] || planLimits.free));
  }

  return Response.json({ success: true });
}

async function updateSiteAdmin(request, env, siteId) {
  const { status } = await request.json();
  await env.DB.prepare(
    'UPDATE sites SET status = ?, updated_at = ? WHERE id = ?'
  ).bind(status, new Date().toISOString(), siteId).run();
  return Response.json({ success: true });
}

async function getSupabaseStatus(env) {
  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  return Response.json({ accounts: accounts.map(a => ({
    id: a.id,
    email: a.email,
    configured: a.configured,
    projects: a.projects.map(p => ({
      id: p.id,
      url: p.url,
      bucket_count: p.bucket_count,
      sites: p.sites?.length || 0,
    }))
  }))});
}

async function configureSupabase(request, env) {
  const body = await request.json();
  const { account_index, project_index, email, project_id, project_url, anon_key, service_key } = body;

  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  if (!accounts[account_index]) return Response.json({ error: 'Account not found' }, { status: 404 });

  accounts[account_index].email = email;
  accounts[account_index].configured = true;
  accounts[account_index].projects[project_index] = {
    ...accounts[account_index].projects[project_index],
    id: project_id, url: project_url, anon_key, service_key,
  };

  await env.KV.put('supabase:accounts', JSON.stringify(accounts));
  return Response.json({ success: true });
}

function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CloudPress 관리자 패널</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet">
<style>
:root {
  --bg:#08080e;--bg2:#0f0f18;--bg3:#16161f;--border:#252530;--border2:#32323f;
  --text:#dddde8;--text2:#8888a0;--text3:#50506a;
  --accent:#7c3aed;--accent2:#a78bfa;--accent-glow:rgba(124,58,237,.15);
  --green:#10b981;--red:#ef4444;--yellow:#f59e0b;--blue:#3b82f6;
  --font:'DM Sans',sans-serif;--mono:'DM Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;display:flex;height:100vh;overflow:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
.sidebar{width:220px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0}
.logo{padding:18px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.logo-text{font-size:15px;font-weight:700;color:var(--accent2)}
.logo-badge{background:var(--accent);color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600}
.nav{padding:8px}
.nav-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;color:var(--text2);cursor:pointer;font-size:13px;border:none;background:none;width:100%;text-align:left;transition:.12s}
.nav-item:hover{background:var(--bg3);color:var(--text)}
.nav-item.active{background:var(--accent-glow);color:var(--accent2)}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:52px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;background:var(--bg2)}
.topbar-title{font-size:15px;font-weight:600}
.content{flex:1;overflow-y:auto;padding:24px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px}
.stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:18px}
.stat-label{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.stat-value{font-size:26px;font-weight:700;letter-spacing:-.5px}
.panel{background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:20px}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}
.panel-title{font-size:13px;font-weight:600}
.panel-body{padding:18px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:8px 14px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text3);background:var(--bg3);border-bottom:1px solid var(--border)}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid var(--border);vertical-align:middle}
tr:last-child td{border-bottom:none}
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:5px;font-size:12px;font-weight:500;border:1px solid transparent;cursor:pointer;font-family:var(--font)}
.btn-primary{background:var(--accent);color:white}
.btn-secondary{background:var(--bg3);color:var(--text);border-color:var(--border)}
.btn-danger{background:rgba(239,68,68,.1);color:var(--red);border-color:rgba(239,68,68,.2)}
.badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:500}
.badge-green{background:rgba(16,185,129,.1);color:var(--green)}
.badge-red{background:rgba(239,68,68,.1);color:var(--red)}
.badge-blue{background:rgba(59,130,246,.1);color:var(--blue)}
.badge-yellow{background:rgba(245,158,11,.1);color:var(--yellow)}
.toast-container{position:fixed;bottom:20px;right:20px;z-index:1000;display:flex;flex-direction:column;gap:6px}
.toast{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px 14px;font-size:12px;animation:slideIn .2s ease}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.form-input{width:100%;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;outline:none}
.form-input:focus{border-color:var(--accent)}
.form-group{margin-bottom:14px}
.form-label{display:block;font-size:11px;font-weight:600;color:var(--text2);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
.section-title{font-size:13px;font-weight:600;margin-bottom:14px}
.progress-bar{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:6px}
.progress-fill{height:100%;background:var(--accent);border-radius:2px}
</style>
</head>
<body>
<div class="sidebar">
  <div class="logo">
    <span class="logo-text">CloudPress</span>
    <span class="logo-badge">ADMIN</span>
  </div>
  <nav class="nav">
    <button class="nav-item active" onclick="navigate('overview')">📊 개요</button>
    <button class="nav-item" onclick="navigate('users')">👥 사용자</button>
    <button class="nav-item" onclick="navigate('sites')">🌐 사이트</button>
    <button class="nav-item" onclick="navigate('supabase')">🗄️ Supabase</button>
    <button class="nav-item" onclick="navigate('announcements')">📢 공지</button>
    <button class="nav-item" onclick="navigate('traffic')">📈 트래픽</button>
    <button class="nav-item" onclick="navigate('settings')">⚙️ 설정</button>
  </nav>
</div>
<div class="main">
  <div class="topbar"><span class="topbar-title" id="topbar-title">관리자 대시보드</span></div>
  <div class="content" id="main-content"><div style="text-align:center;padding:40px">로딩중...</div></div>
</div>
<div class="toast-container" id="toasts"></div>

<script>
const TOKEN = localStorage.getItem('admin_token');
const API_BASE = '';

async function api(path, opts={}) {
  const headers = {'Content-Type':'application/json'};
  if(TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  const r = await fetch(API_BASE + '/api/' + path, {...opts, headers:{...headers,...(opts.headers||{})}, body: opts.body ? JSON.stringify(opts.body) : undefined});
  return {ok:r.ok, data: await r.json().catch(()=>({}))};
}

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const titles = {overview:'관리자 대시보드',users:'사용자 관리',sites:'사이트 관리',supabase:'Supabase 관리',announcements:'공지 관리',traffic:'트래픽',settings:'설정'};
  document.getElementById('topbar-title').textContent = titles[page] || page;
  const pages = {overview:renderOverview,users:renderUsers,sites:renderSites,supabase:renderSupabase,announcements:renderAnnouncements,traffic:renderTraffic,settings:renderSettings};
  if(pages[page]) pages[page]();
}

async function renderOverview() {
  const res = await api('admin/stats');
  if(!res.ok) { showLogin(); return; }
  const d = res.data;
  document.getElementById('main-content').innerHTML = \`
    <div class="stats-grid">
      \${sc('총 사용자', d.users.total, d.users.active + ' 활성')}
      \${sc('총 사이트', d.sites.total, d.sites.active + ' 운영중')}
      \${sc('Supabase 계정', d.storage.configured_accounts + '/' + d.storage.total_accounts, '설정됨')}
      \${sc('스토리지 버킷', d.storage.total_buckets + '/' + d.storage.max_buckets, '사용중')}
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">스토리지 현황</span></div>
      <div class="panel-body">
        <div style="margin-bottom:6px;font-size:12px;color:var(--text2)">Supabase 계정 사용률</div>
        <div class="progress-bar"><div class="progress-fill" style="width:\${Math.round(d.storage.configured_accounts/d.storage.total_accounts*100)}%"></div></div>
        <div style="margin-top:6px;font-size:11px;color:var(--text3)">\${d.storage.configured_accounts}/18 계정 활성화 · \${d.storage.total_buckets}/36 버킷 사용중</div>
      </div>
    </div>
  \`;
}

function sc(label, value, sub) {
  return \`<div class="stat-card"><div class="stat-label">\${label}</div><div class="stat-value">\${value}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">\${sub}</div></div>\`;
}

async function renderUsers() {
  const res = await api('admin/users');
  if(!res.ok) return;
  const {users=[]} = res.data;
  document.getElementById('main-content').innerHTML = \`
    <div class="panel">
      <div class="panel-header"><span class="panel-title">사용자 목록 (\${users.length}명)</span></div>
      <table>
        <thead><tr><th>이름</th><th>이메일</th><th>플랜</th><th>상태</th><th>역할</th><th>가입일</th><th>작업</th></tr></thead>
        <tbody>\${users.map(u=>\`<tr>
          <td>\${u.name||'-'}</td>
          <td style="font-size:11px">\${u.email}</td>
          <td><span class="badge badge-blue">\${u.plan||'free'}</span></td>
          <td><span class="badge \${u.status==='active'?'badge-green':'badge-red'}">\${u.status}</span></td>
          <td><span class="badge badge-yellow">\${u.role||'user'}</span></td>
          <td style="font-size:11px;color:var(--text2)">\${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
          <td>
            <select onchange="updateUser('\${u.id}',this.value)" style="background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-size:11px">
              <option value="">작업 선택</option>
              <option value="suspend">정지</option>
              <option value="activate">활성화</option>
              <option value="plan_pro">Pro 플랜</option>
              <option value="plan_free">Free 플랜</option>
              <option value="make_admin">관리자 권한</option>
            </select>
          </td>
        </tr>\`).join('')}</tbody>
      </table>
    </div>
  \`;
}

async function updateUser(userId, action) {
  const updates = {};
  if(action==='suspend') updates.status = 'suspended';
  else if(action==='activate') updates.status = 'active';
  else if(action==='plan_pro') updates.plan = 'pro';
  else if(action==='plan_free') updates.plan = 'free';
  else if(action==='make_admin') updates.role = 'admin';
  if(!Object.keys(updates).length) return;
  await api('admin/users/'+userId, {method:'PUT', body:updates});
  toast('업데이트 완료', 'success');
  renderUsers();
}

async function renderSites() {
  const res = await api('admin/sites');
  if(!res.ok) return;
  const {sites=[]} = res.data;
  document.getElementById('main-content').innerHTML = \`
    <div class="panel">
      <div class="panel-header"><span class="panel-title">사이트 목록 (\${sites.length}개)</span></div>
      <table>
        <thead><tr><th>사이트명</th><th>도메인</th><th>소유자</th><th>PHP</th><th>상태</th><th>생성일</th><th>작업</th></tr></thead>
        <tbody>\${sites.map(s=>\`<tr>
          <td>\${s.site_name}</td>
          <td style="font-family:var(--mono);font-size:11px">\${s.primary_domain||'-'}</td>
          <td style="font-size:11px">\${s.user_email}</td>
          <td><span class="badge badge-blue">PHP \${s.php_version}</span></td>
          <td><span class="badge \${s.status==='active'?'badge-green':'badge-red'}">\${s.status}</span></td>
          <td style="font-size:11px;color:var(--text2)">\${new Date(s.created_at).toLocaleDateString('ko-KR')}</td>
          <td>
            <button class="btn btn-danger" onclick="suspendSite('\${s.id}')">정지</button>
          </td>
        </tr>\`).join('')}</tbody>
      </table>
    </div>
  \`;
}

async function suspendSite(siteId) {
  await api('admin/sites/'+siteId, {method:'PUT', body:{status:'inactive'}});
  toast('사이트가 정지되었습니다', 'success');
  renderSites();
}

async function renderSupabase() {
  const res = await api('admin/supabase');
  if(!res.ok) return;
  const {accounts=[]} = res.data;
  document.getElementById('main-content').innerHTML = \`
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Supabase 계정 관리 (18계정 · 36버킷)</span>
      </div>
      <div class="panel-body">
        <p style="color:var(--text2);font-size:12px;margin-bottom:16px">각 계정당 2개의 Supabase 프로젝트를 연결합니다. 무료 플랜 기준 최대 36개 버킷을 관리합니다.</p>
        <table>
          <thead><tr><th>계정 ID</th><th>이메일</th><th>프로젝트 1</th><th>프로젝트 2</th><th>상태</th><th>작업</th></tr></thead>
          <tbody>\${accounts.map((a,i)=>\`<tr>
            <td style="font-family:var(--mono);font-size:11px">\${a.id}</td>
            <td style="font-size:11px">\${a.email||'미설정'}</td>
            <td>\${a.projects[0]?.url ? \`<span class="badge badge-green">\${a.projects[0].sites} sites</span>\` : '<span class="badge badge-red">미설정</span>'}</td>
            <td>\${a.projects[1]?.url ? \`<span class="badge badge-green">\${a.projects[1].sites} sites</span>\` : '<span class="badge badge-red">미설정</span>'}</td>
            <td><span class="badge \${a.configured?'badge-green':'badge-yellow'}">\${a.configured?'설정됨':'미설정'}</span></td>
            <td><button class="btn btn-secondary" onclick="showSupabaseConfig(\${i})">설정</button></td>
          </tr>\`).join('')}</tbody>
        </table>
      </div>
    </div>
  \`;
}

function showSupabaseConfig(accIdx) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = \`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;width:480px;max-height:90vh;overflow-y:auto">
    <div style="font-size:15px;font-weight:600;margin-bottom:20px">Supabase 계정 \${accIdx+1} 설정</div>
    <div class="form-group"><label class="form-label">계정 이메일</label><input class="form-input" id="sb-email" placeholder="supabase-account@email.com"></div>
    <div style="font-size:13px;font-weight:600;margin:16px 0 10px;color:var(--text2)">프로젝트 1</div>
    <div class="form-group"><label class="form-label">Project URL</label><input class="form-input" id="sb-url-0" placeholder="https://xxxx.supabase.co"></div>
    <div class="form-group"><label class="form-label">Anon Key</label><input class="form-input" id="sb-anon-0" placeholder="eyJ..."></div>
    <div class="form-group"><label class="form-label">Service Key</label><input class="form-input" id="sb-svc-0" placeholder="eyJ..."></div>
    <div style="font-size:13px;font-weight:600;margin:16px 0 10px;color:var(--text2)">프로젝트 2</div>
    <div class="form-group"><label class="form-label">Project URL</label><input class="form-input" id="sb-url-1" placeholder="https://yyyy.supabase.co"></div>
    <div class="form-group"><label class="form-label">Anon Key</label><input class="form-input" id="sb-anon-1" placeholder="eyJ..."></div>
    <div class="form-group"><label class="form-label">Service Key</label><input class="form-input" id="sb-svc-1" placeholder="eyJ..."></div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveSupabaseConfig(\${accIdx},this.closest('[style]'))">저장</button>
      <button class="btn btn-secondary" onclick="this.closest('[style]').remove()">취소</button>
    </div>
  </div>\`;
  document.body.appendChild(overlay);
}

async function saveSupabaseConfig(accIdx, overlay) {
  for(const projIdx of [0,1]) {
    const url = document.getElementById('sb-url-'+projIdx).value;
    const anon = document.getElementById('sb-anon-'+projIdx).value;
    const svc = document.getElementById('sb-svc-'+projIdx).value;
    if(url && anon && svc) {
      await api('admin/supabase', {method:'POST', body:{
        account_index: accIdx, project_index: projIdx,
        email: document.getElementById('sb-email').value,
        project_url: url, anon_key: anon, service_key: svc,
      }});
    }
  }
  toast('저장되었습니다', 'success');
  overlay.remove();
  renderSupabase();
}

async function renderAnnouncements() {
  const res = await api('admin/announcements');
  if(!res.ok) return;
  const {announcements=[]} = res.data;
  document.getElementById('main-content').innerHTML = \`
    <div class="panel" style="margin-bottom:20px">
      <div class="panel-header"><span class="panel-title">새 공지 작성</span></div>
      <div class="panel-body">
        <div class="form-group"><label class="form-label">제목</label><input class="form-input" id="ann-title" placeholder="공지 제목"></div>
        <div class="form-group"><label class="form-label">내용</label><textarea class="form-input" id="ann-content" rows="4" placeholder="공지 내용..."></textarea></div>
        <div class="form-group"><label class="form-label">타입</label>
          <select class="form-input" id="ann-type">
            <option value="info">정보</option>
            <option value="warning">경고</option>
            <option value="success">성공</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="createAnnouncement()">공지 발행</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">공지 목록</span></div>
      <table>
        <thead><tr><th>제목</th><th>타입</th><th>상태</th><th>발행일</th></tr></thead>
        <tbody>\${announcements.map(a=>\`<tr>
          <td>\${a.title}</td>
          <td><span class="badge badge-blue">\${a.type}</span></td>
          <td><span class="badge badge-green">\${a.status}</span></td>
          <td style="font-size:11px;color:var(--text2)">\${new Date(a.created_at).toLocaleDateString('ko-KR')}</td>
        </tr>\`).join('')}</tbody>
      </table>
    </div>
  \`;
}

async function createAnnouncement() {
  await api('admin/announcements', {method:'POST', body:{
    title: document.getElementById('ann-title').value,
    content: document.getElementById('ann-content').value,
    type: document.getElementById('ann-type').value,
  }});
  toast('공지가 발행되었습니다', 'success');
  renderAnnouncements();
}

function renderTraffic() {
  document.getElementById('main-content').innerHTML = \`
    <div class="panel">
      <div class="panel-header"><span class="panel-title">트래픽 통계</span></div>
      <div class="panel-body">
        <p style="color:var(--text2)">트래픽 통계는 Cloudflare Analytics API와 연동됩니다. Cloudflare 대시보드에서 상세 통계를 확인하세요.</p>
        <div style="margin-top:16px">
          <a href="https://dash.cloudflare.com" target="_blank" class="btn btn-primary">Cloudflare 대시보드 열기</a>
        </div>
      </div>
    </div>
  \`;
}

function renderSettings() {
  document.getElementById('main-content').innerHTML = \`
    <div class="panel">
      <div class="panel-header"><span class="panel-title">관리자 설정</span></div>
      <div class="panel-body">
        <div class="form-group"><label class="form-label">관리자 토큰</label>
          <input class="form-input" id="admin-token" type="password" placeholder="관리자 Bearer 토큰" value="\${TOKEN||''}">
        </div>
        <button class="btn btn-primary" onclick="saveAdminToken()">저장</button>
      </div>
    </div>
  \`;
}

function saveAdminToken() {
  const t = document.getElementById('admin-token').value;
  localStorage.setItem('admin_token', t);
  location.reload();
}

function showLogin() {
  document.getElementById('main-content').innerHTML = \`
    <div style="max-width:360px;margin:60px auto">
      <div class="panel">
        <div class="panel-body">
          <div class="form-group"><label class="form-label">관리자 토큰</label><input class="form-input" id="admin-token-login" type="password"></div>
          <button class="btn btn-primary" style="width:100%" onclick="saveAdminToken()">로그인</button>
        </div>
      </div>
    </div>
  \`;
  document.getElementById('admin-token').value = '';
}

function saveAdminToken() {
  const el = document.getElementById('admin-token-login') || document.getElementById('admin-token');
  if(el) { localStorage.setItem('admin_token', el.value); location.reload(); }
}

function toast(msg, type='info') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderLeft = '3px solid ' + (type==='success'?'var(--green)':type==='error'?'var(--red)':'var(--accent)');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

renderOverview();
</script>
</body>
</html>`;
}
