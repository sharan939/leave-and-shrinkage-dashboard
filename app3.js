// ========== LEAVE RECORDS with Read/Write/Update ==========
function renderLeaves(){
  var leaves=getLeaves(state.mgr);
  var pending=leaves.filter(function(l){return l.status==='pending';});
  var h='';
  if(pending.length){
    h+='<div class="card"><h2>&#9888;&#65039; Pending Approval ('+pending.length+')</h2><table><thead><tr><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Actions</th></tr></thead><tbody>';
    pending.forEach(function(l){
      var lt=LEAVE_TYPES.find(function(t){return t.id===l.type;});
      h+='<tr><td><strong>'+l.alias+'</strong><br><span style="font-size:11px;color:var(--muted)">'+(ORG[l.alias]?ORG[l.alias].name:'')+'</span></td>';
      h+='<td><span class="badge '+(lt?lt.badge:'b-gray')+'">'+(lt?lt.name:l.type)+'</span></td>';
      h+='<td>'+l.from+'</td><td>'+l.to+'</td><td class="num">'+l.days+'</td><td>'+(l.reason||'-')+'</td>';
      h+='<td><button class="btn btn-g btn-sm" onclick="approveLeave(\''+l.id+'\')">Approve</button> <button class="btn btn-d btn-sm" onclick="rejectLeave(\''+l.id+'\')">Reject</button></td></tr>';
    });
    h+='</tbody></table></div>';
  }

  h+='<div class="card"><h2>All Leave Records ('+leaves.length+') &mdash; <span style="font-size:12px;color:var(--muted)">Click Edit to modify any record</span></h2>';
  h+='<div style="margin-bottom:12px;display:flex;gap:8px"><button class="btn btn-p btn-sm" onclick="setNav(\'apply\')">+ Apply Leave</button><button class="btn btn-s btn-sm" onclick="setNav(\'sheet\')">Open Monthly Sheet</button></div>';
  h+='<table><thead><tr><th>ID</th><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th><th>Actions</th></tr></thead><tbody>';
  var sorted=leaves.slice().sort(function(a,b){return b.from.localeCompare(a.from);});
  sorted.forEach(function(l){
    var lt=LEAVE_TYPES.find(function(t){return t.id===l.type;});
    var stBadge=l.status==='approved'?'b-green':l.status==='pending'?'b-orange':'b-red';
    h+='<tr><td style="font-size:11px;color:var(--muted)">'+l.id+'</td><td><strong>'+l.alias+'</strong></td>';
    h+='<td><span class="badge '+(lt?lt.badge:'b-gray')+'">'+(lt?lt.name:l.type)+'</span></td>';
    h+='<td>'+l.from+'</td><td>'+l.to+'</td><td class="num">'+l.days+'</td>';
    h+='<td><span class="badge '+stBadge+'">'+l.status+'</span></td><td>'+(l.reason||'-')+'</td>';
    h+='<td><button class="btn btn-sm btn-p" onclick="editLeaveModal(\''+l.id+'\')" title="Edit">&#9998;</button> <button class="btn btn-sm btn-d" onclick="deleteLeave(\''+l.id+'\')" title="Delete">&#128465;</button></td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

function approveLeave(id){var leaves=getLeaves(state.mgr);var l=leaves.find(function(x){return x.id===id;});if(l){l.status='approved';save();render();}}
function rejectLeave(id){var leaves=getLeaves(state.mgr);var l=leaves.find(function(x){return x.id===id;});if(l){l.status='rejected';save();render();}}
function deleteLeave(id){if(!confirm('Delete this leave record?'))return;db.leaves[state.mgr]=getLeaves(state.mgr).filter(function(l){return l.id!==id;});save();render();}

// ========== EDIT LEAVE MODAL (Read/Write/Update) ==========
function editLeaveModal(id){
  var leaves=getLeaves(state.mgr);
  var l=leaves.find(function(x){return x.id===id;});
  if(!l)return;
  var ics=getICs(state.mgr);
  var opts='';ics.forEach(function(a){var info=ORG[a];opts+='<option value="'+a+'"'+(a===l.alias?' selected':'')+'>'+a+' - '+(info?info.name:a)+'</option>';});
  var typeOpts='';LEAVE_TYPES.forEach(function(t){typeOpts+='<option value="'+t.id+'"'+(t.id===l.type?' selected':'')+'>'+t.name+'</option>';});
  var mc=document.getElementById('modal-content');
  mc.innerHTML='<h2>&#9998; Edit Leave Record ('+l.id+')</h2>'+
    '<div class="fr"><div class="fg" style="min-width:180px"><label>Associate</label><select id="el-alias">'+opts+'</select></div>'+
    '<div class="fg"><label>Leave Type</label><select id="el-type">'+typeOpts+'</select></div></div>'+
    '<div class="fr"><div class="fg"><label>From Date</label><input type="date" id="el-from" value="'+l.from+'"></div>'+
    '<div class="fg"><label>To Date</label><input type="date" id="el-to" value="'+l.to+'"></div>'+
    '<div class="fg"><label>Days</label><input type="number" id="el-days" min="0.5" step="0.5" value="'+l.days+'" style="width:70px"></div></div>'+
    '<div class="fr"><div class="fg" style="flex:1"><label>Reason</label><input type="text" id="el-reason" value="'+(l.reason||'')+'"></div>'+
    '<div class="fg"><label>Status</label><select id="el-status"><option value="approved"'+(l.status==='approved'?' selected':'')+'>Approved</option><option value="pending"'+(l.status==='pending'?' selected':'')+'>Pending</option><option value="rejected"'+(l.status==='rejected'?' selected':'')+'>Rejected</option></select></div></div>'+
    '<div class="modal-foot"><button class="btn btn-s" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="saveEditLeave(\''+l.id+'\')">Save Changes</button></div>';
  document.getElementById('modal').classList.add('show');
}

function saveEditLeave(id){
  var leaves=getLeaves(state.mgr);
  var l=leaves.find(function(x){return x.id===id;});
  if(!l)return;
  l.alias=document.getElementById('el-alias').value;
  l.type=document.getElementById('el-type').value;
  l.from=document.getElementById('el-from').value;
  l.to=document.getElementById('el-to').value;
  l.days=parseFloat(document.getElementById('el-days').value)||1;
  l.reason=document.getElementById('el-reason').value;
  l.status=document.getElementById('el-status').value;
  save();closeModal();render();
}

// ========== MONTHLY SHEET (per manager, per month) ==========
function renderSheet(){
  var ics=getICs(state.mgr);
  var months=['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
  var h='<div class="card"><h2>&#128203; Monthly Data Sheet &mdash; '+ORG[state.mgr].name+'</h2>';
  h+='<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Select a month, enter/update data for each associate. Changes auto-save and refresh the dashboard.</p>';

  // Month tabs
  h+='<div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:4px">';
  months.forEach(function(m){
    h+='<span class="month-tab'+(m===state.sheetMonth?' active':'')+'" onclick="switchSheetMonth(\''+m+'\')">'+m+'</span>';
  });
  h+='</div>';

  // Sheet table
  var sheetKey=state.mgr+'_'+state.sheetMonth;
  var sheetData=db.sheets[sheetKey]||{};

  h+='<div class="sheet-wrap"><table class="sheet-table"><thead><tr><th>#</th><th>Alias</th><th>Name</th><th>Planned</th><th>Unplanned</th><th>Half-day</th><th>Total</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>';
  ics.forEach(function(a,idx){
    var info=ORG[a]||{name:a};
    var row=sheetData[a]||{planned:0,unplanned:0,halfday:0,remarks:''};
    var total=(row.planned||0)+(row.unplanned||0)+(row.halfday||0);
    h+='<tr>';
    h+='<td>'+(idx+1)+'</td>';
    h+='<td><strong>'+a+'</strong></td>';
    h+='<td>'+info.name+'</td>';
    h+='<td><input type="number" min="0" step="0.5" value="'+(row.planned||0)+'" onchange="updateSheet(\''+a+'\',\'planned\',this.value)"></td>';
    h+='<td><input type="number" min="0" step="0.5" value="'+(row.unplanned||0)+'" onchange="updateSheet(\''+a+'\',\'unplanned\',this.value)" style="'+(row.unplanned>3?'color:var(--danger);font-weight:700':'')+'"></td>';
    h+='<td><input type="number" min="0" step="0.5" value="'+(row.halfday||0)+'" onchange="updateSheet(\''+a+'\',\'halfday\',this.value)"></td>';
    h+='<td class="num" style="font-weight:700">'+total+'</td>';
    h+='<td><input type="text" value="'+(row.remarks||'')+'" onchange="updateSheet(\''+a+'\',\'remarks\',this.value)" placeholder="Notes..."></td>';
    h+='<td><button class="btn btn-sm btn-g" onclick="syncSheetToLeaves(\''+a+'\')">Sync</button></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  h+='<div style="margin-top:12px;display:flex;gap:8px"><button class="btn btn-p" onclick="syncAllSheetToLeaves()">Sync All to Leave Records</button><button class="btn btn-s" onclick="clearSheet()">Clear Month</button></div>';
  h+='</div>';
  return h;
}

function switchSheetMonth(m){state.sheetMonth=m;render();}

function updateSheet(alias,field,value){
  var sheetKey=state.mgr+'_'+state.sheetMonth;
  if(!db.sheets[sheetKey])db.sheets[sheetKey]={};
  if(!db.sheets[sheetKey][alias])db.sheets[sheetKey][alias]={planned:0,unplanned:0,halfday:0,remarks:''};
  if(field==='remarks')db.sheets[sheetKey][alias][field]=value;
  else db.sheets[sheetKey][alias][field]=parseFloat(value)||0;
  save();
}

function syncSheetToLeaves(alias){
  var sheetKey=state.mgr+'_'+state.sheetMonth;
  var row=(db.sheets[sheetKey]||{})[alias];
  if(!row)return;
  if(!db.leaves[state.mgr])db.leaves[state.mgr]=[];
  var month=state.sheetMonth;
  // Remove existing records for this alias in this month
  db.leaves[state.mgr]=db.leaves[state.mgr].filter(function(l){return !(l.alias===alias&&l.from.startsWith(month));});
  // Add new records
  var fromDate=month+'-01';
  var toDate=month+'-'+new Date(parseInt(month.split('-')[0]),parseInt(month.split('-')[1]),0).getDate();
  if(row.planned>0)db.leaves[state.mgr].push({id:'L'+Date.now()+'p',alias:alias,type:'planned',from:fromDate,to:toDate,days:row.planned,status:'approved',reason:row.remarks||'From sheet',appliedOn:new Date().toISOString().slice(0,10)});
  if(row.unplanned>0)db.leaves[state.mgr].push({id:'L'+Date.now()+'u',alias:alias,type:'unplanned',from:fromDate,to:toDate,days:row.unplanned,status:'approved',reason:row.remarks||'From sheet',appliedOn:new Date().toISOString().slice(0,10)});
  if(row.halfday>0)db.leaves[state.mgr].push({id:'L'+Date.now()+'h',alias:alias,type:'halfday',from:fromDate,to:toDate,days:row.halfday,status:'approved',reason:row.remarks||'From sheet',appliedOn:new Date().toISOString().slice(0,10)});
  save();render();
}

function syncAllSheetToLeaves(){
  var ics=getICs(state.mgr);
  ics.forEach(function(a){syncSheetToLeaves(a);});
  alert('All records synced from sheet to leave records!');
}

function clearSheet(){
  if(!confirm('Clear all data for '+state.sheetMonth+'?'))return;
  var sheetKey=state.mgr+'_'+state.sheetMonth;
  delete db.sheets[sheetKey];
  save();render();
}
