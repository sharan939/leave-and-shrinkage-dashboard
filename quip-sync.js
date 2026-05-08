// Quip Sync Module for Leave Tracker Dashboard
// This connects the dashboard to a shared Quip spreadsheet
// so all managers see the same data.

var QUIP_DOC_ID = "CnQZA0rDCing";
var QUIP_API = "https://platform.quip-amazon.com/1";
var QUIP_TOKEN = "VENiOU1BQmR4RFE=|1809762950|toiNIgUfpvfYC3RXvvDRKuk8Wcj11vkfCnOq4vRKD/g=";

// Fetch document content from Quip
function quipFetch() {
  return fetch(QUIP_API + "/threads/" + QUIP_DOC_ID, {
    headers: { "Authorization": "Bearer " + QUIP_TOKEN }
  }).then(function(r) { return r.json(); });
}

// Update document content
function quipUpdate(content) {
  return fetch(QUIP_API + "/threads/edit-document", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + QUIP_TOKEN,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "thread_id=" + QUIP_DOC_ID + "&content=" + encodeURIComponent(content) + "&format=markdown&location=0"
  }).then(function(r) { return r.json(); });
}

// Convert dashboard data to markdown table for Quip
function dataToMarkdown(db) {
  var md = "# Leave Tracker Data\\n\\n";
  md += "**Last Updated:** " + new Date().toISOString().slice(0,16) + "\\n\\n";

  // Leaves table
  md += "## Leave Records\\n\\n";
  md += "| id | alias | manager | type | from | to | days | status | reason |\\n";
  md += "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\\n";

  Object.keys(db.leaves || {}).forEach(function(mgr) {
    (db.leaves[mgr] || []).forEach(function(l) {
      md += "| " + l.id + " | " + l.alias + " | " + mgr + " | " + l.type + " | " + l.from + " | " + l.to + " | " + l.days + " | " + l.status + " | " + (l.reason||"") + " |\\n";
    });
  });

  // Daily tracker
  md += "\\n## Daily Tracker\\n\\n";
  md += "| date | alias | manager | status | leaveType | notes |\\n";
  md += "| --- | --- | --- | --- | --- | --- |\\n";

  Object.keys(db.dailyTracker || {}).forEach(function(mgr) {
    var aliases = db.dailyTracker[mgr] || {};
    Object.keys(aliases).forEach(function(alias) {
      var dates = aliases[alias] || {};
      Object.keys(dates).forEach(function(date) {
        var rec = dates[date];
        md += "| " + date + " | " + alias + " | " + mgr + " | " + rec.status + " | " + (rec.leaveType||"") + " | " + (rec.notes||"") + " |\\n";
      });
    });
  });

  return md;
}

// Parse markdown tables back to dashboard data
function markdownToData(html) {
  var db = { leaves: {}, dailyTracker: {}, monthlySheets: {} };

  // Simple table parser from HTML content
  var lines = html.split("\\n");
  var section = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.indexOf("## Leave Records") >= 0) { section = "leaves"; continue; }
    if (line.indexOf("## Daily Tracker") >= 0) { section = "daily"; continue; }
    if (!line.startsWith("|") || line.indexOf("---") >= 0) continue;

    var cells = line.split("|").map(function(c){return c.trim();}).filter(function(c){return c;});

    if (section === "leaves" && cells.length >= 8) {
      var mgr = cells[2];
      if (!db.leaves[mgr]) db.leaves[mgr] = [];
      db.leaves[mgr].push({
        id: cells[0], alias: cells[1], type: cells[3],
        from: cells[4], to: cells[5], days: parseFloat(cells[6]),
        status: cells[7], reason: cells[8] || ""
      });
    }

    if (section === "daily" && cells.length >= 4) {
      var mgr2 = cells[2];
      var alias = cells[1];
      var date = cells[0];
      if (!db.dailyTracker[mgr2]) db.dailyTracker[mgr2] = {};
      if (!db.dailyTracker[mgr2][alias]) db.dailyTracker[mgr2][alias] = {};
      db.dailyTracker[mgr2][alias][date] = {
        status: cells[3], leaveType: cells[4] || "", notes: cells[5] || ""
      };
    }
  }

  return db;
}

// Sync: Push local data to Quip
function pushToQuip() {
  var md = dataToMarkdown(db);
  quipUpdate(md).then(function(result) {
    if (result.thread) {
      toast("Data synced to Quip! All managers can see updates.");
    } else {
      toast("Sync failed. Check connection.");
      console.error(result);
    }
  }).catch(function(e) {
    toast("Sync error: " + e.message);
    console.error(e);
  });
}

// Sync: Pull data from Quip
function pullFromQuip() {
  quipFetch().then(function(result) {
    if (result.html) {
      var newDb = markdownToData(result.html);
      if (Object.keys(newDb.leaves).length > 0 || Object.keys(newDb.dailyTracker).length > 0) {
        db.leaves = newDb.leaves;
        db.dailyTracker = newDb.dailyTracker;
        save();
        render();
        toast("Data loaded from Quip! Showing latest updates.");
      } else {
        toast("No data found in Quip doc. Use Push to upload first.");
      }
    }
  }).catch(function(e) {
    toast("Pull error: " + e.message);
    console.error(e);
  });
}

// AUTO-SYNC: Push to Quip every time data is saved
var originalSave = save;
save = function() {
  originalSave();
  // Auto-push to Quip (debounced - waits 3 seconds after last change)
  clearTimeout(save._quipTimer);
  save._quipTimer = setTimeout(function() {
    pushToQuip();
  }, 3000);
};

// AUTO-LOAD: Pull from Quip when page opens
window.addEventListener("load", function() {
  // Wait 1 second for page to render, then pull latest from Quip
  setTimeout(function() {
    pullFromQuip();
  }, 1000);
});

// AUTO-REFRESH: Check Quip for updates every 60 seconds
setInterval(function() {
  pullFromQuip();
}, 60000);

console.log("Quip auto-sync enabled. Doc: " + QUIP_DOC_ID);
