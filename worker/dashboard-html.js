/**
 * CloudPress Dashboard HTML
 * Full single-page application for user dashboard
 */

export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CloudPress — WordPress Hosting</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0a0a0f;
  --bg2: #111118;
  --bg3: #18181f;
  --border: #2a2a35;
  --border2: #363645;
  --text: #e8e8f0;
  --text2: #9898b0;
  --text3: #5a5a72;
  --accent: #6366f1;
  --accent2: #818cf8;
  --accent-glow: rgba(99,102,241,0.15);
  --green: #22c55e;
  --green-bg: rgba(34,197,94,0.1);
  --red: #ef4444;
  --red-bg: rgba(239,68,68,0.1);
  --yellow: #eab308;
  --yellow-bg: rgba(234,179,8,0.1);
  --blue: #3b82f6;
  --blue-bg: rgba(59,130,246,0.1);
  --radius: 10px;
  --radius-sm: 6px;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
  --font: 'DM Sans', -apple-system, sans-serif;
  --mono: 'DM Mono', monospace;
  --sidebar-w: 240px;
  --header-h: 56px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { height: 100%; }

body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { font-family: var(--font); cursor: pointer; }
input, select, textarea { font-family: var(--font); }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text3); }

/* ── AUTH SCREEN ── */
#auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
  background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent);
}

.auth-card {
  width: 400px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--shadow), 0 0 60px rgba(99,102,241,0.1);
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  justify-content: center;
}

.auth-logo svg { width: 36px; height: 36px; }

.auth-logo-text {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #fff 0%, var(--accent2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  text-align: center;
}

.auth-subtitle {
  color: var(--text2);
  font-size: 13px;
  margin-bottom: 28px;
  text-align: center;
}

.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg3);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 24px;
}

.auth-tab {
  flex: 1;
  padding: 8px;
  text-align: center;
  border-radius: 4px;
  color: var(--text2);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  border: none;
  background: none;
}

.auth-tab.active {
  background: var(--accent);
  color: white;
}

/* ── FORM ELEMENTS ── */
.form-group { margin-bottom: 16px; }

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text2);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.form-input::placeholder { color: var(--text3); }

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239898b0' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-hint {
  font-size: 11px;
  color: var(--text3);
  margin-top: 5px;
}

/* ── BUTTONS ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.15s;
  cursor: pointer;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.btn-primary:hover {
  background: var(--accent2);
  border-color: var(--accent2);
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
}

.btn-secondary {
  background: var(--bg3);
  color: var(--text);
  border-color: var(--border);
}

.btn-secondary:hover {
  background: var(--border);
  border-color: var(--border2);
}

.btn-danger {
  background: var(--red-bg);
  color: var(--red);
  border-color: rgba(239,68,68,0.3);
}

.btn-danger:hover {
  background: rgba(239,68,68,0.2);
}

.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-lg { padding: 12px 24px; font-size: 15px; }
.btn-full { width: 100%; }

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── APP LAYOUT ── */
#app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── SIDEBAR ── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-logo svg { width: 28px; height: 28px; }

.sidebar-logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #fff 0%, var(--accent2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-section {
  padding: 8px 12px;
}

.sidebar-section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
  padding: 8px 8px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  transition: all 0.12s;
  font-size: 13px;
  font-weight: 450;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg3);
  color: var(--text);
}

.nav-item.active {
  background: var(--accent-glow);
  color: var(--accent2);
}

.nav-item.active svg { color: var(--accent2); }

.nav-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid var(--border);
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--bg3);
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-info { flex: 1; overflow: hidden; }

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-plan {
  font-size: 11px;
  color: var(--text3);
}

/* ── MAIN CONTENT ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

.topbar {
  height: var(--header-h);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--bg2);
  flex-shrink: 0;
}

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
}

/* ── STAT CARDS ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  transition: border-color 0.15s;
}

.stat-card:hover { border-color: var(--border2); }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-change {
  font-size: 12px;
  color: var(--green);
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

/* ── SECTION HEADER ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

/* ── SITE CARDS ── */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.site-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  transition: all 0.15s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.site-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.15s;
}

.site-card:hover {
  border-color: var(--border2);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.site-card:hover::before { opacity: 1; }

.site-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.site-icon {
  width: 40px;
  height: 40px;
  background: var(--accent-glow);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-icon svg { width: 20px; height: 20px; color: var(--accent2); }

.site-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-active { background: var(--green-bg); color: var(--green); }
.status-inactive { background: var(--yellow-bg); color: var(--yellow); }
.status-error { background: var(--red-bg); color: var(--red); }
.status-deleting { background: var(--yellow-bg); color: var(--yellow); }

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.site-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 3px;
}

.site-domain {
  font-size: 12px;
  color: var(--accent2);
  font-family: var(--mono);
}

.site-meta {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.site-meta-item {
  font-size: 11px;
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 4px;
}

.site-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

/* ── PANEL / DETAIL VIEW ── */
.panel {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.panel-body { padding: 20px; }

/* ── TABS ── */
.tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
  padding: 0 28px;
  background: var(--bg2);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 4px;
  border-bottom: 2px solid transparent;
  color: var(--text2);
  font-size: 13px;
  font-weight: 450;
  cursor: pointer;
  transition: all 0.15s;
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  margin-bottom: -1px;
  margin-right: 16px;
}

.tab-btn:hover { color: var(--text); }

.tab-btn.active {
  color: var(--accent2);
  border-bottom-color: var(--accent);
}

.tab-btn svg { width: 14px; height: 14px; }

/* ── TABLE ── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3);
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}

td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

tr:last-child td { border-bottom: none; }

tr:hover td { background: rgba(255,255,255,0.01); }

/* ── BADGE ── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--mono);
}

.badge-blue { background: var(--blue-bg); color: var(--blue); }
.badge-green { background: var(--green-bg); color: var(--green); }
.badge-red { background: var(--red-bg); color: var(--red); }
.badge-yellow { background: var(--yellow-bg); color: var(--yellow); }

/* ── MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow), 0 0 60px rgba(0,0,0,0.5);
  animation: slideUp 0.2s ease;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text2);
  cursor: pointer;
  border: none;
  background: none;
  transition: all 0.12s;
}

.modal-close:hover { background: var(--bg3); color: var(--text); }

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* ── TOAST ── */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow);
  animation: slideIn 0.2s ease;
  max-width: 360px;
  font-size: 13px;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.toast-success { border-left: 3px solid var(--green); }
.toast-error { border-left: 3px solid var(--red); }
.toast-info { border-left: 3px solid var(--accent); }

/* ── DNS TABLE ── */
.dns-type-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  background: var(--bg3);
  color: var(--accent2);
  border: 1px solid var(--border);
}

/* ── FILE MANAGER ── */
.file-tree {
  font-family: var(--mono);
  font-size: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text2);
  transition: all 0.1s;
}

.file-item:hover { background: var(--bg3); color: var(--text); }

/* ── EMPTY STATE ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 60px;
  height: 60px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon svg { width: 26px; height: 26px; color: var(--text3); }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.empty-desc { font-size: 13px; color: var(--text2); margin-bottom: 20px; }

/* ── LOADING ── */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* ── DOMAIN TAGS ── */
.domain-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--mono);
  color: var(--text2);
}

.domain-tag.primary {
  border-color: rgba(99,102,241,0.4);
  background: var(--accent-glow);
  color: var(--accent2);
}

/* ── SITE DETAIL LAYOUT ── */
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.detail-sidebar { display: flex; flex-direction: column; gap: 16px; }

/* ── TOGGLE ── */
.toggle {
  position: relative;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.toggle input { opacity: 0; width: 0; height: 0; }

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border2);
  border-radius: 11px;
  transition: 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

.toggle input:checked + .toggle-slider { background: var(--accent); }
.toggle input:checked + .toggle-slider::before { transform: translateX(18px); }

/* ── ALERT ── */
.alert {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.alert-info { background: var(--blue-bg); border: 1px solid rgba(59,130,246,0.2); color: #93c5fd; }
.alert-warning { background: var(--yellow-bg); border: 1px solid rgba(234,179,8,0.2); color: #fde047; }
.alert-success { background: var(--green-bg); border: 1px solid rgba(34,197,94,0.2); color: #86efac; }
.alert-error { background: var(--red-bg); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }

/* ── CODE BLOCK ── */
.code-block {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--accent2);
  overflow-x: auto;
}

/* ── PHP VERSION SELECTOR ── */
.php-version-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.php-version-btn {
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text2);
  font-size: 12px;
  font-family: var(--mono);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.php-version-btn:hover { border-color: var(--accent); color: var(--text); }
.php-version-btn.selected { border-color: var(--accent); background: var(--accent-glow); color: var(--accent2); }

/* ── BREADCRUMB ── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text2);
}

.breadcrumb-sep { color: var(--text3); }
.breadcrumb-current { color: var(--text); font-weight: 500; }

/* ── PROGRESS BAR ── */
.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
</head>
<body>

<!-- AUTH SCREEN -->
<div id="auth-screen" style="display:none">
  <div class="auth-card">
    <div class="auth-logo">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="url(#lg1)"/>
        <path d="M9 12h18M9 18h12M9 24h15" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="27" cy="24" r="4" fill="white" fill-opacity="0.9"/>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stop-color="#6366f1"/>
            <stop offset="1" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
      <span class="auth-logo-text">CloudPress</span>
    </div>
    <div class="auth-tabs">
      <button class="auth-tab active" onclick="switchAuthTab('login')">로그인</button>
      <button class="auth-tab" onclick="switchAuthTab('register')">회원가입</button>
    </div>
    <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px"></div>
    <!-- Login Form -->
    <div id="login-form">
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input type="email" class="form-input" id="login-email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input type="password" class="form-input" id="login-password" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()">
      </div>
      <button class="btn btn-primary btn-full btn-lg" onclick="doLogin()" id="login-btn">
        <span id="login-spinner" class="spinner" style="display:none"></span>
        로그인
      </button>
    </div>
    <!-- Register Form -->
    <div id="register-form" style="display:none">
      <div class="form-group">
        <label class="form-label">이름</label>
        <input type="text" class="form-input" id="reg-name" placeholder="홍길동">
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input type="email" class="form-input" id="reg-email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input type="password" class="form-input" id="reg-password" placeholder="최소 8자 이상">
        <div class="form-hint">영문, 숫자 포함 8자 이상</div>
      </div>
      <button class="btn btn-primary btn-full btn-lg" onclick="doRegister()" id="reg-btn">
        <span id="reg-spinner" class="spinner" style="display:none"></span>
        계정 만들기
      </button>
    </div>
  </div>
</div>

<!-- MAIN APP -->
<div id="app" style="display:none">
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-logo">
      <svg viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="url(#lg2)"/>
        <path d="M7 9h14M7 14h9M7 19h11" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <circle cx="21" cy="19" r="3" fill="white" fill-opacity="0.85"/>
        <defs>
          <linearGradient id="lg2" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#6366f1"/>
            <stop offset="1" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
      <span class="sidebar-logo-text">CloudPress</span>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">메인</div>
      <button class="nav-item active" onclick="navigate('dashboard')" id="nav-dashboard">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" opacity=".6"/><path d="M2 2h5v5H2z"/></svg>
        대시보드
      </button>
      <button class="nav-item" onclick="navigate('sites')" id="nav-sites">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="13" height="11" rx="2"/><path d="M1.5 6h13"/><circle cx="4" cy="4.25" r=".75" fill="currentColor"/><circle cx="6.5" cy="4.25" r=".75" fill="currentColor"/></svg>
        내 사이트
        <span id="sites-count" style="margin-left:auto;background:var(--accent-glow);color:var(--accent2);padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600"></span>
      </button>
      <button class="nav-item" onclick="navigate('create')" id="nav-create">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v6M5 8h6"/></svg>
        사이트 추가
      </button>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">관리</div>
      <button class="nav-item" onclick="navigate('dns')" id="nav-dns">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1.5A6.5 6.5 0 1 1 8 14.5A6.5 6.5 0 0 1 8 1.5z"/><path d="M1.5 8h13M8 1.5c-2 1.5-3 3.5-3 6.5s1 5 3 6.5M8 1.5c2 1.5 3 3.5 3 6.5s-1 5-3 6.5"/></svg>
        DNS 관리
      </button>
      <button class="nav-item" onclick="navigate('settings')" id="nav-settings">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M13.5 8c0-.5-.06-1-.17-1.47l1.5-1.13-1.5-2.6-1.75.63A5.96 5.96 0 0 0 10 2.83L9.75 1h-3.5L6 2.83A5.96 5.96 0 0 0 4.42 3.43l-1.75-.63-1.5 2.6 1.5 1.13C2.56 7 2.5 7.5 2.5 8s.06 1 .17 1.47l-1.5 1.13 1.5 2.6 1.75-.63A5.96 5.96 0 0 0 6 13.17L6.25 15h3.5L10 13.17a5.96 5.96 0 0 0 1.58-.6l1.75.63 1.5-2.6-1.5-1.13c.11-.47.17-.97.17-1.47z"/></svg>
        설정
      </button>
    </div>

    <div class="sidebar-footer">
      <div class="user-badge" onclick="navigate('settings')">
        <div class="user-avatar" id="user-avatar-text">?</div>
        <div class="user-info">
          <div class="user-name" id="sidebar-user-name">로딩중...</div>
          <div class="user-plan" id="sidebar-user-plan">Free Plan</div>
        </div>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;color:var(--text3)">
          <path d="M5 3l4 4-4 4"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <!-- Dynamic content area -->
    <div id="page-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden"></div>
  </div>
</div>

<!-- MODALS -->
<div id="modal-overlay" class="modal-overlay" style="display:none">
  <div id="modal-content" class="modal"></div>
</div>

<!-- TOAST CONTAINER -->
<div class="toast-container" id="toast-container"></div>

<script>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const State = {
  token: localStorage.getItem('cp_token'),
  user: null,
  sites: [],
  currentPage: 'dashboard',
  currentSite: null,
};

const API = '';  // Same origin

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (State.token) headers['Authorization'] = 'Bearer ' + State.token;

  const resp = await fetch(API + '/api/' + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));

  if (resp.status === 401) {
    logout();
    return null;
  }

  return { ok: resp.ok, status: resp.status, data };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INIT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function init() {
  if (State.token) {
    const res = await api('user');
    if (res && res.ok) {
      State.user = res.data.user;
      showApp();
      navigate('dashboard');
      return;
    }
  }
  showAuth();
}

function showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  // Update sidebar user info
  const initials = (State.user.name || 'U').charAt(0).toUpperCase();
  document.getElementById('user-avatar-text').textContent = initials;
  document.getElementById('sidebar-user-name').textContent = State.user.name || State.user.email;
  document.getElementById('sidebar-user-plan').textContent =
    (State.user.plan || 'free').charAt(0).toUpperCase() + (State.user.plan || 'free').slice(1) + ' Plan';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('auth-error').style.display = 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAuthError('이메일과 비밀번호를 입력하세요.');

  const btn = document.getElementById('login-btn');
  setLoading(btn, document.getElementById('login-spinner'), true);

  const res = await api('auth/login', { method: 'POST', body: { email, password } });
  setLoading(btn, document.getElementById('login-spinner'), false);

  if (!res || !res.ok) {
    showAuthError(res?.data?.error || '로그인 실패. 이메일과 비밀번호를 확인하세요.');
    return;
  }

  State.token = res.data.token;
  State.user = res.data.user;
  localStorage.setItem('cp_token', State.token);
  showApp();
  navigate('dashboard');
}

async function doRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  if (!name || !email || !password) return showAuthError('모든 필드를 입력하세요.');

  const btn = document.getElementById('reg-btn');
  setLoading(btn, document.getElementById('reg-spinner'), true);

  const res = await api('auth/register', { method: 'POST', body: { name, email, password } });
  setLoading(btn, document.getElementById('reg-spinner'), false);

  if (!res || !res.ok) {
    showAuthError(res?.data?.error || '회원가입 실패. 다시 시도하세요.');
    return;
  }

  showToast('계정이 생성되었습니다. 로그인하세요.', 'success');
  switchAuthTab('login');
  document.getElementById('login-email').value = email;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'flex';
}

function logout() {
  if (State.token) api('auth/logout', { method: 'POST' });
  State.token = null;
  State.user = null;
  localStorage.removeItem('cp_token');
  showAuth();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function navigate(page, data = null) {
  State.currentPage = page;
  State.currentSite = data;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navId = 'nav-' + (page.startsWith('site-') ? 'sites' : page === 'create' ? 'create' : page === 'dns' ? 'dns' : page === 'settings' ? 'settings' : 'dashboard');
  const navEl = document.getElementById(navId);
  if (navEl) navEl.classList.add('active');

  const pages = {
    dashboard: renderDashboard,
    sites: renderSites,
    create: renderCreateSite,
    'site-detail': renderSiteDetail,
    dns: renderDNS,
    settings: renderSettings,
  };

  const render = pages[page];
  if (render) render(data);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function renderDashboard() {
  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar">
      <span class="topbar-title">대시보드</span>
      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" onclick="navigate('create')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" width="12"><path d="M7 2v10M2 7h10"/></svg>
          새 사이트
        </button>
      </div>
    </div>
    <div class="content" style="flex:1;overflow-y:auto">
      <div class="stats-grid" id="dash-stats">
        \${statCardHTML('내 사이트', '...', '활성 WordPress 사이트', '#6366f1', siteIcon())}
        \${statCardHTML('도메인', '...', '연결된 도메인', '#22c55e', domainIcon())}
        \${statCardHTML('이번 달 요청', '...', '총 처리 요청수', '#3b82f6', trafficIcon())}
        \${statCardHTML('스토리지', '...', '사용된 스토리지', '#eab308', storageIcon())}
      </div>
      <div class="section-header">
        <span class="section-title">최근 사이트</span>
        <button class="btn btn-secondary btn-sm" onclick="navigate('sites')">전체 보기</button>
      </div>
      <div id="dash-sites"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>
  \`;

  const res = await api('stats');
  const sitesRes = await api('sites');

  if (res && res.ok) {
    document.getElementById('dash-stats').innerHTML = \`
      \${statCardHTML('내 사이트', res.data.sites, '활성 WordPress 사이트', '#6366f1', siteIcon())}
      \${statCardHTML('도메인', res.data.domains, '연결된 도메인', '#22c55e', domainIcon())}
      \${statCardHTML('이번 달 요청', formatNum(res.data.traffic?.requests || 0), '총 처리 요청수', '#3b82f6', trafficIcon())}
      \${statCardHTML('스토리지', '2 GB', '할당된 스토리지', '#eab308', storageIcon())}
    \`;
  }

  if (sitesRes && sitesRes.ok) {
    State.sites = sitesRes.data.sites || [];
    updateSitesCount(State.sites.length);
    const recent = State.sites.slice(0, 3);
    document.getElementById('dash-sites').innerHTML = recent.length
      ? \`<div class="sites-grid">\${recent.map(siteCardHTML).join('')}</div>\`
      : emptyStateHTML('사이트 없음', '첫 WordPress 사이트를 만들어보세요', '사이트 만들기', "navigate('create')");
  }
}

function statCardHTML(label, value, sub, color, icon) {
  return \`<div class="stat-card">
    <div class="stat-icon" style="background:\${color}18;border:1px solid \${color}30">\${icon.replace('currentColor', color)}</div>
    <div class="stat-label">\${label}</div>
    <div class="stat-value">\${value}</div>
    <div style="font-size:11px;color:var(--text3)">\${sub}</div>
  </div>\`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SITES PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function renderSites() {
  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar">
      <span class="topbar-title">내 사이트</span>
      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" onclick="navigate('create')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" width="12"><path d="M7 2v10M2 7h10"/></svg>
          새 사이트 추가
        </button>
      </div>
    </div>
    <div class="content" style="flex:1;overflow-y:auto">
      <div id="sites-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>
  \`;

  const res = await api('sites');
  if (!res || !res.ok) return;

  State.sites = res.data.sites || [];
  updateSitesCount(State.sites.length);

  document.getElementById('sites-list').innerHTML = State.sites.length
    ? \`<div class="sites-grid">\${State.sites.map(siteCardHTML).join('')}</div>\`
    : emptyStateHTML('사이트가 없습니다', '첫 번째 WordPress 사이트를 추가하세요', '사이트 추가하기', "navigate('create')");
}

function siteCardHTML(site) {
  const domain = site.primary_domain || (site.domains && site.domains[0]) || '도메인 없음';
  const statusClass = { active: 'status-active', inactive: 'status-inactive', error: 'status-error', deleting: 'status-deleting' }[site.status] || 'status-inactive';
  const statusLabel = { active: '운영중', inactive: '중지됨', error: '오류', deleting: '삭제중' }[site.status] || site.status;

  return \`<div class="site-card" onclick="navigate('site-detail', \${JSON.stringify(site).replace(/"/g, '&quot;')})">
    <div class="site-card-header">
      <div class="site-icon">\${siteIcon()}</div>
      <span class="site-status \${statusClass}"><span class="status-dot"></span>\${statusLabel}</span>
    </div>
    <div class="site-name">\${esc(site.site_name)}</div>
    <div class="site-domain">\${esc(domain)}</div>
    <div class="site-meta">
      <span class="site-meta-item">PHP \${site.php_version || '8.2'}</span>
      <span class="site-meta-item">WP 6.4</span>
      <span class="site-meta-item">\${site.region || 'Auto'}</span>
    </div>
    <div class="site-card-actions">
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();window.open('https://\${esc(domain)}','_blank')">사이트 보기</button>
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();window.open('https://\${esc(domain)}/wp-admin','_blank')">WP 관리자</button>
    </div>
  </div>\`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE SITE PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderCreateSite() {
  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar">
      <span class="topbar-title">새 사이트 추가</span>
    </div>
    <div class="content" style="flex:1;overflow-y:auto">
      <div style="max-width:620px">
        <div class="panel" style="margin-bottom:20px">
          <div class="panel-header"><span class="panel-title">사이트 정보</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">사이트 이름</label>
              <input type="text" class="form-input" id="cs-name" placeholder="내 멋진 블로그">
            </div>
            <div class="form-group">
              <label class="form-label">도메인</label>
              <input type="text" class="form-input" id="cs-domain" placeholder="myblog.com">
              <div class="form-hint">A 레코드를 Cloudflare Anycast IP로 설정하세요. 사이트 생성 후 안내드립니다.</div>
            </div>
            <div class="form-group">
              <label class="form-label">리전</label>
              <select class="form-input" id="cs-region">
                <option value="auto">Auto (Cloudflare Anycast)</option>
                <option value="asia-east">Asia East (아시아 동부)</option>
                <option value="asia-southeast">Asia Southeast (동남아)</option>
                <option value="us-east">US East (미국 동부)</option>
                <option value="eu-west">EU West (유럽 서부)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">PHP 버전</label>
              <div class="php-version-grid">
                \${['7.4','8.0','8.1','8.2','8.3'].map(v => \`<button class="php-version-btn\${v==='8.2'?' selected':''}" onclick="selectPHP('\${v}')" data-php="\${v}">PHP \${v}</button>\`).join('')}
              </div>
              <input type="hidden" id="cs-php" value="8.2">
            </div>
          </div>
        </div>
        <div class="panel" style="margin-bottom:20px">
          <div class="panel-header"><span class="panel-title">WordPress 관리자 계정</span></div>
          <div class="panel-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group" style="margin:0">
                <label class="form-label">관리자 이메일</label>
                <input type="email" class="form-input" id="cs-admin-email" placeholder="admin@example.com">
              </div>
              <div class="form-group" style="margin:0">
                <label class="form-label">관리자 아이디</label>
                <input type="text" class="form-input" id="cs-admin-user" placeholder="admin">
              </div>
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-label">관리자 비밀번호</label>
              <input type="password" class="form-input" id="cs-admin-pass" placeholder="강력한 비밀번호">
            </div>
          </div>
        </div>
        <div id="create-error" class="alert alert-error" style="display:none;margin-bottom:16px"></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary btn-lg" onclick="doCreateSite()" id="create-btn">
            <span id="create-spinner" class="spinner" style="display:none"></span>
            🚀 사이트 생성
          </button>
          <button class="btn btn-secondary btn-lg" onclick="navigate('sites')">취소</button>
        </div>
      </div>
    </div>
  \`;
}

function selectPHP(ver) {
  document.querySelectorAll('[data-php]').forEach(b => b.classList.toggle('selected', b.dataset.php === ver));
  document.getElementById('cs-php').value = ver;
}

async function doCreateSite() {
  const data = {
    site_name: document.getElementById('cs-name').value,
    domain: document.getElementById('cs-domain').value,
    region: document.getElementById('cs-region').value,
    php_version: document.getElementById('cs-php').value,
    admin_email: document.getElementById('cs-admin-email').value,
    admin_user: document.getElementById('cs-admin-user').value,
    admin_pass: document.getElementById('cs-admin-pass').value,
    wordpress_version: '6.4',
  };

  if (!data.site_name || !data.domain || !data.admin_email || !data.admin_user || !data.admin_pass) {
    const el = document.getElementById('create-error');
    el.textContent = '모든 필드를 입력하세요.';
    el.style.display = 'flex';
    return;
  }

  const btn = document.getElementById('create-btn');
  const sp = document.getElementById('create-spinner');
  setLoading(btn, sp, true);

  const res = await api('sites', { method: 'POST', body: data });
  setLoading(btn, sp, false);

  if (!res || !res.ok) {
    const el = document.getElementById('create-error');
    el.textContent = res?.data?.error || '사이트 생성 실패. 다시 시도하세요.';
    el.style.display = 'flex';
    return;
  }

  const site = res.data.site;
  showToast('사이트가 생성되었습니다! 🎉', 'success');
  showDNSInstructions(site);
}

function showDNSInstructions(site) {
  showModal('DNS 설정 안내', \`
    <div class="alert alert-success" style="margin-bottom:16px">
      <div>✅ <strong>\${esc(site.site_name)}</strong> 사이트가 성공적으로 생성되었습니다!</div>
    </div>
    <p style="margin-bottom:12px;color:var(--text2)">사이트를 활성화하려면 도메인 DNS를 다음과 같이 설정하세요:</p>
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-body">
        <table style="width:100%">
          <thead><tr><th>타입</th><th>이름</th><th>값</th></tr></thead>
          <tbody>
            <tr><td><span class="dns-type-badge">A</span></td><td>\${esc(site.primary_domain)}</td><td><span class="badge badge-blue">Cloudflare Anycast</span></td></tr>
            <tr><td><span class="dns-type-badge">CNAME</span></td><td>www</td><td>\${esc(site.primary_domain)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="alert alert-info">
      <div>💡 Cloudflare에서 관리하는 도메인이라면 <strong>프록시(주황 구름 🔶)</strong>를 활성화하면 자동으로 DDoS 방어와 캐시가 적용됩니다.</div>
    </div>
  \`, [
    { label: '완료', action: () => { closeModal(); navigate('sites'); }, primary: true },
    { label: 'DNS 관리로 이동', action: () => { closeModal(); navigate('dns'); } }
  ]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SITE DETAIL PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function renderSiteDetail(site) {
  if (!site) return navigate('sites');

  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar">
      <div>
        <div class="breadcrumb">
          <span onclick="navigate('sites')" style="cursor:pointer;color:var(--text2)">내 사이트</span>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">\${esc(site.site_name)}</span>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.open('https://\${esc(site.primary_domain || '')}','_blank')">사이트 보기</button>
        <button class="btn btn-secondary btn-sm" onclick="window.open('https://\${esc(site.primary_domain || '')}/wp-admin','_blank')">WP 관리자</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteSite('\${esc(site.id)}','\${esc(site.site_name)}')">삭제</button>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchSiteTab(this,'overview')" data-tab="overview">개요</button>
      <button class="tab-btn" onclick="switchSiteTab(this,'domains')" data-tab="domains">도메인</button>
      <button class="tab-btn" onclick="switchSiteTab(this,'php')" data-tab="php">PHP 설정</button>
      <button class="tab-btn" onclick="switchSiteTab(this,'cache')" data-tab="cache">캐시</button>
      <button class="tab-btn" onclick="switchSiteTab(this,'files')" data-tab="files">파일 관리자</button>
      <button class="tab-btn" onclick="switchSiteTab(this,'waf')" data-tab="waf">보안/WAF</button>
    </div>
    <div class="content" style="flex:1;overflow-y:auto" id="site-tab-content">
      \${renderSiteOverview(site)}
    </div>
  \`;

  window._currentSiteDetail = site;
}

function switchSiteTab(btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const site = window._currentSiteDetail;
  const content = {
    overview: renderSiteOverview,
    domains: renderSiteDomains,
    php: renderSitePHP,
    cache: renderSiteCache,
    files: renderSiteFiles,
    waf: renderSiteWAF,
  }[tab];
  if (content) document.getElementById('site-tab-content').innerHTML = content(site);
}

function renderSiteOverview(site) {
  const domain = site.primary_domain || '미설정';
  return \`<div class="detail-layout">
    <div>
      <div class="panel" style="margin-bottom:16px">
        <div class="panel-header"><span class="panel-title">사이트 정보</span></div>
        <div class="panel-body">
          <table style="width:100%">
            <tbody>
              <tr><td style="color:var(--text3);padding:8px 0;width:130px">사이트 이름</td><td style="padding:8px 0">\${esc(site.site_name)}</td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">주 도메인</td><td style="padding:8px 0"><span class="badge badge-blue">\${esc(domain)}</span></td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">상태</td><td style="padding:8px 0"><span class="site-status status-\${site.status || 'active'}"><span class="status-dot"></span>\${site.status === 'active' ? '운영중' : site.status}</span></td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">PHP 버전</td><td style="padding:8px 0"><span class="badge badge-blue">PHP \${site.php_version || '8.2'}</span></td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">WordPress</td><td style="padding:8px 0"><span class="badge badge-green">6.4.3</span></td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">리전</td><td style="padding:8px 0">\${site.region || 'Auto (Anycast)'}</td></tr>
              <tr><td style="color:var(--text3);padding:8px 0">생성일</td><td style="padding:8px 0">\${new Date(site.created_at).toLocaleDateString('ko-KR')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="detail-sidebar">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">빠른 작업</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-secondary" onclick="purgeSiteCache('\${site.id}')">🧹 캐시 비우기</button>
          <button class="btn btn-secondary" onclick="window.open('https://\${esc(site.primary_domain||'')}/wp-admin','_blank')">🔧 WordPress 관리자</button>
          <button class="btn btn-secondary" onclick="window.open('https://\${esc(site.primary_domain||'')}','_blank')">🌐 사이트 방문</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">보안 상태</span></div>
        <div class="panel-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text2)">WAF 활성화</span>
            <span class="badge badge-green">✓ 활성</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text2)">DDoS 방어</span>
            <span class="badge badge-green">✓ 활성</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text2)">SSL/TLS</span>
            <span class="badge badge-green">✓ 활성</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text2)">브루트포스 방어</span>
            <span class="badge badge-green">✓ 활성</span>
          </div>
        </div>
      </div>
    </div>
  </div>\`;
}

function renderSiteDomains(site) {
  const domains = site.domains || [{ domain: site.primary_domain, is_primary: 1 }];
  return \`<div style="max-width:680px">
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-header">
        <span class="panel-title">연결된 도메인</span>
        <button class="btn btn-primary btn-sm" onclick="showAddDomainModal('\${site.id}')">+ 도메인 추가</button>
      </div>
      <div class="panel-body" style="padding:0">
        <table style="width:100%">
          <thead><tr><th>도메인</th><th>타입</th><th>SSL</th><th>작업</th></tr></thead>
          <tbody>
            \${domains.map(d => \`<tr>
              <td><span class="domain-tag \${d.is_primary?'primary':''}">\${esc(d.domain||d)}</span></td>
              <td><span class="badge \${d.is_primary?'badge-blue':'badge-green'}">\${d.is_primary?'Primary':'Alias'}</span></td>
              <td><span class="badge badge-green">활성</span></td>
              <td>\${!d.is_primary?\`<button class="btn btn-danger btn-sm" onclick="removeDomain('\${site.id}','\${d.domain}')">제거</button>\`:'<span style="color:var(--text3);font-size:12px">기본 도메인</span>'}</td>
            </tr>\`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="alert alert-info">
      <div>💡 도메인을 추가하면 해당 도메인에서도 이 사이트로 접속할 수 있습니다. Primary 도메인은 WordPress 기본 URL로 사용됩니다.</div>
    </div>
  </div>\`;
}

function renderSitePHP(site) {
  const cur = site.php_version || '8.2';
  return \`<div style="max-width:500px">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">PHP 버전 선택</span></div>
      <div class="panel-body">
        <p style="color:var(--text2);font-size:13px;margin-bottom:16px">현재 버전: <strong>PHP \${cur}</strong></p>
        <div class="php-version-grid" style="margin-bottom:16px">
          \${['7.4','8.0','8.1','8.2','8.3'].map(v => \`<button class="php-version-btn\${v===cur?' selected':''}" onclick="selectSitePHP(this,'\${v}')" data-v="\${v}">
            PHP \${v}\${v==='8.2'?'<br><span style=\\"font-size:10px;color:var(--green)\\">권장</span>':''}
          </button>\`).join('')}
        </div>
        <button class="btn btn-primary" onclick="saveSitePHP('\${site.id}')">PHP 버전 변경 적용</button>
        <p style="margin-top:10px;font-size:12px;color:var(--text3)">⚠️ PHP 버전 변경 시 사이트가 잠시 재시작됩니다.</p>
      </div>
    </div>
  </div>\`;
}

function renderSiteCache(site) {
  return \`<div style="max-width:500px">
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-header"><span class="panel-title">페이지 캐시</span></div>
      <div class="panel-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <div style="font-size:13px;font-weight:500;margin-bottom:3px">페이지 캐시 활성화</div>
            <div style="font-size:12px;color:var(--text2)">정적 HTML 캐시로 응답 속도 향상</div>
          </div>
          <label class="toggle"><input type="checkbox" checked onchange="toggleCache('\${site.id}',this.checked)"><span class="toggle-slider"></span></label>
        </div>
        <div class="form-group">
          <label class="form-label">캐시 만료 시간</label>
          <select class="form-input" id="cache-ttl">
            <option value="1800">30분</option>
            <option value="3600" selected>1시간</option>
            <option value="7200">2시간</option>
            <option value="86400">24시간</option>
          </select>
        </div>
        <button class="btn btn-secondary" onclick="purgeSiteCache('\${site.id}')">🧹 전체 캐시 비우기</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">캐시 제외 규칙</span></div>
      <div class="panel-body">
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px">다음 경로는 캐시에서 자동 제외됩니다:</div>
        \${['/wp-admin/*','/wp-login.php','POST 요청','로그인된 사용자'].map(r => \`<div class="code-block" style="margin-bottom:6px">\${r}</div>\`).join('')}
      </div>
    </div>
  </div>\`;
}

function renderSiteFiles(site) {
  return \`<div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">파일 관리자</span>
        <button class="btn btn-secondary btn-sm" onclick="uploadFile('\${site.id}')">📤 파일 업로드</button>
      </div>
      <div class="panel-body">
        <div class="alert alert-info" style="margin-bottom:16px">
          <div>💡 파일은 Supabase Storage에 저장됩니다. WordPress 미디어 파일, 테마, 플러그인을 관리할 수 있습니다.</div>
        </div>
        <div class="file-tree" id="file-tree-\${site.id}">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  </div>\`;
  // Load files async
  setTimeout(() => loadFileTree(site.id, '/'), 100);
}

async function loadFileTree(siteId, path) {
  const res = await api(\`sites/\${siteId}/files?path=\${encodeURIComponent(path)}\`);
  const el = document.getElementById(\`file-tree-\${siteId}\`);
  if (!el) return;

  if (!res || !res.ok) {
    el.innerHTML = '<div style="color:var(--text3);text-align:center;padding:20px">파일을 불러올 수 없습니다</div>';
    return;
  }

  const files = res.data.files || [];
  el.innerHTML = files.length ? files.map(f => \`
    <div class="file-item">
      <span>\${f.id?.endsWith('/') ? '📁' : '📄'}</span>
      <span>\${esc(f.name || f.id)}</span>
      <span style="margin-left:auto;font-size:11px;color:var(--text3)">\${f.metadata?.size ? formatBytes(f.metadata.size) : ''}</span>
    </div>
  \`).join('') : '<div style="color:var(--text3);text-align:center;padding:20px">파일이 없습니다</div>';
}

function renderSiteWAF(site) {
  return \`<div style="max-width:600px">
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-header"><span class="panel-title">WAF 보안 설정</span></div>
      <div class="panel-body">
        \${[
          ['SQL 인젝션 방어', true, '데이터베이스 공격 차단'],
          ['XSS 방어', true, '크로스 사이트 스크립팅 차단'],
          ['DDoS 자동 방어', true, '초당 1000req 초과 시 자동 차단'],
          ['로그인 브루트포스 방어', true, '15분당 10회 시도 제한'],
          ['악성 봇 차단', true, '알려진 스캐너/봇 차단'],
          ['경로 탐색 방어', true, '../ 등의 경로 접근 차단'],
        ].map(([label, on, desc]) => \`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:500">\${label}</div>
            <div style="font-size:11px;color:var(--text3)">\${desc}</div>
          </div>
          <span class="badge badge-green">✓ 활성</span>
        </div>\`).join('')}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">민감 파일 보호</span></div>
      <div class="panel-body">
        <p style="font-size:12px;color:var(--text2);margin-bottom:10px">다음 파일/경로에 대한 접근이 자동으로 차단됩니다:</p>
        \${['/wp-config.php','/.env','/.git/','xmlrpc.php (제한)','readme.html','debug.log'].map(f => \`<div class="code-block" style="margin-bottom:6px">\${f}</div>\`).join('')}
      </div>
    </div>
  </div>\`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DNS PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function renderDNS() {
  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar">
      <span class="topbar-title">DNS 관리</span>
      <div class="topbar-actions">
        <button class="btn btn-secondary btn-sm" onclick="showAddExternalDomain()">+ 외부 도메인 추가</button>
      </div>
    </div>
    <div class="content" style="flex:1;overflow-y:auto">
      <div id="dns-zones"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>
  \`;

  const res = await api('dns/zones');
  const el = document.getElementById('dns-zones');

  if (!res || !res.ok) {
    el.innerHTML = \`<div class="alert alert-warning" style="margin-bottom:16px">
      <div>⚠️ Cloudflare API가 설정되지 않았습니다. <a onclick="navigate('settings')" style="color:var(--accent2);cursor:pointer">설정 페이지</a>에서 Global API Key를 등록하세요.</div>
    </div>
    \${renderDNSPlaceholder()}\`;
    return;
  }

  const zones = res.data.zones || [];
  if (!zones.length) {
    el.innerHTML = emptyStateHTML('도메인 없음', 'Cloudflare에서 관리 중인 도메인이 없습니다', '도메인 추가', 'showAddExternalDomain()');
    return;
  }

  el.innerHTML = \`
    <div style="margin-bottom:20px">
      <div class="section-header"><span class="section-title">Cloudflare 도메인</span></div>
      <div class="panel">
        <div class="panel-body" style="padding:0">
          <table style="width:100%">
            <thead><tr><th>도메인</th><th>상태</th><th>네임서버</th><th>작업</th></tr></thead>
            <tbody>
              \${zones.map(z => \`<tr>
                <td><strong>\${esc(z.name)}</strong></td>
                <td><span class="badge \${z.status==='active'?'badge-green':'badge-yellow'}">\${z.status==='active'?'활성':'대기'}</span></td>
                <td style="font-family:var(--mono);font-size:11px;color:var(--text2)">\${(z.nameservers||[]).join(', ')}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="loadDNSRecords('\${z.id}','\${esc(z.name)}')">레코드 관리</button></td>
              </tr>\`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div id="dns-records-section"></div>
  \`;
}

function renderDNSPlaceholder() {
  return \`<div class="panel">
    <div class="panel-header"><span class="panel-title">DNS 레코드 관리</span></div>
    <div class="panel-body">
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg></div>
        <div class="empty-title">Cloudflare API 필요</div>
        <div class="empty-desc">설정에서 Cloudflare Global API Key를 등록하면<br>DNS 레코드를 직접 관리할 수 있습니다.</div>
        <button class="btn btn-primary" onclick="navigate('settings')">설정으로 이동</button>
      </div>
    </div>
  </div>\`;
}

async function loadDNSRecords(zoneId, zoneName) {
  const el = document.getElementById('dns-records-section');
  el.innerHTML = \`<div class="loading-overlay"><div class="spinner"></div></div>\`;

  const res = await api(\`dns/zones/\${zoneId}/records\`);
  if (!res || !res.ok) {
    el.innerHTML = '<div class="alert alert-error">레코드 불러오기 실패</div>';
    return;
  }

  const records = res.data.records || [];
  el.innerHTML = \`
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">\${esc(zoneName)} DNS 레코드</span>
        <button class="btn btn-primary btn-sm" onclick="showAddRecordModal('\${zoneId}')">+ 레코드 추가</button>
      </div>
      <div class="panel-body" style="padding:0">
        <div style="overflow-x:auto">
          <table style="width:100%">
            <thead><tr><th>타입</th><th>이름</th><th>값</th><th>TTL</th><th>프록시</th><th>작업</th></tr></thead>
            <tbody>
              \${records.map(r => \`<tr>
                <td><span class="dns-type-badge">\${esc(r.type)}</span></td>
                <td style="font-family:var(--mono);font-size:12px">\${esc(r.name)}</td>
                <td style="font-family:var(--mono);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis">\${esc(r.content)}</td>
                <td style="color:var(--text2);font-size:12px">\${r.ttl === 1 ? 'Auto' : r.ttl + 's'}</td>
                <td><span class="badge \${r.proxied?'badge-blue':'badge-green'}">\${r.proxied?'🔶 프록시':'직접'}</span></td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteDNSRecord('\${zoneId}','\${r.id}')">삭제</button></td>
              </tr>\`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  \`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETTINGS PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function renderSettings() {
  const pc = document.getElementById('page-content');
  pc.innerHTML = \`
    <div class="topbar"><span class="topbar-title">설정</span></div>
    <div class="content" style="flex:1;overflow-y:auto">
      <div style="max-width:620px;display:flex;flex-direction:column;gap:20px" id="settings-content">
        <div class="loading-overlay"><div class="spinner"></div></div>
      </div>
    </div>
  \`;

  const [cfRes, profileRes] = await Promise.all([
    api('settings/cloudflare'),
    api('settings/profile'),
  ]);

  const cfConfigured = cfRes?.data?.configured;
  const profile = profileRes?.data || {};

  document.getElementById('settings-content').innerHTML = \`
    <!-- Cloudflare API -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Cloudflare API 설정</span>
        \${cfConfigured ? '<span class="badge badge-green">✓ 연결됨</span>' : '<span class="badge badge-yellow">미설정</span>'}
      </div>
      <div class="panel-body">
        <div class="alert alert-info" style="margin-bottom:16px">
          <div>💡 Cloudflare Global API Key를 등록하면 DNS 관리, Worker 자동 배포 등 모든 기능을 사용할 수 있습니다.</div>
        </div>
        <div class="form-group">
          <label class="form-label">이메일 (Cloudflare 계정)</label>
          <input type="email" class="form-input" id="cf-email" value="\${esc(cfRes?.data?.email||'')}" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Global API Key</label>
          <input type="password" class="form-input" id="cf-apikey" placeholder="\${cfConfigured?'저장됨 (변경하려면 입력)':'Cloudflare 대시보드에서 확인'}">
          <div class="form-hint">Cloudflare 대시보드 → 내 프로필 → API 토큰 → Global API Key</div>
        </div>
        <button class="btn btn-primary" onclick="saveCFSettings()">저장</button>
        \${cfConfigured ? \`<div style="margin-top:10px;font-size:12px;color:var(--text3)">계정 ID: \${cfRes?.data?.account_id||'알 수 없음'}</div>\` : ''}
      </div>
    </div>

    <!-- Profile -->
    <div class="panel">
      <div class="panel-header"><span class="panel-title">프로필</span></div>
      <div class="panel-body">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input type="text" class="form-input" id="prof-name" value="\${esc(profile.name||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input type="email" class="form-input" value="\${esc(profile.email||'')}" disabled style="opacity:0.5">
        </div>
        <button class="btn btn-primary" onclick="saveProfile()">저장</button>
      </div>
    </div>

    <!-- Password -->
    <div class="panel">
      <div class="panel-header"><span class="panel-title">비밀번호 변경</span></div>
      <div class="panel-body">
        <div class="form-group">
          <label class="form-label">현재 비밀번호</label>
          <input type="password" class="form-input" id="cur-pass">
        </div>
        <div class="form-group">
          <label class="form-label">새 비밀번호</label>
          <input type="password" class="form-input" id="new-pass">
        </div>
        <button class="btn btn-primary" onclick="changePassword()">변경</button>
      </div>
    </div>

    <!-- Logout -->
    <div class="panel">
      <div class="panel-header"><span class="panel-title">계정</span></div>
      <div class="panel-body">
        <button class="btn btn-danger" onclick="logout()">로그아웃</button>
      </div>
    </div>
  \`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function saveCFSettings() {
  const email = document.getElementById('cf-email').value;
  const global_api_key = document.getElementById('cf-apikey').value;
  if (!email) return showToast('이메일을 입력하세요', 'error');

  const res = await api('settings/cloudflare', { method: 'POST', body: { email, global_api_key } });
  if (res && res.ok) {
    showToast('Cloudflare API 설정이 저장되었습니다', 'success');
    renderSettings();
  } else {
    showToast(res?.data?.error || '저장 실패', 'error');
  }
}

async function saveProfile() {
  const name = document.getElementById('prof-name').value;
  const res = await api('settings/profile', { method: 'PUT', body: { name } });
  if (res && res.ok) showToast('프로필이 저장되었습니다', 'success');
  else showToast('저장 실패', 'error');
}

async function changePassword() {
  const current_password = document.getElementById('cur-pass').value;
  const new_password = document.getElementById('new-pass').value;
  if (!current_password || !new_password) return showToast('모든 필드를 입력하세요', 'error');

  const res = await api('settings/password', { method: 'PUT', body: { current_password, new_password } });
  if (res && res.ok) {
    showToast('비밀번호가 변경되었습니다', 'success');
    document.getElementById('cur-pass').value = '';
    document.getElementById('new-pass').value = '';
  } else {
    showToast(res?.data?.error || '비밀번호 변경 실패', 'error');
  }
}

async function purgeSiteCache(siteId) {
  const res = await api(\`sites/\${siteId}/purge-cache\`, { method: 'POST' });
  if (res && res.ok) showToast(\`캐시가 비워졌습니다 (\${res.data.purged}개 삭제)\`, 'success');
  else showToast('캐시 비우기 실패', 'error');
}

function confirmDeleteSite(siteId, siteName) {
  showModal('사이트 삭제', \`
    <div class="alert alert-error" style="margin-bottom:16px">
      <div>⚠️ <strong>이 작업은 되돌릴 수 없습니다!</strong></div>
    </div>
    <p style="margin-bottom:16px;color:var(--text2)"><strong>\${esc(siteName)}</strong> 사이트와 관련된 모든 데이터(파일, 데이터베이스, 설정)가 영구 삭제됩니다.</p>
    <div class="form-group">
      <label class="form-label">확인을 위해 사이트 이름을 입력하세요</label>
      <input type="text" class="form-input" id="delete-confirm-name" placeholder="\${esc(siteName)}">
    </div>
  \`, [
    { label: '취소', action: closeModal },
    { label: '삭제', action: () => doDeleteSite(siteId, siteName), danger: true }
  ]);
}

async function doDeleteSite(siteId, siteName) {
  const input = document.getElementById('delete-confirm-name')?.value;
  if (input !== siteName) return showToast('사이트 이름이 일치하지 않습니다', 'error');

  closeModal();
  const res = await api(\`sites/\${siteId}\`, { method: 'DELETE' });
  if (res && res.ok) {
    showToast('사이트 삭제가 시작되었습니다', 'info');
    navigate('sites');
  } else {
    showToast('삭제 실패', 'error');
  }
}

function showAddDomainModal(siteId) {
  showModal('도메인 추가', \`
    <div class="form-group">
      <label class="form-label">도메인</label>
      <input type="text" class="form-input" id="new-domain-input" placeholder="blog.example.com">
    </div>
    <div class="form-group">
      <label class="form-label">타입</label>
      <select class="form-input" id="new-domain-type">
        <option value="alias">Alias (별칭)</option>
        <option value="primary">Primary (주 도메인으로 변경)</option>
      </select>
    </div>
    <div class="alert alert-info">
      <div>도메인을 추가하면 해당 도메인에서도 이 사이트로 접속 가능합니다. DNS A 레코드를 Cloudflare Anycast IP로 설정하세요.</div>
    </div>
  \`, [
    { label: '취소', action: closeModal },
    { label: '추가', action: () => doAddDomain(siteId), primary: true }
  ]);
}

async function doAddDomain(siteId) {
  const domain = document.getElementById('new-domain-input').value;
  const type = document.getElementById('new-domain-type').value;
  if (!domain) return showToast('도메인을 입력하세요', 'error');

  const res = await api(\`sites/\${siteId}/domains\`, {
    method: 'POST',
    body: { domain, is_primary: type === 'primary' }
  });

  if (res && res.ok) {
    closeModal();
    showToast('도메인이 추가되었습니다', 'success');
    navigate('site-detail', window._currentSiteDetail);
  } else {
    showToast(res?.data?.error || '도메인 추가 실패', 'error');
  }
}

async function removeDomain(siteId, domain) {
  if (!confirm(\`\${domain} 도메인을 제거하시겠습니까?\`)) return;
  const res = await api(\`sites/\${siteId}/domains/\${encodeURIComponent(domain)}\`, { method: 'DELETE' });
  if (res && res.ok) {
    showToast('도메인이 제거되었습니다', 'success');
    navigate('site-detail', window._currentSiteDetail);
  } else {
    showToast('제거 실패', 'error');
  }
}

function showAddExternalDomain() {
  showModal('외부 도메인 추가', \`
    <div class="form-group">
      <label class="form-label">도메인명</label>
      <input type="text" class="form-input" id="ext-domain" placeholder="example.com">
    </div>
    <p style="font-size:13px;color:var(--text2)">외부 도메인을 추가하면 Cloudflare를 통해 관리할 수 있습니다. 네임서버 변경 정보를 안내해 드립니다.</p>
  \`, [
    { label: '취소', action: closeModal },
    { label: '추가', action: doAddExternalDomain, primary: true }
  ]);
}

async function doAddExternalDomain() {
  const domain = document.getElementById('ext-domain').value;
  if (!domain) return showToast('도메인을 입력하세요', 'error');

  const res = await api('dns/external-domain', { method: 'POST', body: { domain } });
  closeModal();

  if (res && res.data) {
    showModal('네임서버 설정 안내', \`
      <p style="margin-bottom:16px;color:var(--text2)"><strong>\${esc(domain)}</strong> 도메인의 네임서버를 다음으로 변경하세요:</p>
      <div class="code-block" style="margin-bottom:8px">\${res.data.nameservers?.[0] || 'ns1.cloudflare.com'}</div>
      <div class="code-block">\${res.data.nameservers?.[1] || 'ns2.cloudflare.com'}</div>
      <div class="alert alert-info" style="margin-top:16px">
        <div>⏱️ 네임서버 변경 후 전파까지 최대 48시간 소요될 수 있습니다.</div>
      </div>
    \`, [{ label: '확인', action: () => { closeModal(); renderDNS(); }, primary: true }]);
  }
}

function showAddRecordModal(zoneId) {
  showModal('DNS 레코드 추가', \`
    <div class="form-group">
      <label class="form-label">타입</label>
      <select class="form-input" id="rec-type">
        <option>A</option><option>AAAA</option><option>CNAME</option>
        <option>MX</option><option>TXT</option><option>SRV</option><option>NS</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">이름</label>
      <input type="text" class="form-input" id="rec-name" placeholder="@ 또는 서브도메인">
    </div>
    <div class="form-group">
      <label class="form-label">값 (Content)</label>
      <input type="text" class="form-input" id="rec-content" placeholder="IP 주소 또는 대상">
    </div>
    <div class="form-group">
      <label class="form-label">TTL</label>
      <select class="form-input" id="rec-ttl">
        <option value="1">Auto</option>
        <option value="300">5분</option>
        <option value="3600">1시간</option>
        <option value="86400">24시간</option>
      </select>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <label class="toggle"><input type="checkbox" id="rec-proxied" checked><span class="toggle-slider"></span></label>
      <span style="font-size:13px">Cloudflare 프록시 활성화</span>
    </div>
  \`, [
    { label: '취소', action: closeModal },
    { label: '추가', action: () => doAddDNSRecord(zoneId), primary: true }
  ]);
}

async function doAddDNSRecord(zoneId) {
  const body = {
    type: document.getElementById('rec-type').value,
    name: document.getElementById('rec-name').value,
    content: document.getElementById('rec-content').value,
    ttl: parseInt(document.getElementById('rec-ttl').value),
    proxied: document.getElementById('rec-proxied').checked,
  };

  const res = await api(\`dns/zones/\${zoneId}/records\`, { method: 'POST', body });
  if (res && res.ok) {
    closeModal();
    showToast('DNS 레코드가 추가되었습니다', 'success');
    loadDNSRecords(zoneId, '');
  } else {
    showToast(res?.data?.error || '추가 실패', 'error');
  }
}

async function deleteDNSRecord(zoneId, recordId) {
  if (!confirm('이 DNS 레코드를 삭제하시겠습니까?')) return;
  const res = await api(\`dns/zones/\${zoneId}/records/\${recordId}\`, { method: 'DELETE' });
  if (res && res.ok) {
    showToast('레코드가 삭제되었습니다', 'success');
    loadDNSRecords(zoneId, '');
  } else {
    showToast('삭제 실패', 'error');
  }
}

async function saveSitePHP(siteId) {
  const version = document.querySelector('[data-v].selected')?.dataset?.v || '8.2';
  const res = await api(\`sites/\${siteId}\`, { method: 'PUT', body: { php_version: version } });
  if (res && res.ok) showToast(\`PHP \${version}으로 변경되었습니다\`, 'success');
  else showToast('변경 실패', 'error');
}

function selectSitePHP(btn, ver) {
  document.querySelectorAll('[data-v]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showModal(title, body, actions = []) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = \`
    <div class="modal-header">
      <span class="modal-title">\${title}</span>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" width="14"><path d="M2 2l10 10M12 2L2 12"/></svg>
      </button>
    </div>
    <div class="modal-body">\${body}</div>
    \${actions.length ? \`<div class="modal-footer">
      \${actions.map(a => \`<button class="btn \${a.primary?'btn-primary':a.danger?'btn-danger':'btn-secondary'}" onclick="(\${a.action.toString()})()">\${a.label}</button>\`).join('')}
    </div>\` : ''}
  \`;

  overlay.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOAST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = \`toast toast-\${type}\`;
  toast.innerHTML = \`
    <span>\${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span>
    <span>\${esc(message)}</span>
  \`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return String(n);
}

function formatBytes(b) {
  if (!b) return '0B';
  if (b >= 1073741824) return (b/1073741824).toFixed(1) + 'GB';
  if (b >= 1048576) return (b/1048576).toFixed(1) + 'MB';
  if (b >= 1024) return (b/1024).toFixed(1) + 'KB';
  return b + 'B';
}

function setLoading(btn, spinner, loading) {
  btn.disabled = loading;
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
}

function updateSitesCount(count) {
  const el = document.getElementById('sites-count');
  if (el) el.textContent = count > 0 ? count : '';
}

function emptyStateHTML(title, desc, btnLabel, btnAction) {
  return \`<div class="empty-state">
    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>
    <div class="empty-title">\${title}</div>
    <div class="empty-desc">\${desc}</div>
    <button class="btn btn-primary" onclick="\${btnAction}">\${btnLabel}</button>
  </div>\`;
}

// SVG Icons
function siteIcon() { return \`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="18"><rect x="1.5" y="2.5" width="15" height="13" rx="2"/><path d="M1.5 7h15"/></svg>\`; }
function domainIcon() { return \`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="18"><circle cx="9" cy="9" r="7.5"/><path d="M1.5 9h15M9 1.5a12 12 0 0 1 0 15M9 1.5a12 12 0 0 0 0 15"/></svg>\`; }
function trafficIcon() { return \`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="18"><polyline points="1.5,12 5,7 8,10 12,4.5 16.5,9"/></svg>\`; }
function storageIcon() { return \`<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="18"><ellipse cx="9" cy="5" rx="7.5" ry="2.5"/><path d="M1.5 5v4c0 1.38 3.36 2.5 7.5 2.5S16.5 10.38 16.5 9V5M1.5 9v4c0 1.38 3.36 2.5 7.5 2.5S16.5 14.38 16.5 13V9"/></svg>\`; }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KEYBOARD SHORTCUTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
init();
</script>
</body>
</html>`;
}
