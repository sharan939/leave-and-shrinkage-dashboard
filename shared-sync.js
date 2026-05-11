// Shared Data Sync Module
// Uses Google Sheets as backend via Apps Script
// Everyone reads/writes to the same Google Sheet

var SHEET_API = "https://script.google.com/macros/s/AKfycbznC_SjL37-Thv05F_AHCShNapPsgEW0NAi31_YO7xF61cMLkSIZ2_KlfMW-hufiIMe/exec";

// Save data to Google Sheet
function saveSharedData() {
  var data = JSON.stringify(db);
  fetch(SHEET_API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: data
  }).then(function(r){ return r.json(); })
    .then(function(result){
      if(result.success) toast("Saved to cloud! Everyone can see updates now.");
      else toast("Save failed.");
    }).catch(function(e){ toast("Save error: " + e.message); });
}

// Load data from Google Sheet
function loadSharedData() {
  fetch(SHEET_API)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data && data.leaves){
        db.leaves = data.leaves || {};
        db.dailyTracker = data.dailyTracker || {};
        db.monthlySheets = data.monthlySheets || {};
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
