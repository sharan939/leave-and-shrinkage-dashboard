// ========== GOOGLE SHEETS BACKEND CONFIG ==========
// Set this URL after deploying the Google Apps Script as a Web App
// Leave empty to use localStorage only (offline mode)
let SHEET_API_URL = ''; // e.g., 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'

// Sync mode: 'local' (localStorage only) or 'cloud' (Google Sheets + localStorage cache)
let SYNC_MODE = SHEET_API_URL ? 'cloud' : 'local';

// ========== CLOUD SYNC FUNCTIONS ==========
async function cloudFetch(params) {
  if (!SHEET_API_URL) return null;
  try {
    const url = SHEET_API_URL + '?' + new URLSearchParams(params).toString();
    const res = await fetch(url);
    return await res.json();
  } catch (e) { console.warn('Cloud fetch failed:', e); return null; }
}

async function cloudPost(data) {
  if (!SHEET_API_URL) return null;
  try {
    const res = await fetch(SHEET_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) { console.warn('Cloud post failed:', e); return null; }
}

async function syncToCloud() {
  if (!SHEET_API_URL) return;
  // Flatten leaves for cloud
  const allLeaves = [];
  Object.entries(db.leaves).forEach(([mgr, leaves]) => {
    leaves.forEach(l => { allLeaves.push({ ...l, manager: mgr }); });
  });
  // Flatten daily tracker
  const allDaily = [];
  Object.entries(db.dailyTracker || {}).forEach(([mgr, aliases]) => {
    Object.entries(aliases).forEach(([alias, dates]) => {
      Object.entries(dates).forEach(([date, rec]) => {
        allDaily.push({ date, alias, manager: mgr, status: rec.status, notes: rec.notes || '' });
      });
    });
  });
  await cloudPost({ action: 'bulkSync', leaves: allLeaves, daily: allDaily });
  toast('Synced to cloud!');
}

async function syncFromCloud() {
  if (!SHEET_API_URL) return;
  const result = await cloudFetch({ action: 'readAll' });
  if (!result) return;
  // Rebuild leaves
  if (result.leaves) {
    db.leaves = {};
    result.leaves.forEach(l => {
      const mgr = l.manager || 'aggannam';
      if (!db.leaves[mgr]) db.leaves[mgr] = [];
      db.leaves[mgr].push({ id: l.id, alias: l.alias, type: l.type, from: l.from, to: l.to, days: parseFloat(l.days), status: l.status, reason: l.reason, appliedOn: l.appliedOn });
    });
  }
  // Rebuild daily tracker
  if (result.daily) {
    db.dailyTracker = {};
    result.daily.forEach(d => {
      if (!db.dailyTracker[d.manager]) db.dailyTracker[d.manager] = {};
      if (!db.dailyTracker[d.manager][d.alias]) db.dailyTracker[d.manager][d.alias] = {};
      db.dailyTracker[d.manager][d.alias][d.date] = { status: d.status, notes: d.notes || '' };
    });
  }
  save();
  render();
  toast('Synced from cloud!');
}

// ========== ORG DATA ==========
const ORG = {
  'agasarad': { name: 'Sarad Agarwal', title: 'Manager, TPM', level: 6, isMgr: true, mgr: null, directs: ['shoyaba', 'jorrigal', 'kumarshu', 'bhrgar', 'sidhanp', 'duraiv', 'girisada', 'sylimm', 'nidhivya', 'prtbht'] },
  'shoyaba': { name: 'Shoyab Ahamed', title: 'Support Eng Manager', level: 5, isMgr: true, mgr: 'agasarad', directs: ['hmmuttum', 'musavaru', 'bhayush', 'ngowthh', 'snaidus', 'nsskv', 'jyothigr'] },
  'jorrigal': { name: 'Karthik Jorrigal', title: 'Manager II, Program Mgmt', level: 5, isMgr: true, mgr: 'agasarad', directs: ['yohannjo', 'meghamav', 'abhanwad', 'kprasanj', 'chikbal', 'musaddm', 'thotteja', 'vjchilla', 'valavoju'] },
  'kumarshu': { name: 'Shubham Kumar', title: 'Manager II, Prgm Mgmt', level: 5, isMgr: true, mgr: 'agasarad', directs: ['aggannam', 'mssowmya', 'jonnac', 'ypreksha', 'noosuraj', 'mheshpm', 'kgorapal', 'shreevi', 'gosang', 'cheedel', 'rsameerk', 'rmvineet'] },
  'bhrgar': { name: 'Bhargavi Raghavendran', title: 'QA Manager', level: 6, isMgr: true, mgr: 'agasarad', directs: ['prathysr', 'muthindh', 'dvadakat', 'vaischa', 'shreejsj', 'urvenkat', 'ramsais', 'megsb', 'hadhug'] },
  'aggannam': { name: 'Akhila Gannamraju', title: 'Manager II, Prod Compliance', level: 5, isMgr: true, mgr: 'kumarshu', directs: ['muqeemah', 'syesule', 'ketiredd', 'sharkoth', 'rundevak', 'ahmshaiq', 'vijaupot', 'sudaveda', 'vankithe'] },
  'sidhanp': { name: 'Priyanka Sidhani', title: 'Program Manager II', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'duraiv': { name: 'Venkatesh Durai', title: 'Sr. Program Manager', level: 6, isMgr: false, mgr: 'agasarad', directs: [] },
  'girisada': { name: 'Giridhar Saday', title: 'System Dev Engineer', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'sylimm': { name: 'Syed Rashid Ali', title: 'Program Manager', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'nidhivya': { name: 'Nidhi Vyas', title: 'Program Manager II', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'prtbht': { name: 'Pratham Bhat', title: 'Manager, Program Mgmt', level: 6, isMgr: false, mgr: 'agasarad', directs: [] },
  'muqeemah': { name: 'Ahmed Abdul Muqeem', title: 'Catalog Specialist', level: 3, mgr: 'aggannam', directs: [] },
  'syesule': { name: 'Syed Suleman', title: 'Prod Compliance Spec', level: 4, mgr: 'aggannam', directs: [] },
  'ketiredd': { name: 'Kowshik Reddy', title: 'Catalog Specialist', level: 3, mgr: 'aggannam', directs: [] },
  'sharkoth': { name: 'Sharan Kotha', title: 'Catalog Specialist', level: 3, mgr: 'aggannam', directs: [] },
  'rundevak': { name: 'Deva Krishna Babu', title: 'Sr. Prod Compliance', level: 3, mgr: 'aggannam', directs: [] },
  'ahmshaiq': { name: 'Shaik Abdul Ahmed', title: 'Prod Compliance Spec', level: 4, mgr: 'aggannam', directs: [] },
  'vijaupot': { name: 'Vijay Rajan P', title: 'Product Compliance Spec', level: 4, mgr: 'aggannam', directs: [] },
  'sudaveda': { name: 'Veda Vyas S', title: 'Sr. Prod Compliance', level: 3, mgr: 'aggannam', directs: [] },
  'vankithe': { name: 'Ankitha Vyas', title: 'Catalog Specialist', level: 3, mgr: 'aggannam', directs: [] },
  'gvatsala': { name: 'Vatsal Gupta', title: 'Catalog Specialist', level: 3, mgr: 'aggannam', directs: [] },
  'musavaru': { name: 'Musavaru', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'hmmuttum': { name: 'Hmmuttum', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'bhayush': { name: 'Bhayush', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'ngowthh': { name: 'Ngowthh', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'snaidus': { name: 'Snaidus', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'nsskv': { name: 'Nsskv', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'jyothigr': { name: 'Jyothigr', title: 'Direct Report', level: 3, mgr: 'shoyaba', directs: [] },
  'yohannjo': { name: 'Yohannjo', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'meghamav': { name: 'Meghamav', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'abhanwad': { name: 'Abhanwad', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'kprasanj': { name: 'Kprasanj', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'chikbal': { name: 'Chikbal', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'musaddm': { name: 'Musaddm', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'thotteja': { name: 'Thotteja', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'vjchilla': { name: 'Vjchilla', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'valavoju': { name: 'Valavoju', title: 'Direct Report', level: 3, mgr: 'jorrigal', directs: [] },
  'mssowmya': { name: 'Mssowmya', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'jonnac': { name: 'Jonnac', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'ypreksha': { name: 'Ypreksha', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'noosuraj': { name: 'Noosuraj', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'mheshpm': { name: 'Mheshpm', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'kgorapal': { name: 'Kgorapal', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'shreevi': { name: 'Shreevi', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'gosang': { name: 'Gosang', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'cheedel': { name: 'Cheedel', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'rsameerk': { name: 'Rsameerk', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'rmvineet': { name: 'Rmvineet', title: 'Direct Report', level: 3, mgr: 'kumarshu', directs: [] },
  'prathysr': { name: 'Prathysr', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'muthindh': { name: 'Muthindh', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'dvadakat': { name: 'Dvadakat', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'vaischa': { name: 'Vaischa', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'shreejsj': { name: 'Shreejsj', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'urvenkat': { name: 'Urvenkat', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'ramsais': { name: 'Ramsais', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'megsb': { name: 'Megsb', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] },
  'hadhug': { name: 'Hadhug', title: 'Direct Report', level: 3, mgr: 'bhrgar', directs: [] }
};

const LEAVE_TYPES = [
  { id: 'planned', name: 'Planned Leave', color: '#0073bb', bg: '#dbeafe', badge: 'b-blue', calClass: 'planned', annual: 24 },
  { id: 'unplanned', name: 'Unplanned Leave', color: '#d13212', bg: '#fce9e6', badge: 'b-red', calClass: 'unplanned', annual: 12 },
  { id: 'halfday', name: 'Half-day', color: '#ff9900', bg: '#fff3e0', badge: 'b-orange', calClass: 'halfday', annual: null },
  { id: 'mandatory_off', name: 'Mandatory Off', color: '#6b21a8', bg: '#f3e8ff', badge: 'b-purple', calClass: 'planned', annual: null }
];

const SK = 'leave_mgmt_v4';
let state = { view: 'org', mgr: null, nav: 'dashboard', calMonth: new Date().getMonth(), calYear: new Date().getFullYear(), sheetMonth: new Date().getMonth(), sheetYear: new Date().getFullYear() };

// ========== DATABASE ==========
function defaultDB() {
  const db = { leaves: {}, balances: {}, notes: {}, dailyTracker: {}, monthlySheets: {} };
  const wk46 = [
    { alias: 'gvatsala', type: 'planned', from: '2025-11-10', to: '2025-11-14', days: 5, status: 'approved', reason: 'Vacation' },
    { alias: 'sharkoth', type: 'planned', from: '2025-11-10', to: '2025-11-12', days: 3, status: 'approved', reason: 'Personal work' },
    { alias: 'musaddm', type: 'unplanned', from: '2025-11-11', to: '2025-11-11', days: 1, status: 'approved', reason: 'Sick' },
    { alias: 'muqeemah', type: 'unplanned', from: '2025-11-12', to: '2025-11-12', days: 1, status: 'approved', reason: 'Emergency' },
    { alias: 'valavoju', type: 'unplanned', from: '2025-11-13', to: '2025-11-13', days: 1, status: 'approved', reason: 'Personal' },
    { alias: 'vijaupot', type: 'unplanned', from: '2025-11-10', to: '2025-11-10', days: 1, status: 'approved', reason: 'Sick' },
    { alias: 'ketiredd', type: 'halfday', from: '2025-11-14', to: '2025-11-14', days: 0.5, status: 'approved', reason: 'Doctor appointment' },
    { alias: 'chikbal', type: 'halfday', from: '2025-11-14', to: '2025-11-14', days: 0.5, status: 'approved', reason: 'Personal' },
    { alias: 'ypreksha', type: 'halfday', from: '2025-11-14', to: '2025-11-14', days: 0.5, status: 'approved', reason: 'Personal' },
    { alias: 'shreevi', type: 'halfday', from: '2025-11-13', to: '2025-11-13', days: 0.5, status: 'approved', reason: 'Appointment' },
    { alias: 'rundevak', type: 'halfday', from: '2025-11-12', to: '2025-11-12', days: 0.5, status: 'approved', reason: 'Personal' },
    { alias: 'abhanwad', type: 'halfday', from: '2025-11-11', to: '2025-11-11', days: 0.5, status: 'approved', reason: 'Personal' },
    { alias: 'ahmshaiq', type: 'unplanned', from: '2025-11-17', to: '2025-11-18', days: 2, status: 'approved', reason: 'Sick' },
    { alias: 'vijaupot', type: 'unplanned', from: '2025-11-17', to: '2025-11-18', days: 2, status: 'approved', reason: 'Family emergency' },
    { alias: 'ketiredd', type: 'unplanned', from: '2025-11-18', to: '2025-11-18', days: 1, status: 'approved', reason: 'Unwell' },
    { alias: 'syesule', type: 'unplanned', from: '2025-11-19', to: '2025-11-19', days: 1, status: 'approved', reason: 'Personal' },
    { alias: 'thotteja', type: 'unplanned', from: '2025-11-20', to: '2025-11-20', days: 1, status: 'approved', reason: 'Sick' },
    { alias: 'abhanwad', type: 'unplanned', from: '2025-11-17', to: '2025-11-17', days: 1, status: 'approved', reason: 'Emergency' },
    { alias: 'vankithe', type: 'planned', from: '2025-11-21', to: '2025-11-21', days: 1, status: 'approved', reason: 'Festival' }
  ];
  wk46.forEach((l, i) => {
    const mgr = ORG[l.alias] ? ORG[l.alias].mgr : 'aggannam';
    if (!db.leaves[mgr]) db.leaves[mgr] = [];
    db.leaves[mgr].push({ id: 'L' + (1000 + i), alias: l.alias, type: l.type, from: l.from, to: l.to, days: l.days, status: l.status, reason: l.reason, appliedOn: '2025-11-08' });
  });
  // Pre-populate daily tracker for Akhila's team
  const today = new Date().toISOString().slice(0, 10);
  db.dailyTracker['aggannam'] = {};
  ORG['aggannam'].directs.forEach(a => {
    db.dailyTracker['aggannam'][a] = { [today]: { status: 'present', notes: '' } };
  });
  return db;
}

let db;
try { const s = localStorage.getItem(SK); db = s ? JSON.parse(s) : defaultDB(); } catch (e) { db = defaultDB(); }
function save() {
  localStorage.setItem(SK, JSON.stringify(db));
  // Auto-sync individual changes to cloud if connected
  if (SHEET_API_URL && SYNC_MODE === 'cloud') {
    // Debounced cloud sync (don't flood on every keystroke)
    clearTimeout(save._timer);
    save._timer = setTimeout(() => syncToCloud(), 5000);
  }
}

// ========== HELPERS ==========
function getMgrs(alias) { const o = ORG[alias]; if (!o) return []; return o.directs.filter(d => ORG[d] && ORG[d].isMgr && ORG[d].directs.length > 0); }
function getICs(alias) { const o = ORG[alias]; if (!o) return []; return o.directs.filter(d => { const di = ORG[d]; return di && (!di.isMgr || di.directs.length === 0); }); }
function allReports(alias) { const o = ORG[alias]; if (!o || !o.directs) return []; let a = []; o.directs.forEach(d => { a.push(d); a = a.concat(allReports(d)); }); return a; }
function getLeaves(mgr) { return db.leaves[mgr] || []; }
function mgrPath(alias) { const p = [alias]; let c = alias; while (ORG[c] && ORG[c].mgr && ORG[c].mgr !== 'agasarad') { c = ORG[c].mgr; p.unshift(c); } return p; }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000); }
function closeModal(e) { if (e.target.id === 'modal') document.getElementById('modal').classList.remove('show'); }
function showModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal').classList.add('show'); }
function hideModal() { document.getElementById('modal').classList.remove('show'); }
function refreshDashboard() {
  if (SHEET_API_URL) { syncFromCloud().then(() => render()); }
  else { render(); toast('Dashboard refreshed!'); }
}
function getMonthKey(y, m) { return `${y}-${String(m + 1).padStart(2, '0')}`; }
function showSyncSettings() {
  let h = '<h2>&#9729; Cloud Sync Settings</h2>';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Connect to Google Sheets so all team members share the same data.</p>';
  h += `<div class="fg"><label>Google Apps Script URL</label><input type="text" id="sync-url" value="${SHEET_API_URL}" placeholder="https://script.google.com/macros/s/.../exec"></div>`;
  h += '<div class="modal-foot">';
  h += '<button class="btn btn-s" onclick="hideModal()">Cancel</button>';
  h += '<button class="btn btn-p" onclick="saveSyncUrl()">Save & Connect</button>';
  if (SHEET_API_URL) {
    h += ' <button class="btn btn-g" onclick="syncToCloud()">Push to Cloud</button>';
    h += ' <button class="btn btn-s" onclick="syncFromCloud()">Pull from Cloud</button>';
  }
  h += '</div>';
  showModal(h);
}
function saveSyncUrl() {
  const url = document.getElementById('sync-url').value.trim();
  SHEET_API_URL = url;
  SYNC_MODE = url ? 'cloud' : 'local';
  localStorage.setItem('sheet_api_url', url);
  hideModal();
  toast(url ? 'Connected to Google Sheets!' : 'Cloud sync disabled. Using local storage.');
  render();
}
// Load saved API URL on startup
(function loadSyncUrl() {
  const saved = localStorage.getItem('sheet_api_url');
  if (saved) { SHEET_API_URL = saved; SYNC_MODE = 'cloud'; }
})();

// ========== SIDEBAR ==========
function renderSidebar() {
  const sb = document.getElementById('sidebar');
  const n = state.nav;
  const pendingCount = state.mgr ? getLeaves(state.mgr).filter(l => l.status === 'pending').length : 0;
  let h = '<div class="nav-section"><div class="nav-title">Navigation</div>';
  h += `<div class="nav-item ${!state.mgr ? 'active' : ''}" onclick="goOrg()"><span class="icon">&#127970;</span>Org Overview</div>`;
  h += '</div>';
  if (state.mgr) {
    const info = ORG[state.mgr];
    h += `<div class="nav-section"><div class="nav-title">${info.name}'s Team</div>`;
    h += `<div class="nav-item ${n === 'dashboard' ? 'active' : ''}" onclick="setNav('dashboard')"><span class="icon">&#128202;</span>Dashboard</div>`;
    h += `<div class="nav-item ${n === 'calendar' ? 'active' : ''}" onclick="setNav('calendar')"><span class="icon">&#128197;</span>Calendar</div>`;
    h += `<div class="nav-item ${n === 'leaves' ? 'active' : ''}" onclick="setNav('leaves')"><span class="icon">&#128221;</span>Leave Records${pendingCount ? '<span class="badge-count">' + pendingCount + '</span>' : ''}</div>`;
    h += `<div class="nav-item ${n === 'spreadsheet' ? 'active' : ''}" onclick="setNav('spreadsheet')"><span class="icon">&#128203;</span>Monthly Sheet</div>`;
    h += `<div class="nav-item ${n === 'apply' ? 'active' : ''}" onclick="setNav('apply')"><span class="icon">&#10133;</span>Apply Leave</div>`;
    h += `<div class="nav-item ${n === 'team' ? 'active' : ''}" onclick="setNav('team')"><span class="icon">&#128101;</span>Team</div>`;
    h += `<div class="nav-item ${n === 'reports' ? 'active' : ''}" onclick="setNav('reports')"><span class="icon">&#128200;</span>Reports</div>`;
    h += `<div class="nav-item ${n === 'daily' ? 'active' : ''}" onclick="setNav('daily')"><span class="icon">&#128197;</span>Daily Tracker</div>`;
    h += '</div>';
  }
  sb.innerHTML = h;
}

function goOrg() { state.view = 'org'; state.mgr = null; state.nav = 'dashboard'; render(); }
function goMgr(alias) { state.view = 'mgr'; state.mgr = alias; state.nav = 'dashboard'; render(); }
function setNav(n) { state.nav = n; render(); }

// ========== MAIN RENDER ==========
function render() {
  renderSidebar();
  const mc = document.getElementById('main');
  if (state.view === 'org') renderOrgView(mc);
  else renderMgrView(mc);
}

// ========== ORG VIEW ==========
function renderOrgView(c) {
  const mgrs = getMgrs('agasarad');
  const ics = getICs('agasarad');
  const total = allReports('agasarad').length;
  let h = `<div class="breadcrumb"><span class="current">&#127970; Org: Sarad Agarwal</span></div>`;
  h += `<div class="stats">
    <div class="stat"><div class="val">${mgrs.length}</div><div class="lbl">Managers</div></div>
    <div class="stat"><div class="val">${ics.length}</div><div class="lbl">ICs (Direct)</div></div>
    <div class="stat"><div class="val">${total}</div><div class="lbl">Total Org</div></div>
  </div>`;
  h += '<div class="card"><h2>Managers &mdash; Click to open team</h2><div class="mgr-grid">';
  mgrs.forEach(a => {
    const i = ORG[a]; const ts = allReports(a).length; const sm = getMgrs(a).length;
    const leaves = getLeaves(a); const pending = leaves.filter(l => l.status === 'pending').length;
    h += `<div class="mgr-card" onclick="goMgr('${a}')">
      <div class="mb"><span class="badge b-purple">L${i.level}</span></div>
      <div class="mn">${i.name}</div><div class="mt">${i.title}</div>
      <div class="ms">
        <div><div class="mv">${ts}</div><div class="ml">Team</div></div>
        <div><div class="mv">${i.directs.length}</div><div class="ml">Directs</div></div>
        ${sm ? `<div><div class="mv">${sm}</div><div class="ml">Sub-Mgrs</div></div>` : ''}
        ${pending ? `<div><div class="mv" style="color:var(--danger)">${pending}</div><div class="ml">Pending</div></div>` : ''}
      </div>
    </div>`;
  });
  h += '</div></div>';
  if (ics.length) {
    h += '<div class="card"><h2>Individual Contributors (Direct to Sarad)</h2><table><thead><tr><th>Alias</th><th>Name</th><th>Title</th><th>Level</th></tr></thead><tbody>';
    ics.forEach(a => { const i = ORG[a]; h += `<tr><td><strong>${a}</strong></td><td>${i.name}</td><td>${i.title}</td><td><span class="badge b-purple">L${i.level}</span></td></tr>`; });
    h += '</tbody></table></div>';
  }
  c.innerHTML = h;
}

// ========== MANAGER VIEW ==========
function renderMgrView(c) {
  const info = ORG[state.mgr];
  const path = mgrPath(state.mgr);
  let bc = '<div class="breadcrumb"><a onclick="goOrg()">Org: Sarad</a>';
  path.forEach((a, i) => {
    if (i < path.length - 1) bc += `<span class="sep">&rsaquo;</span><a onclick="goMgr('${a}')">${ORG[a].name}</a>`;
    else bc += `<span class="sep">&rsaquo;</span><span class="current">${ORG[a].name}</span>`;
  });
  bc += '</div>';
  const subMgrs = getMgrs(state.mgr);
  let subH = '';
  if (subMgrs.length) {
    subH = '<div class="card"><h2>Sub-Managers</h2><div class="mgr-grid">';
    subMgrs.forEach(a => {
      const i = ORG[a]; const ts = allReports(a).length;
      subH += `<div class="mgr-card" onclick="goMgr('${a}')"><div class="mb"><span class="badge b-purple">L${i.level}</span></div>
        <div class="mn">${i.name}</div><div class="mt">${i.title}</div>
        <div class="ms"><div><div class="mv">${ts}</div><div class="ml">Team</div></div><div><div class="mv">${i.directs.length}</div><div class="ml">Directs</div></div></div></div>`;
    });
    subH += '</div></div>';
  }
  let content = '';
  const n = state.nav;
  if (n === 'dashboard') content = renderDashboard();
  else if (n === 'calendar') content = renderCalendar();
  else if (n === 'leaves') content = renderLeaves();
  else if (n === 'spreadsheet') content = renderSpreadsheet();
  else if (n === 'apply') content = renderApplyLeave();
  else if (n === 'team') content = renderTeam();
  else if (n === 'reports') content = renderReports();
  else if (n === 'daily') content = renderDailyTracker();
  c.innerHTML = bc + subH + content;
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const ics = getICs(state.mgr);
  const leaves = getLeaves(state.mgr);
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  let totalP = 0, totalU = 0, totalH = 0, pending = 0;
  leaves.forEach(l => {
    if (l.type === 'planned') totalP += l.days;
    if (l.type === 'unplanned') totalU += l.days;
    if (l.type === 'halfday') totalH += l.days;
    if (l.status === 'pending') pending++;
  });
  const onLeaveToday = [];
  leaves.forEach(l => { if (l.status === 'approved' && l.from <= today && l.to >= today) onLeaveToday.push(l); });

  // Count availability using daily tracker (most accurate) + leave records as fallback
  let availableCount = 0;
  ics.forEach(a => {
    const trackerRec = db.dailyTracker && db.dailyTracker[state.mgr] && db.dailyTracker[state.mgr][a] && db.dailyTracker[state.mgr][a][today];
    if (trackerRec && trackerRec.status !== 'present') {
      // Not available
    } else if (onLeaveToday.find(l => l.alias === a)) {
      // Not available
    } else {
      availableCount++;
    }
  });
  const availableToday = availableCount;

  let h = `<div class="stats">
    <div class="stat green"><div class="val">${availableToday}/${ics.length}</div><div class="lbl">Available Today</div></div>
    <div class="stat"><div class="val">${leaves.length}</div><div class="lbl">Total Records</div></div>
    <div class="stat"><div class="val">${totalP}</div><div class="lbl">Planned Days</div></div>
    <div class="stat red"><div class="val">${totalU}</div><div class="lbl">Unplanned Days</div></div>
    <div class="stat orange"><div class="val">${totalH}</div><div class="lbl">Half-days</div></div>
    ${pending ? `<div class="stat red"><div class="val">${pending}</div><div class="lbl">Pending Approval</div></div>` : ''}
  </div>`;

  // Today's availability cards
  h += '<div class="card"><h2>&#128994; Today\'s Availability</h2><div class="avail-grid">';
  ics.forEach(a => {
    const info = ORG[a] || { name: a };
    // Check daily tracker first (most up-to-date), then fall back to leave records
    const trackerRec = db.dailyTracker && db.dailyTracker[state.mgr] && db.dailyTracker[state.mgr][a] && db.dailyTracker[state.mgr][a][today];
    const leave = onLeaveToday.find(l => l.alias === a);

    let status = 'available';
    let badgeClass = 'b-green';
    let badgeText = 'Available';
    let cardClass = 'available';

    if (trackerRec && trackerRec.status !== 'present') {
      // Daily tracker takes priority
      if (trackerRec.status === 'absent') { status = 'absent'; badgeClass = 'b-red'; badgeText = trackerRec.leaveType ? trackerRec.leaveType.charAt(0).toUpperCase() + trackerRec.leaveType.slice(1) + ' Leave' : 'Absent'; cardClass = 'on-leave'; }
      else if (trackerRec.status === 'halfday') { status = 'halfday'; badgeClass = 'b-orange'; badgeText = 'Half-day'; cardClass = 'half'; }
      else if (trackerRec.status === 'mandate_off') { status = 'mandate_off'; badgeClass = 'b-purple'; badgeText = 'Mandate Off'; cardClass = 'on-leave'; }
    } else if (leave) {
      // Fall back to leave records
      const lt = LEAVE_TYPES.find(t => t.id === leave.type);
      if (leave.type === 'halfday') { cardClass = 'half'; badgeClass = lt ? lt.badge : 'b-orange'; badgeText = 'Half-day'; }
      else { cardClass = 'on-leave'; badgeClass = lt ? lt.badge : 'b-red'; badgeText = lt ? lt.name : leave.type; }
    }

    h += `<div class="avail-card ${cardClass}"><div class="aa">${a}</div>${info.name}<br><span class="badge ${badgeClass}">${badgeText}</span></div>`;
  });
  h += '</div></div>';

  // Leave distribution chart
  const perA = {};
  ics.forEach(a => { perA[a] = [0, 0, 0, 0]; });
  leaves.forEach(l => { if (!perA[l.alias]) return; const ti = LEAVE_TYPES.findIndex(t => t.id === l.type); if (ti >= 0) perA[l.alias][ti] += l.days; });
  const maxV = Math.max(...Object.values(perA).map(v => v[0] + v[1] + v[2] + v[3]), 1);
  const sorted = Object.entries(perA).sort((a, b) => (b[1][0] + b[1][1] + b[1][2] + b[1][3]) - (a[1][0] + a[1][1] + a[1][2] + a[1][3]));
  h += '<div class="card"><h2>Leave Distribution</h2>';
  h += '<div class="legend"><div class="legend-i"><div class="legend-d" style="background:#0073bb"></div>Planned</div><div class="legend-i"><div class="legend-d" style="background:#d13212"></div>Unplanned</div><div class="legend-i"><div class="legend-d" style="background:#ff9900"></div>Half-day</div><div class="legend-i"><div class="legend-d" style="background:#6b21a8"></div>Mandatory Off</div></div>';
  h += '<div class="bar-chart">';
  sorted.forEach(([a, v]) => {
    const t = v[0] + v[1] + v[2] + v[3]; if (t === 0) return;
    h += `<div class="bar-row"><div class="bar-lbl" title="${ORG[a] ? ORG[a].name : a}">${a}</div><div class="bar-track"><div style="display:flex;height:100%">`;
    if (v[0]) h += `<div class="bar-fill" style="width:${v[0] / maxV * 100}%;background:#0073bb">${v[0]}</div>`;
    if (v[1]) h += `<div class="bar-fill" style="width:${v[1] / maxV * 100}%;background:#d13212">${v[1]}</div>`;
    if (v[2]) h += `<div class="bar-fill" style="width:${v[2] / maxV * 100}%;background:#ff9900">${v[2]}</div>`;
    if (v[3]) h += `<div class="bar-fill" style="width:${v[3] / maxV * 100}%;background:#6b21a8">${v[3]}</div>`;
    h += '</div></div></div>';
  });
  h += '</div></div>';

  // Recent leaves table
  const recent = leaves.slice().sort((a, b) => b.from.localeCompare(a.from)).slice(0, 10);
  h += '<div class="card"><h2>Recent Leave Records</h2><table><thead><tr><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead><tbody>';
  recent.forEach(l => {
    const lt = LEAVE_TYPES.find(t => t.id === l.type);
    const stBadge = l.status === 'approved' ? 'b-green' : l.status === 'pending' ? 'b-orange' : 'b-red';
    h += `<tr><td><strong>${l.alias}</strong></td><td><span class="badge ${lt ? lt.badge : 'b-gray'}">${lt ? lt.name : l.type}</span></td>
      <td>${l.from}</td><td>${l.to}</td><td class="num">${l.days}</td>
      <td><span class="badge ${stBadge}">${l.status}</span></td><td>${l.reason || '-'}</td></tr>`;
  });
  h += '</tbody></table></div>';

  // Daily tracker summary for all managers
  h += renderDailySnapshot();

  // Charts
  h += renderCharts();

  return h;
}

// ========== DAILY SNAPSHOT (for any manager's dashboard) ==========
function renderDailySnapshot() {
  const mgr = state.mgr;
  const today = new Date().toISOString().slice(0, 10);
  const tracker = db.dailyTracker[mgr] || {};
  const ics = getICs(mgr);
  let present = 0, absent = 0, half = 0, mandateOff = 0;
  ics.forEach(a => {
    const rec = tracker[a] && tracker[a][today];
    if (rec) {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'halfday') half++;
      else if (rec.status === 'mandate_off') mandateOff++;
    } else { present++; }
  });
  const totalAbsent = absent + half * 0.5 + mandateOff;
  const shrinkage = ics.length > 0 ? ((totalAbsent / ics.length) * 100).toFixed(1) : 0;
  let h = `<div class="card"><h2>&#128197; Today's Daily Tracker Summary</h2>
    <div class="stats">
      <div class="stat green"><div class="val">${present}</div><div class="lbl">Present</div></div>
      <div class="stat red"><div class="val">${absent}</div><div class="lbl">Absent</div></div>
      <div class="stat orange"><div class="val">${half}</div><div class="lbl">Half-day</div></div>
      <div class="stat"><div class="val">${mandateOff}</div><div class="lbl">Mandate Off</div></div>
      <div class="stat ${parseFloat(shrinkage) > 20 ? 'red' : 'green'}"><div class="val">${shrinkage}%</div><div class="lbl">Shrinkage</div></div>
    </div>
    <button class="btn btn-p" onclick="setNav('daily')">Open Daily Tracker &rarr;</button>
  </div>`;
  return h;
}

// ========== CALENDAR ==========
function renderCalendar() {
  const m = state.calMonth, y = state.calYear;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const leaves = getLeaves(state.mgr).filter(l => l.status === 'approved');
  const dateMap = {};
  leaves.forEach(l => {
    let d = new Date(l.from); const end = new Date(l.to);
    while (d <= end) {
      const ds = d.toISOString().slice(0, 10);
      if (ds.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)) {
        if (!dateMap[ds]) dateMap[ds] = [];
        dateMap[ds].push(l);
      }
      d.setDate(d.getDate() + 1);
    }
  });
  let h = `<div class="card"><div class="cal"><div class="cal-header">
    <div class="cal-nav"><button onclick="calNav(-1)">&laquo; Prev</button></div>
    <h3>${months[m]} ${y}</h3>
    <div class="cal-nav"><button onclick="calNav(1)">Next &raquo;</button></div>
  </div><div class="cal-grid">`;
  days.forEach(d => { h += `<div class="cal-day-header">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) { h += '<div class="cal-day other"></div>'; }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = ds === todayStr;
    h += `<div class="cal-day${isToday ? ' today' : ''}"><div class="day-num">${d}</div>`;
    if (dateMap[ds]) {
      const shown = new Set();
      dateMap[ds].forEach(l => {
        if (shown.has(l.alias)) return; shown.add(l.alias);
        const lt = LEAVE_TYPES.find(t => t.id === l.type);
        h += `<div class="leave-dot ${lt ? lt.calClass : ''}" title="${l.alias}: ${lt ? lt.name : l.type}">${l.alias}</div>`;
      });
    }
    h += '</div>';
  }
  h += '</div></div></div>';
  return h;
}
function calNav(dir) {
  state.calMonth += dir;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  render();
}

// ========== LEAVE RECORDS (Read/Write/Update) ==========
function renderLeaves() {
  const leaves = getLeaves(state.mgr);
  const pending = leaves.filter(l => l.status === 'pending');
  const approved = leaves.filter(l => l.status === 'approved');
  const rejected = leaves.filter(l => l.status === 'rejected');
  let h = '';

  // Pending approvals
  if (pending.length) {
    h += '<div class="card"><h2>&#9888;&#65039; Pending Approval (' + pending.length + ')</h2><table><thead><tr><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Actions</th></tr></thead><tbody>';
    pending.forEach(l => {
      const lt = LEAVE_TYPES.find(t => t.id === l.type);
      h += `<tr><td><strong>${l.alias}</strong></td><td><span class="badge ${lt ? lt.badge : 'b-gray'}">${lt ? lt.name : l.type}</span></td>
        <td>${l.from}</td><td>${l.to}</td><td class="num">${l.days}</td><td>${l.reason || '-'}</td>
        <td><button class="btn btn-g btn-sm" onclick="approveLeave('${l.id}')">Approve</button> <button class="btn btn-d btn-sm" onclick="rejectLeave('${l.id}')">Reject</button></td></tr>`;
    });
    h += '</tbody></table></div>';
  }

  // All records with edit/delete
  h += '<div class="card"><h2>All Leave Records (' + leaves.length + ')</h2>';
  h += '<div style="margin-bottom:12px"><button class="btn btn-p" onclick="showAddLeaveModal()">+ Add Record</button></div>';
  h += '<table><thead><tr><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th><th>Actions</th></tr></thead><tbody>';
  leaves.slice().sort((a, b) => b.from.localeCompare(a.from)).forEach(l => {
    const lt = LEAVE_TYPES.find(t => t.id === l.type);
    const stBadge = l.status === 'approved' ? 'b-green' : l.status === 'pending' ? 'b-orange' : 'b-red';
    h += `<tr><td><strong>${l.alias}</strong></td><td><span class="badge ${lt ? lt.badge : 'b-gray'}">${lt ? lt.name : l.type}</span></td>
      <td>${l.from}</td><td>${l.to}</td><td class="num">${l.days}</td>
      <td><span class="badge ${stBadge}">${l.status}</span></td><td>${l.reason || '-'}</td>
      <td><button class="btn btn-s btn-sm" onclick="editLeaveModal('${l.id}')">&#9998; Edit</button> <button class="btn btn-d btn-sm" onclick="deleteLeave('${l.id}')">&#128465;</button></td></tr>`;
  });
  h += '</tbody></table></div>';
  return h;
}

function approveLeave(id) {
  const leaves = db.leaves[state.mgr];
  const l = leaves.find(x => x.id === id);
  if (l) { l.status = 'approved'; save(); render(); toast('Leave approved!'); }
}
function rejectLeave(id) {
  const leaves = db.leaves[state.mgr];
  const l = leaves.find(x => x.id === id);
  if (l) { l.status = 'rejected'; save(); render(); toast('Leave rejected.'); }
}
function deleteLeave(id) {
  if (!isAdmin) { alert("View-only mode. Click Admin button to enable editing."); return; }
  if (!confirm('Delete this leave record?')) return;
  db.leaves[state.mgr] = (db.leaves[state.mgr] || []).filter(x => x.id !== id);
  save(); render(); toast('Record deleted.');
}

function showAddLeaveModal() {
  const ics = getICs(state.mgr);
  let h = '<h2>Add Leave Record</h2>';
  h += '<div class="fg"><label>Associate</label><select id="m-alias">';
  ics.forEach(a => { h += `<option value="${a}">${a} - ${ORG[a] ? ORG[a].name : a}</option>`; });
  h += '</select></div>';
  h += '<div class="fg"><label>Leave Type</label><select id="m-type">';
  LEAVE_TYPES.forEach(t => { h += `<option value="${t.id}">${t.name}</option>`; });
  h += '</select></div>';
  h += '<div class="fr"><div class="fg"><label>From</label><input type="date" id="m-from"></div><div class="fg"><label>To</label><input type="date" id="m-to"></div></div>';
  h += '<div class="fg"><label>Days</label><input type="number" id="m-days" step="0.5" min="0.5"></div>';
  h += '<div class="fg"><label>Status</label><select id="m-status"><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></div>';
  h += '<div class="fg"><label>Reason</label><input type="text" id="m-reason" placeholder="Reason for leave"></div>';
  h += '<div class="modal-foot"><button class="btn btn-s" onclick="hideModal()">Cancel</button><button class="btn btn-p" onclick="saveNewLeave()">Save</button></div>';
  showModal(h);
}

function saveNewLeave() {
  if (!isAdmin) { alert("View-only mode. Click Admin button to enable editing."); return; }
  const alias = document.getElementById('m-alias').value;
  const type = document.getElementById('m-type').value;
  const from = document.getElementById('m-from').value;
  const to = document.getElementById('m-to').value;
  const days = parseFloat(document.getElementById('m-days').value);
  const status = document.getElementById('m-status').value;
  const reason = document.getElementById('m-reason').value;
  if (!alias || !from || !to || !days) { alert('Please fill all required fields.'); return; }
  if (!db.leaves[state.mgr]) db.leaves[state.mgr] = [];
  db.leaves[state.mgr].push({ id: 'L' + Date.now(), alias, type, from, to, days, status, reason, appliedOn: new Date().toISOString().slice(0, 10) });
  save(); hideModal(); render(); toast('Leave record added!');
}

function editLeaveModal(id) {
  const leaves = db.leaves[state.mgr];
  const l = leaves.find(x => x.id === id);
  if (!l) return;
  const ics = getICs(state.mgr);
  let h = '<h2>Edit Leave Record</h2>';
  h += '<div class="fg"><label>Associate</label><select id="m-alias">';
  ics.forEach(a => { h += `<option value="${a}" ${a === l.alias ? 'selected' : ''}>${a} - ${ORG[a] ? ORG[a].name : a}</option>`; });
  h += '</select></div>';
  h += '<div class="fg"><label>Leave Type</label><select id="m-type">';
  LEAVE_TYPES.forEach(t => { h += `<option value="${t.id}" ${t.id === l.type ? 'selected' : ''}>${t.name}</option>`; });
  h += '</select></div>';
  h += `<div class="fr"><div class="fg"><label>From</label><input type="date" id="m-from" value="${l.from}"></div><div class="fg"><label>To</label><input type="date" id="m-to" value="${l.to}"></div></div>`;
  h += `<div class="fg"><label>Days</label><input type="number" id="m-days" step="0.5" min="0.5" value="${l.days}"></div>`;
  h += `<div class="fg"><label>Status</label><select id="m-status"><option value="approved" ${l.status === 'approved' ? 'selected' : ''}>Approved</option><option value="pending" ${l.status === 'pending' ? 'selected' : ''}>Pending</option><option value="rejected" ${l.status === 'rejected' ? 'selected' : ''}>Rejected</option></select></div>`;
  h += `<div class="fg"><label>Reason</label><input type="text" id="m-reason" value="${l.reason || ''}"></div>`;
  h += `<div class="modal-foot"><button class="btn btn-s" onclick="hideModal()">Cancel</button><button class="btn btn-p" onclick="saveEditLeave('${id}')">Update</button></div>`;
  showModal(h);
}

function saveEditLeave(id) {
  if (!isAdmin) { alert("View-only mode. Click Admin button to enable editing."); return; }
  const leaves = db.leaves[state.mgr];
  const l = leaves.find(x => x.id === id);
  if (!l) return;
  l.alias = document.getElementById('m-alias').value;
  l.type = document.getElementById('m-type').value;
  l.from = document.getElementById('m-from').value;
  l.to = document.getElementById('m-to').value;
  l.days = parseFloat(document.getElementById('m-days').value);
  l.status = document.getElementById('m-status').value;
  l.reason = document.getElementById('m-reason').value;
  save(); hideModal(); render(); toast('Leave record updated!');
}

// ========== MONTHLY SPREADSHEET (Per Manager) ==========
function renderSpreadsheet() {
  const mgr = state.mgr;
  const ics = getICs(mgr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const m = state.sheetMonth, y = state.sheetYear;
  const mk = getMonthKey(y, m);
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // Initialize monthly sheet data if not exists
  if (!db.monthlySheets) db.monthlySheets = {};
  if (!db.monthlySheets[mgr]) db.monthlySheets[mgr] = {};
  if (!db.monthlySheets[mgr][mk]) {
    db.monthlySheets[mgr][mk] = {};
    ics.forEach(a => {
      db.monthlySheets[mgr][mk][a] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(y, m, d).getDay();
        // Default weekends to 'WO' (week off), weekdays to 'P' (present)
        db.monthlySheets[mgr][mk][a][ds] = (dow === 0 || dow === 6) ? 'WO' : 'P';
      }
    });
    // Overlay existing leave data
    const leaves = getLeaves(mgr).filter(l => l.status === 'approved');
    leaves.forEach(l => {
      let d = new Date(l.from); const end = new Date(l.to);
      while (d <= end) {
        const ds = d.toISOString().slice(0, 10);
        if (ds.startsWith(mk) && db.monthlySheets[mgr][mk][l.alias]) {
          if (l.type === 'planned') db.monthlySheets[mgr][mk][l.alias][ds] = 'PL';
          else if (l.type === 'unplanned') db.monthlySheets[mgr][mk][l.alias][ds] = 'UL';
          else if (l.type === 'halfday') db.monthlySheets[mgr][mk][l.alias][ds] = 'HD';
        }
        d.setDate(d.getDate() + 1);
      }
    });
    save();
  }

  const sheetData = db.monthlySheets[mgr][mk];

  let h = '<div class="card">';
  h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <h2>&#128203; Monthly Sheet: ${months[m]} ${y}</h2>
    <div style="display:flex;gap:8px">
      <button class="btn btn-s btn-sm" onclick="sheetNav(-1)">&laquo; Prev</button>
      <button class="btn btn-s btn-sm" onclick="sheetNav(1)">Next &raquo;</button>
      <button class="btn btn-p btn-sm" onclick="saveSheet()">&#128190; Save Changes</button>
      <button class="btn btn-s btn-sm" onclick="exportSheetCSV()">Export CSV</button>
    </div>
  </div>`;

  // Legend
  h += '<div style="margin-bottom:10px;font-size:11px;display:flex;gap:12px;flex-wrap:wrap">';
  h += '<span><strong>P</strong>=Present</span><span style="color:var(--primary)"><strong>PL</strong>=Planned Leave</span>';
  h += '<span style="color:var(--danger)"><strong>UL</strong>=Unplanned Leave</span><span style="color:var(--warn)"><strong>HD</strong>=Half-day</span>';
  h += '<span style="color:var(--muted)"><strong>WO</strong>=Week Off</span><span style="color:var(--purple)"><strong>MO</strong>=Mandatory Off</span>';
  h += '<span style="color:#555"><strong>H</strong>=Holiday</span>';
  h += '</div>';

  // Spreadsheet table
  h += '<div class="spreadsheet"><table><thead><tr><th style="position:sticky;left:0;background:#fff;z-index:1">Associate</th>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(y, m, d).getDay();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const isWE = dow === 0 || dow === 6;
    h += `<th style="text-align:center;min-width:36px;${isWE ? 'background:#f0f0f0' : ''}">${d}<br><span style="font-size:9px">${dayNames[dow]}</span></th>`;
  }
  h += '<th>Total P</th><th>Total PL</th><th>Total UL</th><th>Total HD</th></tr></thead><tbody>';

  ics.forEach(a => {
    const row = sheetData[a] || {};
    let tP = 0, tPL = 0, tUL = 0, tHD = 0;
    h += `<tr><td style="position:sticky;left:0;background:#fff;z-index:1;font-weight:600;white-space:nowrap">${a}</td>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const val = row[ds] || 'P';
      if (val === 'P') tP++;
      else if (val === 'PL') tPL++;
      else if (val === 'UL') tUL++;
      else if (val === 'HD') { tHD++; tP += 0.5; }
      let bg = '';
      if (val === 'PL') bg = 'background:#dbeafe';
      else if (val === 'UL') bg = 'background:#fce9e6';
      else if (val === 'HD') bg = 'background:#fff3e0';
      else if (val === 'WO') bg = 'background:#f0f0f0';
      else if (val === 'MO') bg = 'background:#f3e8ff';
      else if (val === 'H') bg = 'background:#e8e8e8';
      h += `<td style="text-align:center;padding:2px;${bg}"><select style="width:42px;font-size:10px;padding:1px;border:1px solid #eee;border-radius:2px" onchange="updateSheetCell('${a}','${ds}',this.value)">
        <option value="P" ${val === 'P' ? 'selected' : ''}>P</option>
        <option value="PL" ${val === 'PL' ? 'selected' : ''}>PL</option>
        <option value="UL" ${val === 'UL' ? 'selected' : ''}>UL</option>
        <option value="HD" ${val === 'HD' ? 'selected' : ''}>HD</option>
        <option value="MO" ${val === 'MO' ? 'selected' : ''}>MO</option>
        <option value="WO" ${val === 'WO' ? 'selected' : ''}>WO</option>
        <option value="H" ${val === 'H' ? 'selected' : ''}>H</option>
      </select></td>`;
    }
    h += `<td class="num">${tP}</td><td class="num" style="color:var(--primary)">${tPL}</td><td class="num" style="color:var(--danger)">${tUL}</td><td class="num" style="color:var(--warn)">${tHD}</td></tr>`;
  });
  h += '</tbody></table></div></div>';

  // Summary stats from sheet
  let grandP = 0, grandPL = 0, grandUL = 0, grandHD = 0;
  ics.forEach(a => {
    const row = sheetData[a] || {};
    Object.values(row).forEach(v => {
      if (v === 'P') grandP++;
      else if (v === 'PL') grandPL++;
      else if (v === 'UL') grandUL++;
      else if (v === 'HD') grandHD++;
    });
  });
  h += `<div class="stats">
    <div class="stat green"><div class="val">${grandP}</div><div class="lbl">Total Present Days</div></div>
    <div class="stat"><div class="val">${grandPL}</div><div class="lbl">Planned Leaves</div></div>
    <div class="stat red"><div class="val">${grandUL}</div><div class="lbl">Unplanned Leaves</div></div>
    <div class="stat orange"><div class="val">${grandHD}</div><div class="lbl">Half-days</div></div>
  </div>`;

  return h;
}

function sheetNav(dir) {
  state.sheetMonth += dir;
  if (state.sheetMonth > 11) { state.sheetMonth = 0; state.sheetYear++; }
  if (state.sheetMonth < 0) { state.sheetMonth = 11; state.sheetYear--; }
  render();
}

function updateSheetCell(alias, date, value) {
  const mgr = state.mgr;
  const mk = getMonthKey(state.sheetYear, state.sheetMonth);
  if (!db.monthlySheets[mgr]) db.monthlySheets[mgr] = {};
  if (!db.monthlySheets[mgr][mk]) db.monthlySheets[mgr][mk] = {};
  if (!db.monthlySheets[mgr][mk][alias]) db.monthlySheets[mgr][mk][alias] = {};
  db.monthlySheets[mgr][mk][alias][date] = value;
  save();
  // Also sync to leave records if it's a leave type
  syncSheetToLeaves(alias, date, value);
}

function syncSheetToLeaves(alias, date, value) {
  const mgr = state.mgr;
  if (!db.leaves[mgr]) db.leaves[mgr] = [];
  // Remove any existing single-day leave for this alias on this date
  db.leaves[mgr] = db.leaves[mgr].filter(l => !(l.alias === alias && l.from === date && l.to === date));
  // Add new leave record if applicable
  if (value === 'PL') {
    db.leaves[mgr].push({ id: 'L' + Date.now(), alias, type: 'planned', from: date, to: date, days: 1, status: 'approved', reason: 'From sheet', appliedOn: new Date().toISOString().slice(0, 10) });
  } else if (value === 'UL') {
    db.leaves[mgr].push({ id: 'L' + Date.now(), alias, type: 'unplanned', from: date, to: date, days: 1, status: 'approved', reason: 'From sheet', appliedOn: new Date().toISOString().slice(0, 10) });
  } else if (value === 'HD') {
    db.leaves[mgr].push({ id: 'L' + Date.now(), alias, type: 'halfday', from: date, to: date, days: 0.5, status: 'approved', reason: 'From sheet', appliedOn: new Date().toISOString().slice(0, 10) });
  } else if (value === 'MO') {
    db.leaves[mgr].push({ id: 'L' + Date.now(), alias, type: 'mandatory_off', from: date, to: date, days: 1, status: 'approved', reason: 'Mandatory Off', appliedOn: new Date().toISOString().slice(0, 10) });
  }
  save();
}

function saveSheet() {
  save();
  toast('Sheet saved successfully!');
  render();
}

function exportSheetCSV() {
  const mgr = state.mgr;
  const mk = getMonthKey(state.sheetYear, state.sheetMonth);
  const sheetData = db.monthlySheets[mgr] && db.monthlySheets[mgr][mk];
  if (!sheetData) { toast('No data to export'); return; }
  const ics = getICs(mgr);
  const daysInMonth = new Date(state.sheetYear, state.sheetMonth + 1, 0).getDate();
  let csv = 'Associate';
  for (let d = 1; d <= daysInMonth; d++) csv += ',' + d;
  csv += ',Total P,Total PL,Total UL,Total HD\n';
  ics.forEach(a => {
    csv += a;
    let tP = 0, tPL = 0, tUL = 0, tHD = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${state.sheetYear}-${String(state.sheetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const val = (sheetData[a] && sheetData[a][ds]) || 'P';
      csv += ',' + val;
      if (val === 'P') tP++; else if (val === 'PL') tPL++; else if (val === 'UL') tUL++; else if (val === 'HD') tHD++;
    }
    csv += `,${tP},${tPL},${tUL},${tHD}\n`;
  });
  downloadCSV(csv, `${ORG[mgr].name}_${mk}.csv`);
}

// ========== DAILY TRACKER (All Managers) ==========
function renderDailyTracker() {
  const mgr = state.mgr;
  const ics = getICs(mgr);
  const today = new Date().toISOString().slice(0, 10);

  if (!db.dailyTracker) db.dailyTracker = {};
  if (!db.dailyTracker[mgr]) db.dailyTracker[mgr] = {};

  // Initialize today's data if not exists
  ics.forEach(a => {
    if (!db.dailyTracker[mgr][a]) db.dailyTracker[mgr][a] = {};
    if (!db.dailyTracker[mgr][a][today]) db.dailyTracker[mgr][a][today] = { status: 'present', leaveType: '', notes: '' };
  });

  let h = '<div class="card">';
  h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <h2>&#128197; Daily Attendance Tracker - ${today}</h2>
    <div style="display:flex;gap:8px">
      <input type="date" id="tracker-date" value="${today}" onchange="changeTrackerDate(this.value)" style="padding:5px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px">
      <button class="btn btn-p btn-sm" onclick="saveDailyTracker()">&#128190; Save</button>
      <button class="btn btn-s btn-sm" onclick="exportDailyCSV()">Export</button>
    </div>
  </div>`;

  // Summary
  let present = 0, absent = 0, half = 0, mandateOff = 0;
  ics.forEach(a => {
    const rec = db.dailyTracker[mgr][a] && db.dailyTracker[mgr][a][today];
    if (rec) {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'halfday') half++;
      else if (rec.status === 'mandate_off') mandateOff++;
    }
  });

  const totalWorkforce = ics.length;
  const totalAbsent = absent + half * 0.5 + mandateOff;
  const dailyShrinkage = totalWorkforce > 0 ? ((totalAbsent / totalWorkforce) * 100).toFixed(1) : 0;

  h += `<div class="stats">
    <div class="stat green"><div class="val">${present}</div><div class="lbl">Present</div></div>
    <div class="stat red"><div class="val">${absent}</div><div class="lbl">Absent</div></div>
    <div class="stat orange"><div class="val">${half}</div><div class="lbl">Half-day</div></div>
    <div class="stat"><div class="val">${mandateOff}</div><div class="lbl">Mandate Off</div></div>
    <div class="stat"><div class="val">${totalWorkforce}</div><div class="lbl">Total Team</div></div>
    <div class="stat ${parseFloat(dailyShrinkage) > 20 ? 'red' : 'green'}"><div class="val">${dailyShrinkage}%</div><div class="lbl">Daily Shrinkage</div></div>
  </div>`;

  // Visual cards
  h += '<div class="daily-grid">';
  ics.forEach(a => {
    const info = ORG[a] || { name: a };
    const rec = db.dailyTracker[mgr][a] && db.dailyTracker[mgr][a][today];
    const status = rec ? rec.status : 'present';
    const cls = status === 'present' ? 'present' : status === 'absent' ? 'absent' : 'halfday';
    const badge = status === 'present' ? 'b-green' : status === 'absent' ? 'b-red' : status === 'mandate_off' ? 'b-purple' : 'b-orange';
    const label = status === 'mandate_off' ? 'Mandate Off' : status.charAt(0).toUpperCase() + status.slice(1);
    h += `<div class="daily-card ${cls}">
      <div class="dc-name">${info.name}</div>
      <div style="font-size:11px;color:var(--muted)">${a}</div>
      <div class="dc-status"><span class="badge ${badge}">${label}</span></div>
      ${rec && rec.leaveType ? `<div style="font-size:10px;margin-top:4px;color:var(--muted)">${rec.leaveType}</div>` : ''}
    </div>`;
  });
  h += '</div>';

  // Editable table with leave type selection
  h += '<table><thead><tr><th>Alias</th><th>Name</th><th>Status</th><th>Leave Type</th><th>Notes</th></tr></thead><tbody>';
  ics.forEach(a => {
    const info = ORG[a] || { name: a };
    const rec = db.dailyTracker[mgr][a] && db.dailyTracker[mgr][a][today];
    const status = rec ? rec.status : 'present';
    const leaveType = rec ? (rec.leaveType || '') : '';
    const notes = rec ? (rec.notes || '') : '';
    h += `<tr>
      <td><strong>${a}</strong></td>
      <td>${info.name}</td>
      <td><select onchange="updateDailyStatus('${a}', this.value)">
        <option value="present" ${status === 'present' ? 'selected' : ''}>Present</option>
        <option value="absent" ${status === 'absent' ? 'selected' : ''}>Absent</option>
        <option value="halfday" ${status === 'halfday' ? 'selected' : ''}>Half-day</option>
        <option value="mandate_off" ${status === 'mandate_off' ? 'selected' : ''}>Mandate Off</option>
      </select></td>
      <td><select onchange="updateDailyLeaveType('${a}', this.value)" ${status === 'present' ? 'disabled' : ''}>
        <option value="" ${leaveType === '' ? 'selected' : ''}>--</option>
        <option value="planned" ${leaveType === 'planned' ? 'selected' : ''}>Planned Leave</option>
        <option value="unplanned" ${leaveType === 'unplanned' ? 'selected' : ''}>Unplanned Leave</option>
        <option value="sick" ${leaveType === 'sick' ? 'selected' : ''}>Sick Leave</option>
        <option value="mandate_off" ${leaveType === 'mandate_off' ? 'selected' : ''}>Mandate Off</option>
        <option value="emergency" ${leaveType === 'emergency' ? 'selected' : ''}>Emergency</option>
        <option value="personal" ${leaveType === 'personal' ? 'selected' : ''}>Personal</option>
      </select></td>
      <td><input type="text" value="${notes}" placeholder="Add notes..." style="width:100%;padding:4px;border:1px solid var(--border);border-radius:3px;font-size:12px" onchange="updateDailyNotes('${a}', this.value)"></td>
    </tr>`;
  });
  h += '</tbody></table></div>';

  // Weekly summary
  h += renderWeeklySummary(mgr);

  // Shrinkage trend from daily tracker
  h += renderDailyShrinkageTrend(mgr);

  return h;
}

function updateDailyStatus(alias, status) {
  if (!isAdmin) { alert("View-only mode. Click Admin button to enable editing."); render(); return; }
  const mgr = state.mgr;
  const date = document.getElementById('tracker-date').value;
  if (!db.dailyTracker[mgr]) db.dailyTracker[mgr] = {};
  if (!db.dailyTracker[mgr][alias]) db.dailyTracker[mgr][alias] = {};
  if (!db.dailyTracker[mgr][alias][date]) db.dailyTracker[mgr][alias][date] = { status: 'present', leaveType: '', notes: '' };
  db.dailyTracker[mgr][alias][date].status = status;

  // Auto-sync to leave records and monthly sheet
  syncDailyToAll(mgr, alias, date, status, db.dailyTracker[mgr][alias][date].leaveType);
  save();
  render();
}

function updateDailyLeaveType(alias, leaveType) {
  const mgr = state.mgr;
  const date = document.getElementById('tracker-date').value;
  if (!db.dailyTracker[mgr]) db.dailyTracker[mgr] = {};
  if (!db.dailyTracker[mgr][alias]) db.dailyTracker[mgr][alias] = {};
  if (!db.dailyTracker[mgr][alias][date]) db.dailyTracker[mgr][alias][date] = { status: 'present', leaveType: '', notes: '' };
  db.dailyTracker[mgr][alias][date].leaveType = leaveType;

  // Auto-sync to leave records and monthly sheet
  const status = db.dailyTracker[mgr][alias][date].status;
  syncDailyToAll(mgr, alias, date, status, leaveType);
  save();
  render();
}

function updateDailyNotes(alias, notes) {
  const mgr = state.mgr;
  const date = document.getElementById('tracker-date').value;
  if (!db.dailyTracker[mgr]) db.dailyTracker[mgr] = {};
  if (!db.dailyTracker[mgr][alias]) db.dailyTracker[mgr][alias] = {};
  if (!db.dailyTracker[mgr][alias][date]) db.dailyTracker[mgr][alias][date] = { status: 'present', leaveType: '', notes: '' };
  db.dailyTracker[mgr][alias][date].notes = notes;
  save();
}

// ========== SYNC DAILY TRACKER TO LEAVES + MONTHLY SHEET + REPORTS ==========
function syncDailyToAll(mgr, alias, date, status, leaveType) {
  // 1. Sync to Leave Records
  if (!db.leaves[mgr]) db.leaves[mgr] = [];
  // Remove existing single-day leave for this alias on this date (from daily tracker)
  db.leaves[mgr] = db.leaves[mgr].filter(l => !(l.alias === alias && l.from === date && l.to === date && l.reason && l.reason.includes('Daily Tracker')));

  if (status === 'absent' || status === 'halfday' || status === 'mandate_off') {
    let type = 'unplanned';
    let days = 1;
    let reason = leaveType || status;

    if (leaveType === 'planned') type = 'planned';
    else if (leaveType === 'unplanned' || leaveType === 'sick' || leaveType === 'emergency') type = 'unplanned';
    else if (leaveType === 'mandate_off') type = 'mandatory_off';

    if (status === 'halfday') { type = 'halfday'; days = 0.5; }
    if (status === 'mandate_off') { type = 'mandatory_off'; reason = 'Mandatory Off'; }

    db.leaves[mgr].push({
      id: 'DT' + Date.now() + Math.random().toString(36).slice(2, 6),
      alias, type, from: date, to: date, days, status: 'approved',
      reason: `[Daily Tracker] ${reason}`,
      appliedOn: new Date().toISOString().slice(0, 10)
    });
  }

  // 2. Sync to Monthly Sheet
  const y = parseInt(date.slice(0, 4));
  const m = parseInt(date.slice(5, 7)) - 1;
  const mk = getMonthKey(y, m);
  if (!db.monthlySheets) db.monthlySheets = {};
  if (!db.monthlySheets[mgr]) db.monthlySheets[mgr] = {};
  if (!db.monthlySheets[mgr][mk]) db.monthlySheets[mgr][mk] = {};
  if (!db.monthlySheets[mgr][mk][alias]) db.monthlySheets[mgr][mk][alias] = {};

  if (status === 'present') db.monthlySheets[mgr][mk][alias][date] = 'P';
  else if (status === 'absent') {
    if (leaveType === 'planned') db.monthlySheets[mgr][mk][alias][date] = 'PL';
    else db.monthlySheets[mgr][mk][alias][date] = 'UL';
  }
  else if (status === 'halfday') db.monthlySheets[mgr][mk][alias][date] = 'HD';
  else if (status === 'mandate_off') db.monthlySheets[mgr][mk][alias][date] = 'MO';
}

// ========== DAILY SHRINKAGE TREND ==========
function renderDailyShrinkageTrend(mgr) {
  const ics = getICs(mgr);
  const tracker = db.dailyTracker[mgr] || {};
  const today = new Date();

  // Last 7 working days
  let h = '<div class="card"><h2>&#128200; Shrinkage Trend (Last 7 Days)</h2>';
  h += '<table><thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Half-day</th><th>Mandate Off</th><th>Shrinkage %</th></tr></thead><tbody>';

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    let pres = 0, abs = 0, hd = 0, mo = 0;
    ics.forEach(a => {
      const rec = tracker[a] && tracker[a][ds];
      if (rec) {
        if (rec.status === 'present') pres++;
        else if (rec.status === 'absent') abs++;
        else if (rec.status === 'halfday') hd++;
        else if (rec.status === 'mandate_off') mo++;
      } else { pres++; }
    });
    const totalAbsent = abs + hd * 0.5 + mo;
    const shrinkage = ics.length > 0 ? ((totalAbsent / ics.length) * 100).toFixed(1) : 0;
    const shrinkClass = parseFloat(shrinkage) > 20 ? 'color:var(--danger);font-weight:700' : 'color:var(--success)';

    h += `<tr><td><strong>${ds}</strong></td><td class="num">${pres}</td><td class="num" style="${abs > 0 ? 'color:var(--danger)' : ''}">${abs}</td><td class="num">${hd}</td><td class="num">${mo}</td><td class="num" style="${shrinkClass}">${shrinkage}%</td></tr>`;
  }
  h += '</tbody></table></div>';
  return h;
}

function changeTrackerDate(date) {
  const mgr = state.mgr;
  const ics = getICs(mgr);
  if (!db.dailyTracker[mgr]) db.dailyTracker[mgr] = {};
  ics.forEach(a => {
    if (!db.dailyTracker[mgr][a]) db.dailyTracker[mgr][a] = {};
    if (!db.dailyTracker[mgr][a][date]) db.dailyTracker[mgr][a][date] = { status: 'present', leaveType: '', notes: '' };
  });
  save();
  render();
}

function saveDailyTracker() {
  save();
  toast('Daily tracker saved! Leave records & reports updated.');
  render();
}

function renderWeeklySummary(mgr) {
  const ics = getICs(mgr);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  let h = '<div class="card"><h2>This Week\'s Summary</h2>';
  h += '<table><thead><tr><th>Associate</th><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody>';
  ics.forEach(a => {
    h += `<tr><td><strong>${a}</strong></td>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const rec = db.dailyTracker[mgr] && db.dailyTracker[mgr][a] && db.dailyTracker[mgr][a][ds];
      const status = rec ? rec.status : '-';
      let badge = 'b-gray';
      let label = '-';
      if (status === 'present') { badge = 'b-green'; label = 'P'; }
      else if (status === 'absent') { badge = 'b-red'; label = 'A'; }
      else if (status === 'halfday') { badge = 'b-orange'; label = 'HD'; }
      else if (status === 'mandate_off') { badge = 'b-purple'; label = 'MO'; }
      h += `<td style="text-align:center"><span class="badge ${badge}">${label}</span></td>`;
    }
    h += '</tr>';
  });
  h += '</tbody></table></div>';
  return h;
}

function exportDailyCSV() {
  const mgr = state.mgr;
  const date = document.getElementById('tracker-date') ? document.getElementById('tracker-date').value : new Date().toISOString().slice(0, 10);
  const ics = getICs(mgr);
  let csv = 'Alias,Name,Status,Leave Type,Notes\n';
  ics.forEach(a => {
    const info = ORG[a] || { name: a };
    const rec = db.dailyTracker[mgr] && db.dailyTracker[mgr][a] && db.dailyTracker[mgr][a][date];
    csv += `${a},${info.name},${rec ? rec.status : 'present'},${rec ? (rec.leaveType || '') : ''},"${rec ? (rec.notes || '') : ''}"\n`;
  });
  downloadCSV(csv, `${ORG[mgr].name}_Daily_${date}.csv`);
}

// ========== APPLY LEAVE ==========
function renderApplyLeave() {
  const ics = getICs(state.mgr);
  let h = '<div class="card"><h2>&#10133; Apply Leave</h2>';
  h += '<div class="fg"><label>Associate</label><select id="al-alias">';
  ics.forEach(a => { h += `<option value="${a}">${a} - ${ORG[a] ? ORG[a].name : a}</option>`; });
  h += '</select></div>';
  h += '<div class="fg"><label>Leave Type</label><select id="al-type">';
  LEAVE_TYPES.forEach(t => { h += `<option value="${t.id}">${t.name}</option>`; });
  h += '</select></div>';
  h += '<div class="fr"><div class="fg"><label>From Date</label><input type="date" id="al-from"></div><div class="fg"><label>To Date</label><input type="date" id="al-to"></div><div class="fg"><label>Days</label><input type="number" id="al-days" step="0.5" min="0.5" value="1"></div></div>';
  h += '<div class="fg"><label>Reason</label><textarea id="al-reason" rows="2" placeholder="Reason for leave..."></textarea></div>';
  h += '<div style="display:flex;gap:8px"><button class="btn btn-p" onclick="submitLeave(\'approved\')">Submit as Approved</button><button class="btn btn-s" onclick="submitLeave(\'pending\')">Submit as Pending</button></div>';
  h += '</div>';
  return h;
}

function submitLeave(status) {
  if (!isAdmin) { alert("View-only mode. Click Admin button to enable editing."); return; }
  const alias = document.getElementById('al-alias').value;
  const type = document.getElementById('al-type').value;
  const from = document.getElementById('al-from').value;
  const to = document.getElementById('al-to').value;
  const days = parseFloat(document.getElementById('al-days').value);
  const reason = document.getElementById('al-reason').value;
  if (!alias || !from || !to || !days) { alert('Please fill all required fields.'); return; }
  if (!db.leaves[state.mgr]) db.leaves[state.mgr] = [];
  db.leaves[state.mgr].push({ id: 'L' + Date.now(), alias, type, from, to, days, status, reason, appliedOn: new Date().toISOString().slice(0, 10) });
  save(); render(); toast('Leave applied successfully!');
}

// ========== TEAM VIEW ==========
function renderTeam() {
  const ics = getICs(state.mgr);
  const leaves = getLeaves(state.mgr);
  let h = '<div class="card"><h2>&#128101; Team Members</h2>';
  h += '<table><thead><tr><th>Alias</th><th>Name</th><th>Title</th><th>Level</th><th>Planned</th><th>Unplanned</th><th>Half-days</th><th>Total</th></tr></thead><tbody>';
  ics.forEach(a => {
    const info = ORG[a] || { name: a, title: '-', level: '-' };
    let pl = 0, ul = 0, hd = 0;
    leaves.filter(l => l.alias === a).forEach(l => {
      if (l.type === 'planned') pl += l.days;
      else if (l.type === 'unplanned') ul += l.days;
      else if (l.type === 'halfday') hd += l.days;
    });
    h += `<tr><td><strong>${a}</strong></td><td>${info.name}</td><td>${info.title}</td><td><span class="badge b-purple">L${info.level}</span></td>
      <td class="num">${pl}</td><td class="num" style="${ul > 3 ? 'color:var(--danger);font-weight:700' : ''}">${ul}</td><td class="num">${hd}</td><td class="num">${pl + ul + hd}</td></tr>`;
  });
  h += '</tbody></table></div>';
  return h;
}

// ========== REPORTS ==========
function getWeekNumber(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d - start + ((start.getDay() + 6) % 7) * 86400000) / 86400000;
  return Math.ceil((diff + 1) / 7);
}

function renderReports() {
  const ics = getICs(state.mgr);
  const leaves = getLeaves(state.mgr);
  const mgr = state.mgr;

  // Download button
  let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<h2 style="margin:0">&#128200; Reports & Shrinkage Analysis</h2>';
  h += '<div style="display:flex;gap:8px"><button class="btn btn-p" onclick="downloadMonthlyReport()">&#128229; Download Report</button><button class="btn btn-s" onclick="exportCSV()">Export CSV</button></div>';
  h += '</div>';

  // Monthly breakdown with week numbers
  const monthlyData = {};
  const weeklyData = {};
  leaves.forEach(l => {
    const mk = l.from.slice(0, 7);
    if (!monthlyData[mk]) monthlyData[mk] = { planned: 0, unplanned: 0, halfday: 0, mandateOff: 0 };
    if (l.type === 'planned') monthlyData[mk].planned += l.days;
    else if (l.type === 'unplanned') monthlyData[mk].unplanned += l.days;
    else if (l.type === 'halfday') monthlyData[mk].halfday += l.days;
    else if (l.type === 'mandatory_off') monthlyData[mk].mandateOff += l.days;
    // Weekly
    const wk = 'W' + getWeekNumber(l.from);
    if (!weeklyData[wk]) weeklyData[wk] = { planned: 0, unplanned: 0, halfday: 0, mandateOff: 0 };
    if (l.type === 'planned') weeklyData[wk].planned += l.days;
    else if (l.type === 'unplanned') weeklyData[wk].unplanned += l.days;
    else if (l.type === 'halfday') weeklyData[wk].halfday += l.days;
    else if (l.type === 'mandatory_off') weeklyData[wk].mandateOff += l.days;
  });

  // SHRINKAGE BAR CHART (visual)
  const sortedMonths = Object.keys(monthlyData).sort();
  const monthNames = {'-01':'Jan','-02':'Feb','-03':'Mar','-04':'Apr','-05':'May','-06':'Jun','-07':'Jul','-08':'Aug','-09':'Sep','-10':'Oct','-11':'Nov','-12':'Dec'};
  h += '<div class="card"><h2>&#128202; Monthly Shrinkage Chart</h2>';
  h += '<div style="display:flex;align-items:flex-end;gap:8px;height:200px;padding:20px 0;border-bottom:2px solid var(--border)">';
  const maxShrinkage = Math.max(...sortedMonths.map(mk => {
    const d = monthlyData[mk]; const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    return (total / (ics.length * 22)) * 100;
  }), 20);
  sortedMonths.forEach(mk => {
    const d = monthlyData[mk];
    const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    const shrinkage = ics.length > 0 ? ((total / (ics.length * 22)) * 100).toFixed(1) : 0;
    const barHeight = (parseFloat(shrinkage) / maxShrinkage) * 160;
    const color = parseFloat(shrinkage) > 20 ? 'var(--danger)' : parseFloat(shrinkage) > 15 ? 'var(--warn)' : 'var(--success)';
    const label = monthNames[mk.slice(4)] || mk.slice(5);
    h += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">`;
    h += `<span style="font-size:11px;font-weight:700;color:${color}">${shrinkage}%</span>`;
    h += `<div style="width:100%;max-width:50px;height:${barHeight}px;background:${color};border-radius:4px 4px 0 0;min-height:4px"></div>`;
    h += `<span style="font-size:10px;color:var(--muted)">${label}</span>`;
    h += `</div>`;
  });
  h += '</div>';
  h += '<div style="display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:11px">';
  h += '<span style="color:var(--success)">&#9632; &lt;15% Good</span>';
  h += '<span style="color:var(--warn)">&#9632; 15-20% Warning</span>';
  h += '<span style="color:var(--danger)">&#9632; &gt;20% Critical</span>';
  h += '</div></div>';

  // LEAVE TYPE BREAKDOWN CHART
  h += '<div class="card"><h2>&#128203; Leave Type Distribution by Month</h2>';
  h += '<div style="overflow-x:auto"><div style="display:flex;align-items:flex-end;gap:12px;height:180px;padding:20px 0;min-width:' + (sortedMonths.length * 80) + 'px">';
  const maxTotal = Math.max(...sortedMonths.map(mk => { const d = monthlyData[mk]; return d.planned + d.unplanned + d.halfday + d.mandateOff; }), 1);
  sortedMonths.forEach(mk => {
    const d = monthlyData[mk];
    const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    const label = monthNames[mk.slice(4)] || mk.slice(5);
    const scale = 140 / maxTotal;
    h += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:60px">`;
    h += `<span style="font-size:10px;font-weight:600">${total}</span>`;
    h += `<div style="width:40px;display:flex;flex-direction:column-reverse;border-radius:3px;overflow:hidden">`;
    if (d.planned) h += `<div style="height:${d.planned*scale}px;background:#0073bb" title="Planned: ${d.planned}"></div>`;
    if (d.unplanned) h += `<div style="height:${d.unplanned*scale}px;background:#d13212" title="Unplanned: ${d.unplanned}"></div>`;
    if (d.halfday) h += `<div style="height:${d.halfday*scale}px;background:#ff9900" title="Half-day: ${d.halfday}"></div>`;
    if (d.mandateOff) h += `<div style="height:${d.mandateOff*scale}px;background:#6b21a8" title="Mandate Off: ${d.mandateOff}"></div>`;
    h += `</div><span style="font-size:10px;color:var(--muted)">${label}</span></div>`;
  });
  h += '</div></div>';
  h += '<div class="legend"><div class="legend-i"><div class="legend-d" style="background:#0073bb"></div>Planned</div><div class="legend-i"><div class="legend-d" style="background:#d13212"></div>Unplanned</div><div class="legend-i"><div class="legend-d" style="background:#ff9900"></div>Half-day</div><div class="legend-i"><div class="legend-d" style="background:#6b21a8"></div>Mandate Off</div></div>';
  h += '</div>';

  // Monthly table with week numbers
  h += '<div class="card"><h2>Monthly Breakdown (with Week Numbers)</h2>';
  h += '<table><thead><tr><th>Month</th><th>Weeks</th><th>Planned</th><th>Unplanned</th><th>Half-day</th><th>Mandate Off</th><th>Total</th><th>Work Days</th><th>Shrinkage %</th></tr></thead><tbody>';
  sortedMonths.forEach(mk => {
    const d = monthlyData[mk];
    const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    const workDays = ics.length * 22;
    const shrinkage = workDays > 0 ? ((total / workDays) * 100).toFixed(1) : 0;
    const y = parseInt(mk.slice(0,4)); const m = parseInt(mk.slice(5,7));
    const firstWeek = getWeekNumber(mk + '-01');
    const lastDay = new Date(y, m, 0).getDate();
    const lastWeek = getWeekNumber(mk + '-' + lastDay);
    h += `<tr><td><strong>${mk}</strong></td><td>W${firstWeek}-W${lastWeek}</td><td class="num">${d.planned}</td><td class="num" style="${d.unplanned > 5 ? 'color:var(--danger)' : ''}">${d.unplanned}</td><td class="num">${d.halfday}</td><td class="num">${d.mandateOff}</td><td class="num">${total}</td><td class="num">${workDays}</td><td class="num" style="${parseFloat(shrinkage) > 15 ? 'color:var(--danger);font-weight:700' : 'color:var(--success)'}">${shrinkage}%</td></tr>`;
  });
  h += '</tbody></table></div>';

  // Weekly breakdown
  h += '<div class="card"><h2>Weekly Breakdown</h2>';
  h += '<table><thead><tr><th>Week</th><th>Planned</th><th>Unplanned</th><th>Half-day</th><th>Mandate Off</th><th>Total</th></tr></thead><tbody>';
  Object.keys(weeklyData).sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).forEach(wk => {
    const d = weeklyData[wk];
    const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    h += `<tr><td><strong>${wk}</strong></td><td class="num">${d.planned}</td><td class="num">${d.unplanned}</td><td class="num">${d.halfday}</td><td class="num">${d.mandateOff}</td><td class="num">${total}</td></tr>`;
  });
  h += '</tbody></table></div>';

  // Overall Shrinkage stats
  const totalLeaves = leaves.reduce((s, l) => s + l.days, 0);
  const totalWorkDays = ics.length * 22;
  const overallShrinkage = totalWorkDays > 0 ? ((totalLeaves / totalWorkDays) * 100).toFixed(1) : 0;
  const tracker = db.dailyTracker[mgr] || {};
  let trackedDays = 0, trackedAbsent = 0;
  ics.forEach(a => { if (tracker[a]) { Object.values(tracker[a]).forEach(rec => { trackedDays++; if (rec.status === 'absent') trackedAbsent++; else if (rec.status === 'halfday') trackedAbsent += 0.5; else if (rec.status === 'mandate_off') trackedAbsent++; }); } });
  const trackerShrinkage = trackedDays > 0 ? ((trackedAbsent / trackedDays) * 100).toFixed(1) : 0;

  h += `<div class="card"><h2>Overall Shrinkage Summary</h2>
    <div class="stats">
      <div class="stat"><div class="val">${ics.length}</div><div class="lbl">Team Size</div></div>
      <div class="stat"><div class="val">${totalLeaves}</div><div class="lbl">Total Leave Days</div></div>
      <div class="stat ${parseFloat(overallShrinkage) > 15 ? 'red' : 'green'}"><div class="val">${overallShrinkage}%</div><div class="lbl">Shrinkage (Monthly)</div></div>
      <div class="stat ${parseFloat(trackerShrinkage) > 15 ? 'red' : 'green'}"><div class="val">${trackerShrinkage}%</div><div class="lbl">Shrinkage (Daily)</div></div>
    </div>
  </div>`;

  // Individual shrinkage
  h += '<div class="card"><h2>Individual Shrinkage</h2>';
  h += '<table><thead><tr><th>Associate</th><th>Name</th><th>Planned</th><th>Unplanned</th><th>Half-day</th><th>Mandate Off</th><th>Total</th><th>Shrinkage %</th></tr></thead><tbody>';
  ics.forEach(a => {
    const info = ORG[a] || { name: a };
    let pl = 0, ul = 0, hd = 0, mo = 0;
    leaves.filter(l => l.alias === a).forEach(l => {
      if (l.type === 'planned') pl += l.days;
      else if (l.type === 'unplanned') ul += l.days;
      else if (l.type === 'halfday') hd += l.days;
      else if (l.type === 'mandatory_off') mo += l.days;
    });
    const total = pl + ul + hd + mo;
    const indShrinkage = (total / 22 * 100).toFixed(1);
    h += `<tr><td><strong>${a}</strong></td><td>${info.name}</td><td class="num">${pl}</td><td class="num" style="${ul > 3 ? 'color:var(--danger);font-weight:700' : ''}">${ul}</td><td class="num">${hd}</td><td class="num">${mo}</td><td class="num">${total}</td><td class="num" style="${parseFloat(indShrinkage) > 15 ? 'color:var(--danger);font-weight:700' : 'color:var(--success)'}">${indShrinkage}%</td></tr>`;
  });
  h += '</tbody></table></div>';

  // Top absentees
  const perPerson = {};
  ics.forEach(a => { perPerson[a] = 0; });
  leaves.forEach(l => { if (perPerson[l.alias] !== undefined) perPerson[l.alias] += l.days; });
  const topAbsentees = Object.entries(perPerson).sort((a, b) => b[1] - a[1]).slice(0, 5);
  h += '<div class="card"><h2>Top Absentees</h2><table><thead><tr><th>Associate</th><th>Name</th><th>Total Days</th></tr></thead><tbody>';
  topAbsentees.forEach(([a, days]) => {
    h += `<tr><td><strong>${a}</strong></td><td>${ORG[a] ? ORG[a].name : a}</td><td class="num" style="${days > 5 ? 'color:var(--danger)' : ''}">${days}</td></tr>`;
  });
  h += '</tbody></table></div>';
  return h;
}

// Download monthly report
function downloadMonthlyReport() {
  const ics = getICs(state.mgr);
  const leaves = getLeaves(state.mgr);
  const mgrName = ORG[state.mgr] ? ORG[state.mgr].name : state.mgr;
  const monthlyData = {};
  leaves.forEach(l => {
    const mk = l.from.slice(0, 7);
    if (!monthlyData[mk]) monthlyData[mk] = { planned: 0, unplanned: 0, halfday: 0, mandateOff: 0 };
    if (l.type === 'planned') monthlyData[mk].planned += l.days;
    else if (l.type === 'unplanned') monthlyData[mk].unplanned += l.days;
    else if (l.type === 'halfday') monthlyData[mk].halfday += l.days;
    else if (l.type === 'mandatory_off') monthlyData[mk].mandateOff += l.days;
  });
  let csv = 'SHRINKAGE REPORT - ' + mgrName + '\nGenerated: ' + new Date().toISOString().slice(0,10) + '\n\n';
  csv += 'MONTHLY SUMMARY\nMonth,Week Range,Planned,Unplanned,Half-day,Mandate Off,Total,Work Days,Shrinkage %\n';
  Object.keys(monthlyData).sort().forEach(mk => {
    const d = monthlyData[mk]; const total = d.planned + d.unplanned + d.halfday + d.mandateOff;
    const workDays = ics.length * 22; const shrinkage = workDays > 0 ? ((total / workDays) * 100).toFixed(1) : 0;
    const firstWeek = getWeekNumber(mk + '-01');
    csv += `${mk},W${firstWeek},${d.planned},${d.unplanned},${d.halfday},${d.mandateOff},${total},${workDays},${shrinkage}%\n`;
  });
  csv += '\nINDIVIDUAL BREAKDOWN\nAlias,Name,Planned,Unplanned,Half-day,Mandate Off,Total,Shrinkage %\n';
  ics.forEach(a => {
    const info = ORG[a] || { name: a }; let pl=0,ul=0,hd=0,mo=0;
    leaves.filter(l => l.alias === a).forEach(l => { if(l.type==='planned')pl+=l.days;else if(l.type==='unplanned')ul+=l.days;else if(l.type==='halfday')hd+=l.days;else if(l.type==='mandatory_off')mo+=l.days; });
    const total = pl+ul+hd+mo; const s = (total/22*100).toFixed(1);
    csv += `${a},${info.name},${pl},${ul},${hd},${mo},${total},${s}%\n`;
  });
  downloadCSV(csv, `Shrinkage_Report_${mgrName}_${new Date().toISOString().slice(0,10)}.csv`);
  toast('Report downloaded!');
}

// ========== EXPORT ==========
function exportCSV() {
  if (!state.mgr) {
    toast('Select a manager first');
    return;
  }
  const leaves = getLeaves(state.mgr);
  let csv = 'ID,Alias,Name,Type,From,To,Days,Status,Reason,Applied On\n';
  leaves.forEach(l => {
    const name = ORG[l.alias] ? ORG[l.alias].name : l.alias;
    csv += `${l.id},${l.alias},"${name}",${l.type},${l.from},${l.to},${l.days},${l.status},"${l.reason || ''}",${l.appliedOn || ''}\n`;
  });
  downloadCSV(csv, `${ORG[state.mgr].name}_leaves.csv`);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('CSV exported: ' + filename);
}

// ========== ADMIN ACCESS CONTROL ==========
var ADMIN_PASSWORD = "spex2026";  // Change this to your password
var isAdmin = false;

function toggleAdmin() {
  if (isAdmin) {
    isAdmin = false;
    toast("Admin mode OFF. View-only mode.");
    render();
    return;
  }
  var pwd = prompt("Enter admin password to enable edit mode:");
  if (pwd === ADMIN_PASSWORD) {
    isAdmin = true;
    toast("Admin mode ON. You can now edit and save.");
    render();
  } else if (pwd !== null) {
    alert("Wrong password. Contact sharkoth for access.");
  }
}

function adminSave() {
  if (!isAdmin) {
    alert("You need Admin access to save changes.\nClick the Admin button and enter the password.");
    return;
  }
  saveSharedData();
}

// Override functions to check admin
var _origSubmitLeave = typeof submitLeave !== 'undefined' ? submitLeave : null;
var _origSaveNewLeave = typeof saveNewLeave !== 'undefined' ? saveNewLeave : null;

function checkAdmin() {
  if (!isAdmin) {
    alert("View-only mode. Click Admin button to enable editing.");
    return false;
  }
  return true;
}

// ========== CHARTS ON DASHBOARD ==========
function renderCharts() {
  var ics = getICs(state.mgr);
  var leaves = getLeaves(state.mgr);
  if (leaves.length === 0) return '';

  // Monthly shrinkage data
  var monthlyData = {};
  leaves.forEach(function(l) {
    var mk = l.from.slice(0, 7);
    if (!monthlyData[mk]) monthlyData[mk] = { total: 0 };
    monthlyData[mk].total += l.days;
  });

  var sortedMonths = Object.keys(monthlyData).sort();
  var monthNames = {'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};

  // Shrinkage trend chart
  var h = '<div class="card"><h2>&#128200; Monthly Shrinkage Trend</h2>';
  var maxS = Math.max.apply(null, sortedMonths.map(function(mk) { return (monthlyData[mk].total / (ics.length * 22)) * 100; }));
  maxS = Math.max(maxS, 25);
  h += '<div style="display:flex;align-items:flex-end;gap:6px;height:160px;padding:10px 0;border-bottom:2px solid var(--border)">';
  sortedMonths.forEach(function(mk) {
    var total = monthlyData[mk].total;
    var shrinkage = ics.length > 0 ? ((total / (ics.length * 22)) * 100).toFixed(1) : 0;
    var barH = (parseFloat(shrinkage) / maxS) * 130;
    var color = parseFloat(shrinkage) > 20 ? '#d13212' : parseFloat(shrinkage) > 15 ? '#ff9900' : '#1d8102';
    var label = monthNames[mk.slice(5)] || mk;
    h += '<div style="flex:1;text-align:center"><span style="font-size:10px;font-weight:700;color:' + color + '">' + shrinkage + '%</span>';
    h += '<div style="height:' + barH + 'px;background:' + color + ';border-radius:4px 4px 0 0;margin:4px auto;width:70%"></div>';
    h += '<span style="font-size:10px;color:var(--muted)">' + label + '</span></div>';
  });
  h += '</div>';
  h += '<div style="margin-top:8px;font-size:10px;text-align:center;color:var(--muted)">Target: &lt;15% | ';
  h += '<span style="color:#1d8102">&#9632; Good(&lt;15%)</span> ';
  h += '<span style="color:#ff9900">&#9632; Warning(15-20%)</span> ';
  h += '<span style="color:#d13212">&#9632; Critical(&gt;20%)</span></div>';
  h += '</div>';

  // Leave type pie chart (CSS-based)
  var totalP = 0, totalU = 0, totalH = 0, totalM = 0;
  leaves.forEach(function(l) {
    if (l.type === 'planned') totalP += l.days;
    else if (l.type === 'unplanned') totalU += l.days;
    else if (l.type === 'halfday') totalH += l.days;
    else if (l.type === 'mandatory_off') totalM += l.days;
  });
  var grandTotal = totalP + totalU + totalH + totalM;
  if (grandTotal > 0) {
    var pP = ((totalP / grandTotal) * 100).toFixed(0);
    var pU = ((totalU / grandTotal) * 100).toFixed(0);
    var pH = ((totalH / grandTotal) * 100).toFixed(0);
    var pM = ((totalM / grandTotal) * 100).toFixed(0);
    var deg1 = (totalP / grandTotal) * 360;
    var deg2 = deg1 + (totalU / grandTotal) * 360;
    var deg3 = deg2 + (totalH / grandTotal) * 360;

    h += '<div class="card"><h2>&#128200; Leave Type Distribution</h2>';
    h += '<div style="display:flex;align-items:center;gap:30px;flex-wrap:wrap">';
    h += '<div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(#0073bb 0deg ' + deg1 + 'deg, #d13212 ' + deg1 + 'deg ' + deg2 + 'deg, #ff9900 ' + deg2 + 'deg ' + deg3 + 'deg, #6b21a8 ' + deg3 + 'deg 360deg)"></div>';
    h += '<div style="font-size:13px;line-height:2">';
    h += '<div><span style="display:inline-block;width:12px;height:12px;background:#0073bb;border-radius:2px;margin-right:6px"></span>Planned: ' + totalP + ' days (' + pP + '%)</div>';
    h += '<div><span style="display:inline-block;width:12px;height:12px;background:#d13212;border-radius:2px;margin-right:6px"></span>Unplanned: ' + totalU + ' days (' + pU + '%)</div>';
    h += '<div><span style="display:inline-block;width:12px;height:12px;background:#ff9900;border-radius:2px;margin-right:6px"></span>Half-day: ' + totalH + ' days (' + pH + '%)</div>';
    h += '<div><span style="display:inline-block;width:12px;height:12px;background:#6b21a8;border-radius:2px;margin-right:6px"></span>Mandate Off: ' + totalM + ' days (' + pM + '%)</div>';
    h += '</div></div></div>';
  }

  return h;
}

// ========== INIT ==========
render();
