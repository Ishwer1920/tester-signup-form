# Save submissions to a Google Sheet (free, no backend)

Your form stays 100% frontend. A tiny **Google Apps Script** receives each
submission and writes it to your own spreadsheet — **Testers** go to a
`Testers` tab, **Developers** go to a `Developers` tab, so the data is kept
separate. You get a normal Google Sheet link, and you can download it as a real
Excel file any time (**File → Download → Microsoft Excel (.xlsx)**).

Takes about 3 minutes.

---

## 1. Create the spreadsheet
1. Go to **https://sheets.new** (creates a blank Google Sheet).
2. Give it a name, e.g. **Signups**. This is the sheet you'll share/download.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete whatever is in the editor and paste **all** of the code below.
3. Click the **Save** icon.

```javascript
// Writes form submissions to "Testers" and "Developers" tabs.
// Deploy as a Web App (see the README steps).

var HEADERS = {
  tester:     ["submittedAt", "name", "email", "android", "agree"],
  developer:  ["submittedAt", "name", "email", "phone", "skill", "link", "message", "agree"],
  suggestion: ["submittedAt", "suggestion"]
};
var TABS = { tester: "Testers", developer: "Developers", suggestion: "Suggestions" };

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = HEADERS[data.type] ? data.type : "tester";
    var tabName = TABS[type];

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

    var headers = HEADERS[type];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);          // write header row once
    }
    var row = headers.map(function (h) {
      return (data[h] !== undefined && data[h] !== null) ? data[h] : "";
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("OK");
}
```

## 3. Deploy it as a Web App
1. Top-right: **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" → choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
4. **Deploy** → **Authorize access** → pick your account → *Advanced* →
   "Go to (project) (unsafe)" → **Allow**. (It's your own script; this is normal.)
5. Copy the **Web app URL** — it ends with `/exec`.

## 4. Connect it to the form
1. Open `script.js`.
2. Find this line near the top and paste your URL between the quotes:
   ```javascript
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
3. Save, then push to GitHub (or just reload locally to test).

## 5. Test
- Submit the **tester** form → a row appears in the **Testers** tab.
- Submit the **developer** form → a row appears in the **Developers** tab.

---

### Notes
- **The link you share is your Google Sheet's own URL** (copy it from the browser
  address bar, or **Share** for view access). I can't generate that link for you —
  it lives in your Google account.
- The browser can't read the script's response (that's the `no-cors` mode), so the
  form always shows the thank-you screen. Check the sheet to confirm a row landed.
- To change a deployed script later, edit the code then **Deploy → Manage
  deployments → Edit → Version: New version → Deploy** (the `/exec` URL stays the same).
- Want a different column order or extra columns? Edit the `HEADERS` lists in the script.
