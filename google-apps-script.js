/**
 * Google Apps Script - Backend for Leave & Shrinkage Dashboard
 * 
 * SETUP:
 * 1. Create a Google Sheet with tabs: "leaves", "daily", "monthly"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire code
 * 4. Deploy > New Deployment > Web App > "Anyone" can access
 * 5. Copy the URL and put it in your dashboard's SHEET_API_URL
 */

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet || 'leaves';
  const manager = e.parameter.manager || '';
  
  try {
    if (action === 'read') {
      return readData(sheet, manager);
    } else if (action === 'readAll') {
      return readAllData();
    }
    return jsonResponse({ error: 'Invalid action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addLeave') {
      return addLeave(data);
    } else if (action === 'updateLeave') {
      return updateLeave(data);
    } else if (action === 'deleteLeave') {
      return deleteLeave(data);
    } else if (action === 'updateDaily') {
      return updateDaily(data);
    } else if (action === 'updateMonthly') {
      return updateMonthly(data);
    } else if (action === 'bulkSync') {
      return bulkSync(data);
    }
    return jsonResponse({ error: 'Invalid action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ========== READ ==========
function readData(sheetName, manager) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ data: [], headers: data[0] || [] });
  
  const headers = data[0];
  let rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  
  // Filter by manager if specified
  if (manager) {
    rows = rows.filter(r => r.manager === manager);
  }
  
  return jsonResponse({ data: rows, headers: headers });
}

function readAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  ['leaves', 'daily', 'monthly'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      if (data.length >= 2) {
        const headers = data[0];
        result[name] = data.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = row[i]; });
          return obj;
        });
      } else {
        result[name] = [];
      }
    }
  });
  
  return jsonResponse(result);
}

// ========== LEAVES ==========
function addLeave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('leaves');
  if (!sheet) {
    sheet = ss.insertSheet('leaves');
    sheet.appendRow(['id', 'alias', 'manager', 'type', 'from', 'to', 'days', 'status', 'reason', 'appliedOn']);
  }
  
  const row = [
    data.id || 'L' + Date.now(),
    data.alias,
    data.manager,
    data.type,
    data.from,
    data.to,
    data.days,
    data.status || 'pending',
    data.reason || '',
    data.appliedOn || new Date().toISOString().slice(0, 10)
  ];
  
  sheet.appendRow(row);
  return jsonResponse({ success: true, id: row[0] });
}

function updateLeave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('leaves');
  if (!sheet) return jsonResponse({ error: 'Sheet not found' });
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idCol] === data.id) {
      // Update the row
      headers.forEach((h, col) => {
        if (data[h] !== undefined && h !== 'id') {
          sheet.getRange(i + 1, col + 1).setValue(data[h]);
        }
      });
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ error: 'Record not found' });
}

function deleteLeave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('leaves');
  if (!sheet) return jsonResponse({ error: 'Sheet not found' });
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idCol] === data.id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ error: 'Record not found' });
}

// ========== DAILY TRACKER ==========
function updateDaily(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('daily');
  if (!sheet) {
    sheet = ss.insertSheet('daily');
    sheet.appendRow(['date', 'alias', 'manager', 'status', 'notes']);
  }
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  // Check if entry exists for this date + alias
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.date && allData[i][1] === data.alias) {
      // Update existing
      sheet.getRange(i + 1, 4).setValue(data.status);
      sheet.getRange(i + 1, 5).setValue(data.notes || '');
      return jsonResponse({ success: true, updated: true });
    }
  }
  
  // Add new
  sheet.appendRow([data.date, data.alias, data.manager || 'aggannam', data.status, data.notes || '']);
  return jsonResponse({ success: true, created: true });
}

// ========== MONTHLY SHEET ==========
function updateMonthly(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('monthly');
  if (!sheet) {
    sheet = ss.insertSheet('monthly');
    sheet.appendRow(['manager', 'month', 'alias', 'date', 'value']);
  }
  
  const allData = sheet.getDataRange().getValues();
  
  // Check if entry exists
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.manager && allData[i][2] === data.alias && allData[i][3] === data.date) {
      sheet.getRange(i + 1, 5).setValue(data.value);
      return jsonResponse({ success: true, updated: true });
    }
  }
  
  // Add new
  sheet.appendRow([data.manager, data.month, data.alias, data.date, data.value]);
  return jsonResponse({ success: true, created: true });
}

// ========== BULK SYNC ==========
function bulkSync(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (data.leaves && data.leaves.length) {
    let sheet = ss.getSheetByName('leaves');
    if (!sheet) {
      sheet = ss.insertSheet('leaves');
      sheet.appendRow(['id', 'alias', 'manager', 'type', 'from', 'to', 'days', 'status', 'reason', 'appliedOn']);
    }
    // Clear existing and re-write
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
    }
    data.leaves.forEach(l => {
      sheet.appendRow([l.id, l.alias, l.manager, l.type, l.from, l.to, l.days, l.status, l.reason || '', l.appliedOn || '']);
    });
  }
  
  if (data.daily && data.daily.length) {
    let sheet = ss.getSheetByName('daily');
    if (!sheet) {
      sheet = ss.insertSheet('daily');
      sheet.appendRow(['date', 'alias', 'manager', 'status', 'notes']);
    }
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
    }
    data.daily.forEach(d => {
      sheet.appendRow([d.date, d.alias, d.manager, d.status, d.notes || '']);
    });
  }
  
  return jsonResponse({ success: true, message: 'Bulk sync complete' });
}

// ========== HELPERS ==========
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
