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
  'agasarad': { name: 'Sarad Agarwal', title: 'Manager, TPM', level: 6, isMgr: true, mgr: 'jaysell', directs: ['shoyaba', 'jorrigal', 'sidhanp', 'duraiv', 'kumarshu', 'girisada', 'sylimm', 'nidhivya', 'bhrgar', 'prtbht', 'venkaani'] },

  // ---- Sarad's direct managers ----
  'shoyaba': { name: 'Shoyab Ahamed', title: 'Support Engineering Manager', level: 5, isMgr: true, mgr: 'agasarad', directs: ['hmmuttum', 'musavaru', 'bhayush', 'ngowthh', 'snaidus', 'nsskv', 'jyothigr', 'ruthrag'] },
  'jorrigal': { name: 'Karthik Jorrigal', title: 'Manager II, Program Mgmt, MCE', level: 5, isMgr: true, mgr: 'agasarad', directs: ['meghamav', 'kprasanj', 'yohannjo', 'vjchilla', 'abhanwad', 'chikbal', 'musaddm', 'thotteja', 'valavoju'] },
  'kumarshu': { name: 'Shubham Kumar', title: 'Manager II, Prgm Mgmt', level: 5, isMgr: true, mgr: 'agasarad', directs: ['mssowmya', 'kgorapal', 'aggannam', 'jonnac', 'ypreksha', 'noosuraj', 'mheshpm', 'shreevi', 'gosang', 'cheedel', 'rsameerk', 'rmvineet'] },
  'bhrgar': { name: 'Bhargavi Raghavendran', title: 'Quality Assurance Manager', level: 6, isMgr: true, mgr: 'agasarad', directs: ['prathysr', 'muthindh', 'dvadakat', 'ketiredd', 'vaischa', 'shreejsj', 'urvenkat', 'ramsais', 'megsb', 'hadhug'] },

  // ---- Sarad's direct ICs ----
  'sidhanp': { name: 'Priyanka Sidhani', title: 'Program Manager II, SALSA', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'duraiv': { name: 'Venkatesh Durai', title: 'Sr. Program Manager', level: 6, isMgr: false, mgr: 'agasarad', directs: [] },
  'girisada': { name: 'Giridhar Saday', title: 'System Development Engineer', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'sylimm': { name: 'Syed Rashid Ali', title: 'Program Manager, Listings', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'nidhivya': { name: 'Nidhi Vyas', title: 'Program Manager II', level: 5, isMgr: false, mgr: 'agasarad', directs: [] },
  'prtbht': { name: 'Pratham Bhat', title: 'Manager, Program Management', level: 6, isMgr: false, mgr: 'agasarad', directs: [] },

  // ---- Shoyab Ahamed's team ----
  'hmmuttum': { name: 'Harsha Vardhan Reddy Muttumula', title: 'Support Engineer II', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'musavaru': { name: 'Varun Musale', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'bhayush': { name: 'Ayush Bharadwaj', title: 'System Development Engineer II', level: 5, isMgr: false, mgr: 'shoyaba', directs: [] },
  'ngowthh': { name: 'Gowthami N', title: 'Support Engineer II', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'snaidus': { name: 'Swamy Naidu Sukkireddy', title: 'Support Engineer II', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'nsskv': { name: 'Surya Sai Krishna Vamsi Nalamati', title: 'Support Engineer II', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'jyothigr': { name: 'Jyothi Gorle', title: 'SE II, Selling Partner Exp', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },
  'ruthrag': { name: 'Ruthra Gnanasambantham', title: 'SE II', level: 4, isMgr: false, mgr: 'shoyaba', directs: [] },

  // ---- Karthik Jorrigal's ICs ----
  'abhanwad': { name: 'Alisha Bhanwadiya', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'jorrigal', directs: [] },
  'chikbal': { name: 'Krishna Chaitanya Chikballa', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'jorrigal', directs: [] },
  'musaddm': { name: 'Musaddiq Ahmed Muneeb', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'jorrigal', directs: [] },
  'thotteja': { name: 'Sai Teja T', title: 'Prod Compliance Specialist, MCE', level: 4, isMgr: false, mgr: 'jorrigal', directs: [] },
  'valavoju': { name: 'Abhishek Valavoju', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'jorrigal', directs: [] },

  // ---- Megha Bhusani (Risk) - sub-teams not modeled in this dashboard ----
  'meghamav': { name: 'Megha Bhusani', title: 'Manager II, Risk', level: 5, isMgr: true, mgr: 'jorrigal', directs: ['sjjamwal', 'jhprakas', 'apakalap', 'ishratbq', 'prabhanu'] },
  'sjjamwal': { name: 'Sonal Jamwal', title: 'Manager, Risk', level: 4, isMgr: true, mgr: 'meghamav', directs: ['bhatarch', 'mshifali', 'tamardma', 'rvinsach', 'mkjasir', 'hajtasn', 'tripatht', 'mehenoor', 'joekenny', 'madulika', 'vaishmk', 'kimuduch', 'srakshu', 'ckyatham', 'saayisha'] },
  'jhprakas': { name: 'Prakash Jha', title: 'Manager I, Risk', level: 4, isMgr: true, mgr: 'meghamav', directs: ['piyamiya', 'shrtewar', 'lakshmvm', 'akshida', 'snehajan', 'rdshetty', 'vivsonar', 'yaminmd', 'chatulok', 'shalzz', 'ikpk', 'kdande', 'prgarika'] },
  'apakalap': { name: 'Pakalapati Anjana', title: 'Catalog Spc Quality Auditor', level: 3, isMgr: false, mgr: 'meghamav', directs: [] },
  'ishratbq': { name: 'Ishrat Bano', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'meghamav', directs: [] },
  'prabhanu': { name: 'Bhanu Prakash', title: 'Manager, Risk', level: 4, isMgr: true, mgr: 'meghamav', directs: ['sggadhaw', 'bbbandan', 'calsyeda', 'kpbandar', 'vkraghul', 'zsarukmi', 'sukumjon', 'bhaspath', 'hmohamib', 'meghachh', 'gvsgiris', 'shravnk', 'mirsyeda'] },

  // ---- Prasanjeet Kar (Risk) - sub-teams not modeled in this dashboard ----
  'kprasanj': { name: 'Prasanjeet Kar', title: 'Manager II, Risk Mngmt', level: 5, isMgr: true, mgr: 'jorrigal', directs: ['afnas', 'rishap', 'anjanvya', 'abhindas', 'shreeru', 'rosunews', 'dutshirs'] },
  'afnas': { name: 'Afnan Safdar', title: 'Manager I, Risk', level: 4, isMgr: true, mgr: 'kprasanj', directs: ['glarik', 'uddarajs', 'mouadhik', 'trsubham', 'afvjabee', 'pajyotip', 'kaushidq', 'ukanish', 'kadamvar', 'gksunith', 'danyaar', 'srihrami', 'pumpkinn'] },
  'rishap': { name: 'Rishabh Pandey', title: 'Manager I, Risk Management', level: 4, isMgr: true, mgr: 'kprasanj', directs: ['shaikhdn', 'madisetj', 'ashmitv', 'bansafia', 'nidpatre', 'kotvvina', 'sitriloc', 'chitralv', 'chedipaa', 'azanyajo', 'saiksri'] },
  'anjanvya': { name: 'Anjani V', title: 'Manager, Risk', level: 4, isMgr: true, mgr: 'kprasanj', directs: ['geeredd', 'curichie', 'visakumk', 'fbasinhk', 'harshijz', 'githa', 'kalimura', 'podijaga', 'aihtesha', 'rubyshah', 'veerdon', 'afrzmoha'] },
  'abhindas': { name: 'Abhinav Dass', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kprasanj', directs: [] },
  'shreeru': { name: 'Shree Banerjee', title: 'Manager I, Risk', level: 4, isMgr: true, mgr: 'kprasanj', directs: ['annappav', 'aashutr', 'akssahal', 'janbafar', 'enazmoha', 'anumuddh', 'machasow', 'syyomer', 'dimounik', 'faraime', 'feerahs', 'mfaraaz', 'humabhat', 'nowshenz', 'shandole', 'mohwwahi', 'vinohp', 'puneetog'] },
  'rosunews': { name: 'Roshan Newar', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kprasanj', directs: [] },
  'dutshirs': { name: 'Shirsendu Dutta', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'kprasanj', directs: [] },

  // ---- Yohann Joseph's team ----
  'yohannjo': { name: 'Yohann Joseph', title: 'Team Lead, SxVx - SQ', level: 4, isMgr: true, mgr: 'jorrigal', directs: ['kalavags', 'mithea', 'thonongi', 'dachetha', 'anuragys', 'karnatij'] },
  'kalavags': { name: 'Sugandha Rathnam Kalavaganti', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'yohannjo', directs: [] },
  'mithea': { name: 'Akash Mithe', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'yohannjo', directs: [] },
  'thonongi': { name: 'Chandan Thonongi', title: 'Catalog Specialist', level: 3, isMgr: false, mgr: 'yohannjo', directs: [] },
  'dachetha': { name: 'Chethan Dinesh Danavath', title: 'Prod Compliance Specialist I', level: 4, isMgr: false, mgr: 'yohannjo', directs: [] },
  'anuragys': { name: 'Anurag Singh', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'yohannjo', directs: [] },
  'karnatij': { name: 'Jashwanth Goud Karnati', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'yohannjo', directs: [] },

  // ---- Vijay Kumar Chilla's team (7 former members removed per Phone Tool) ----
  'vjchilla': { name: 'Vijay Kumar Chilla', title: 'Manager I, Risk Management', level: 4, isMgr: true, mgr: 'jorrigal', directs: ['sadiyk', 'rajamkr', 'ageethik', 'sarikabh', 'mchankit', 'gudimalh', 'apurwakr', 'kumunell', 'kvinayt', 'rishiaj', 'sdayesha', 'revardha'] },
  'sadiyk': { name: 'Sadiya Kauser', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'rajamkr': { name: 'Karthick Raj', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'ageethik': { name: 'Geethika Avadhootha', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'sarikabh': { name: 'Sarika Bhosle', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'mchankit': { name: 'Ankita Choudhury', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'gudimalh': { name: 'Harish Gudimalla', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'apurwakr': { name: 'Apurwa Kumar', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'kumunell': { name: 'Kumudh Nellutla', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'kvinayt': { name: 'Vinay Kumar Margam', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'rishiaj': { name: 'Rishi Ajayakumar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'sdayesha': { name: 'Ayesha Sayed', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },
  'revardha': { name: 'Vardhan Meka', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'vjchilla', directs: [] },

  // ---- Shubham Kumar's direct ICs ----
  'jonnac': { name: 'Chitra Reddy Jonnalagadda', title: 'Program Manager I', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'ypreksha': { name: 'Preksha Y', title: 'Program Manager I', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'noosuraj': { name: 'Suraj Nookalamarri', title: 'Program Manager II, SxVx', level: 5, isMgr: false, mgr: 'kumarshu', directs: [] },
  'mheshpm': { name: 'Mahesh P', title: 'Program Manager I, SALSA', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'shreevi': { name: 'Shreevidya Annayarambatla', title: 'Program Manager I, MCE', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'gosang': { name: 'Srisai Gosangi', title: 'Program Manager I', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'cheedel': { name: 'Mahesh Ch', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'rsameerk': { name: 'Sameer Raj', title: 'Program Manager I', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },
  'rmvineet': { name: 'Vineeth Reddy', title: 'IC, SALSA QA', level: 4, isMgr: false, mgr: 'kumarshu', directs: [] },

  // ---- Sowmya Mettu's team ----
  'mssowmya': { name: 'Sowmya Mettu', title: 'Program Manager II, SxVx', level: 5, isMgr: true, mgr: 'kumarshu', directs: ['gnneeraj', 'ayabhatt', 'nelluruk', 'paatreya', 'apoogund', 'ejawsury'] },
  'gnneeraj': { name: 'Gajula Neeraj', title: 'Catalog Specialist II', level: 4, isMgr: false, mgr: 'mssowmya', directs: [] },
  'ayabhatt': { name: 'Ayan Bhattacharjee', title: 'Seller Qualification Spl.', level: 4, isMgr: false, mgr: 'mssowmya', directs: [] },
  'nelluruk': { name: 'Krishna Kanth Nelluru', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'mssowmya', directs: [] },
  'paatreya': { name: 'Atreya Avulamanda', title: 'Catalog Specialist II', level: 4, isMgr: false, mgr: 'mssowmya', directs: [] },
  'apoogund': { name: 'Sphoorthi Gundagani', title: 'Prod Compliance Specialist I', level: 4, isMgr: false, mgr: 'mssowmya', directs: [] },
  'ejawsury': { name: 'Surya Jawahar', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'mssowmya', directs: [] },

  // ---- Anthony Gorapalli's team ----
  'kgorapal': { name: 'Anthony Gorapalli', title: 'Manager I, SALSA', level: 4, isMgr: true, mgr: 'kumarshu', directs: ['prephani', 'kodsravy', 'bojjia', 'goswapra', 'kumamnik', 'shravkal', 'wgummare', 'egodispr'] },
  'prephani': { name: 'Phani Preethi', title: 'Prod Compliance Associate Sr.', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'kodsravy': { name: 'Sravya Kodi', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'bojjia': { name: 'Anirudh Madhwaraj Bojji', title: 'Prod Compliance Specialist I', level: 4, isMgr: false, mgr: 'kgorapal', directs: [] },
  'goswapra': { name: 'Pranav Goswami', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'kumamnik': { name: 'Nikhil Mamadala', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'shravkal': { name: 'Shravan Kumar Kalgodi', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'wgummare': { name: 'Swathi Gummalla', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },
  'egodispr': { name: 'Prashanth Godishala', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kgorapal', directs: [] },

  // ---- Akhila Gannamraju's team ----
  'aggannam': { name: 'Akhila Gannamraju', title: 'Manager II, Prod Compliance', level: 5, isMgr: true, mgr: 'kumarshu', directs: ['muqeemah', 'syesule', 'sharkoth', 'rundevak', 'ahmshaiq', 'vijaupot', 'sudaveda', 'vankithe'] },
  'muqeemah': { name: 'Ahmed Abdul Muqeem', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'aggannam', directs: [] },
  'syesule': { name: 'Syed Suleman', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'aggannam', directs: [] },
  'sharkoth': { name: 'Sharan Kotha', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'aggannam', directs: [] },
  'rundevak': { name: 'Deva Krishna Babu Rudra', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'aggannam', directs: [] },
  'ahmshaiq': { name: 'Shaik Abdul Ahmed', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'aggannam', directs: [] },
  'vijaupot': { name: 'Vijay Rajan P', title: 'Product Compliance Specialist', level: 4, isMgr: false, mgr: 'aggannam', directs: [] },
  'sudaveda': { name: 'Veda Vyas Sudarsanam', title: 'Sr. Prod. Compliance Associate', level: 3, isMgr: false, mgr: 'aggannam', directs: [] },
  'vankithe': { name: 'Ankitha Vyas', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'aggannam', directs: [] },

  // ---- Bhargavi Raghavendran's team (QA) ----
  'prathysr': { name: 'Prathyusha Srikanta', title: 'Prod Compliance Specialist, MCE', level: 4, isMgr: false, mgr: 'bhrgar', directs: [] },
  'muthindh': { name: 'Indhu Muthyala', title: 'Software Dev Eng - Test', level: 5, isMgr: false, mgr: 'bhrgar', directs: [] },
  'dvadakat': { name: 'Dileep Vadakattu', title: 'Quality Assurance Engineer', level: 5, isMgr: false, mgr: 'bhrgar', directs: [] },
  'ketiredd': { name: 'Kowshik Reddy Ketireddy', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'bhrgar', directs: [] },
  'vaischa': { name: 'Vaishnavi Chada', title: 'QAE II, SPEx', level: 5, isMgr: false, mgr: 'bhrgar', directs: [] },
  'shreejsj': { name: 'Shreeja Tejaswi S.M.', title: 'Prod Compliance Specialist', level: 4, isMgr: false, mgr: 'bhrgar', directs: [] },
  'urvenkat': { name: 'Venkata Ramana Sanepu', title: 'Quality Assurance Engineer II', level: 5, isMgr: false, mgr: 'bhrgar', directs: [] },
  'ramsais': { name: 'Ram Sai Mallik', title: 'Quality Assurance Engineer', level: 5, isMgr: false, mgr: 'bhrgar', directs: [] },
  'megsb': { name: 'Megha Butani', title: 'Quality Assurance Engineer I', level: 4, isMgr: false, mgr: 'bhrgar', directs: [] },
  'hadhug': { name: 'Hadhassa Garlapati', title: 'Quality Assurance Engineer I', level: 4, isMgr: false, mgr: 'bhrgar', directs: [] },


  // ---- Sonal Jamwal's team (Risk) ----
  'bhatarch': { name: 'Archa Bhattacharjee', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'mshifali': { name: 'Shifali M', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'tamardma': { name: 'Tamarana Manikanta', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'rvinsach': { name: 'Sachu Vinayan', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'mkjasir': { name: 'Jasirsha M K', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'hajtasn': { name: 'Hajira Tasneem', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'tripatht': { name: 'Tripti Tripathi', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'mehenoor': { name: 'Mehenoor Shariff', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'joekenny': { name: 'Joel Kenny Aligala', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'madulika': { name: 'Madhulika Sheelam', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'vaishmk': { name: 'Vaishnavi Mutakuduru', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'kimuduch': { name: 'Chiranjeevi Kimudu', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'srakshu': { name: 'Janga Sai Rakshitha', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'ckyatham': { name: 'SharathChandra Kyatham', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },
  'saayisha': { name: 'Aayisha Sharma', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'sjjamwal', directs: [] },

  // ---- Prakash Jha's team (Risk) ----
  'piyamiya': { name: 'Amiya Piyush', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'shrtewar': { name: 'Shraddha Tewari', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'lakshmvm': { name: 'Lakshmi Rajesh', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'akshida': { name: 'Akshitha Deshpande', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'snehajan': { name: 'Jangam Sneha', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'rdshetty': { name: 'Roshan Shetty', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'vivsonar': { name: 'Vivek Sonar', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'yaminmd': { name: 'Mohammed Yamin Abdul', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'chatulok': { name: 'Lokesh Chaturvedi', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'shalzz': { name: 'Shalini Sharma', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'ikpk': { name: 'Pramod Kumar Kandala', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'kdande': { name: 'Krishna Dande', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },
  'prgarika': { name: 'Priyanka Garikapati', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'jhprakas', directs: [] },

  // ---- Afnan Safdar's team (Risk) ----
  'glarik': { name: 'Glarindha J', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'uddarajs': { name: 'Sudeepthi Uddaraju', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'mouadhik': { name: 'Mou Adhikary', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'trsubham': { name: 'Subham Tripathi', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'afvjabee': { name: 'Afsha Jabeen', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'pajyotip': { name: 'Jyoti Prakash Panda', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'kaushidq': { name: 'Kaushik Dhar', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'ukanish': { name: 'Anisha K', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'kadamvar': { name: 'Varsha Kadam M', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'gksunith': { name: 'Sunitha G', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'danyaar': { name: 'Danya Arora', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'srihrami': { name: 'Sri Harshitha Ramisetti', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },
  'pumpkinn': { name: 'Muktyala Manohar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'afnas', directs: [] },

  // ---- Bhanu Prakash's team (Risk) ----
  'sggadhaw': { name: 'Shriya Gadhawe', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'bbbandan': { name: 'Bandana Bandana', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'calsyeda': { name: 'Syed Abdul Aleem', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'kpbandar': { name: 'Prasanna Kumar', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'vkraghul': { name: 'Raghul V', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'zsarukmi': { name: 'Rukmini Andal Tayaru Sathuluri', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'sukumjon': { name: 'Bandi Jonah Sukumar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'bhaspath': { name: 'Bhaskar Jyoti Pathak', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'hmohamib': { name: 'Mohammed Ibrahim', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'meghachh': { name: 'Megha Chhetri', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'gvsgiris': { name: 'Shabarigirish G V', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'shravnk': { name: 'Shravan Kolluru', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },
  'mirsyeda': { name: 'Syeda Begam', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'prabhanu', directs: [] },

  // ---- Rishabh Pandey's team (Risk) ----
  'shaikhdn': { name: 'Amir Shaikh', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'madisetj': { name: 'Jagadeesh Madisetti', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'ashmitv': { name: 'Ashmitha Shetty', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'bansafia': { name: 'Safiya Banu', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'nidpatre': { name: 'Nidhee Patre', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'kotvvina': { name: 'Vinay Kumar K', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'sitriloc': { name: 'Sinagam Trilochana', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'chitralv': { name: 'Mani C', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'chedipaa': { name: 'Akhil Dev Roy Chedipaka', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'azanyajo': { name: 'Joanna Azanya K', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },
  'saiksri': { name: 'Sai Srinivas Kovvada', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rishap', directs: [] },

  // ---- Anjani V's team (Risk) ----
  'geeredd': { name: 'Geereddy Aravind', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'curichie': { name: 'Richie Chandrapalaka', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'visakumk': { name: 'Visal Kumar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'fbasinhk': { name: 'Basina H K N P Sabarish', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'harshijz': { name: 'Harshita Joshi', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'githa': { name: 'Geetha Priya Dhayalan', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'kalimura': { name: 'Rajkumar K', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'podijaga': { name: 'Jagadeesh Podili', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'aihtesha': { name: 'Areej Ihtesham', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'rubyshah': { name: 'Rubina Shaheen', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'veerdon': { name: 'Donekal Veerendra', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },
  'afrzmoha': { name: 'Mohammed Afroz', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'anjanvya', directs: [] },

  // ---- Shree Banerjee's team (Risk) ----
  'annappav': { name: 'Vineeth Kumar Annappa', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'aashutr': { name: 'Aashutosh Rastogi', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'akssahal': { name: 'Akshita Sahal', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'janbafar': { name: 'Farhan Janbaz', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'enazmoha': { name: 'Mohammed Nazimuddin', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'anumuddh': { name: 'Anusha Muddhapuram', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'machasow': { name: 'Machavaram Sowjanya', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'syyomer': { name: 'Syed Omer', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'dimounik': { name: 'Divya Mounika Murugudu', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'faraime': { name: 'Fariya Aimen', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'feerahs': { name: 'Shareef Shaik', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'mfaraaz': { name: 'Faraaz Shaikh', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'humabhat': { name: 'Humera Bhat', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'nowshenz': { name: 'Nowsheen Zehra', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'shandole': { name: 'Shivani Andole', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'mohwwahi': { name: 'Wahid Mohammad', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'vinohp': { name: 'Vinodha Boovaragapushpavelan', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },
  'puneetog': { name: 'Puneeth Baradi', title: 'Product Compliance', level: 3, isMgr: false, mgr: 'shreeru', directs: [] },


  // ======== Anil Venkat (Program Management / Brand Protection / BRS) sub-org ========
  'venkaani': { name: 'Anil Venkat', title: 'Manager, Program Management', level: 6, isMgr: true, mgr: 'agasarad', directs: ['aditpati', 'rizshahb', 'ngkj', 'alasabbi', 'iksanth', 'akonredd', 'gawansam', 'kshivaml', 'harikkop'] },
  'ngkj': { name: 'Kajal Negi', title: 'BR Training Specialist I', level: 4, isMgr: false, mgr: 'venkaani', directs: [] },
  'alasabbi': { name: 'Sabbir Alam', title: 'Program Manager', level: 5, isMgr: false, mgr: 'venkaani', directs: [] },
  'akonredd': { name: 'Ravikanth K', title: 'Program Manager - I', level: 4, isMgr: false, mgr: 'venkaani', directs: [] },
  'harikkop': { name: 'Hari Krishna Kopparapu', title: 'Program Manager', level: 5, isMgr: false, mgr: 'venkaani', directs: [] },

  // ---- Aditi Pati's team ----
  'aditpati': { name: 'Aditi Pati', title: 'Manager, Brand Protection', level: 4, isMgr: true, mgr: 'venkaani', directs: ['palvidya', 'rudrang', 'bandsree', 'thejasvi', 'ysaraf', 'kkgj', 'hquamz', 'rbandara', 'vrpulich', 'asljmoha', 'srnavyaa', 'yennmani', 'shabetmo', 'vbaparna', 'durnimma', 'gandamkm', 'ymzubair', 'akhiil'] },
  'palvidya': { name: 'Vidya Palan', title: 'CQT- Quality Auditor', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'rudrang': { name: 'Rudrangi Nikitha', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'bandsree': { name: 'Bandila Bhagya Sree', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'thejasvi': { name: 'Thejasvini Biyya', title: 'CQT- Quality Auditor', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'ysaraf': { name: 'Yesh Saraf', title: 'CQT- Quality Auditor', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'kkgj': { name: 'Kamalpreet Kaur', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'hquamz': { name: 'Mohammad Faisal Haque', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'rbandara': { name: 'Rishitha Goud Bandharapu', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'vrpulich': { name: 'Rajiv Pulichara', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'asljmoha': { name: 'Aslam Mohammad', title: 'CQT- Quality Auditor', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'srnavyaa': { name: 'Kalabandalapati Navya Sri', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'yennmani': { name: 'Manikumar Yennabathula', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'shabetmo': { name: 'Shabeth MD', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'vbaparna': { name: 'Aparna Basavarasu', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'durnimma': { name: 'Durga Naga Shyam Nimmala', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'gandamkm': { name: 'Gandam Diana Maria', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'ymzubair': { name: 'Muhammed Zubair Ahmed', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },
  'akhiil': { name: 'A Singh', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'aditpati', directs: [] },

  // ---- Shahbaz Rizvi's team ----
  'rizshahb': { name: 'Shahbaz Rizvi', title: 'Manager I', level: 4, isMgr: true, mgr: 'venkaani', directs: ['maasir', 'avirj', 'sprathb', 'pushpnp', 'navlanka', 'sunnpkum', 'tamminkr', 'nalapava', 'madshivd', 'kbhushak', 'mutalliy', 'majsiris', 'rasagnac', 'knavadiy', 'dakshyv', 'vinuvb', 'dpnandit'] },
  'maasir': { name: 'Maasir Saad', title: 'Risk Specialist I', level: 4, isMgr: true, mgr: 'rizshahb', directs: ['sravk', 'svvoleti', 'panddimp', 'mahsrira', 'juluriv', 'rhsriva', 'mhhasm', 'anupkish', 'mpmuham', 'goudanur', 'gupabhiy', 'abhijiyk', 'ykollmah', 'abidshan', 'mosalihh', 'lnanikhi', 'akgop'] },
  'sravk': { name: 'Sravan Kumar Peddoti', title: 'Invest Spc [JPN]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'svvoleti': { name: 'Shravani Voleti', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'panddimp': { name: 'Dimple Prathyusha Pandey', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'mahsrira': { name: 'Maheshwari Sriram', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'juluriv': { name: 'Vasanth Juluri', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'rhsriva': { name: 'Rahul Srivastava', title: 'Invest Spc [FRE]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'mhhasm': { name: 'Mohammad Hassan', title: 'Invest Spc [ITA]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'anupkish': { name: 'Anupam Kishan', title: 'Invest Spc [CHI]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'mpmuham': { name: 'Muhammed Hafiyy MP', title: 'Invest Spc [ARA]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'goudanur': { name: 'Anusha Atmakur Goud', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'gupabhiy': { name: 'Abhishek Gupta', title: 'Invest Spc [JPN]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'abhijiyk': { name: 'Abhijith KP', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'ykollmah': { name: 'Mahesh Kolli', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'abidshan': { name: 'Abid Shaik', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'mosalihh': { name: 'Mohammed Salih', title: 'Invest Spc [CHI]', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'lnanikhi': { name: 'Nikhita LN', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'akgop': { name: 'Gopi A', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'maasir', directs: [] },
  'avirj': { name: 'Aviral Joshi', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'sprathb': { name: 'Prathibha S', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'pushpnp': { name: 'Kolla Pushpa Nandini', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'navlanka': { name: 'Naveen Lankapalli', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'sunnpkum': { name: 'Sunny Kumar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'tamminkr': { name: 'Krishna Tammineni', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'nalapava': { name: 'Pavankumar Nalam', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'madshivd': { name: 'Shiva Madupathi', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'kbhushak': { name: 'K Bhushan Kumar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'mutalliy': { name: 'Mutallib Mohammed', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'majsiris': { name: 'Sireesha Majji', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'rasagnac': { name: 'Rasagna Chirala', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'knavadiy': { name: 'Kishan Navadiya', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'dakshyv': { name: 'Dakshayani Vruddhula', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'vinuvb': { name: 'Vinutha Belur', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },
  'dpnandit': { name: 'Nanditha Pawar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'rizshahb', directs: [] },

  // ---- Santhoshkumar K's team ----
  'iksanth': { name: 'Santhoshkumar K', title: 'Risk Specialist I', level: 4, isMgr: true, mgr: 'venkaani', directs: ['pmothuku', 'phanibp', 'rajppri', 'vanganv', 'pullbhan', 'mobimran', 'garikram', 'mazhaq', 'ameessaq', 'dharnpra', 'mohchat', 'asharahu'] },
  'pmothuku': { name: 'Pallavi Mothukuri', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'phanibp': { name: 'Phani Bellamkonda', title: 'CQT - Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'rajppri': { name: 'Priya Rajput', title: 'CQT - Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'vanganv': { name: 'Vani Puppala', title: 'CQT - Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'pullbhan': { name: 'Pullabatla Bhanu Sri', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'mobimran': { name: 'Mohammad Imran', title: 'CQT- Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'garikram': { name: 'Ramakrishna Gariki', title: 'CQT - Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'mazhaq': { name: 'Md Azhar', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'ameessaq': { name: 'Amees Saqlain Mohammed', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'dharnpra': { name: 'Dharna Prasad', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'mohchat': { name: 'Mohua Chatterjee', title: 'CQT - Quality Auditor', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },
  'asharahu': { name: 'Rahul Sharma', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'iksanth', directs: [] },

  // ---- Samiksha Gawand's team ----
  'gawansam': { name: 'Samiksha Gawand', title: 'Manager, Brand - BRS', level: 4, isMgr: true, mgr: 'venkaani', directs: ['lipsp', 'naazh', 'bnbhatra', 'khafshay', 'ashllaxm', 'snaivish', 'prjangra', 'srgundeb', 'mjunaidb', 'treddich', 'esamhith', 'garavikg', 'jainrahe', 'gaddraje', 'tahatm', 'syedahmz'] },
  'lipsp': { name: 'Lipsa Pattanayak', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'naazh': { name: 'Hiba Naaz', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'bnbhatra': { name: 'Nikitha Bhatraj', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'khafshay': { name: 'Shayan Khan', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'ashllaxm': { name: 'Ashlesha Laxmi', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'snaivish': { name: 'Vishnu S Nair', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'prjangra': { name: 'Prerna Jangra', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'srgundeb': { name: 'Sai Krishna Yadav', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'mjunaidb': { name: 'Junaid Baba Shaik M', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'treddich': { name: 'Saikumar Reddicherla', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'esamhith': { name: 'Veda Samhitha', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'garavikg': { name: 'Ravi Kiran Gandikota', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'jainrahe': { name: 'Rahul Jain', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'gaddraje': { name: 'Rajesh Gaddagolla', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'tahatm': { name: 'Taha Tarannum', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },
  'syedahmz': { name: 'Syedah Mehak Zahra', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'gawansam', directs: [] },

  // ---- Kunal Shivam's team ----
  'kshivaml': { name: 'Kunal Shivam', title: 'Manager, Brand - BRS', level: 4, isMgr: true, mgr: 'venkaani', directs: ['krmya', 'maameenb', 'smsmriti', 'viraghur', 'zahogani', 'swesunit', 'gaithri', 'sukkanya', 'pdhanimi', 'sivasahi', 'mysujana', 'sgharti', 'himshaam'] },
  'krmya': { name: 'Ramya K', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'maameenb': { name: 'Ameen Mahmood', title: 'Catalog Spc', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'smsmriti': { name: 'Smriti', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'viraghur': { name: 'Vijay Anand Raghu Raman', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'zahogani': { name: 'Anisa Zahoor', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'swesunit': { name: 'Swetha Sunith', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'gaithri': { name: 'Gayathri Katuri', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'sukkanya': { name: 'Sukanya Palanisamy', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'pdhanimi': { name: 'Padmavathi Dhanimireddy', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'sivasahi': { name: 'Siva Sahithi Chinnolla', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'mysujana': { name: 'Mylapalli Sujana', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'sgharti': { name: 'Sunaina Gharti', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },
  'himshaam': { name: 'Himanshu Sharma', title: 'Prod Compliance Associate Sr', level: 3, isMgr: false, mgr: 'kshivaml', directs: [] },

  // ---- Vatsal Gupta (referenced in sample data; kept) ----
  'gvatsala': { name: 'Vatsal Gupta', title: 'Catalog Specialist, GCOI', level: 3, isMgr: false, mgr: 'jtteja', directs: [] }
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
    const subMgrs = getMgrs(state.mgr);
    h += `<div class="nav-section"><div class="nav-title">${info.name}'s Team</div>`;
    h += `<div class="nav-item ${n === 'dashboard' ? 'active' : ''}" onclick="setNav('dashboard')"><span class="icon">&#128202;</span>Dashboard</div>`;
    if (subMgrs.length > 0) {
      h += `<div class="nav-item ${n === 'consolidated' ? 'active' : ''}" onclick="setNav('consolidated')"><span class="icon">&#128203;</span>Consolidated View</div>`;
    }
    h += `<div class="nav-item ${n === 'calendar' ? 'active' : ''}" onclick="setNav('calendar')"><span class="icon">&#128197;</span>Calendar</div>`;
    h += `<div class="nav-item ${n === 'leaves' ? 'active' : ''}" onclick="setNav('leaves')"><span class="icon">&#128221;</span>Leave Records${pendingCount ? '<span class="badge-count">' + pendingCount + '</span>' : ''}</div>`;
    h += `<div class="nav-item ${n === 'spreadsheet' ? 'active' : ''}" onclick="setNav('spreadsheet')"><span class="icon">&#128203;</span>Monthly Sheet</div>`;
    h += `<div class="nav-item ${n === 'apply' ? 'active' : ''}" onclick="window.open('https://atoz.amazon.work/time','_blank')"><span class="icon">&#10133;</span>Apply Leave</div>`;
    h += `<div class="nav-item ${n === 'team' ? 'active' : ''}" onclick="setNav('team')"><span class="icon">&#128101;</span>Team</div>`;
    h += `<div class="nav-item ${n === 'reports' ? 'active' : ''}" onclick="setNav('reports')"><span class="icon">&#128200;</span>Reports</div>`;
    h += `<div class="nav-item ${n === 'daily' ? 'active' : ''}" onclick="setNav('daily')"><span class="icon">&#128197;</span>Daily Tracker</div>`;
    h += `<div class="nav-item ${n === 'flash' ? 'active' : ''}" onclick="setNav('flash')"><span class="icon">&#9993;</span>Flash Email</div>`;
    h += `<div class="nav-item ${n === 'wbr' ? 'active' : ''}" onclick="setNav('wbr')"><span class="icon">&#128221;</span>WBR</div>`;
    h += '</div>';
  }
  sb.innerHTML = h;
}

function goOrg() { state.view = 'org'; state.mgr = null; state.nav = 'dashboard'; render(); }
function goMgr(alias) {
  // Access control check
  if (LOGGED_IN_USER && !canViewTeam(alias)) {
    toast('?? Access denied. You don\'t have permission to view ' + (ORG[alias] ? ORG[alias].name : alias) + '\'s team. Ask their manager to grant access.');
    return;
  }
  state.view = 'mgr'; state.mgr = alias; state.nav = 'dashboard'; render();
}
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
  else if (n === 'flash') content = renderFlashEmail();
  else if (n === 'wbr') content = renderWBR();
  else if (n === 'consolidated') content = renderConsolidatedView();
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
  // Get holidays for this month
  const monthHolidays = INDIAN_HOLIDAYS[m + 1] || [];
  const holidayMap = {};
  monthHolidays.forEach(h => { holidayMap[h.day] = h.name; });

  let h = `<div class="card"><div class="cal"><div class="cal-header">
    <div class="cal-nav"><button onclick="calNav(-1)">&laquo; Prev</button></div>
    <h3>${months[m]} ${y}</h3>
    <div class="cal-nav"><button onclick="calNav(1)">Next &raquo;</button></div>
  </div>
  <div style="display:flex;gap:14px;padding:8px 16px;font-size:11px;border-bottom:1px solid var(--border)">
    <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#fee2e2;border:1px solid #fca5a5;border-radius:2px"></span> Weekend (Sat/Sun)</span>
    <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#dcfce7;border:1px solid #86efac;border-radius:2px"></span> Holiday</span>
    <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#e6f2ff;border:1px solid #0073bb;border-radius:2px"></span> Today</span>
  </div>
  <div class="cal-grid">`;
  days.forEach(d => {
    const isWkend = (d === 'Sun' || d === 'Sat');
    h += `<div class="cal-day-header" style="${isWkend ? 'color:#d13212;background:#fff5f5' : ''}">${d}</div>`;
  });
  for (let i = 0; i < firstDay; i++) { h += '<div class="cal-day other"></div>'; }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(y, m, d);
    const dow = dateObj.getDay();
    const isWeekend = (dow === 0 || dow === 6);
    const isHoliday = holidayMap[d];
    const isToday = ds === todayStr;

    let cellStyle = '';
    let cellClass = 'cal-day';
    if (isToday) cellClass += ' today';
    else if (isHoliday) cellStyle = 'background:#dcfce7;';
    else if (isWeekend) cellStyle = 'background:#fee2e2;';

    h += `<div class="${cellClass}" style="${cellStyle}">`;
    h += `<div class="day-num" style="${isWeekend ? 'color:#d13212' : ''}${isHoliday ? 'color:#1d8102;font-weight:700' : ''}">${d}</div>`;

    // Show holiday name
    if (isHoliday) {
      h += `<div class="leave-dot" style="background:#bbf7d0;color:#166534;font-size:8px;padding:1px 3px;border-radius:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%" title="${isHoliday}">${isHoliday}</div>`;
    }
    // Show weekend label
    if (isWeekend && !isHoliday) {
      h += `<div style="font-size:8px;color:#991b1b;opacity:0.7">${dow === 0 ? 'SUN' : 'SAT'}</div>`;
    }
    // Show leave entries
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

  // Always rebuild monthly sheet from latest data (no caching)
  if (!db.monthlySheets) db.monthlySheets = {};
  if (!db.monthlySheets[mgr]) db.monthlySheets[mgr] = {};
  // Always regenerate
  db.monthlySheets[mgr][mk] = {};
  ics.forEach(a => {
    db.monthlySheets[mgr][mk][a] = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m, d).getDay();
      db.monthlySheets[mgr][mk][a][ds] = (dow === 0 || dow === 6) ? 'WO' : 'P';
    }
  });
  // Overlay from daily tracker (most accurate)
  const tracker = db.dailyTracker[mgr] || {};
  ics.forEach(a => {
    if (tracker[a]) {
      Object.keys(tracker[a]).forEach(date => {
        if (date.startsWith(mk) && db.monthlySheets[mgr][mk][a]) {
          const rec = tracker[a][date];
          if (rec.status === 'absent') db.monthlySheets[mgr][mk][a][date] = rec.leaveType === 'planned' ? 'PL' : 'UL';
          else if (rec.status === 'halfday') db.monthlySheets[mgr][mk][a][date] = 'HD';
          else if (rec.status === 'mandate_off') db.monthlySheets[mgr][mk][a][date] = 'MO';
          else if (rec.status === 'present') db.monthlySheets[mgr][mk][a][date] = 'P';
        }
      });
    }
  });
  // Overlay from leave records
  const leaves = getLeaves(mgr).filter(l => l.status === 'approved');
  leaves.forEach(l => {
    let d = new Date(l.from); const end = new Date(l.to);
    while (d <= end) {
      const ds = d.toISOString().slice(0, 10);
      if (ds.startsWith(mk) && db.monthlySheets[mgr][mk][l.alias]) {
        if (l.type === 'planned') db.monthlySheets[mgr][mk][l.alias][ds] = 'PL';
        else if (l.type === 'unplanned') db.monthlySheets[mgr][mk][l.alias][ds] = 'UL';
        else if (l.type === 'halfday') db.monthlySheets[mgr][mk][l.alias][ds] = 'HD';
        else if (l.type === 'mandatory_off') db.monthlySheets[mgr][mk][l.alias][ds] = 'MO';
      }
      d.setDate(d.getDate() + 1);
    }
  });

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

  // Monthly Sheet Charts
  var totalLeaveDays = grandPL + grandUL + grandHD;
  var totalWorkDays = grandP + totalLeaveDays;
  var sheetShrinkage = totalWorkDays > 0 ? ((totalLeaveDays / totalWorkDays) * 100).toFixed(1) : 0;

  // Pie chart for this month
  if (totalLeaveDays > 0) {
    var dPL = (grandPL / (grandPL+grandUL+grandHD)) * 360;
    var dUL = dPL + (grandUL / (grandPL+grandUL+grandHD)) * 360;
    h += `<div class="card"><h2>&#128200; ${months[m]} ${y} - Leave Breakdown</h2>`;
    h += `<div style="display:flex;align-items:center;gap:30px;flex-wrap:wrap">`;
    h += `<div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(#0073bb 0deg ${dPL}deg, #d13212 ${dPL}deg ${dUL}deg, #ff9900 ${dUL}deg 360deg)"></div>`;
    h += `<div style="font-size:13px;line-height:2.2">`;
    h += `<div><span style="display:inline-block;width:12px;height:12px;background:#0073bb;border-radius:2px;margin-right:6px"></span>Planned: ${grandPL} days</div>`;
    h += `<div><span style="display:inline-block;width:12px;height:12px;background:#d13212;border-radius:2px;margin-right:6px"></span>Unplanned: ${grandUL} days</div>`;
    h += `<div><span style="display:inline-block;width:12px;height:12px;background:#ff9900;border-radius:2px;margin-right:6px"></span>Half-day: ${grandHD} days</div>`;
    h += `<div style="margin-top:8px;font-weight:700;color:${parseFloat(sheetShrinkage)>15?'var(--danger)':'var(--success)'}">Monthly Shrinkage: ${sheetShrinkage}%</div>`;
    h += `</div></div></div>`;
  }

  // Per-associate chart for this month
  h += `<div class="card"><h2>&#128101; ${months[m]} - Per Associate Attendance</h2>`;
  h += `<div style="font-size:10px;margin-bottom:8px;display:flex;gap:10px"><span style="color:#1d8102">&#9632; Present</span><span style="color:#0073bb">&#9632; Planned</span><span style="color:#d13212">&#9632; Unplanned</span><span style="color:#ff9900">&#9632; Half-day</span></div>`;
  ics.forEach(a => {
    var row = sheetData[a] || {};
    var aP=0, aPL=0, aUL=0, aHD=0, aWO=0;
    Object.values(row).forEach(v => {
      if(v==='P') aP++; else if(v==='PL') aPL++; else if(v==='UL') aUL++; else if(v==='HD') aHD++; else if(v==='WO'||v==='MO'||v==='H') aWO++;
    });
    var aTotal = aP+aPL+aUL+aHD;
    if(aTotal===0) aTotal=1;
    var isHigh = (aPL+aUL+aHD) > 5;
    h += `<div style="display:flex;align-items:center;gap:6px;margin:4px 0">`;
    h += `<div style="width:70px;font-size:10px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a}</div>`;
    h += `<div style="flex:1;height:18px;background:#eee;border-radius:3px;overflow:hidden;display:flex">`;
    if(aP) h += `<div style="width:${aP/daysInMonth*100}%;background:#1d8102"></div>`;
    if(aPL) h += `<div style="width:${aPL/daysInMonth*100}%;background:#0073bb"></div>`;
    if(aUL) h += `<div style="width:${aUL/daysInMonth*100}%;background:#d13212"></div>`;
    if(aHD) h += `<div style="width:${aHD/daysInMonth*100}%;background:#ff9900"></div>`;
    if(aWO) h += `<div style="width:${aWO/daysInMonth*100}%;background:#ddd"></div>`;
    h += `</div>`;
    h += `<div style="width:60px;font-size:10px;text-align:right;color:${isHigh?'var(--danger)':'var(--muted)'}">${aPL+aUL+aHD} leaves</div>`;
    h += `</div>`;
  });
  h += `</div>`;

  // Leave Forecast Table (next 3 months, auto-calculated)
  h += `<div class="card" style="margin-top:16px"><h2>&#128197; Leave Forecast (Next 3 Months)</h2>`;
  const forecastData = getLeaveForcastData(state.sheetMonth, state.sheetYear, ics.length);
  h += `<table><thead><tr><th>Month</th><th>Forecasted Working %</th><th>Forecasted Leave %</th><th>Formula</th><th>Employees on Leave</th><th>Key Holidays</th><th>Likely Leave Pattern</th></tr></thead><tbody>`;
  forecastData.forEach(f => {
    const leavePctStyle = f.leavePct > 20 ? 'color:#d13212;font-weight:700' : '';
    h += `<tr><td>${f.month}</td><td class="num">${f.workPct}%</td><td class="num" style="${leavePctStyle}">${f.leavePct}%</td><td>${f.formula}</td><td class="num">~${f.empOnLeave}</td><td style="font-size:11px">${f.holidays}</td><td style="font-size:11px">${f.patterns}</td></tr>`;
  });
  h += `</tbody></table>`;
  h += `<p style="font-size:11px;color:var(--muted);margin-top:6px">Note: Forecast based on Indian festivals and historical trends. Leave % > 20% highlighted in red.</p>`;
  h += `</div>`;

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
  
    // ========== DAILY WORK UPDATE (compact grid) ==========
  var today = new Date();
  var startOfYear = new Date(today.getFullYear(), 0, 1);
  var weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  var weekKey = today.getFullYear() + '-W' + weekNum;
  if (!db.wbr) db.wbr = {};
  if (!db.wbr[state.mgr]) db.wbr[state.mgr] = {};
  if (!db.wbr[state.mgr][weekKey]) db.wbr[state.mgr][weekKey] = {};
  var updatedCount = 0, notUpdated = [];
  ics.forEach(function(a) { if (db.wbr[state.mgr][weekKey][a] && db.wbr[state.mgr][weekKey][a].tasks && db.wbr[state.mgr][weekKey][a].tasks.length > 0) updatedCount++; else notUpdated.push(a); });

  h += '<div class="card" style="border-left:4px solid var(--primary)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
  h += '<h3 style="margin:0">&#9998; Log Daily Update</h3>';
  h += '<span class="badge ' + (updatedCount === ics.length ? 'b-green' : 'b-orange') + '" style="font-size:10px">' + updatedCount + '/' + ics.length + ' done (Wk' + weekNum + ')</span>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">';
  h += '<div class="fg" style="margin:0"><label>Associate</label><select id="wbr-user" style="width:100%" onchange="document.getElementById(\'wbr-name\').value=this.options[this.selectedIndex].getAttribute(\'data-name\')">';
  ics.forEach(function(a) { var n = ORG[a] ? ORG[a].name.split(' ')[0] : a; h += '<option value="' + a + '" data-name="' + (ORG[a] ? ORG[a].name : a) + '">' + a + ' (' + n + ')</option>'; });
  h += '</select></div>';
  h += '<div class="fg" style="margin:0"><label>Program</label><select id="wbr-program" style="width:100%"><option value="">Select</option><option>CMDE Audit</option><option>LDX</option><option>Expo</option><option>NGS</option><option>MCE QA</option><option>MCE Dev</option><option>MCE Tickets</option><option>Listing deep dives</option><option>CMDE QC</option></select></div>';
  h += '<div class="fg" style="margin:0"><label>Date</label><input type="date" id="wbr-date" value="' + new Date().toISOString().slice(0,10) + '" style="width:100%"></div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:2fr 1fr auto;gap:10px;margin-bottom:10px">';
  h += '<div class="fg" style="margin:0"><label>Sub-Program</label><input type="text" id="wbr-subprogram" placeholder="Display properties, Tickets..." style="width:100%"></div>';
  h += '<div class="fg" style="margin:0"><label>Status</label><select id="wbr-availability" style="width:100%"><option value="present">Present</option><option value="halfday">Half Day</option><option value="wfh">WFH</option><option value="planned_leave">On Leave</option></select></div>';
  h += '<div class="fg" style="margin:0"><label>Hrs</label><input type="number" id="wbr-timespent" value="8" min="0" max="12" step="0.5" style="width:60px"></div>';
  h += '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">';
  h += '<div class="fg" style="margin:0"><label>Target</label><input type="number" id="wbr-target" placeholder="1000" style="width:100%"></div>';
  h += '<div class="fg" style="margin:0"><label>Actual</label><input type="number" id="wbr-actual" placeholder="700" style="width:100%"></div>';
  h += '<div class="fg" style="margin:0"><label>Shrinkage</label><select id="wbr-shrinkage" style="width:100%"><option value="NA">NA (Utilized)</option><option value="Leave">Leave</option><option value="Mandatory Off">Mandatory Off</option><option value="Adhoc Testing and Analysis">Adhoc Testing</option></select></div>';
  h += '<div class="fg" style="margin:0"><label>HC</label><input type="number" id="wbr-hc" value="1" min="0" max="1" step="0.1" style="width:100%"></div>';
  h += '</div>';
h += '<div class="fg" style="margin:0 0 10px"><label>Activities (one per line)</label><textarea id="wbr-tasks" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:4px;font-size:12px" placeholder="Completed 400 audits on CAT tool&#10;Resolved SIM-12345"></textarea></div>';
  h += '<input type="hidden" id="wbr-name" value="' + (ORG[ics[0]] ? ORG[ics[0]].name : ics[0]) + '">';
  h += '<div style="display:flex;align-items:center;gap:12px">';
  h += '<button class="btn btn-p" onclick="saveWBREntry()">&#10004; Submit</button>';
  if (notUpdated.length > 0) h += '<span style="font-size:11px;color:var(--danger)">Pending: ' + notUpdated.slice(0,4).join(', ') + (notUpdated.length > 4 ? ' +' + (notUpdated.length-4) : '') + '</span>';
  h += '</div></div>';

  // Submitted entries - compact grid
  if (updatedCount > 0) {
    h += '<div class="card"><h3 style="margin-bottom:10px">&#128203; Submissions (Wk ' + weekNum + ')</h3>';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">';
    ics.forEach(function(a) { var entry = db.wbr[state.mgr][weekKey][a]; if (entry && entry.tasks && entry.tasks.length > 0) {
      h += '<div style="border:1px solid var(--border);border-radius:6px;padding:10px;border-left:3px solid var(--success);font-size:11px">';
      h += '<strong>' + a + '</strong> <span class="badge b-green" style="font-size:9px;margin-left:4px">Done</span>';
      h += '<ul style="margin:4px 0 0 12px;color:var(--muted)">';
      entry.tasks.slice(0,2).forEach(function(t) { h += '<li>' + t + '</li>'; });
      if (entry.tasks.length > 2) h += '<li><i>+' + (entry.tasks.length-2) + ' more</i></li>';
      h += '</ul></div>';
    }});
    h += '</div></div>';
  }

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

// ========== USER LOGIN & ACCESS CONTROL ==========
// Each manager sees only their team. Cross-team access requires permission.

var LOGGED_IN_USER = localStorage.getItem('dashboard_user') || null;
var ACCESS_PERMISSIONS_KEY = 'dashboard_access_permissions';

// Get stored permissions: { "aggannam": ["mssowmya", "kgorapal"] } means aggannam can also view mssowmya and kgorapal's teams
function getAccessPermissions() {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_PERMISSIONS_KEY) || '{}');
  } catch (e) { return {}; }
}

function saveAccessPermissions(perms) {
  localStorage.setItem(ACCESS_PERMISSIONS_KEY, JSON.stringify(perms));
}

// Check if logged-in user can view a specific manager's team
function canViewTeam(targetMgr) {
  if (!LOGGED_IN_USER) return true; // No login = open access (backward compatible)
  
  // Rule 1: You can always view your own team
  if (LOGGED_IN_USER === targetMgr) return true;
  
  // Rule 2: You can view teams below you in hierarchy (you're their skip-level or above)
  const allBelow = allReports(LOGGED_IN_USER);
  if (allBelow.includes(targetMgr)) return true;
  
  // Rule 3: Check explicit cross-team permissions
  const perms = getAccessPermissions();
  const userPerms = perms[LOGGED_IN_USER] || [];
  if (userPerms.includes(targetMgr)) return true;
  
  // Rule 4: If you're an IC (not a manager), you can view your own manager's dashboard
  const userInfo = ORG[LOGGED_IN_USER];
  if (userInfo && userInfo.mgr === targetMgr) return true;
  
  return false;
}

// Login prompt
function showLoginPrompt() {
  let h = '<h2>&#128100; Who are you?</h2>';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:16px">Select your name to see your team\'s dashboard. You\'ll only see teams you have access to.</p>';
  
  // Show all managers as login options
  const managers = Object.entries(ORG).filter(([k, v]) => v.isMgr).sort((a, b) => b[1].level - a[1].level);
  
  h += '<div class="fg"><label>Select your login:</label><select id="login-select" style="font-size:14px;padding:10px">';
  h += '<option value="">-- Choose your name --</option>';
  h += '<option value="__open__">Open Access (no restrictions)</option>';
  managers.forEach(([alias, info]) => {
    h += `<option value="${alias}">${info.name} (${info.title}) - L${info.level}</option>`;
  });
  h += '</select></div>';
  
  h += '<div style="margin-top:16px"><button class="btn btn-p" onclick="doLogin()">Login</button></div>';
  showModal(h);
}

function doLogin() {
  const sel = document.getElementById('login-select').value;
  if (!sel) { toast('Please select your name'); return; }
  
  if (sel === '__open__') {
    LOGGED_IN_USER = null;
    localStorage.removeItem('dashboard_user');
    toast('Open access mode. All teams visible.');
  } else {
    LOGGED_IN_USER = sel;
    localStorage.setItem('dashboard_user', sel);
    toast('Logged in as ' + (ORG[sel] ? ORG[sel].name : sel));
    
    // Auto-navigate to their team
    if (ORG[sel] && ORG[sel].isMgr) {
      state.view = 'mgr';
      state.mgr = sel;
      state.nav = 'dashboard';
    }
  }
  
  hideModal();
  render();
  updateLoginDisplay();
}

function doLogout() {
  LOGGED_IN_USER = null;
  localStorage.removeItem('dashboard_user');
  state.view = 'org';
  state.mgr = null;
  render();
  updateLoginDisplay();
  toast('Logged out. Open access mode.');
}

function updateLoginDisplay() {
  const el = document.getElementById('login-display');
  if (!el) return;
  if (LOGGED_IN_USER && ORG[LOGGED_IN_USER]) {
    el.innerHTML = `<span style="font-size:11px;color:#aab7b8">?? ${ORG[LOGGED_IN_USER].name}</span> <button class="btn btn-s btn-sm" onclick="doLogout()" style="margin-left:6px">Logout</button> <button class="btn btn-s btn-sm" onclick="showLoginPrompt()">Switch</button>`;
  } else {
    el.innerHTML = `<button class="btn btn-s btn-sm" onclick="showLoginPrompt()">?? Login</button>`;
  }
}

// Grant cross-team access permission
function showGrantAccessModal() {
  if (!isAdmin) { alert("Admin mode required to manage permissions."); return; }
  
  const perms = getAccessPermissions();
  const managers = Object.entries(ORG).filter(([k, v]) => v.isMgr).sort((a, b) => a[1].name.localeCompare(b[1].name));
  
  let h = '<h2>&#128274; Manage Cross-Team Access</h2>';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Grant a manager permission to view another manager\'s team data.</p>';
  
  h += '<div class="fr" style="margin-bottom:16px">';
  h += '<div class="fg"><label>Grant access TO:</label><select id="perm-user">';
  managers.forEach(([alias, info]) => { h += `<option value="${alias}">${info.name}</option>`; });
  h += '</select></div>';
  h += '<div class="fg"><label>Can view team OF:</label><select id="perm-target">';
  managers.forEach(([alias, info]) => { h += `<option value="${alias}">${info.name}</option>`; });
  h += '</select></div>';
  h += '<button class="btn btn-p" onclick="grantAccess()" style="margin-bottom:4px">Grant</button>';
  h += '</div>';
  
  // Show current permissions
  h += '<h3 style="margin-top:16px">Current Permissions:</h3>';
  const permEntries = Object.entries(perms).filter(([k, v]) => v.length > 0);
  if (permEntries.length === 0) {
    h += '<p style="color:var(--muted);font-size:12px">No cross-team permissions granted yet. Managers can only see their own teams and teams below them.</p>';
  } else {
    h += '<table style="font-size:12px"><thead><tr><th>User</th><th>Can Also View</th><th>Action</th></tr></thead><tbody>';
    permEntries.forEach(([user, targets]) => {
      const userName = ORG[user] ? ORG[user].name : user;
      targets.forEach(target => {
        const targetName = ORG[target] ? ORG[target].name : target;
        h += `<tr><td>${userName}</td><td>${targetName}'s team</td><td><button class="btn btn-d btn-sm" onclick="revokeAccess('${user}','${target}')">Revoke</button></td></tr>`;
      });
    });
    h += '</tbody></table>';
  }
  
  h += '<div style="margin-top:16px"><button class="btn btn-s" onclick="hideModal()">Close</button></div>';
  showModal(h);
}

function grantAccess() {
  const user = document.getElementById('perm-user').value;
  const target = document.getElementById('perm-target').value;
  
  if (user === target) { toast('Cannot grant access to own team (already has it)'); return; }
  
  const perms = getAccessPermissions();
  if (!perms[user]) perms[user] = [];
  if (!perms[user].includes(target)) {
    perms[user].push(target);
    saveAccessPermissions(perms);
    toast(`? ${ORG[user] ? ORG[user].name : user} can now view ${ORG[target] ? ORG[target].name : target}'s team`);
    showGrantAccessModal(); // Refresh modal
  } else {
    toast('Permission already exists');
  }
}

function revokeAccess(user, target) {
  const perms = getAccessPermissions();
  if (perms[user]) {
    perms[user] = perms[user].filter(t => t !== target);
    if (perms[user].length === 0) delete perms[user];
    saveAccessPermissions(perms);
    toast(`Revoked ${ORG[user] ? ORG[user].name : user}'s access to ${ORG[target] ? ORG[target].name : target}'s team`);
    showGrantAccessModal(); // Refresh modal
  }
}

// Add login display to header on load
(function initLoginDisplay() {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    const loginDiv = document.createElement('div');
    loginDiv.id = 'login-display';
    loginDiv.style.display = 'flex';
    loginDiv.style.alignItems = 'center';
    loginDiv.style.gap = '6px';
    headerActions.insertBefore(loginDiv, headerActions.firstChild);
    
    // Add permissions button
    const permBtn = document.createElement('button');
    permBtn.className = 'btn btn-s btn-sm';
    permBtn.innerHTML = '&#128274; Permissions';
    permBtn.onclick = showGrantAccessModal;
    headerActions.insertBefore(permBtn, loginDiv.nextSibling);
    
    setTimeout(updateLoginDisplay, 100);
  }
})();

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

  // Per-associate leave chart (who takes most leaves)
  var perAssociate = {};
  ics.forEach(function(a) { perAssociate[a] = {planned:0, unplanned:0, halfday:0, mandateOff:0, total:0}; });
  leaves.forEach(function(l) {
    if (!perAssociate[l.alias]) return;
    if (l.type === 'planned') perAssociate[l.alias].planned += l.days;
    else if (l.type === 'unplanned') perAssociate[l.alias].unplanned += l.days;
    else if (l.type === 'halfday') perAssociate[l.alias].halfday += l.days;
    else if (l.type === 'mandatory_off') perAssociate[l.alias].mandateOff += l.days;
    perAssociate[l.alias].total += l.days;
  });

  // Sort by total leaves (highest first)
  var sortedAssociates = Object.entries(perAssociate).sort(function(a,b){ return b[1].total - a[1].total; });
  var maxLeaves = sortedAssociates.length > 0 ? sortedAssociates[0][1].total : 1;
  if (maxLeaves === 0) maxLeaves = 1;

  h += '<div class="card"><h2>&#128101; Leave Per Associate (Who Takes Most Leaves)</h2>';
  h += '<div style="font-size:11px;margin-bottom:10px;display:flex;gap:12px">';
  h += '<span><span style="display:inline-block;width:10px;height:10px;background:#0073bb;border-radius:2px"></span> Planned</span>';
  h += '<span><span style="display:inline-block;width:10px;height:10px;background:#d13212;border-radius:2px"></span> Unplanned</span>';
  h += '<span><span style="display:inline-block;width:10px;height:10px;background:#ff9900;border-radius:2px"></span> Half-day</span>';
  h += '<span><span style="display:inline-block;width:10px;height:10px;background:#6b21a8;border-radius:2px"></span> Mandate Off</span>';
  h += '<span style="margin-left:auto;color:var(--danger)">&#9888; Red = High absenteeism (&gt;10 days)</span>';
  h += '</div>';

  sortedAssociates.forEach(function(entry) {
    var alias = entry[0];
    var d = entry[1];
    if (d.total === 0) return;
    var name = ORG[alias] ? ORG[alias].name : alias;
    var barWidth = (d.total / maxLeaves) * 100;
    var isHigh = d.total > 10;
    var borderColor = isHigh ? 'border-left:4px solid #d13212' : 'border-left:4px solid #1d8102';

    h += '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px 10px;background:#fafafa;border-radius:4px;' + borderColor + '">';
    h += '<div style="width:80px;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + name + '">' + alias + '</div>';
    h += '<div style="flex:1;height:22px;background:#eee;border-radius:3px;overflow:hidden;display:flex">';
    if (d.planned > 0) h += '<div style="width:' + (d.planned/maxLeaves*100) + '%;background:#0073bb;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700">' + (d.planned >= 2 ? d.planned : '') + '</div>';
    if (d.unplanned > 0) h += '<div style="width:' + (d.unplanned/maxLeaves*100) + '%;background:#d13212;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700">' + (d.unplanned >= 2 ? d.unplanned : '') + '</div>';
    if (d.halfday > 0) h += '<div style="width:' + (d.halfday/maxLeaves*100) + '%;background:#ff9900;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700">' + (d.halfday >= 1 ? d.halfday : '') + '</div>';
    if (d.mandateOff > 0) h += '<div style="width:' + (d.mandateOff/maxLeaves*100) + '%;background:#6b21a8;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700">' + (d.mandateOff >= 2 ? d.mandateOff : '') + '</div>';
    h += '</div>';
    h += '<div style="width:50px;text-align:right;font-size:12px;font-weight:700;color:' + (isHigh ? 'var(--danger)' : 'var(--text)') + '">' + d.total + ' d</div>';
    h += '</div>';
  });
  h += '</div>';

  return h;
}


// ========== INDIAN HOLIDAYS DATABASE (2025-2026) ==========
const INDIAN_HOLIDAYS = {
  1: [{ name: "New Year's Day", day: 1 }, { name: 'Makar Sankranti/Pongal', day: 14 }, { name: 'Republic Day', day: 26 }],
  2: [{ name: 'Maha Shivaratri', day: 15 }],
  3: [{ name: 'Holi', day: 4 }, { name: 'Id-ul-Fitr (Eid)', day: 21 }, { name: 'Ram Navami', day: 26 }, { name: 'Mahavir Jayanti', day: 31 }],
  4: [{ name: 'Good Friday', day: 3 }, { name: 'Ambedkar Jayanti', day: 14 }],
  5: [{ name: 'May Day/Buddha Purnima', day: 1 }, { name: 'Id-ul-Zuha (Bakrid)', day: 27 }],
  6: [{ name: 'Muharram', day: 26 }],
  7: [{ name: 'Rath Yatra', day: 16 }],
  8: [{ name: 'Independence Day', day: 15 }, { name: 'Id-e-Milad', day: 26 }, { name: 'Raksha Bandhan', day: 28 }],
  9: [{ name: 'Janmashtami', day: 4 }, { name: 'Ganesh Chaturthi', day: 14 }],
  10: [{ name: 'Gandhi Jayanti', day: 2 }, { name: 'Dussehra', day: 20 }, { name: 'Bathukamma', day: 13 }],
  11: [{ name: 'Diwali', day: 8 }, { name: 'Govardhan Puja', day: 9 }, { name: 'Bhai Dooj', day: 11 }, { name: 'Guru Nanak Jayanti', day: 24 }],
  12: [{ name: 'Christmas', day: 25 }]
};

function getLeaveForcastData(selMonth, selYear, teamSize) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const forecast = [];
  const leaves = getLeaves(state.mgr);

  for (let i = 1; i <= 3; i++) {
    const fMonthIdx = (selMonth + i) % 12;
    const fYear = (selMonth + i) > 11 ? selYear + 1 : selYear;
    const fMonthName = months[fMonthIdx];

    // Get holidays for this month
    const holidays = INDIAN_HOLIDAYS[fMonthIdx + 1] || [];
    const holidayStr = holidays.map(function(hol) {
      const d = new Date(fYear, fMonthIdx, hol.day);
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return hol.name + ' (' + days[d.getDay()] + ', ' + fMonthName.slice(0,3) + ' ' + hol.day + ')';
    }).join('; ');

    // Calculate likely leave patterns (long weekends, bridge days)
    const patterns = [];
    holidays.forEach(function(hol) {
      const d = new Date(fYear, fMonthIdx, hol.day);
      const dow = d.getDay(); // 0=Sun, 6=Sat
      const mn = fMonthName.slice(0,3);
      if (dow === 0) patterns.push(mn + ' ' + (hol.day-2) + '-' + hol.day + ' (Sat-Sun-Mon potential)');
      else if (dow === 1) patterns.push(mn + ' ' + (hol.day-2) + '-' + hol.day + ' (long weekend)');
      else if (dow === 5) patterns.push(mn + ' ' + hol.day + '-' + (hol.day+2) + ' (long weekend)');
      else if (dow === 6) patterns.push(mn + ' ' + hol.day + '-' + (hol.day+1) + ' (Sat-Sun)');
      else if (dow === 2) patterns.push(mn + ' ' + (hol.day-1) + '-' + hol.day + ' (bridge Mon)');
      else if (dow === 4) patterns.push(mn + ' ' + hol.day + '-' + (hol.day+1) + ' (bridge Fri)');
      else if (dow === 3) patterns.push(mn + ' ' + (hol.day-1) + '-' + (hol.day+1) + ' (mid-week break)');
    });

    // Calculate forecast % based on number of holidays and historical patterns
    // More holidays = higher leave probability
    let leavePct;
    if (holidays.length >= 4) leavePct = 30;
    else if (holidays.length >= 3) leavePct = 27;
    else if (holidays.length >= 2) leavePct = 24;
    else if (holidays.length >= 1) leavePct = 20;
    else leavePct = 18;

    // Check historical data for this month to refine
    const historicalKey = (selYear - 1) + '-' + String(fMonthIdx + 1).padStart(2, '0');
    const histLeaves = leaves.filter(function(l) { return l.from.startsWith(historicalKey); });
    if (histLeaves.length > 0) {
      const histDays = histLeaves.reduce(function(s, l) { return s + l.days; }, 0);
      const histPct = Math.round((histDays / (teamSize * 22)) * 100);
      // Blend historical with holiday-based estimate
      leavePct = Math.round((leavePct + histPct) / 2);
    }

    const workPct = 100 - leavePct;
    const empOnLeave = Math.round(teamSize * (leavePct / 100));

    forecast.push({
      month: fMonthName,
      workPct: workPct,
      leavePct: leavePct,
      formula: teamSize + ' \u00d7 ' + (leavePct / 100).toFixed(2),
      empOnLeave: empOnLeave,
      holidays: holidayStr,
      patterns: patterns.join('; ')
    });
  }
  return forecast;
}

// ========== FLASH EMAIL GENERATOR (FULLY AUTOMATED) ==========
function renderFlashEmail() {
  const mgr = state.mgr;
  const ics = getICs(mgr);
  const leaves = getLeaves(mgr);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();

  let h = '<div class="card">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<h2 style="margin:0">&#9993; MCE Flash Report</h2>';
  h += '<div style="display:flex;gap:8px;align-items:center">';
  h += '<select id="flash-month" onchange="autoGenerateFlash()" style="padding:6px 10px;border:1px solid var(--border);border-radius:4px;font-size:13px">';
  months.forEach((m, i) => { h += '<option value="' + i + '"' + (i === curMonth ? ' selected' : '') + '>' + m + '</option>'; });
  h += '</select>';
  h += '<select id="flash-year" onchange="autoGenerateFlash()" style="padding:6px 10px;border:1px solid var(--border);border-radius:4px;font-size:13px">';
  for (let y = curYear - 1; y <= curYear + 1; y++) { h += '<option value="' + y + '"' + (y === curYear ? ' selected' : '') + '>' + y + '</option>'; }
  h += '</select>';
  h += '<button class="btn btn-p" onclick="copyFlashEmail()">&#128203; Copy to Clipboard</button>';
  h += '<button class="btn btn-g" onclick="sendFlashEmail()">&#9993; Open in Email</button>';
  h += '</div></div>';
  h += '<div id="flash-output"></div>';
  h += '</div>';
  setTimeout(autoGenerateFlash, 50);
  return h;
}

function autoGenerateFlash() {
  const output = document.getElementById('flash-output');
  if (!output) return;
  output.innerHTML = buildFlashHTML();
}

function buildFlashHTML() {
  var mgr = state.mgr;
  var ics = getICs(mgr);
  var leaves = getLeaves(mgr);
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var TARGET = 20;

  var selMonth = parseInt(document.getElementById('flash-month').value);
  var selYear = parseInt(document.getElementById('flash-year').value);
  var monthName = months[selMonth];
  var teamSize = ics.length;
  var workDays = getWorkingDaysInMonth(selYear, selMonth);

  // Previous month
  var prevMonthIdx = (selMonth - 1 + 12) % 12;
  var prevYear = selMonth === 0 ? selYear - 1 : selYear;
  var prevMonthName = months[prevMonthIdx];
  var prevMonthKey = prevYear + '-' + String(prevMonthIdx + 1).padStart(2, '0');
  var prevWorkDays = getWorkingDaysInMonth(prevYear, prevMonthIdx);
  var prevTotalPersonDays = teamSize * prevWorkDays;

  // Weekly and MTD calculations
  var weeklyWorkDays = 5;
  // Calculate actual weeks in this month (Mon-Fri weeks)
  var firstDay = new Date(selYear, selMonth, 1);
  var lastDay = new Date(selYear, selMonth + 1, 0);
  var daysInMonth = lastDay.getDate();
  
  // Get ISO week number
  function getISOWeek(d) {
    var date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    var week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Find all unique weeks in this month
  var weeksInMonth = [];
  var weekWorkingDays = {};
  for (var d = 1; d <= daysInMonth; d++) {
    var dt = new Date(selYear, selMonth, d);
    var dow = dt.getDay();
    if (dow !== 0 && dow !== 6) { // Only working days (Mon-Fri)
      var wkNum = getISOWeek(dt);
      if (weeksInMonth.indexOf(wkNum) === -1) weeksInMonth.push(wkNum);
      if (!weekWorkingDays[wkNum]) weekWorkingDays[wkNum] = 0;
      weekWorkingDays[wkNum]++;
    }
  }
  var numWeeks = weeksInMonth.length;
  var mtdWorkDays = workDays; // actual working days in month
  var mtdPersonDays = teamSize * mtdWorkDays;

  // Current month key
  var monthKey = selYear + '-' + String(selMonth + 1).padStart(2, '0');
  var monthLeaves = leaves.filter(function(l) { return l.from.startsWith(monthKey); });

  function getWeekOfMonth(dateStr) {
    var dt = new Date(dateStr);
    return getISOWeek(dt);
  }

  // Build weekly breakdown using actual week numbers
  var weekData = {};
  weeksInMonth.forEach(function(wk) { weekData[wk] = {pl:0,ul:0,so:0}; });
  var personData = {};
  ics.forEach(function(a) { 
    personData[a] = {};
    weeksInMonth.forEach(function(wk) { personData[a][wk] = {pl:0,ul:0,so:0}; });
  });

  monthLeaves.forEach(function(l) {
    var fromDate = new Date(l.from);
    var toDate = l.to ? new Date(l.to) : fromDate;
    var current = new Date(fromDate);
    while (current <= toDate) {
      if (current.getMonth() === selMonth && current.getFullYear() === selYear && current.getDay() !== 0 && current.getDay() !== 6) {
        var wk = getISOWeek(current);
        if (weekData[wk]) {
          if (l.type === 'planned') { weekData[wk].pl++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].pl++; }
          else if (l.type === 'unplanned') { weekData[wk].ul++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].ul++; }
          else if (l.type === 'mandatory_off') { weekData[wk].so++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].so++; }
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });

  // Daily tracker site offs
  var tracker = db.dailyTracker[mgr] || {};
  ics.forEach(function(a) {
    if (tracker[a]) {
      Object.entries(tracker[a]).forEach(function(entry) {
        var date = entry[0], rec = entry[1];
        if (date.startsWith(monthKey) && rec.status === 'mandate_off') {
          var dt = new Date(date);
          if (dt.getDay() !== 0 && dt.getDay() !== 6) {
            var wk = getISOWeek(dt);
            if (weekData[wk]) {
              weekData[wk].so++;
              if (personData[a] && personData[a][wk]) personData[a][wk].so++;
            }
          }
        }
      });
    }
  });

  // Previous month totals
  var prevLeaves = leaves.filter(function(l) { return l.from.startsWith(prevMonthKey); });
  var prevPL = 0, prevUL = 0, prevSO = 0;
  prevLeaves.forEach(function(l) {
    if (l.type === 'planned') prevPL += l.days;
    else if (l.type === 'unplanned') prevUL += l.days;
    else if (l.type === 'mandatory_off') prevSO += l.days;
  });
  var prevOOTO = prevPL + prevUL + prevSO;

  // MTD totals
  var mtdPL = 0, mtdUL = 0, mtdSO = 0;
  weeksInMonth.forEach(function(wk) { mtdPL += weekData[wk].pl; mtdUL += weekData[wk].ul; mtdSO += weekData[wk].so; });
  var mtdOOTO = mtdPL + mtdUL + mtdSO;

  // Styles
  var bs = 'font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5;mso-line-height-rule:exactly;';
  var tc = 'border:1px solid #999;padding:3px 6px;text-align:center;' + bs;
  var th = tc + 'font-weight:bold;background:#d9e2f3;';
  var tl = 'border:1px solid #999;padding:3px 6px;text-align:left;' + bs;
  var tr = tc + 'color:#d13212;font-weight:bold;';
  var ts = 'border-collapse:collapse;width:100%;font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5;mso-line-height-rule:exactly;';

  function pctE(val, total) {
    var pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return pct > TARGET ? '<td style="' + tr + '">' + pct + '%</td>' : '<td style="' + tc + '">' + pct + '%</td>';
  }

  // ===== BUILD EMAIL HTML =====
  var h = '<div style="font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5;mso-line-height-rule:exactly;">';
  h += '<p style="font-family:Calibri,sans-serif;font-size:14pt;font-weight:bold;line-height:1.5;margin:0 0 4px;">MCE Flash | ' + monthName.toUpperCase() + '</p>';
  h += '<p style="' + bs + 'margin:0 0 12px;">Overview: This flash aims to provide the MCE Team Monthly Shrinkage Report covering Team Availability, People Availability for ' + monthName + ' MTD.</p>';
  h += '<p style="' + bs + 'margin:0 0 4px;"><b>Table of Contents:</b></p>';
  h += '<p style="' + bs + 'margin:0 0 16px;padding-left:16px;">1. Team Availability Report<br>2. People Availability Report<br>3. Leave Forecast Report<br>4. Callouts</p>';

  // TABLE 1
  h += '<p style="' + bs + 'font-weight:bold;margin:16px 0 6px;">Table 1: Team Availability Report</p>';
  h += '<table style="' + ts + '">';
  h += '<tr><td style="' + th + '">#</td><td style="' + th + 'text-align:left;">Available Days</td>';
  h += '<td style="' + th + '">' + prevMonthName + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + th + '">WK ' + wk + '</td>'; });
  h += '<td style="' + th + '">MTD</td><td style="' + th + '">Vs Target</td></tr>';

  // Row 1: Persons
  h += '<tr><td style="' + tc + '">1</td><td style="' + tl + '">Total Persons (A)</td>';
  h += '<td style="' + tc + '">' + teamSize + '</td>';
  weeksInMonth.forEach(function() { h += '<td style="' + tc + '">' + teamSize + '</td>'; });
  h += '<td style="' + tc + '">' + teamSize + '</td><td style="' + tc + '">-</td></tr>';

  // Row 2: Working Days
  h += '<tr><td style="' + tc + '">2</td><td style="' + tl + '">Total Working Days (B)</td>';
  h += '<td style="' + tc + '">' + prevWorkDays + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + weekWorkingDays[wk] + '</td>'; });
  h += '<td style="' + tc + '">' + mtdWorkDays + '</td><td style="' + tc + '">-</td></tr>';

  // Row 3: Person Days
  h += '<tr><td style="' + tc + '">3</td><td style="' + tl + '">Total Available Person Days (A*B)=(C)</td>';
  h += '<td style="' + tc + '">' + prevTotalPersonDays + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + (teamSize * weekWorkingDays[wk]) + '</td>'; });
  h += '<td style="' + tc + '">' + mtdPersonDays + '</td><td style="' + tc + '">-</td></tr>';

  // Row 4: OOTO
  var wkOOTO = [];
  weeksInMonth.forEach(function(wk) { wkOOTO.push(weekData[wk].pl + weekData[wk].ul + weekData[wk].so); });
  h += '<tr><td style="' + tc + '">4</td><td style="' + tl + 'font-weight:bold;">Total OOTO Person Days (D)</td>';
  h += '<td style="' + tc + '">' + prevOOTO + '</td>';
  wkOOTO.forEach(function(v) { h += '<td style="' + tc + '">' + v + '</td>'; });
  h += '<td style="' + tc + '">' + mtdOOTO + '</td><td style="' + tc + '">-</td></tr>';

  // Sub-rows
  h += '<tr><td style="' + tc + '"></td><td style="' + tl + 'padding-left:20px;">i.) Planned Leaves</td>';
  h += '<td style="' + tc + '">' + prevPL + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + weekData[wk].pl + '</td>'; });
  h += '<td style="' + tc + '">' + mtdPL + '</td><td style="' + tc + '">-</td></tr>';

  h += '<tr><td style="' + tc + '"></td><td style="' + tl + 'padding-left:20px;">ii.) Unplanned Leaves</td>';
  h += '<td style="' + tc + '">' + prevUL + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + weekData[wk].ul + '</td>'; });
  h += '<td style="' + tc + '">' + mtdUL + '</td><td style="' + tc + '">-</td></tr>';

  h += '<tr><td style="' + tc + '"></td><td style="' + tl + 'padding-left:20px;">iii.) Site Offs/Optional Offs</td>';
  h += '<td style="' + tc + '">' + prevSO + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + weekData[wk].so + '</td>'; });
  h += '<td style="' + tc + '">' + mtdSO + '</td><td style="' + tc + '">-</td></tr>';

  // Row 5: Shrinkage %
  h += '<tr style="background:#fff2cc;"><td style="' + tc + 'font-weight:bold;">5</td><td style="' + tl + 'font-weight:bold;">OOTO Shrinkage% (D/C)</td>';
  h += pctE(prevOOTO, prevTotalPersonDays);
  weeksInMonth.forEach(function(wk, idx) { h += pctE(wkOOTO[idx], teamSize * weekWorkingDays[wk]); });
  h += pctE(mtdOOTO, mtdPersonDays);
  h += '<td style="' + tc + 'font-weight:bold;">' + TARGET + '%</td></tr>';
  h += '</table>';

  // LEGEND
  h += '<p style="' + bs + 'margin:12px 0 4px;font-size:9pt;color:#545b64;"><b>Note:</b> PL - Planned Leave | UL - Unplanned Leave | SO - Site Off</p>';

  // TABLE 2: People Availability
  h += '<p style="' + bs + 'font-weight:bold;margin:20px 0 6px;">Table 2: People Availability Report</p>';
  h += '<table style="' + ts + '">';
  h += '<tr><td style="' + th + '" rowspan="2">Login</td>';
  h += '<td style="' + th + '" colspan="3">' + prevMonthName + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + th + '" colspan="3">WK ' + wk + '</td>'; });
  h += '<td style="' + th + '" colspan="3">MTD</td></tr>';
  h += '<tr>';
  for (var c = 0; c < numWeeks + 2; c++) h += '<td style="' + th + '">PL</td><td style="' + th + '">UL</td><td style="' + th + '">SO</td>';
  h += '</tr>';

  var totRow = {prev:{pl:0,ul:0,so:0},mtd:{pl:0,ul:0,so:0}};
  weeksInMonth.forEach(function(wk) { totRow[wk] = {pl:0,ul:0,so:0}; });

  ics.forEach(function(a) {
    var prevPersonLeaves = prevLeaves.filter(function(l) { return l.alias === a; });
    var pPL = 0, pUL = 0, pSO = 0;
    prevPersonLeaves.forEach(function(l) {
      if (l.type === 'planned') pPL += l.days;
      else if (l.type === 'unplanned') pUL += l.days;
      else if (l.type === 'mandatory_off') pSO += l.days;
    });
    var pd = personData[a];
    var mPL = 0, mUL = 0, mSO = 0;
    weeksInMonth.forEach(function(wk) { mPL += pd[wk].pl; mUL += pd[wk].ul; mSO += pd[wk].so; });

    totRow.prev.pl+=pPL; totRow.prev.ul+=pUL; totRow.prev.so+=pSO;
    weeksInMonth.forEach(function(wk) { totRow[wk].pl+=pd[wk].pl; totRow[wk].ul+=pd[wk].ul; totRow[wk].so+=pd[wk].so; });
    totRow.mtd.pl+=mPL; totRow.mtd.ul+=mUL; totRow.mtd.so+=mSO;

    h += '<tr><td style="' + tl + 'font-weight:bold;">' + a + '</td>';
    h += '<td style="' + tc + '">' + pPL + '</td><td style="' + tc + '">' + pUL + '</td><td style="' + tc + '">' + pSO + '</td>';
    weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + pd[wk].pl + '</td><td style="' + tc + '">' + pd[wk].ul + '</td><td style="' + tc + '">' + pd[wk].so + '</td>'; });
    h += '<td style="' + tc + '">' + mPL + '</td><td style="' + tc + '">' + mUL + '</td><td style="' + tc + '">' + mSO + '</td></tr>';
  });

  // Totals row
  h += '<tr style="background:#d9e2f3;font-weight:bold;"><td style="' + tl + 'font-weight:bold;">Total</td>';
  h += '<td style="' + tc + '">' + totRow.prev.pl + '</td><td style="' + tc + '">' + totRow.prev.ul + '</td><td style="' + tc + '">' + totRow.prev.so + '</td>';
  weeksInMonth.forEach(function(wk) { h += '<td style="' + tc + '">' + totRow[wk].pl + '</td><td style="' + tc + '">' + totRow[wk].ul + '</td><td style="' + tc + '">' + totRow[wk].so + '</td>'; });
  h += '<td style="' + tc + '">' + totRow.mtd.pl + '</td><td style="' + tc + '">' + totRow.mtd.ul + '</td><td style="' + tc + '">' + totRow.mtd.so + '</td></tr>';
  h += '</table>';

  // TABLE 3: Leave Forecast
  var forecast = getLeaveForcastData(selMonth, selYear, teamSize);
  h += '<p style="' + bs + 'font-weight:bold;margin:20px 0 6px;">Table 3: Leave Forecast Report</p>';
  h += '<table style="' + ts + '">';
  h += '<tr><td style="' + th + '">Month</td><td style="' + th + '">Working %</td><td style="' + th + '">Leave %</td><td style="' + th + '">Formula</td><td style="' + th + '">Emp on Leave</td><td style="' + th + '">Key Holidays</td><td style="' + th + '">Likely Leave Pattern</td></tr>';
  forecast.forEach(function(f) {
    var lpStyle = f.leavePct > 20 ? tr : tc;
    h += '<tr><td style="' + tc + '">' + f.month + '</td><td style="' + tc + '">' + f.workPct + '%</td><td style="' + lpStyle + '">' + f.leavePct + '%</td><td style="' + tc + '">' + f.formula + '</td><td style="' + tc + '">~' + f.empOnLeave + '</td><td style="' + tl + 'font-size:9pt;">' + f.holidays + '</td><td style="' + tl + 'font-size:9pt;">' + f.patterns + '</td></tr>';
  });
  h += '</table>';
  h += '<p style="' + bs + 'font-size:9pt;color:#666;margin:4px 0 16px;">Note: Leave Forecast based on Indian festivals and historical trends. Saturday and Sunday weekly off.</p>';

  // CALLOUTS
  h += '<p style="' + bs + 'font-weight:bold;margin:16px 0 6px;">4. Callouts:</p>';
  h += '<ol style="' + bs + 'margin:0 0 12px 20px;padding:0;">';
  weeksInMonth.forEach(function(wk, idx) {
    var wTotal = weekData[wk].pl + weekData[wk].ul + weekData[wk].so;
    if (wTotal > 0) {
      var parts = [];
      if (weekData[wk].pl > 0) parts.push(weekData[wk].pl + ' planned leaves');
      if (weekData[wk].ul > 0) parts.push(weekData[wk].ul + ' sick leaves');
      if (weekData[wk].so > 0) parts.push(weekData[wk].so + ' optional offs');
      h += '<li>In WK ' + wk + ', ' + wTotal + ' productivity days were lost due to ' + parts.join(' and ') + '.</li>';
    }
  });
  h += '</ol>';

  // Contact
  h += '<p style="' + bs + 'margin:12px 0;">For any questions/concerns, please reach out to @KOTHA, SHARAN  @Gannamraju, Akhila</p>';
  h += '<p style="' + bs + '"margin:16px 0 4px;">Regards,</p>';
  h += '<p style="' + bs + '"font-weight:bold;margin:0;">Akhila Gannamraju</p>';
  h += '</div>';
  return h;
}

function getWorkingDaysInMonth(year, month) {
  var count = 0;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  for (var d = 1; d <= daysInMonth; d++) {
    var day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function copyFlashEmail() {
  var output = document.getElementById('flash-output');
  if (!output || !output.innerHTML.trim()) { toast('No flash report to copy!'); return; }
  // Copy as rich HTML so it pastes with formatting in Outlook
  var wrapStyle = '<html><head><style>body,p,td,th,div,span,li{font-family:Calibri,sans-serif !important;font-size:10pt !important;line-height:1.5 !important;}table{font-family:Calibri,sans-serif !important;font-size:10pt !important;line-height:1.5 !important;border-collapse:collapse;}</style></head><body style="font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5;">';
  var htmlContent = wrapStyle + output.innerHTML + '</body></html>';
  var blob = new Blob([htmlContent], { type: 'text/html' });
  var plainBlob = new Blob([output.innerText], { type: 'text/plain' });
  var clipboardItem = new ClipboardItem({
    'text/html': blob,
    'text/plain': plainBlob
  });
  navigator.clipboard.write([clipboardItem]).then(function() {
    toast('Flash report copied with formatting! Paste in Outlook.');
  }).catch(function() {
    // Fallback: copy plain text
    navigator.clipboard.writeText(output.innerText).then(function() {
      toast('Copied as plain text (rich copy not supported in this browser)');
    });
  });
}


function sendFlashEmail() {
  var output = document.getElementById('flash-output');
  if (!output || !output.innerHTML.trim()) { toast('No flash report to send!'); return; }
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var selMonth = parseInt(document.getElementById('flash-month').value);
  var subject = 'MCE Flash | ' + months[selMonth].toUpperCase() + ' - Monthly Shrinkage Report';

  // Get the manager's email
  var mgr = state.mgr;
  var mgrInfo = ORG[mgr];
  var mgrEmail = mgr + '@amazon.com';
  var mgrMgr = mgrInfo && mgrInfo.mgr ? mgrInfo.mgr + '@amazon.com' : '';

  // Copy rich HTML to clipboard
  var htmlContent = output.innerHTML;
  var blob = new Blob([htmlContent], { type: 'text/html' });
  var plainBlob = new Blob([output.innerText], { type: 'text/plain' });
  var clipboardItem = new ClipboardItem({ 'text/html': blob, 'text/plain': plainBlob });
  navigator.clipboard.write([clipboardItem]).then(function() {
    // Open email client with To, CC, Subject pre-filled
    var mailto = 'mailto:' + mgrEmail + '?subject=' + encodeURIComponent(subject);
    if (mgrMgr) mailto += '&cc=' + mgrMgr;
    window.location.href = mailto;
    toast('Email opened for ' + (mgrInfo ? mgrInfo.name : mgr) + '. Press Ctrl+V to paste report.');
  }).catch(function() {
    // Fallback: open with plain text body
    var body = buildFlashPlainText();
    var mailto = 'mailto:' + mgrEmail + '?subject=' + encodeURIComponent(subject);
    if (mgrMgr) mailto += '&cc=' + mgrMgr;
    mailto += '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
    toast('Email opened for ' + (mgrInfo ? mgrInfo.name : mgr));
  });
}

function buildFlashPlainText() {
  var mgr = state.mgr;
  var ics = getICs(mgr);
  var leaves = getLeaves(mgr);
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var TARGET = 20;
  var selMonth = parseInt(document.getElementById('flash-month').value);
  var selYear = parseInt(document.getElementById('flash-year').value);
  var monthName = months[selMonth];
  var teamSize = ics.length;
  var workDays = getWorkingDaysInMonth(selYear, selMonth);
  var prevMonthIdx = (selMonth - 1 + 12) % 12;
  var prevYear = selMonth === 0 ? selYear - 1 : selYear;
  var prevMonthName = months[prevMonthIdx];
  var prevMonthKey = prevYear + '-' + String(prevMonthIdx + 1).padStart(2, '0');
  var prevWorkDays = getWorkingDaysInMonth(prevYear, prevMonthIdx);
  var prevTotalPersonDays = teamSize * prevWorkDays;
  var monthKey = selYear + '-' + String(selMonth + 1).padStart(2, '0');
  var monthLeaves = leaves.filter(function(l) { return l.from.startsWith(monthKey); });

  function getISOWeek(d) {
    var date = new Date(d.getTime()); date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    var week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  var daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  var weeksInMonth = [], weekWorkingDays = {};
  for (var d = 1; d <= daysInMonth; d++) {
    var dt = new Date(selYear, selMonth, d);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) {
      var wkNum = getISOWeek(dt);
      if (weeksInMonth.indexOf(wkNum) === -1) weeksInMonth.push(wkNum);
      if (!weekWorkingDays[wkNum]) weekWorkingDays[wkNum] = 0;
      weekWorkingDays[wkNum]++;
    }
  }
  var mtdWorkDays = workDays;
  var mtdPersonDays = teamSize * mtdWorkDays;

  var weekData = {};
  weeksInMonth.forEach(function(wk) { weekData[wk] = {pl:0,ul:0,so:0}; });
  var personData = {};
  ics.forEach(function(a) { personData[a] = {}; weeksInMonth.forEach(function(wk) { personData[a][wk] = {pl:0,ul:0,so:0}; }); });

  monthLeaves.forEach(function(l) {
    var current = new Date(l.from);
    var toDate = l.to ? new Date(l.to) : new Date(l.from);
    while (current <= toDate) {
      if (current.getMonth() === selMonth && current.getFullYear() === selYear && current.getDay() !== 0 && current.getDay() !== 6) {
        var wk = getISOWeek(current);
        if (weekData[wk]) {
          if (l.type === 'planned') { weekData[wk].pl++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].pl++; }
          else if (l.type === 'unplanned') { weekData[wk].ul++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].ul++; }
          else if (l.type === 'mandatory_off') { weekData[wk].so++; if (personData[l.alias] && personData[l.alias][wk]) personData[l.alias][wk].so++; }
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });

  var tracker = db.dailyTracker[mgr] || {};
  ics.forEach(function(a) {
    if (tracker[a]) { Object.entries(tracker[a]).forEach(function(entry) {
      if (entry[0].startsWith(monthKey) && entry[1].status === 'mandate_off') {
        var dt2 = new Date(entry[0]);
        if (dt2.getDay() !== 0 && dt2.getDay() !== 6) { var wk = getISOWeek(dt2); if (weekData[wk]) { weekData[wk].so++; if (personData[a] && personData[a][wk]) personData[a][wk].so++; } }
      }
    }); }
  });

  var prevLeaves = leaves.filter(function(l) { return l.from.startsWith(prevMonthKey); });
  var prevPL = 0, prevUL = 0, prevSO = 0;
  prevLeaves.forEach(function(l) { if (l.type === 'planned') prevPL += l.days; else if (l.type === 'unplanned') prevUL += l.days; else if (l.type === 'mandatory_off') prevSO += l.days; });
  var prevOOTO = prevPL + prevUL + prevSO;
  var mtdPL = 0, mtdUL = 0, mtdSO = 0;
  weeksInMonth.forEach(function(wk) { mtdPL += weekData[wk].pl; mtdUL += weekData[wk].ul; mtdSO += weekData[wk].so; });
  var mtdOOTO = mtdPL + mtdUL + mtdSO;

  function pct(v, t) { return t > 0 ? Math.round((v/t)*100) + '%' : '0%'; }
  var S = '\t';

  var t = 'MCE Flash | ' + monthName.toUpperCase() + '\n\n';
  t += 'Overview: MCE Team Monthly Shrinkage Report - Team Availability, People Availability for ' + monthName + ' MTD.\n\n';

  // Table 1
  t += 'Table 1: Team Availability Report\n\n';
  t += '#' + S + 'Available Days' + S + prevMonthName;
  weeksInMonth.forEach(function(wk) { t += S + 'WK ' + wk; });
  t += S + 'MTD' + S + 'Vs Target\n';

  t += '1' + S + 'Total Persons (A)' + S + teamSize;
  weeksInMonth.forEach(function() { t += S + teamSize; });
  t += S + teamSize + S + '-\n';

  t += '2' + S + 'Total Working Days (B)' + S + prevWorkDays;
  weeksInMonth.forEach(function(wk) { t += S + weekWorkingDays[wk]; });
  t += S + mtdWorkDays + S + '-\n';

  t += '3' + S + 'Total Available Person Days (A*B)=(C)' + S + prevTotalPersonDays;
  weeksInMonth.forEach(function(wk) { t += S + (teamSize * weekWorkingDays[wk]); });
  t += S + mtdPersonDays + S + '-\n';

  var wkOOTO = weeksInMonth.map(function(wk) { return weekData[wk].pl + weekData[wk].ul + weekData[wk].so; });
  t += '4' + S + 'Total OOTO Person Days (D)' + S + prevOOTO;
  wkOOTO.forEach(function(v) { t += S + v; });
  t += S + mtdOOTO + S + '-\n';

  t += ' ' + S + 'i.) Planned Leaves' + S + prevPL;
  weeksInMonth.forEach(function(wk) { t += S + weekData[wk].pl; });
  t += S + mtdPL + S + '-\n';

  t += ' ' + S + 'ii.) Unplanned Leaves' + S + prevUL;
  weeksInMonth.forEach(function(wk) { t += S + weekData[wk].ul; });
  t += S + mtdUL + S + '-\n';

  t += ' ' + S + 'iii.) Site Offs/Optional Offs' + S + prevSO;
  weeksInMonth.forEach(function(wk) { t += S + weekData[wk].so; });
  t += S + mtdSO + S + '-\n';

  t += '5' + S + 'OOTO Shrinkage% (D/C)' + S + pct(prevOOTO, prevTotalPersonDays);
  weeksInMonth.forEach(function(wk, i) { t += S + pct(wkOOTO[i], teamSize * weekWorkingDays[wk]); });
  t += S + pct(mtdOOTO, mtdPersonDays) + S + TARGET + '%\n';

  // Table 2
  t += '\n\nTable 2: People Availability Report\n\n';
  t += 'Login' + S + 'PL' + S + 'UL' + S + 'SO';
  weeksInMonth.forEach(function(wk) { t += S + 'PL' + S + 'UL' + S + 'SO'; });
  t += S + 'PL' + S + 'UL' + S + 'SO\n';

  ics.forEach(function(a) {
    var pp = prevLeaves.filter(function(l) { return l.alias === a; });
    var pPL=0, pUL=0, pSO=0;
    pp.forEach(function(l) { if (l.type==='planned') pPL+=l.days; else if (l.type==='unplanned') pUL+=l.days; else if (l.type==='mandatory_off') pSO+=l.days; });
    var pd = personData[a];
    var mPL=0, mUL=0, mSO=0;
    weeksInMonth.forEach(function(wk) { mPL+=pd[wk].pl; mUL+=pd[wk].ul; mSO+=pd[wk].so; });
    t += a + S + pPL + S + pUL + S + pSO;
    weeksInMonth.forEach(function(wk) { t += S + pd[wk].pl + S + pd[wk].ul + S + pd[wk].so; });
    t += S + mPL + S + mUL + S + mSO + '\n';
  });

  // Callouts
  t += '\n\n4. Callouts:\n\n';
  var cn = 1;
  weeksInMonth.forEach(function(wk) {
    var wT = weekData[wk].pl + weekData[wk].ul + weekData[wk].so;
    if (wT > 0) {
      var p = [];
      if (weekData[wk].pl > 0) p.push(weekData[wk].pl + ' planned leaves');
      if (weekData[wk].ul > 0) p.push(weekData[wk].ul + ' sick leaves');
      if (weekData[wk].so > 0) p.push(weekData[wk].so + ' optional offs');
      t += cn + '. In WK ' + wk + ', ' + wT + ' productivity days lost due to ' + p.join(' and ') + '.\n';
      cn++;
    }
  });

  t += '\nFor any questions/concerns, please reach out to @KOTHA, SHARAN  @Gannamraju, Akhila';
  t += '\n\nRegards,\nAkhila Gannamraju';
  return t;
}

// ========== WBR (Weekly Business Review) ==========
function renderWBR() {
  var mgr = state.mgr;
  var ics = getICs(mgr);
  var info = ORG[mgr];
  
  // Get current week number
  var today = new Date();
  var startOfYear = new Date(today.getFullYear(), 0, 1);
  var weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  var weekKey = today.getFullYear() + '-W' + weekNum;
  
  // Initialize WBR data in db
  if (!db.wbr) db.wbr = {};
  if (!db.wbr[mgr]) db.wbr[mgr] = {};
  if (!db.wbr[mgr][weekKey]) db.wbr[mgr][weekKey] = {};

  var h = '<div class="card">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  h += '<h2 style="margin:0">&#128221; Weekly Business Review (WBR)</h2>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn btn-p" onclick="generateTeamWBR()">&#128196; Generate Team WBR</button>';
  h += '<button class="btn btn-g" onclick="sendWBRReminders()">&#128232; Send Reminders</button>';
  h += '</div></div>';

  // Week selector
  h += '<div style="margin-bottom:16px;font-size:13px;color:var(--muted)">Week ' + weekNum + ' (' + getWeekDateRange(today) + ')</div>';

  // Status overview - who has updated
  var updatedCount = 0;
  var notUpdated = [];
  ics.forEach(function(a) {
    if (db.wbr[mgr][weekKey] && db.wbr[mgr][weekKey][a] && db.wbr[mgr][weekKey][a].tasks && db.wbr[mgr][weekKey][a].tasks.length > 0) {
      updatedCount++;
    } else {
      notUpdated.push(a);
    }
  });

  h += '<div class="stats">';
  h += '<div class="stat green"><div class="val">' + updatedCount + '/' + ics.length + '</div><div class="lbl">Updated</div></div>';
  h += '<div class="stat ' + (notUpdated.length > 0 ? 'red' : 'green') + '"><div class="val">' + notUpdated.length + '</div><div class="lbl">Pending</div></div>';
  h += '<div class="stat"><div class="val">' + Math.round((updatedCount/ics.length)*100) + '%</div><div class="lbl">Completion</div></div>';
  h += '</div>';

  // Not updated list with reminder
  if (notUpdated.length > 0) {
    h += '<div style="background:#fce9e6;border:1px solid #f5c6c0;border-radius:6px;padding:12px;margin-bottom:16px;font-size:12px">';
    h += '<strong style="color:var(--danger)">&#9888; Not Updated:</strong> ';
    h += notUpdated.map(function(a) { return '<span style="font-weight:600">' + a + '</span>'; }).join(', ');
    h += '</div>';
  }

  
    // WBR Data-Driven Narrative Email Section
  h += '<hr style="margin:20px 0;border:none;border-top:2px solid var(--border)">';
  h += renderWBRDataSection();
  return h;
}

function getWeekDateRange(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  var monday = new Date(d.setDate(diff));
  var friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[monday.getMonth()] + ' ' + monday.getDate() + ' - ' + months[friday.getMonth()] + ' ' + friday.getDate();
}

function saveWBREntry() {
  var mgr = state.mgr;
  var today = new Date();
  var startOfYear = new Date(today.getFullYear(), 0, 1);
  var weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  var weekKey = today.getFullYear() + '-W' + weekNum;
  var alias = document.getElementById('wbr-user').value;
  var date = document.getElementById('wbr-date').value;
  var program = document.getElementById('wbr-program').value;
  var subProgram = document.getElementById('wbr-subprogram').value;
  var tasks = document.getElementById('wbr-tasks').value.trim().split('\n').filter(function(t) { return t.trim(); });
  var timeSpent = parseFloat(document.getElementById('wbr-timespent').value) || 8;
  var availability = document.getElementById('wbr-availability').value;

  if (tasks.length === 0 && availability.indexOf('leave') === -1 && availability !== 'site_off') { toast('Please enter at least one callout/activity!'); return; }

  if (!db.wbr) db.wbr = {};
  if (!db.wbr[mgr]) db.wbr[mgr] = {};
  if (!db.wbr[mgr][weekKey]) db.wbr[mgr][weekKey] = {};
  
  // Store per date (not just per week) for daily tracking
  if (!db.wbr[mgr][weekKey][alias]) db.wbr[mgr][weekKey][alias] = { entries: [] };
  db.wbr[mgr][weekKey][alias].entries.push({
    date: date, target: parseInt(document.getElementById('wbr-target').value) || 0, actual: parseInt(document.getElementById('wbr-actual').value) || 0, shrinkage: document.getElementById('wbr-shrinkage').value, hc: parseFloat(document.getElementById('wbr-hc').value) || 1,
    program: program,
    subProgram: subProgram,
    tasks: tasks,
    timeSpent: timeSpent,
    availability: availability,
    updatedAt: new Date().toISOString()
  });
  // Keep backward compatibility
  db.wbr[mgr][weekKey][alias].tasks = tasks;
  db.wbr[mgr][weekKey][alias].availability = availability;
  
  save();
  toast((ORG[alias] ? ORG[alias].name : alias) + "'s update saved for " + date + "!");
  render();
}

function generateTeamWBR() {
  var mgr = state.mgr;
  var ics = getICs(mgr);
  var info = ORG[mgr];
  var today = new Date();
  var startOfYear = new Date(today.getFullYear(), 0, 1);
  var weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  var weekKey = today.getFullYear() + '-W' + weekNum;
  var weekRange = getWeekDateRange(today);
  var entries = db.wbr && db.wbr[mgr] && db.wbr[mgr][weekKey] ? db.wbr[mgr][weekKey] : {};

  var subject = 'WBR - ' + info.name + "'s Team - Week " + weekNum + ' (' + weekRange + ')';
  var body = 'WEEKLY BUSINESS REVIEW\n';
  body += 'Team: ' + info.name + ' | Week ' + weekNum + ' (' + weekRange + ')\n';
  body += '-----------------------------------------------\n\n';

  // Aggregate metrics
  var totalTarget = 0, totalActual = 0, totalHC = 0, shrinkageDays = 0, utilizedDays = 0;
  var programStats = {};
  var personStats = [];

  ics.forEach(function(a) {
    var name = ORG[a] ? ORG[a].name : a;
    var pTarget = 0, pActual = 0, pShrinkage = 0, pUtilized = 0, pPrograms = [];
    if (entries[a] && entries[a].entries) {
      entries[a].entries.forEach(function(e) {
        pTarget += (e.target || 0);
        pActual += (e.actual || 0);
        if (e.shrinkage && e.shrinkage !== 'NA') { pShrinkage += (e.hc || 1); shrinkageDays += (e.hc || 1); }
        else { pUtilized += (e.hc || 1); utilizedDays += (e.hc || 1); }
        totalHC += (e.hc || 1);
        if (e.program && pPrograms.indexOf(e.program) === -1) pPrograms.push(e.program);
        if (e.program) {
          if (!programStats[e.program]) programStats[e.program] = { target: 0, actual: 0, hc: 0, people: [] };
          programStats[e.program].target += (e.target || 0);
          programStats[e.program].actual += (e.actual || 0);
          programStats[e.program].hc += (e.hc || 1);
          if (programStats[e.program].people.indexOf(a) === -1) programStats[e.program].people.push(a);
        }
      });
    }
    totalTarget += pTarget;
    totalActual += pActual;
    personStats.push({ alias: a, name: name, target: pTarget, actual: pActual, shrinkage: pShrinkage, utilized: pUtilized, programs: pPrograms, hasData: !!(entries[a] && entries[a].entries && entries[a].entries.length > 0) });
  });

  var productivity = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  var shrinkagePct = totalHC > 0 ? Math.round((shrinkageDays / totalHC) * 100) : 0;
  var backlog = totalTarget - totalActual;

  // SUMMARY
  body += 'SUMMARY\n';
  body += '-----------------------------------------------\n';
  body += 'Total HC Days: ' + totalHC.toFixed(1) + ' | Utilized: ' + utilizedDays.toFixed(1) + ' | Shrinkage: ' + shrinkageDays.toFixed(1) + ' (' + shrinkagePct + '%)\n';
  body += 'Target: ' + totalTarget + ' | Actual: ' + totalActual + ' | Productivity: ' + productivity + '%\n';
  body += 'Backlog: ' + (backlog > 0 ? backlog : 0) + '\n';
  body += 'Reported: ' + personStats.filter(function(p) { return p.hasData; }).length + '/' + ics.length + '\n\n';

  // PROGRAM-WISE BREAKDOWN
  body += 'PROGRAM-WISE BREAKDOWN\n';
  body += '-----------------------------------------------\n';
  Object.keys(programStats).forEach(function(prog) {
    var s = programStats[prog];
    var pProd = s.target > 0 ? Math.round((s.actual / s.target) * 100) : 0;
    body += prog + ': ' + s.people.length + ' people | Target: ' + s.target + ' | Actual: ' + s.actual + ' | ' + pProd + '% productivity\n';
  });
  body += '\n';

  // PER PERSON BREAKDOWN
  body += 'INDIVIDUAL PERFORMANCE\n';
  body += '-----------------------------------------------\n';
  personStats.forEach(function(p) {
    if (p.hasData) {
      var pProd = p.target > 0 ? Math.round((p.actual / p.target) * 100) : 0;
      var flag = pProd < 70 ? ' [LOW]' : '';
      body += p.name + ' (' + p.alias + '): Target ' + p.target + ' | Actual ' + p.actual + ' | ' + pProd + '%' + flag;
      if (p.shrinkage > 0) body += ' | Shrinkage: ' + p.shrinkage.toFixed(1) + ' days';
      body += ' | Programs: ' + p.programs.join(', ') + '\n';
    } else {
      body += p.name + ' (' + p.alias + '): NOT SUBMITTED\n';
    }
  });

  // ALERTS
  var alerts = [];
  personStats.forEach(function(p) {
    if (!p.hasData) alerts.push(p.name + ' - not submitted');
    else if (p.target > 0 && (p.actual / p.target) < 0.7) alerts.push(p.name + ' - productivity below 70% (' + Math.round((p.actual/p.target)*100) + '%)');
  });
  if (alerts.length > 0) {
    body += '\nALERTS\n';
    body += '-----------------------------------------------\n';
    alerts.forEach(function(a) { body += '! ' + a + '\n'; });
  }

  body += '\n\n---\nGenerated by WBR Dashboard | ' + new Date().toLocaleDateString();

  // Open email
  var mgrMgr = info.mgr ? info.mgr + '@amazon.com' : '';
  var mailto = 'mailto:' + mgrMgr + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  window.location.href = mailto;
  toast('WBR email generated with metrics for ' + ics.length + ' associates');
}


// ========== WBR DATA-DRIVEN EMAIL GENERATOR ==========
// Paste SharePoint data -> Aggregate by week/program -> Generate narrative WBR email
var wbrParsedData = [];
var wbrWeekFilter = '';
var wbrProgFilter = '';

function renderWBRDataSection() {
  var hasData = wbrParsedData.length > 0;
  var h = '<div class="card">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">';
  h += '<h2 style="margin:0">&#128232; WBR Narrative Email Generator</h2>';
  if (hasData) h += '<button class="btn btn-p" onclick="generateWBRNarrativeEmail()">&#128228; Generate Narrative Email</button>';
  h += '</div>';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Paste your SharePoint weekly data (tab-separated). Generates a manager-style narrative WBR email ready for Outlook (Calibri 10pt, 1.5 spacing).</p>';

  // Tabs: Paste / Upload
  h += '<div class="tabs" style="margin-bottom:12px"><div class="tab active" onclick="wbrDataTab(\'paste\',this)">Paste Data</div><div class="tab" onclick="wbrDataTab(\'upload\',this)">Upload CSV</div></div>';
  h += '<div id="wbr-data-input">';
  h += '<textarea id="wbr-data-paste" rows="8" style="width:100%;font-family:Consolas,monospace;font-size:11px;padding:10px;border:1px solid var(--border);border-radius:6px;resize:vertical" placeholder="Paste tab-separated data from SharePoint here...\nColumns: Login, HC, WK, Date, Program, Sub-Program, HC Utilization, Shrinkage Type, Target, Actual, Inflow, Backlog of the day, Comments"></textarea>';
  h += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">';
  h += '<button class="btn btn-p" onclick="parseWBRSheetData()">Parse & Load</button>';
  h += '<button class="btn btn-s" onclick="loadWBRSampleData()">Load Sample</button>';
  h += '<span id="wbr-data-status" style="font-size:12px;color:var(--muted)"></span>';
  h += '</div></div>';
  h += '</div>';

  if (hasData) {
    var agg = aggregateWBRData(getFilteredWBRData());
    var achPct = agg.totalTarget > 0 ? ((agg.totalAudits / agg.totalTarget) * 100).toFixed(1) : 0;

    // Stats
    h += '<div class="stats">';
    h += '<div class="stat"><div class="val">' + agg.uniqueAssociates + '</div><div class="lbl">Associates</div></div>';
    h += '<div class="stat green"><div class="val">' + agg.totalAudits.toLocaleString() + '</div><div class="lbl">Total Actuals</div></div>';
    h += '<div class="stat"><div class="val">' + agg.totalTarget.toLocaleString() + '</div><div class="lbl">Target</div></div>';
    h += '<div class="stat ' + (achPct >= 100 ? 'green' : achPct >= 85 ? 'orange' : 'red') + '"><div class="val">' + achPct + '%</div><div class="lbl">Achievement</div></div>';
    h += '<div class="stat ' + (agg.shrinkagePct > 15 ? 'red' : 'green') + '"><div class="val">' + agg.shrinkagePct.toFixed(0) + '%</div><div class="lbl">Shrinkage</div></div>';
    h += '<div class="stat orange"><div class="val">' + agg.totalBacklog.toLocaleString() + '</div><div class="lbl">Backlog</div></div>';
    h += '</div>';

    
    // Manager Brief - additional context for the WBR email
    h += '<div class="card" style="padding:14px 16px;margin-bottom:12px;background:#f8f9fa">';
    h += '<h3 style="margin-bottom:8px">&#128221; Manager Brief (Optional)</h3>';
    h += '<p style="font-size:11px;color:var(--muted);margin-bottom:8px">Add key highlights, project updates, or business context to include in the WBR email. This will appear as a dedicated section.</p>';
    h += '<textarea id="wbr-manager-brief" rows="4" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;resize:vertical" placeholder="Example: Completed 110K PT-MP-Attribute display properties audits and identified 30K defects (116 unique). 65 localization defects will auto-remediate via PKTW by 5/25. Remaining 51 defects (24 example text, 16 short descriptions, 11 labels) being fixed via self-service tooling, releasing 6/29."></textarea>';
    h += '</div>';
// Filters
    var weeks = []; wbrParsedData.forEach(function(d) { if (d.week && weeks.indexOf(d.week) === -1) weeks.push(d.week); }); weeks.sort();
    h += '<div class="card" style="padding:12px 16px"><div class="fr">';
    h += '<div class="fg"><label>Week</label><select id="wbr-wk-filter" onchange="wbrWeekFilter=this.value;render()"><option value="">All Weeks</option>';
    weeks.forEach(function(w) { h += '<option value="' + w + '" ' + (wbrWeekFilter === w ? 'selected' : '') + '>' + w + '</option>'; });
    h += '</select></div>';
    h += '<div class="fg"><label>Program</label><select id="wbr-prog-filter" onchange="wbrProgFilter=this.value;render()"><option value="">All Programs</option>';
    var progs = ['CMDE Audit','LDX','Expo','NGS','MCE QA','MCE Dev','MCE Tickets','Listing deep dives','CMDE QC'];
    progs.forEach(function(p) { h += '<option value="' + p + '" ' + (wbrProgFilter === p ? 'selected' : '') + '>' + p + '</option>'; });
    h += '</select></div>';
    h += '<div class="fg"><label>Tone</label><select id="wbr-tone"><option value="formal">Formal</option><option value="concise">Concise</option></select></div>';
    h += '</div></div>';

    // Program table
    h += '<div class="card"><h3>Program Breakdown</h3><table><tr><th>Program</th><th>HC</th><th>Target</th><th>Actual</th><th>Achievement</th><th>Backlog</th><th>Per HC</th></tr>';
    agg.byProgram.forEach(function(p) {
      var pAch = p.target > 0 ? (p.actual / p.target * 100).toFixed(0) : 0;
      h += '<tr><td><strong>' + p.program + '</strong></td><td class="num">' + p.hc + '</td><td class="num">' + p.target.toLocaleString() + '</td><td class="num">' + p.actual.toLocaleString() + '</td>';
      h += '<td class="num"><span class="badge ' + (pAch >= 100 ? 'b-green' : pAch >= 85 ? 'b-orange' : 'b-red') + '">' + pAch + '%</span></td>';
      h += '<td class="num">' + p.backlog.toLocaleString() + '</td><td class="num">' + (p.hc > 0 ? (p.actual / p.hc).toFixed(0) : '-') + '</td></tr>';
    });
    h += '</table></div>';
  }

  // Email preview area
  h += '<div id="wbr-email-output" style="display:none"><div class="card">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
  h += '<h3>&#128203; Generated WBR Email</h3>';
  h += '<button class="btn btn-g" onclick="copyWBRNarrativeEmail()">&#128203; Copy to Clipboard (Outlook)</button>';
  h += '</div>';
  h += '<div id="wbr-email-html" style="background:#fafafa;border:1px solid var(--border);border-radius:6px;padding:20px;font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5;max-height:500px;overflow-y:auto"></div>';
  h += '</div></div>';

  return h;
}

function wbrDataTab(tab, el) {
  document.querySelectorAll('.tabs .tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  var area = document.getElementById('wbr-data-input');
  if (tab === 'paste') {
    area.innerHTML = '<textarea id="wbr-data-paste" rows="8" style="width:100%;font-family:Consolas,monospace;font-size:11px;padding:10px;border:1px solid var(--border);border-radius:6px;resize:vertical" placeholder="Paste tab-separated data..."></textarea><div style="display:flex;gap:8px;margin-top:8px;align-items:center"><button class="btn btn-p" onclick="parseWBRSheetData()">Parse & Load</button><button class="btn btn-s" onclick="loadWBRSampleData()">Load Sample</button><span id="wbr-data-status" style="font-size:12px;color:var(--muted)"></span></div>';
  } else {
    area.innerHTML = '<div class="fg"><label>Upload CSV / TSV</label><input type="file" id="wbr-file-upload" accept=".csv,.tsv" onchange="handleWBRFileUpload(event)" style="padding:8px"></div><span id="wbr-data-status" style="font-size:12px;color:var(--muted)"></span>';
  }
}

function parseWBRSheetData() {
  var el = document.getElementById('wbr-data-paste');
  if (!el || !el.value.trim()) { toast('Paste data first'); return; }
  var rows = el.value.trim().split('\n').map(function(r) { return r.split('\t'); });
  if (rows.length < 2) { toast('Need header + data rows'); return; }
  var headers = rows[0].map(function(h) { return h.trim().toLowerCase().replace(/^#$/, '_num'); });
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i].length < 4) continue;
    var obj = {};
    headers.forEach(function(hdr, idx) { obj[hdr] = (rows[i][idx] || '').trim(); });
    data.push(obj);
  }
  wbrParsedData = normalizeWBRSheetData(data);
  var status = document.getElementById('wbr-data-status');
  if (status) { status.innerHTML = '<span style="color:var(--success)">&#10004; ' + wbrParsedData.length + ' rows loaded</span>'; }
  render();
  toast(wbrParsedData.length + ' rows loaded');
}

function handleWBRFileUpload(e) {
  var file = e.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var text = ev.target.result;
    var delim = text.split('\n')[0].split('\t').length > 3 ? '\t' : ',';
    var rows = text.split('\n').map(function(r) { return r.split(delim); });
    if (rows.length < 2) { toast('No data in file'); return; }
    var headers = rows[0].map(function(h) { return h.trim().toLowerCase().replace(/"/g, '').replace(/^#$/, '_num'); });
    var data = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i].length < 4) continue;
      var obj = {};
      headers.forEach(function(hdr, idx) { obj[hdr] = (rows[i][idx] || '').trim().replace(/"/g, ''); });
      data.push(obj);
    }
    wbrParsedData = normalizeWBRSheetData(data);
    toast(wbrParsedData.length + ' rows loaded from file');
    render();
  };
  reader.readAsText(file);
}

function normalizeWBRSheetData(data) {
  return data.map(function(row) {
    var utilRaw = row['hc utilization'] || row['hcutilization'] || row['utilization'] || '';
    var util = 0;
    if (utilRaw.toLowerCase() === 'utilized') util = 100;
    else if (utilRaw.toLowerCase() === 'shrinkage') util = 0;
    else util = parseFloat(utilRaw) || 0;
    var week = row['week'] || row['wk'] || '';
    if (week && !isNaN(week)) week = 'Week ' + week;
    return {
      login: row['login'] || row['associate'] || row['name'] || '',
      hc: parseFloat(row['hc'] || '1') || 1,
      week: week,
      date: row['date'] || '',
      program: row['program'] || '',
      subProgram: row['sub-program'] || row['subprogram'] || '',
      hcUtilization: util,
      shrinkageType: row['shrinkage type'] || row['shrinkagetype'] || '',
      target: parseFloat(row['target'] || '0') || 0,
      actual: parseFloat(row['actual'] || '0') || 0,
      inflow: parseFloat(row['inflow'] || '0') || 0,
      backlog: parseFloat(row['backlog of the day'] || row['backlog'] || '0') || 0,
      comments: row['comments'] || row['comment'] || ''
    };
  }).filter(function(r) { return r.login; });
}

function getFilteredWBRData() {
  var d = wbrParsedData;
  var ics = getICs(state.mgr);
  d = d.filter(function(r) { return ics.indexOf(r.login) !== -1; });
  if (wbrWeekFilter) d = d.filter(function(r) { return r.week === wbrWeekFilter; });
  if (wbrProgFilter) d = d.filter(function(r) { return r.program === wbrProgFilter; });
  return d;
}

function aggregateWBRData(data) {
  var totalAudits = 0, totalTarget = 0, totalBacklog = 0, totalInflow = 0;
  data.forEach(function(d) { totalAudits += d.actual; totalTarget += d.target; totalBacklog += d.backlog; totalInflow += d.inflow; });
  var shrinkCount = data.filter(function(d) { return d.hcUtilization === 0; }).length;
  var shrinkagePct = data.length > 0 ? (shrinkCount / data.length * 100) : 0;
  var logins = {}; data.forEach(function(d) { if (d.login) logins[d.login] = true; });
  var uniqueAssociates = Object.keys(logins).length;
  var pm = {};
  data.forEach(function(d) {
    if (!d.program) return;
    if (!pm[d.program]) pm[d.program] = { program: d.program, target: 0, actual: 0, inflow: 0, backlog: 0, hc: {} };
    pm[d.program].target += d.target; pm[d.program].actual += d.actual;
    pm[d.program].inflow += d.inflow; pm[d.program].backlog += d.backlog;
    if (d.login) pm[d.program].hc[d.login] = true;
  });
  var byProgram = Object.keys(pm).map(function(k) { var p = pm[k]; return { program: p.program, target: p.target, actual: p.actual, inflow: p.inflow, backlog: p.backlog, hc: Object.keys(p.hc).length }; }).sort(function(a, b) { return b.actual - a.actual; });
  var ppl = {};
  data.forEach(function(d) {
    if (!d.login) return;
    if (!ppl[d.login]) ppl[d.login] = { login: d.login, target: 0, actual: 0, progs: {} };
    ppl[d.login].target += d.target; ppl[d.login].actual += d.actual;
    if (d.program) ppl[d.login].progs[d.program] = true;
  });
  var byPerson = Object.keys(ppl).map(function(k) { var p = ppl[k]; return { login: p.login, target: p.target, actual: p.actual, programs: Object.keys(p.progs).join(', '), ach: p.target > 0 ? (p.actual / p.target * 100) : 0 }; }).sort(function(a, b) { return b.actual - a.actual; });
  return { totalAudits: totalAudits, totalTarget: totalTarget, totalBacklog: totalBacklog, totalInflow: totalInflow, shrinkagePct: shrinkagePct, uniqueAssociates: uniqueAssociates, byProgram: byProgram, byPerson: byPerson };
}

function generateWBRNarrativeEmail() {
  var data = getFilteredWBRData();
  if (!data.length) { toast('No data loaded'); return; }
  var agg = aggregateWBRData(data);
  var weekLabel = wbrWeekFilter || 'Month Summary';
  var achPct = agg.totalTarget > 0 ? ((agg.totalAudits / agg.totalTarget) * 100).toFixed(1) : 0;
  var tone = (document.getElementById('wbr-tone') || {}).value || 'formal';
  var info = ORG[state.mgr] || { name: 'Manager' };
  var mgrName = info.name || 'Akhila Gannamraju';

  // Compute weekly breakdown
  var weekMap = {};
  data.forEach(function(d) {
    if (!d.week) return;
    if (!weekMap[d.week]) weekMap[d.week] = { week: d.week, target: 0, actual: 0, backlog: 0, inflow: 0, utilized: 0, shrinkage: 0, total: 0 };
    weekMap[d.week].target += d.target;
    weekMap[d.week].actual += d.actual;
    weekMap[d.week].backlog += d.backlog;
    weekMap[d.week].inflow += d.inflow;
    weekMap[d.week].total++;
    if (d.hcUtilization > 0) weekMap[d.week].utilized++;
    else weekMap[d.week].shrinkage++;
  });
  var weeks = Object.keys(weekMap).sort();
  var weekData = weeks.map(function(w) { var wd = weekMap[w]; wd.achPct = wd.target > 0 ? (wd.actual / wd.target * 100).toFixed(0) : 0; wd.shrinkPct = wd.total > 0 ? (wd.shrinkage / wd.total * 100).toFixed(0) : 0; return wd; });

  // Shrinkage by type
  var shrinkTypes = {};
  data.forEach(function(d) { if (d.shrinkageType && d.shrinkageType !== 'NA' && d.shrinkageType !== '') shrinkTypes[d.shrinkageType] = (shrinkTypes[d.shrinkageType] || 0) + 1; });
  var totalShrinkEntries = Object.keys(shrinkTypes).reduce(function(s, k) { return s + shrinkTypes[k]; }, 0);

  // Top performers and bottom performers
  var topPerf = agg.byPerson.filter(function(p) { return p.target > 0 && p.ach >= 100; });
  var lowPerf = agg.byPerson.filter(function(p) { return p.target > 0 && p.ach < 80; });

  // Build email
  var e = '';

  // Subject
  e += '<b>Subject:</b> WBR \u2013 ' + weekLabel + ' | CMDE & Programs Update | ' + mgrName + '\'s Team<br><br>';

  // Greeting
  e += 'Hi Team,<br><br>';
  e += 'Please find below the Weekly Business Review summary for <b>' + weekLabel + '</b>.<br><br>';

  // ============ 1. EXECUTIVE SUMMARY ============
  e += '<b style="font-size:11pt">1. Executive Summary</b><br><br>';
  e += 'The team processed <b>' + agg.totalAudits.toLocaleString() + ' audits/actions</b> against a target of <b>' + agg.totalTarget.toLocaleString() + '</b>, ';
  e += 'achieving <b>' + achPct + '% target attainment</b>. ';
  if (parseFloat(achPct) >= 100) e += 'Target exceeded \u2014 strong execution across programs. ';
  else if (parseFloat(achPct) >= 85) e += 'Slight miss primarily driven by shrinkage and tool limitations. ';
  else e += 'Gap driven by high shrinkage (leaves/holidays) impacting productive capacity. ';
  e += '<br><br>';
  e += 'Shrinkage for the period: <b>' + agg.shrinkagePct.toFixed(1) + '%</b> (' + totalShrinkEntries + ' shrinkage entries out of ' + data.length + ' data points). ';
  e += 'Team operated with <b>' + agg.uniqueAssociates + ' associates</b> across <b>' + agg.byProgram.length + ' active programs</b>. ';
  e += 'Current open backlog: <b>' + agg.totalBacklog.toLocaleString() + '</b>.<br><br>';

  // ============ MANAGER BRIEF (if provided) ============
  var briefEl = document.getElementById('wbr-manager-brief');
  var briefText = briefEl ? briefEl.value.trim() : '';
  if (briefText) {
    e += '<b style="font-size:11pt">2. Key Highlights & Business Context</b><br><br>';
    // Format the brief - split by newlines or periods for readability
    var briefLines = briefText.split('\n').filter(function(l) { return l.trim(); });
    if (briefLines.length > 1) {
      e += '<ul style="margin:0 0 12px 16px;font-size:10pt">';
      briefLines.forEach(function(line) { e += '<li>' + line.trim() + '</li>'; });
      e += '</ul><br>';
    } else {
      e += '<p style="font-size:10pt;margin-bottom:12px">' + briefText + '</p><br>';
    }
    // Shift all subsequent section numbers by 1
    var sectionOffset = 1;
  } else {
    var sectionOffset = 0;
  }

  // ============ WEEKLY TREND ============
  if (weekData.length > 1) {
    e += '<b style="font-size:11pt">' + (2 + sectionOffset) + '. Weekly Trend</b><br><br>';
    e += '<table style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:10pt;width:100%">';
    e += '<tr style="background:#232f3e;color:#fff"><th style="padding:6px 10px;border:1px solid #545b64">Week</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Target</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Actual</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Ach%</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Shrinkage%</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Backlog</th></tr>';
    weekData.forEach(function(w, i) {
      var bg = i % 2 === 0 ? '#f4f4f4' : '#fff';
      var c = w.achPct >= 100 ? '#1d8102' : w.achPct >= 85 ? '#c45500' : '#d13212';
      var sc = w.shrinkPct > 30 ? '#d13212' : w.shrinkPct > 15 ? '#c45500' : '#1d8102';
      e += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border:1px solid #eaeded"><b>' + w.week + '</b></td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + w.target.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + w.actual.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center;color:' + c + ';font-weight:bold">' + w.achPct + '%</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center;color:' + sc + '">' + w.shrinkPct + '%</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + w.backlog.toLocaleString() + '</td></tr>';
    });
    e += '</table><br>';
  }

  // ============ 3. PROGRAM PERFORMANCE ============
  e += '<b style="font-size:11pt">' + (weekData.length > 1 ? (3 + sectionOffset) : (2 + sectionOffset)) + '. Program-wise Performance</b><br><br>';
  e += '<table style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:10pt;width:100%">';
  e += '<tr style="background:#232f3e;color:#fff"><th style="padding:6px 10px;border:1px solid #545b64;text-align:left">Program</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">HC</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Target</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Actual</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Ach%</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Backlog</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Per HC/Day</th></tr>';
  agg.byProgram.forEach(function(p, i) {
    var bg = i % 2 === 0 ? '#f4f4f4' : '#fff';
    var pAch = p.target > 0 ? (p.actual / p.target * 100).toFixed(0) : '-';
    var c = pAch >= 100 ? '#1d8102' : pAch >= 85 ? '#c45500' : '#d13212';
    var perHC = p.hc > 0 ? (p.actual / p.hc).toFixed(0) : '-';
    e += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border:1px solid #eaeded">' + p.program + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.hc + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.target.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.actual.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center;color:' + c + ';font-weight:bold">' + pAch + '%</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.backlog.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + perHC + '</td></tr>';
  });
  e += '<tr style="background:#232f3e;color:#fff;font-weight:bold"><td style="padding:5px 10px;border:1px solid #545b64">TOTAL</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">' + agg.uniqueAssociates + '</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">' + agg.totalTarget.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">' + agg.totalAudits.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">' + achPct + '%</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">' + agg.totalBacklog.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #545b64;text-align:center">-</td></tr>';
  e += '</table><br>';

  // ============ 4. PER-PERSON PRODUCTIVITY ============
  if (tone !== 'concise') {
    var secNum = weekData.length > 1 ? '4' : '3';
    e += '<b style="font-size:11pt">' + secNum + '. Per-Person Productivity</b><br><br>';
    e += '<table style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:10pt;width:100%">';
    e += '<tr style="background:#232f3e;color:#fff"><th style="padding:6px 10px;border:1px solid #545b64;text-align:left">Associate</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Target</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Actual</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Ach%</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:left">Programs</th></tr>';
    agg.byPerson.forEach(function(p, i) {
      var bg = i % 2 === 0 ? '#f4f4f4' : '#fff';
      var c = p.ach >= 100 ? '#1d8102' : p.ach >= 85 ? '#c45500' : '#d13212';
      e += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border:1px solid #eaeded">' + p.login + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.target.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + p.actual.toLocaleString() + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center;color:' + c + ';font-weight:bold">' + p.ach.toFixed(0) + '%</td><td style="padding:5px 10px;border:1px solid #eaeded;font-size:9pt;color:#545b64">' + p.programs + '</td></tr>';
    });
    e += '</table><br>';
  }

  // ============ 5. SHRINKAGE ANALYSIS ============
  var shrinkKeys = Object.keys(shrinkTypes);
  if (shrinkKeys.length) {
    var secNum2 = tone !== 'concise' ? (weekData.length > 1 ? (5 + sectionOffset) : (4 + sectionOffset)) : (weekData.length > 1 ? (4 + sectionOffset) : (3 + sectionOffset));
    e += '<b style="font-size:11pt">' + secNum2 + '. Shrinkage & Utilization</b><br><br>';
    e += 'Overall shrinkage rate: <b>' + agg.shrinkagePct.toFixed(1) + '%</b><br><br>';
    e += '<table style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:10pt;width:80%">';
    e += '<tr style="background:#232f3e;color:#fff"><th style="padding:6px 10px;border:1px solid #545b64;text-align:left">Shrinkage Type</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">Count</th><th style="padding:6px 10px;border:1px solid #545b64;text-align:center">% of Total</th></tr>';
    shrinkKeys.sort(function(a, b) { return shrinkTypes[b] - shrinkTypes[a]; }).forEach(function(type, i) {
      var bg = i % 2 === 0 ? '#f4f4f4' : '#fff';
      var pct = (shrinkTypes[type] / data.length * 100).toFixed(1);
      e += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border:1px solid #eaeded">' + type + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + shrinkTypes[type] + '</td><td style="padding:5px 10px;border:1px solid #eaeded;text-align:center">' + pct + '%</td></tr>';
    });
    e += '</table><br>';
  }

  // ============ 6. KEY CALLOUTS ============
  var comments = data.filter(function(d) { return d.comments && d.comments.length > 10 && d.comments.indexOf('CMDE non-english') === -1 && d.comments.indexOf('CMDE non-english audits on CAT tool') === -1; });
  if (comments.length) {
    var secNum3 = tone !== 'concise' ? (weekData.length > 1 ? (6 + sectionOffset) : (5 + sectionOffset)) : (weekData.length > 1 ? (5 + sectionOffset) : (4 + sectionOffset));
    e += '<b style="font-size:11pt">' + secNum3 + '. Key Callouts & Risks</b><br><br>';
    e += '<ul style="margin:0 0 12px 16px;font-size:10pt">';
    var uniqueComments = [];
    var seenComments = {};
    comments.forEach(function(d) {
      var key = d.login + ':' + d.comments.substring(0, 30);
      if (!seenComments[key]) { seenComments[key] = true; uniqueComments.push(d); }
    });
    uniqueComments.slice(0, 10).forEach(function(d) {
      e += '<li><b>' + d.login + '</b> (' + d.program + ', ' + d.date + '): ' + d.comments + '</li>';
    });
    e += '</ul><br>';
  }

  // ============ 7. ACTIONS & NEXT STEPS ============
  var lastSecNum = tone !== 'concise' ? (weekData.length > 1 ? (7 + sectionOffset) : (6 + sectionOffset)) : (weekData.length > 1 ? (6 + sectionOffset) : (5 + sectionOffset));
  e += '<b style="font-size:11pt">' + lastSecNum + '. Actions & Next Steps</b><br><br>';
  e += '<ul style="margin:0 0 12px 16px;font-size:10pt">';
  if (agg.shrinkagePct > 25) e += '<li>High shrinkage (' + agg.shrinkagePct.toFixed(0) + '%) \u2014 review leave patterns and ensure coverage planning</li>';
  if (agg.totalBacklog > 0) e += '<li>Backlog clearance plan needed \u2014 current open items: ' + agg.totalBacklog.toLocaleString() + '</li>';
  if (lowPerf.length > 0) e += '<li>Coaching needed for ' + lowPerf.length + ' associate(s) below 80% achievement</li>';
  if (topPerf.length > 0) e += '<li>Recognize top performers: ' + topPerf.slice(0, 3).map(function(p) { return p.login; }).join(', ') + ' (100%+ achievement)</li>';
  e += '<li>Continue monitoring daily CAT tool output and flag translation availability issues</li>';
  e += '</ul><br>';

  // Closing
  e += 'Please reach out for any deep-dives or additional data cuts.<br><br>';
  e += 'Best regards,<br><b>' + mgrName + '</b><br>';
  e += '<span style="color:#545b64;font-size:9pt">Manager II, Prod Compliance | Selling Partner Experience - VAR</span>';

  document.getElementById('wbr-email-output').style.display = 'block';
  document.getElementById('wbr-email-html').innerHTML = e;
  document.getElementById('wbr-email-output').scrollIntoView({ behavior: 'smooth' });
  toast('WBR narrative email generated!');
}
function copyWBRNarrativeEmail() {
  var el = document.getElementById('wbr-email-html');
  if (!el || !el.innerHTML) { toast('Generate email first'); return; }
  var html = '<div style="font-family:Calibri,sans-serif;font-size:10pt;line-height:1.5">' + el.innerHTML + '</div>';
  var blob = new Blob([html], { type: 'text/html' });
  if (navigator.clipboard && navigator.clipboard.write) {
    navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([el.innerText], { type: 'text/plain' }) })]).then(function() { toast('Copied! Paste in Outlook.'); }).catch(function() { fallbackCopyWBR(html); });
  } else { fallbackCopyWBR(html); }
}

function fallbackCopyWBR(html) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;left:-9999px';
  t.innerHTML = html;
  document.body.appendChild(t);
  var r = document.createRange(); r.selectNodeContents(t);
  var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  try { document.execCommand('copy'); toast('Copied!'); } catch(e) { toast('Copy failed'); }
  s.removeAllRanges(); document.body.removeChild(t);
}

function loadWBRSampleData() {
  var s = "Login\tHC\tWK\tDate\tProgram\tSub-Program\tHC Utilization\tShrinkage Type\tTarget\tActual\tInflow\tBacklog of the day\tComments\n" +
"muqeemah\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t350\t400\t350\t-50\tCMDE non-english audits on CAT tool\n" +
"ketiredd\t0.5\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t175\t0\t175\t175\tCMDE non-english audits on CAT tool\n" +
"ketiredd\t0.5\t1\t1-Jan\tLDX\tLDX Tickets\tShrinkage\tLeave\t\t\t\t\tForte feedback\n" +
"sharkoth\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t350\t340\t350\t10\tCMDE non-english audits on CAT tool\n" +
"vankithe\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t350\t420\t350\t-70\tCMDE non-english audits on CAT tool\n" +
"musaddm\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t350\t400\t350\t-50\tCMDE non-english audits on CAT tool\n" +
"syesule\t0.5\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t175\t227\t175\t-52\tCMDE non-english audits on CAT tool\n" +
"syesule\t0.4\t1\t1-Jan\tLDX\tLDX Tickets\tUtilized\tNA\t\t\t\t\tLDX Tickets (assigned 3 | actioned 3)\n" +
"syesule\t0.1\t1\t1-Jan\tMCE Tickets\tMat issue triage\tUtilized\tNA\t\t\t\t\t\n" +
"gvatsala\t1\t1\t1-Jan\tMCE QA\tMat Testing\tUtilized\tNA\t\t\t\t\t\n" +
"sudaveda\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t350\t0\t350\t350\t\n" +
"rundevak\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t350\t400\t350\t-50\t\n" +
"valavoju\t1\t1\t1-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t350\t0\t350\t350\t\n" +
"ypreksha\t1\t1\t1-Jan\tListing deep dives\tInvisible PT Analysis\tShrinkage\tLeave\t\t\t\t\t\n" +
"ahmshaiq\t1\t1\t1-Jan\tExpo\tExpo Tickets\tShrinkage\tLeave\t\t\t\t\t\n" +
"vijaupot\t1\t1\t1-Jan\tListing deep dives\tCMDE SOP FAQ updates\tShrinkage\tLeave\t\t\t\t\t\n" +
"abhanwad\t1\t1\t1-Jan\tExpo\tExpo Tickets\tShrinkage\tLeave\t\t\t\t\t\n" +
"chikbal\t1\t1\t1-Jan\tExpo\tExpo Tickets\tShrinkage\tLeave\t\t\t\t\t\n" +
"thotteja\t1\t1\t1-Jan\tNGS\tHMD Audits\tShrinkage\tLeave\t\t\t\t\t\n" +
"cheedel\t1\t1\t1-Jan\tNGS\tHMD Audits\tShrinkage\tLeave\t\t\t\t\t\n" +
"muqeemah\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t431\t400\t-31\t\n" +
"sharkoth\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t360\t400\t40\t\n" +
"vankithe\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t435\t400\t-35\t\n" +
"musaddm\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t440\t400\t-40\t\n" +
"sudaveda\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t405\t400\t-5\t\n" +
"rundevak\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t420\t400\t-20\t\n" +
"valavoju\t1\t2\t5-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t400\t444\t400\t-44\t\n" +
"thotteja\t1\t2\t5-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t75\t\t\t\n" +
"cheedel\t0.5\t2\t5-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t50\t\t\t\n" +
"cheedel\t0.5\t2\t5-Jan\tNGS\tExit Survey\tUtilized\tNA\t\t20\t\t\tContacts with deep dive - 20\n" +
"muqeemah\t1\t2\t7-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"sharkoth\t1\t2\t7-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t360\t1000\t640\t\n" +
"sudaveda\t1\t2\t7-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t2\t7-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"muqeemah\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t750\t1000\t250\t\n" +
"sharkoth\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"vankithe\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t755\t1000\t245\t\n" +
"musaddm\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t710\t1000\t290\t\n" +
"sharkoth\t1\t3\t13-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t690\t1000\t310\ttook time to find defects in cattool for english\n" +
"musaddm\t1\t3\t14-Jan\tMCE Dev\tMat Configurations\tUtilized\tNA\t\t\t\t\t\n" +
"sudaveda\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"rundevak\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"valavoju\t1\t3\t12-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"ypreksha\t1\t3\t13-Jan\tListing deep dives\tInvisible PT Analysis\tShrinkage\tAdhoc Testing and Analysis\t\t\t\t\tQuicksuite Flash using Flow\n" +
"vijaupot\t1\t3\t12-Jan\tCMDE QC\tCMDE QC Audits\tShrinkage\tLeave\t\t\t\t\t\n" +
"thotteja\t1\t3\t12-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t75\t\t\tNGS Audits, Deep dive\n" +
"cheedel\t0.5\t3\t12-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t41\t\t\t\n" +
"cheedel\t0.5\t3\t12-Jan\tNGS\tExit Survey\tUtilized\tNA\t\t35\t\t\tContacts with deep dive(Business Page) - 35\n" +
"muqeemah\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t800\t1000\t200\t\n" +
"sharkoth\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"musaddm\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"sudaveda\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"valavoju\t1\t4\t19-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t700\t1000\t300\t\n" +
"sharkoth\t1\t4\t20-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t630\t1000\t370\tno template values for PT BICYCLE_CARGO_RACK\n" +
"sharkoth\t1\t4\t22-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t700\t1000\t300\taudited PT BICYCLE_CARGO_RACK - no template values generated\n" +
"muqeemah\t1\t4\t22-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sudaveda\t1\t4\t22-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t4\t22-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"valavoju\t1\t4\t22-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1005\t1000\t-5\t\n" +
"thotteja\t1\t4\t22-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t64\t\t\tNGS URL based testing, fba page tested\n" +
"chikbal\t0.6\t4\t22-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t67\t\t\tNGS flash metrics\n" +
"muqeemah\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\tRepublic Day\n" +
"sharkoth\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"vankithe\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"musaddm\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"sudaveda\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"rundevak\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"valavoju\t1\t5\t26-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tMandatory Off\t1000\t0\t1000\t1000\t\n" +
"muqeemah\t1\t5\t27-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sharkoth\t1\t5\t27-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tShrinkage\tLeave\t1000\t0\t1000\t1000\t\n" +
"sudaveda\t1\t5\t27-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t5\t27-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"valavoju\t1\t5\t27-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1004\t1000\t-4\t\n" +
"sudaveda\t1\t5\t28-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t250\t1000\t750\tIssue in audit allocation BOOKMARK PT\n" +
"rundevak\t1\t5\t28-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t239\t1000\t761\tPT BOOKMARK - Template & Translated values not present\n" +
"valavoju\t1\t5\t28-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t275\t1000\t725\tIssue with Allocation (PT: BOOKMARK)\n" +
"syesule\t0.5\t5\t29-Jan\tCMDE QC\tCMDE QC Audits\tUtilized\tNA\t\t340\t\t\t\n" +
"ypreksha\t0.5\t5\t29-Jan\tCMDE QC\tCMDE QC Audits\tUtilized\tNA\t\t200\t\t\t\n" +
"vijaupot\t1\t5\t29-Jan\tCMDE QC\tCMDE QC Audits\tUtilized\tNA\t\t450\t\t\t\n" +
"muqeemah\t1\t5\t29-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sharkoth\t1\t5\t29-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sudaveda\t1\t5\t29-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t5\t29-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"valavoju\t1\t5\t29-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1005\t1000\t-5\t\n" +
"syesule\t0.9\t5\t30-Jan\tCMDE QC\tCMDE QC Audits\tUtilized\tNA\t\t400\t\t\t\n" +
"ypreksha\t0.8\t5\t30-Jan\tCMDE QC\tCMDE QC Audits\tUtilized\tNA\t\t350\t\t\t\n" +
"muqeemah\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sharkoth\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t913\t1000\t87\t\n" +
"vankithe\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"sudaveda\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"rundevak\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1000\t1000\t0\t\n" +
"valavoju\t1\t5\t30-Jan\tCMDE Audit\tDisplay properties 1x1 Audit\tUtilized\tNA\t1000\t1003\t1000\t-3\t\n" +
"thotteja\t1\t5\t30-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t68\t\t\tNGS Audits, deep dive\n" +
"cheedel\t0.7\t5\t30-Jan\tNGS\tExit Survey\tUtilized\tNA\t\t60\t\t\t\n" +
"cheedel\t0.3\t5\t30-Jan\tNGS\tHMD Audits\tUtilized\tNA\t\t30\t\t\t";
  var el = document.getElementById('wbr-data-paste');
  if (el) { el.value = s; toast('Full January sample loaded (Jan Wk1-5) \u2014 click Parse & Load'); }
  else {
    var rows = s.split('\n').map(function(r) { return r.split('\t'); });
    var headers = rows[0].map(function(h) { return h.trim().toLowerCase().replace(/^#$/, '_num'); });
    var data = [];
    for (var i = 1; i < rows.length; i++) { var obj = {}; headers.forEach(function(hdr, idx) { obj[hdr] = (rows[i][idx] || '').trim(); }); data.push(obj); }
    wbrParsedData = normalizeWBRSheetData(data);
    toast(wbrParsedData.length + ' rows loaded (Full January)');
    render();
  }
}

function sendWBRReminders() {
  var mgr = state.mgr;
  var ics = getICs(mgr);
  var today = new Date();
  var startOfYear = new Date(today.getFullYear(), 0, 1);
  var weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  var weekKey = today.getFullYear() + '-W' + weekNum;

  var notUpdated = [];
  ics.forEach(function(a) {
    if (!db.wbr || !db.wbr[mgr] || !db.wbr[mgr][weekKey] || !db.wbr[mgr][weekKey][a] || !db.wbr[mgr][weekKey][a].tasks || db.wbr[mgr][weekKey][a].tasks.length === 0) {
      notUpdated.push(a);
    }
  });

  if (notUpdated.length === 0) { toast('Everyone has updated! No reminders needed.'); return; }

  var emails = notUpdated.map(function(a) { return a + '@amazon.com'; }).join(',');
  var subject = 'Reminder: Please update your WBR for Week ' + weekNum;
  var body = 'Hi,\n\nThis is a reminder to update your Weekly Business Review (WBR) for Week ' + weekNum + '.\n\n';
  body += 'Please update your tasks, blockers, and highlights in the dashboard:\n';
  body += '? Open Dashboard ? Select your team ? Click "WBR" tab ? Submit your update\n\n';
  body += 'Deadline: End of day Friday\n\n';
  body += 'Pending updates from: ' + notUpdated.join(', ') + '\n\n';
  body += 'Thanks,\n' + (ORG[mgr] ? ORG[mgr].name : mgr);

  var mailto = 'mailto:' + emails + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  window.location.href = mailto;
  toast('Reminder email opened for ' + notUpdated.length + ' people');
}

// ========== CONSOLIDATED VIEW (Multi-Manager) ==========
// Allows a higher-level manager to select sub-managers and see all their associates' data in one place

var consolidatedSelection = []; // selected sub-manager aliases

function renderConsolidatedView() {
  const mgr = state.mgr;
  const subMgrs = getMgrs(mgr);
  
  if (subMgrs.length === 0) {
    return '<div class="card"><p>No sub-managers found. This view is for managers who have other managers reporting to them.</p></div>';
  }
  
  // Initialize selection with all sub-managers if empty
  if (consolidatedSelection.length === 0) {
    consolidatedSelection = [...subMgrs];
  }
  
  let h = '<div class="card">';
  h += '<h2>&#128203; Consolidated View � Select Teams</h2>';
  h += '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Select which managers\' teams to include in the consolidated report below.</p>';
  
  // Manager selection checkboxes
  h += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">';
  subMgrs.forEach(a => {
    const info = ORG[a];
    const teamSize = allReports(a).length;
    const checked = consolidatedSelection.includes(a) ? 'checked' : '';
    h += `<label style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:${checked ? '#e6f2ff' : '#f7f8f8'};border:1px solid ${checked ? 'var(--primary)' : 'var(--border)'};border-radius:6px;cursor:pointer;font-size:12px">`;
    h += `<input type="checkbox" ${checked} onchange="toggleConsolidatedMgr('${a}')">`;
    h += `<strong>${info.name}</strong> <span style="color:var(--muted)">(${teamSize} people)</span>`;
    h += '</label>';
  });
  h += '</div>';
  
  h += '<div style="display:flex;gap:8px;margin-bottom:16px">';
  h += '<button class="btn btn-s btn-sm" onclick="selectAllConsolidated()">Select All</button>';
  h += '<button class="btn btn-s btn-sm" onclick="selectNoneConsolidated()">Clear All</button>';
  h += '</div>';
  h += '</div>';
  
  // Get all ICs from selected managers
  const allICs = [];
  const allLeaves = [];
  consolidatedSelection.forEach(mgrAlias => {
    const ics = getICs(mgrAlias);
    ics.forEach(ic => allICs.push({ alias: ic, mgr: mgrAlias }));
    const leaves = getLeaves(mgrAlias);
    leaves.forEach(l => allLeaves.push({ ...l, mgrAlias }));
  });
  
  if (allICs.length === 0) {
    h += '<div class="card"><p>No teams selected. Check at least one manager above.</p></div>';
    return h;
  }
  
  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = allLeaves.filter(l => l.status === 'approved' && l.from <= today && l.to >= today).length;
  const totalPeople = allICs.length;
  const presentToday = totalPeople - onLeaveToday;
  const shrinkageToday = totalPeople > 0 ? ((onLeaveToday / totalPeople) * 100).toFixed(1) : 0;
  const pendingLeaves = allLeaves.filter(l => l.status === 'pending').length;
  
  h += '<div class="stats">';
  h += `<div class="stat"><div class="val">${totalPeople}</div><div class="lbl">Total Associates</div></div>`;
  h += `<div class="stat green"><div class="val">${presentToday}</div><div class="lbl">Present Today</div></div>`;
  h += `<div class="stat red"><div class="val">${onLeaveToday}</div><div class="lbl">On Leave Today</div></div>`;
  h += `<div class="stat ${parseFloat(shrinkageToday) > 20 ? 'red' : 'orange'}"><div class="val">${shrinkageToday}%</div><div class="lbl">Shrinkage Today</div></div>`;
  h += `<div class="stat"><div class="val">${consolidatedSelection.length}</div><div class="lbl">Teams Selected</div></div>`;
  if (pendingLeaves > 0) h += `<div class="stat orange"><div class="val">${pendingLeaves}</div><div class="lbl">Pending Approvals</div></div>`;
  h += '</div>';
  
  // Today's Availability Grid
  h += '<div class="card"><h2>&#128994; Today\'s Availability (All Selected Teams)</h2>';
  h += '<div class="avail-grid">';
  allICs.forEach(({ alias, mgr: mgrAlias }) => {
    const name = ORG[alias] ? ORG[alias].name : alias;
    const mgrName = ORG[mgrAlias] ? ORG[mgrAlias].name.split(' ')[0] : mgrAlias;
    const isOnLeave = allLeaves.some(l => l.alias === alias && l.status === 'approved' && l.from <= today && l.to >= today);
    const isHalf = allLeaves.some(l => l.alias === alias && l.status === 'approved' && l.type === 'halfday' && l.from <= today && l.to >= today);
    
    let cls = 'available', statusText = '? Present';
    if (isHalf) { cls = 'half'; statusText = '� Half-day'; }
    else if (isOnLeave) { cls = 'on-leave'; statusText = '? On Leave'; }
    
    h += `<div class="avail-card ${cls}"><div class="aa">${name}</div><div style="font-size:10px;color:var(--muted)">${mgrName}'s team</div><div>${statusText}</div></div>`;
  });
  h += '</div></div>';
  
  // Leave Records Table (consolidated)
  h += '<div class="card"><h2>&#128221; All Leave Records (Consolidated)</h2>';
  h += '<table><thead><tr><th>Associate</th><th>Manager</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead><tbody>';
  
  const sortedLeaves = allLeaves.sort((a, b) => new Date(b.from) - new Date(a.from)).slice(0, 100);
  sortedLeaves.forEach(l => {
    const name = ORG[l.alias] ? ORG[l.alias].name : l.alias;
    const mgrName = ORG[l.mgrAlias] ? ORG[l.mgrAlias].name.split(' ')[0] : l.mgrAlias;
    const typeBadge = l.type === 'planned' ? 'b-blue' : l.type === 'unplanned' ? 'b-red' : l.type === 'halfday' ? 'b-orange' : 'b-purple';
    const statusBadge = l.status === 'approved' ? 'b-green' : l.status === 'pending' ? 'b-orange' : 'b-red';
    h += `<tr><td>${name}</td><td>${mgrName}</td><td><span class="badge ${typeBadge}">${l.type}</span></td><td>${l.from}</td><td>${l.to}</td><td class="num">${l.days}</td><td><span class="badge ${statusBadge}">${l.status}</span></td><td>${l.reason || '-'}</td></tr>`;
  });
  h += '</tbody></table>';
  if (allLeaves.length > 100) h += `<p style="font-size:11px;color:var(--muted)">Showing latest 100 of ${allLeaves.length} records</p>`;
  h += '</div>';
  
  // Per-Manager Shrinkage Summary
  h += '<div class="card"><h2>&#128200; Shrinkage by Team</h2>';
  h += '<table><thead><tr><th>Manager</th><th>Team Size</th><th>On Leave Today</th><th>Shrinkage %</th><th>Pending Approvals</th></tr></thead><tbody>';
  consolidatedSelection.forEach(mgrAlias => {
    const mgrInfo = ORG[mgrAlias];
    const ics = getICs(mgrAlias);
    const mgrLeaves = getLeaves(mgrAlias);
    const mgrOnLeave = mgrLeaves.filter(l => l.status === 'approved' && l.from <= today && l.to >= today).length;
    const mgrShrinkage = ics.length > 0 ? ((mgrOnLeave / ics.length) * 100).toFixed(1) : '0.0';
    const mgrPending = mgrLeaves.filter(l => l.status === 'pending').length;
    const shrinkStyle = parseFloat(mgrShrinkage) > 20 ? 'color:#d13212;font-weight:700' : '';
    h += `<tr><td><a onclick="goMgr('${mgrAlias}')">${mgrInfo.name}</a></td><td class="num">${ics.length}</td><td class="num">${mgrOnLeave}</td><td class="num" style="${shrinkStyle}">${mgrShrinkage}%</td><td class="num">${mgrPending}</td></tr>`;
  });
  h += '</tbody></table></div>';
  
  return h;
}

function toggleConsolidatedMgr(alias) {
  const idx = consolidatedSelection.indexOf(alias);
  if (idx >= 0) consolidatedSelection.splice(idx, 1);
  else consolidatedSelection.push(alias);
  render();
}

function selectAllConsolidated() {
  consolidatedSelection = [...getMgrs(state.mgr)];
  render();
}

function selectNoneConsolidated() {
  consolidatedSelection = [];
  render();
}

// ========== INIT ==========
render();


// ========== PHONE TOOL AUTO-SYNC (Monthly) ==========
// Automatically syncs org hierarchy with Phone Tool every 30 days
// No button needed � runs silently on page load when due

const ORG_SYNC_KEY = 'org_last_sync';
const ORG_SYNC_INTERVAL_DAYS = 30;
const ORG_SYNC_CHANGES_KEY = 'org_sync_changes';

async function fetchPhoneTool(alias) {
  try {
    const resp = await fetch(`https://phonetool.amazon.com/users/${alias}.json`, { credentials: 'include' });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn('PhoneTool fetch failed for', alias, e);
    return null;
  }
}

async function autoSyncOrg() {
  // Check if sync is due (every 30 days)
  const lastSync = localStorage.getItem(ORG_SYNC_KEY);
  if (lastSync) {
    const daysSince = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < ORG_SYNC_INTERVAL_DAYS) {
      console.log(`[OrgSync] Last synced ${Math.floor(daysSince)} days ago. Next sync in ${Math.ceil(ORG_SYNC_INTERVAL_DAYS - daysSince)} days.`);
      return;
    }
  }
  
  console.log('[OrgSync] Monthly sync triggered. Checking Phone Tool...');
  
  const ROOT = 'agasarad';
  const visited = new Set();
  const queue = [ROOT];
  const newOrg = {};
  let fetchCount = 0;
  let failed = false;
  
  // BFS through org tree
  while (queue.length > 0) {
    const alias = queue.shift();
    if (visited.has(alias)) continue;
    visited.add(alias);
    
    const data = await fetchPhoneTool(alias);
    fetchCount++;
    
    // If root fetch fails, Phone Tool is unreachable � abort silently
    if (!data && alias === ROOT) {
      console.warn('[OrgSync] Cannot reach Phone Tool. Will retry next load.');
      failed = true;
      break;
    }
    
    if (!data) continue;
    
    const directs = (data.direct_reports || []).map(d => d.login);
    const mgrLogin = data.manager ? data.manager.login : null;
    const isMgr = data.is_manager && directs.length > 0;
    
    newOrg[alias] = {
      name: data.name || alias,
      title: data.job_title || 'Unknown',
      level: data.job_level || 3,
      isMgr: isMgr,
      mgr: (alias === ROOT) ? null : mgrLogin,
      directs: directs
    };
    
    // Queue directs
    directs.forEach(d => {
      if (!visited.has(d)) queue.push(d);
    });
    
    // Rate limit: small delay every 5 requests
    if (fetchCount % 5 === 0) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  if (failed || Object.keys(newOrg).length === 0) return;
  
  // Compare with current ORG
  const changes = detectOrgChanges(newOrg);
  
  // Apply changes automatically
  if (changes.length > 0) {
    console.log(`[OrgSync] ${changes.length} change(s) detected. Auto-applying...`);
    applyOrgChanges(newOrg);
    localStorage.setItem(ORG_SYNC_CHANGES_KEY, JSON.stringify({
      date: new Date().toISOString(),
      changes: changes
    }));
    // Show notification after render
    setTimeout(() => {
      showOrgSyncNotification(changes);
    }, 1000);
  } else {
    console.log(`[OrgSync] No changes. Org is up to date (${Object.keys(newOrg).length} people).`);
  }
  
  // Mark sync complete
  localStorage.setItem(ORG_SYNC_KEY, new Date().toISOString());
  console.log('[OrgSync] Sync complete. Next sync in 30 days.');
}

function detectOrgChanges(newOrg) {
  const changes = [];
  const currentAliases = new Set(Object.keys(ORG));
  const newAliases = new Set(Object.keys(newOrg));
  
  // People who left
  currentAliases.forEach(alias => {
    if (!newAliases.has(alias)) {
      changes.push({ type: 'left', alias, name: ORG[alias].name, mgr: ORG[alias].mgr });
    }
  });
  
  // New people
  newAliases.forEach(alias => {
    if (!currentAliases.has(alias)) {
      changes.push({ type: 'new', alias, name: newOrg[alias].name, mgr: newOrg[alias].mgr });
    }
  });
  
  // Reporting changes
  newAliases.forEach(alias => {
    if (currentAliases.has(alias)) {
      const oldMgr = ORG[alias].mgr;
      const newMgr = newOrg[alias].mgr;
      if (oldMgr !== newMgr && alias !== 'agasarad') {
        changes.push({ type: 'moved', alias, name: newOrg[alias].name, from: oldMgr, to: newMgr });
      }
      // Check directs changes
      const oldDirects = new Set(ORG[alias].directs || []);
      const newDirects = new Set(newOrg[alias].directs || []);
      const gained = [...newDirects].filter(d => !oldDirects.has(d));
      const lost = [...oldDirects].filter(d => !newDirects.has(d));
      if (gained.length > 0) {
        changes.push({ type: 'gained_directs', alias, name: newOrg[alias].name, directs: gained });
      }
      if (lost.length > 0) {
        changes.push({ type: 'lost_directs', alias, name: newOrg[alias].name, directs: lost });
      }
    }
  });
  
  return changes;
}

function applyOrgChanges(newOrg) {
  // Clear current ORG
  Object.keys(ORG).forEach(k => delete ORG[k]);
  
  // Apply new data
  Object.entries(newOrg).forEach(([alias, data]) => {
    ORG[alias] = data;
  });
  
  // Re-render
  render();
}

function showOrgSyncNotification(changes) {
  let msg = '?? Org auto-synced with Phone Tool: ';
  const left = changes.filter(c => c.type === 'left');
  const added = changes.filter(c => c.type === 'new');
  const moved = changes.filter(c => c.type === 'moved');
  
  const parts = [];
  if (left.length) parts.push(left.length + ' left');
  if (added.length) parts.push(added.length + ' new');
  if (moved.length) parts.push(moved.length + ' moved');
  msg += parts.join(', ');
  
  toast(msg);
  
  // Also show a detailed modal
  let h = '<h2>?? Monthly Org Sync Complete</h2>';
  h += `<p style="font-size:12px;color:var(--muted)">Auto-synced on ${new Date().toLocaleDateString()} | ${Object.keys(ORG).length} people in org</p>`;
  h += '<table style="width:100%;font-size:12px;margin:10px 0"><thead><tr><th>Change</th><th>Alias</th><th>Name</th><th>Details</th></tr></thead><tbody>';
  
  changes.forEach(c => {
    if (c.type === 'left') {
      h += `<tr style="background:#fce9e6"><td><span class="badge b-red">LEFT</span></td><td>${c.alias}</td><td>${c.name}</td><td>Was under ${c.mgr || 'unknown'}</td></tr>`;
    } else if (c.type === 'new') {
      h += `<tr style="background:#e6f9e6"><td><span class="badge b-green">NEW</span></td><td>${c.alias}</td><td>${c.name}</td><td>Under ${c.mgr || 'unknown'}</td></tr>`;
    } else if (c.type === 'moved') {
      h += `<tr style="background:#fff3e0"><td><span class="badge b-orange">MOVED</span></td><td>${c.alias}</td><td>${c.name}</td><td>${c.from} ? ${c.to}</td></tr>`;
    } else if (c.type === 'gained_directs') {
      h += `<tr style="background:#e6f9e6"><td><span class="badge b-blue">+DIRECTS</span></td><td>${c.alias}</td><td>${c.name}</td><td>Gained: ${c.directs.join(', ')}</td></tr>`;
    } else if (c.type === 'lost_directs') {
      h += `<tr style="background:#fce9e6"><td><span class="badge b-orange">-DIRECTS</span></td><td>${c.alias}</td><td>${c.name}</td><td>Lost: ${c.directs.join(', ')}</td></tr>`;
    }
  });
  
  h += '</tbody></table>';
  h += '<p style="font-size:11px;color:var(--muted)">Changes have been applied automatically. Next sync in 30 days.</p>';
  h += '<div style="margin-top:12px"><button class="btn btn-p" onclick="hideModal()">OK</button></div>';
  
  showModal(h);
}

// ========== TRIGGER AUTO-SYNC ON PAGE LOAD ==========
// Runs silently in background after dashboard loads
setTimeout(() => {
  autoSyncOrg().catch(e => console.warn('[OrgSync] Error:', e));
}, 3000); // Wait 3 seconds after page load to not block UI















