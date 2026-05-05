// ========== DAILY SHEET (Akhila's team) ==========
function renderDailySheet(){
  if(state.mgr!=='aggannam')return '<div class="card"><h2>Daily Sheet is only available for Akhila\'s team</h2></div>';
  var ics=getICs('aggannam');
  var today=state.dailyDate||new Date().toISOString().slice(0,10);
  var dailyData=db.dailySheet[today]||{};

  var h='<div class="card"><h2>&#128197; Daily Attendance Sheet &mdash; Akhila\'s Team</h2>';
  h+='<p style="font-size:12px;color:var(--muted);margin-bottom:12px">Update daily status for each associate. Results appear on the dashboard immediately.</p>';
  h+='<div class="fr" style="margin-bottom:16px"><div class="fg"><label>Date</label><input type="date" id="daily-date" value="'+today+'" onchange="changeDailyDate(this.value)"></div>';
  h+='<button class="btn btn-sm btn-s" onclick="dailyPrevDay()" style="margin-bottom:12px">&laquo; Prev</button>';
  h+='<button class="btn btn-sm btn-s" onclick="dailyNextDay()" style="margin-bottom:12px">Next &raquo;</button>';
  h+='<button class="btn btn-sm btn-p" onclick="dailyToday()" style="margin-bottom:12px">Today</button></div>';

  // Summary banner
  var onLeave=0,wfh=0,present=0,halfDay=0;
  ics.forEach(function(a){
    var d=dailyData[a];
    if(!d||d.status==='present')present++;
    else if(d.status==='on-leave')onLeave++;
    else if(d.status==='wfh')wfh++;
    else if(d.status==='half-day')halfDay++;
    else present++;
  });
  h+='<div class="stats">';
  h+='<div class="stat green"><div class="val">'+present+'</div><div class="lbl">Present</div></div>';
  h+='<div class="stat"><div class="val">'+wfh+'</div><div class="lbl">WFH</div></div>';
  h+='<div class="stat red"><div class="val">'+onLeave+'</div><div class="lbl">On Leave</div></div>';
  h+='<div class="stat orange"><div class="val">'+halfDay+'</div><div class="lbl">Half Day</div></div>';
  h+='</div>';

  // Daily table
  h+='<div class="sheet-wrap"><table class="sheet-table"><thead><tr><th>#</th><th>Alias</th><th>Name</th><th>Status</th><th>Leave Type</th><th>Check-in</th><th>Check-out</th><th>Remarks</th></tr></thead><tbody>';
  ics.forEach(function(a,idx){
    var info=ORG[a]||{name:a};
    var row=dailyData[a]||{status:'present',leaveType:'',checkIn:'',checkOut:'',remarks:''};
    h+='<tr>';
    h+='<td>'+(idx+1)+'</td>';
    h+='<td><strong>'+a+'</strong></td>';
    h+='<td>'+info.name+'</td>';
    h+='<td><select onchange="updateDaily(\''+a+'\',\'status\',this.value)">';
    ['present','wfh','on-leave','half-day','comp-off'].forEach(function(s){
      h+='<option value="'+s+'"'+(row.status===s?' selected':'')+'>'+s.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();})+'</option>';
    });
    h+='</select></td>';
    h+='<td><select onchange="updateDaily(\''+a+'\',\'leaveType\',this.value)"><option value="">-</option>';
    LEAVE_TYPES.forEach(function(t){h+='<option value="'+t.id+'"'+(row.leaveType===t.id?' selected':'')+'>'+t.name+'</option>';});
    h+='</select></td>';
    h+='<td><input type="time" value="'+(row.checkIn||'')+'" onchange="updateDaily(\''+a+'\',\'checkIn\',this.value)"></td>';
    h+='<td><input type="time" value="'+(row.checkOut||'')+'" onchange="updateDaily(\''+a+'\',\'checkOut\',this.value)"></td>';
    h+='<td><input type="text" value="'+(row.remarks||'')+'" onchange="updateDaily(\''+a+'\',\'remarks\',this.value)" placeholder="Notes..."></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  h+='<div style="margin-top:12px;display:flex;gap:8px">';
  h+='<button class="btn btn-p" onclick="syncDailyToLeaves()">Sync Leaves to Records</button>';
  h+='<button class="btn btn-s" onclick="exportDailyCSV()">Export Day CSV</button>';
  h+='</div></div>';

  // Weekly summary
  h+=renderDailyWeeklySummary(today);
  return h;
}

function renderDailyWeeklySummary(today){
  var ics=getICs('aggannam');
  var d=new Date(today);
  var dayOfWeek=d.getDay();
  var monday=new Date(d);monday.setDate(d.getDate()-(dayOfWeek===0?6:dayOfWeek-1));
  var h='<div class="card"><h2>This Week\'s Summary</h2><table><thead><tr><th>Associate</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Leave Days</th></tr></thead><tbody>';
  ics.forEach(function(a){
    var info=ORG[a]||{name:a};
    var leaveDays=0;
    h+='<tr><td><strong>'+a+'</strong></td>';
    for(var i=0;i<5;i++){
      var dd=new Date(monday);dd.setDate(monday.getDate()+i);
      var ds=dd.toISOString().slice(0,10);
      var dayData=(db.dailySheet[ds]||{})[a];
      var st=dayData?dayData.status:'';
      var cls='';var txt='-';
      if(st==='present'){cls='color:var(--success)';txt='P';}
      else if(st==='wfh'){cls='color:var(--primary)';txt='W';}
      else if(st==='on-leave'){cls='color:var(--danger)';txt='L';leaveDays++;}
      else if(st==='half-day'){cls='color:var(--warn)';txt='H';leaveDays+=0.5;}
      else if(st==='comp-off'){cls='color:var(--purple)';txt='C';leaveDays++;}
      h+='<td class="num" style="'+cls+';font-weight:700">'+txt+'</td>';
    }
    h+='<td class="num'+(leaveDays>2?' high':'')+'">'+leaveDays+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

function changeDailyDate(val){state.dailyDate=val;render();}
function dailyPrevDay(){var d=new Date(state.dailyDate);d.setDate(d.getDate()-1);state.dailyDate=d.toISOString().slice(0,10);render();}
function dailyNextDay(){var d=new Date(state.dailyDate);d.setDate(d.getDate()+1);state.dailyDate=d.toISOString().slice(0,10);render();}
function dailyToday(){state.dailyDate=new Date().toISOString().slice(0,10);render();}

function updateDaily(alias,field,value){
  var today=state.dailyDate;
  if(!db.dailySheet[today])db.dailySheet[today]={};
  if(!db.dailySheet[today][alias])db.dailySheet[today][alias]={status:'present',leaveType:'',checkIn:'',checkOut:'',remarks:''};
  db.dailySheet[today][alias][field]=value;
  save();
}

function syncDailyToLeaves(){
  var today=state.dailyDate;
  var dailyData=db.dailySheet[today]||{};
  if(!db.leaves['aggannam'])db.leaves['aggannam']=[];
  var count=0;
  Object.entries(dailyData).forEach(function(entry){
    var alias=entry[0],row=entry[1];
    if(row.status==='on-leave'||row.status==='half-day'){
      var existing=db.leaves['aggannam'].find(function(l){return l.alias===alias&&l.from===today;});
      if(!existing){
        var type=row.leaveType||'unplanned';
        var days=row.status==='half-day'?0.5:1;
        db.leaves['aggannam'].push({id:'L'+Date.now()+count,alias:alias,type:type,from:today,to:today,days:days,status:'approved',reason:row.remarks||'From daily sheet',appliedOn:today});
        count++;
      }
    }
  });
  save();
  alert(count+' leave records synced from daily sheet!');
  render();
}

function exportDailyCSV(){
  var today=state.dailyDate;
  var ics=getICs('aggannam');
  var dailyData=db.dailySheet[today]||{};
  var csv='Date,Alias,Name,Status,Leave Type,Check-In,Check-Out,Remarks\n';
  ics.forEach(function(a){
    var info=ORG[a]||{name:a};
    var row=dailyData[a]||{status:'present',leaveType:'',checkIn:'',checkOut:'',remarks:''};
    csv+=today+','+a+',"'+info.name+'",'+row.status+','+(row.leaveType||'-')+','+(row.checkIn||'-')+','+(row.checkOut||'-')+',"'+(row.remarks||'')+'"\n';
  });
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='daily_sheet_'+today+'.csv';a.click();URL.revokeObjectURL(url);
}
