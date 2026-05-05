// ========== DASHBOARD ==========
function renderDashboard(){
  var ics=getICs(state.mgr);
  var leaves=getLeaves(state.mgr);
  var today=new Date().toISOString().slice(0,10);
  var totalP=0,totalU=0,totalH=0,pending=0;
  leaves.forEach(function(l){
    if(l.type==='planned')totalP+=l.days;
    if(l.type==='unplanned')totalU+=l.days;
    if(l.type==='halfday')totalH+=l.days;
    if(l.status==='pending')pending++;
  });
  var onLeaveToday=[];
  leaves.forEach(function(l){if(l.status==='approved'&&l.from<=today&&l.to>=today)onLeaveToday.push(l);});
  var availableToday=ics.length-new Set(onLeaveToday.map(function(l){return l.alias;})).size;

  var h='<div class="stats">';
  h+='<div class="stat green"><div class="val">'+availableToday+'/'+ics.length+'</div><div class="lbl">Available Today</div></div>';
  h+='<div class="stat"><div class="val">'+leaves.length+'</div><div class="lbl">Total Records</div></div>';
  h+='<div class="stat"><div class="val">'+totalP+'</div><div class="lbl">Planned Days</div></div>';
  h+='<div class="stat red"><div class="val">'+totalU+'</div><div class="lbl">Unplanned Days</div></div>';
  h+='<div class="stat orange"><div class="val">'+totalH+'</div><div class="lbl">Half-days</div></div>';
  if(pending)h+='<div class="stat red"><div class="val">'+pending+'</div><div class="lbl">Pending Approval</div></div>';
  h+='</div>';

  // Daily sheet summary for Akhila
  if(state.mgr==='aggannam'){
    var dailyData=db.dailySheet[today];
    if(dailyData&&Object.keys(dailyData).length>0){
      h+='<div class="daily-banner"><h3>&#128197; Today\'s Daily Sheet Update ('+today+')</h3><p>';
      var onLeave=0,wfh=0,present=0;
      Object.values(dailyData).forEach(function(d){
        if(d.status==='on-leave')onLeave++;
        else if(d.status==='wfh')wfh++;
        else present++;
      });
      h+='Present: <strong>'+present+'</strong> | WFH: <strong>'+wfh+'</strong> | On Leave: <strong>'+onLeave+'</strong>';
      h+='</p></div>';
    }
  }

  // Availability cards
  h+='<div class="card"><h2>&#128994; Today\'s Availability</h2><div class="avail-grid">';
  ics.forEach(function(a){
    var info=ORG[a]||{name:a};
    var leave=onLeaveToday.find(function(l){return l.alias===a;});
    if(leave){
      var cls=leave.type==='halfday'?'half':'on-leave';
      var lt=LEAVE_TYPES.find(function(t){return t.id===leave.type;});
      h+='<div class="avail-card '+cls+'"><div class="aa">'+a+'</div>'+info.name+'<br><span class="badge '+(lt?lt.badge:'b-red')+'">'+(lt?lt.name:leave.type)+'</span></div>';
    } else {
      h+='<div class="avail-card available"><div class="aa">'+a+'</div>'+info.name+'<br><span class="badge b-green">Available</span></div>';
    }
  });
  h+='</div></div>';

  // Bar chart
  var perA={};
  ics.forEach(function(a){perA[a]=[0,0,0];});
  leaves.forEach(function(l){if(!perA[l.alias])return;var ti=LEAVE_TYPES.findIndex(function(t){return t.id===l.type;});if(ti>=0)perA[l.alias][ti]+=l.days;});
  var maxV=Math.max.apply(null,Object.values(perA).map(function(v){return v[0]+v[1]+v[2];}));
  if(maxV<1)maxV=1;
  var sorted=Object.entries(perA).sort(function(a,b){return(b[1][0]+b[1][1]+b[1][2])-(a[1][0]+a[1][1]+a[1][2]);});

  h+='<div class="card"><h2>Leave Distribution</h2>';
  h+='<div class="legend"><div class="legend-i"><div class="legend-d" style="background:#0073bb"></div>Planned</div><div class="legend-i"><div class="legend-d" style="background:#d13212"></div>Unplanned</div><div class="legend-i"><div class="legend-d" style="background:#ff9900"></div>Half-day</div></div>';
  h+='<div class="bar-chart">';
  sorted.forEach(function(item){
    var a=item[0],v=item[1];var t=v[0]+v[1]+v[2];if(t===0)return;
    h+='<div class="bar-row"><div class="bar-lbl" title="'+(ORG[a]?ORG[a].name:a)+'">'+a+'</div><div class="bar-track"><div style="display:flex;height:100%">';
    if(v[0])h+='<div class="bar-fill" style="width:'+((v[0]/maxV)*100)+'%;background:#0073bb">'+v[0]+'</div>';
    if(v[1])h+='<div class="bar-fill" style="width:'+((v[1]/maxV)*100)+'%;background:#d13212">'+v[1]+'</div>';
    if(v[2])h+='<div class="bar-fill" style="width:'+((v[2]/maxV)*100)+'%;background:#ff9900">'+v[2]+'</div>';
    h+='</div></div></div>';
  });
  h+='</div></div>';

  // Recent leaves
  var recent=leaves.slice().sort(function(a,b){return b.from.localeCompare(a.from);}).slice(0,8);
  h+='<div class="card"><h2>Recent Leave Records</h2><table><thead><tr><th>Associate</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead><tbody>';
  recent.forEach(function(l){
    var lt=LEAVE_TYPES.find(function(t){return t.id===l.type;});
    var stBadge=l.status==='approved'?'b-green':l.status==='pending'?'b-orange':'b-red';
    h+='<tr><td><strong>'+l.alias+'</strong></td><td><span class="badge '+(lt?lt.badge:'b-gray')+'">'+(lt?lt.name:l.type)+'</span></td>';
    h+='<td>'+l.from+'</td><td>'+l.to+'</td><td class="num">'+l.days+'</td>';
    h+='<td><span class="badge '+stBadge+'">'+l.status+'</span></td><td>'+(l.reason||'-')+'</td></tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

// ========== CALENDAR ==========
function renderCalendar(){
  var m=state.calMonth,y=state.calYear;
  var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var firstDay=new Date(y,m,1).getDay();
  var daysInMonth=new Date(y,m+1,0).getDate();
  var todayStr=new Date().toISOString().slice(0,10);
  var leaves=getLeaves(state.mgr).filter(function(l){return l.status==='approved';});
  var dateMap={};
  leaves.forEach(function(l){
    var d=new Date(l.from);var end=new Date(l.to);
    while(d<=end){
      var ds=d.toISOString().slice(0,10);
      if(ds.startsWith(y+'-'+String(m+1).padStart(2,'0'))){
        if(!dateMap[ds])dateMap[ds]=[];
        dateMap[ds].push(l);
      }
      d.setDate(d.getDate()+1);
    }
  });
  var h='<div class="card"><div class="cal"><div class="cal-header">';
  h+='<div class="cal-nav"><button onclick="calNav(-1)">&laquo; Prev</button></div>';
  h+='<h3>'+months[m]+' '+y+'</h3>';
  h+='<div class="cal-nav"><button onclick="calNav(1)">Next &raquo;</button></div>';
  h+='</div><div class="cal-grid">';
  days.forEach(function(d){h+='<div class="cal-day-header">'+d+'</div>';});
  for(var i=0;i<firstDay;i++){h+='<div class="cal-day other"></div>';}
  for(var d=1;d<=daysInMonth;d++){
    var ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var isToday=ds===todayStr;
    h+='<div class="cal-day'+(isToday?' today':'')+'"><div class="day-num">'+d+'</div>';
    if(dateMap[ds]){
      var shown=new Set();
      dateMap[ds].forEach(function(l){
        if(shown.has(l.alias))return;shown.add(l.alias);
        var lt=LEAVE_TYPES.find(function(t){return t.id===l.type;});
        h+='<div class="leave-dot '+(lt?lt.calClass:'')+'" title="'+l.alias+': '+(lt?lt.name:l.type)+'">'+l.alias+'</div>';
      });
    }
    h+='</div>';
  }
  h+='</div></div></div>';
  return h;
}
function calNav(dir){
  state.calMonth+=dir;
  if(state.calMonth>11){state.calMonth=0;state.calYear++;}
  if(state.calMonth<0){state.calMonth=11;state.calYear--;}
  render();
}
