# Leave & Shrinkage Management Dashboard

## Setup for Shared Data (Google Sheets Backend)

### Step 1: Create a Google Sheet
1. Go to https://sheets.google.com and create a new spreadsheet
2. Name it "Leave Dashboard Data"
3. Create these sheets (tabs):
   - `leaves` — columns: id, alias, manager, type, from, to, days, status, reason, appliedOn
   - `daily` — columns: date, alias, manager, status, notes
   - `monthly` — columns: manager, month, alias, date, value

### Step 2: Publish as Web App
1. Go to Extensions → Apps Script
2. Paste the Google Apps Script code (see `google-apps-script.js` in this repo)
3. Deploy → New Deployment → Web App
4. Set "Who has access" to "Anyone"
5. Copy the deployment URL

### Step 3: Update Dashboard
1. Open `app.js`
2. Set `SHEET_API_URL` to your deployment URL
3. The dashboard will now read/write from the shared Google Sheet

## Local Usage
Just open `dashboard-standalone.html` in any browser. Data is stored locally per browser.

## Hosted Version
Deploy to GitHub Pages for a shareable link.
