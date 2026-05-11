// Shared Data Sync Module
// Uses Google Sheets as backend via Apps Script
// Everyone reads/writes to the same Google Sheet

var SHEET_API = "https://script.google.com/macros/s/AKfycbznC_SjL37-Thv05F_AHCShNapPsgEW0NAi31_YO7xF61cMLkSIZ2_KlfMW-hufiIMe/exec";

// Save data to Google Sheet (compressed)
function saveSharedData() {
  var compact = {l:{},d:{}};
  // Compress leaves
  Object.keys(db.leaves||{}).forEach(function(mgr){
    compact.l[mgr] = (db.leaves[mgr]||[]).map(function(l){
      return [l.id,l.alias,l.type,l.from,l.to,l.days,l.status,l.reason||''];
    });
  });
  // Compress daily tracker
  var codeMap = {present:'P',absent:'A',halfday:'H',mandate_off:'M'};
  Object.keys(db.dailyTracker||{}).forEach(function(mgr){
    compact.d[mgr] = {};
    Object.keys(db.dailyTracker[mgr]||{}).forEach(function(alias){
      compact.d[mgr][alias] = {};
      Object.keys(db.dailyTracker[mgr][alias]||{}).forEach(function(date){
        var s = db.dailyTracker[mgr][alias][date].status || 'present';
        compact.d[mgr][alias][date] = codeMap[s] || 'P';
      });
    });
  });
  fetch(SHEET_API, {
    method: "POST",
    headers: {"Content-Type": "text/plain"},
    body: JSON.stringify(compact)
  }).then(function(r){ return r.json(); })
    .then(function(result){
      if(result.success) toast("Saved! All managers can see updates.");
    }).catch(function(e){ console.log("Save error:", e); });
}

// Load data from Google Sheet
function loadSharedData() {
  fetch(SHEET_API)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data && data.l){
        // Decompress leaves
        db.leaves = {};
        Object.keys(data.l).forEach(function(mgr){
          db.leaves[mgr] = data.l[mgr].map(function(arr){
            return {id:arr[0],alias:arr[1],type:arr[2],from:arr[3],to:arr[4],days:arr[5],status:arr[6],reason:arr[7]||''};
          });
        });
        // Decompress daily tracker
        db.dailyTracker = {};
        var statusMap = {'P':'present','A':'absent','H':'halfday','M':'mandate_off'};
        Object.keys(data.d||{}).forEach(function(mgr){
          db.dailyTracker[mgr] = {};
          Object.keys(data.d[mgr]).forEach(function(alias){
            db.dailyTracker[mgr][alias] = {};
            Object.keys(data.d[mgr][alias]).forEach(function(date){
              var code = data.d[mgr][alias][date];
              db.dailyTracker[mgr][alias][date] = {status:statusMap[code]||'present',leaveType:'',notes:code};
            });
          });
        });
        save();
        render();
        toast("Latest data loaded!");
      } else if(data && data.leaves) {
        // Uncompressed format fallback
        db.leaves = data.leaves || {};
        db.dailyTracker = data.dailyTracker || {};
        save();
        render();
        toast("Latest data loaded!");
      }
    }).catch(function(e){
      console.log("Cloud load failed, using local data");
    });
}

// Auto-save to cloud after every change (debounced 5 seconds)
var _origSave = save;
save = function() {
  _origSave();
  clearTimeout(save._cloudTimer);
  save._cloudTimer = setTimeout(saveSharedData, 5000);
};

// Auto-load from cloud on page open
window.addEventListener("load", function(){
  setTimeout(loadSharedData, 1000);
});

// Refresh from cloud every 2 minutes
setInterval(loadSharedData, 120000);
