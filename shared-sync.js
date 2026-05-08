// Shared Data Sync Module
// Uses a shared JSON file that everyone can access
// The file is stored alongside the dashboard files

var SHARED_FILE = "shared-data.json";

// Save data to shared file (downloads it so you can place in shared folder)
function saveSharedData() {
  var data = JSON.stringify(db, null, 2);
  var blob = new Blob([data], {type: "application/json"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = SHARED_FILE;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Data saved! Place this file in the same folder as the dashboard for others to see.");
}

// Load data from shared file (reads from same folder)
function loadSharedData() {
  fetch(SHARED_FILE)
    .then(function(r) {
      if (!r.ok) throw new Error("File not found");
      return r.json();
    })
    .then(function(data) {
      if (data.leaves) db.leaves = data.leaves;
      if (data.dailyTracker) db.dailyTracker = data.dailyTracker;
      if (data.monthlySheets) db.monthlySheets = data.monthlySheets;
      save();
      render();
      toast("Latest data loaded!");
    })
    .catch(function(e) {
      toast("No shared data file found. Click 'Save & Share' first to create one.");
    });
}

// Auto-load on page open
window.addEventListener("load", function() {
  setTimeout(loadSharedData, 500);
});
