# Save submissions to a Google Sheet (free, no backend)

Your form stays 100% frontend. A tiny **Google Apps Script** receives each
submission and writes it to your own spreadsheet — **Testers** go to a
`Testers` tab, **Developers** go to a `Developers` tab, so the data is kept
separate. You get a normal Google Sheet link, and you can download it as a real
Excel file any time (**File → Download → Microsoft Excel (.xlsx)**).

Takes about 3 minutes.

---

## 1. Create the spreadsheet
1. Go to **https://sheets.new** (creates a blank Google Sheet) — or just use your
   existing `play_store_testing` sheet.
2. Give it a name, e.g. **Signups**. This is the sheet you'll share/download.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete whatever is in the editor and paste **all** of the code below.
3. Click the **Save** icon.

```javascript
// Writes each submission into its own tab, keeping tester / developer /
// suggestion data separate. Adapts to a custom sheet layout: it finds each
// tab by name, auto-detects the header row (even if it's not row 1), and
// fills columns by matching their header labels. Deploy as a Web App.

// Map the form "type" to YOUR tab names (rename on the right if yours differ):
var TABS = { tester: "Testing", developer: "Developer", suggestion: "Dev Name" };

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = TABS[data.type] ? data.type : "tester";
    var tabName = TABS[type];

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {                       // make the tab if it's missing
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(defaultHeaders(type));
    }

    var head = findHeaderRow(sheet);    // { row, startCol, headers:[...] }
    var nextRow = Math.max(sheet.getLastRow() + 1, head.row + 1);
    var idNumber = nextRow - head.row;  // 1, 2, 3 … for a "Tester ID" column

    var values = head.headers.map(function (label) {
      return valueForHeader(label, data, idNumber);
    });
    sheet.getRange(nextRow, head.startCol, 1, values.length).setValues([values]);

    return json({ ok: true, tab: tabName, row: nextRow });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Find the header row by scanning the top rows for a real column header.
function findHeaderRow(sheet) {
  var maxR = Math.min(20, Math.max(sheet.getLastRow(), 1));
  var maxC = Math.min(20, Math.max(sheet.getLastColumn(), 1));
  var grid = sheet.getRange(1, 1, maxR, maxC).getValues();
  for (var r = 0; r < grid.length; r++) {
    var joined = grid[r].join("|").toLowerCase();
    if (joined.indexOf("name") >= 0 || joined.indexOf("tester id") >= 0 ||
        joined.indexOf("suggest") >= 0) {
      var row = grid[r];
      var start = 0; while (start < row.length && row[start] === "") start++;
      var end = row.length - 1; while (end >= 0 && row[end] === "") end--;
      return { row: r + 1, startCol: start + 1, headers: row.slice(start, end + 1) };
    }
  }
  return { row: 1, startCol: 1, headers: grid[0] || ["Name", "Email"] };
}

// Decide what value goes under a given header label.
function valueForHeader(label, data, idNumber) {
  var h = String(label).toLowerCase().trim();
  if (h.indexOf("tester id") >= 0 || h.indexOf("dev id") >= 0 || h === "id" ||
      h === "#" || h.indexOf("s.no") >= 0 || h.indexOf("sr") >= 0 ||
      h.indexOf("serial") >= 0) return idNumber;
  if (h.indexOf("dev name") >= 0 || h.indexOf("suggest") >= 0) return data.suggestion || data.name || "";
  if (h.indexOf("name") >= 0) return data.name || data.suggestion || "";
  if (h.indexOf("email") >= 0) return data.email || "";
  if (h.indexOf("phone") >= 0 || h.indexOf("mobile") >= 0) return data.phone || "";
  if (h.indexOf("skill") >= 0) return data.skill || "";
  if (h.indexOf("github") >= 0 || h.indexOf("portfolio") >= 0 || h.indexOf("link") >= 0) return data.link || "";
  if (h.indexOf("message") >= 0 || h.indexOf("say") >= 0 || h.indexOf("note") >= 0 || h.indexOf("about") >= 0) return data.message || "";
  if (h.indexOf("android") >= 0) return data.android || "";
  if (h.indexOf("agree") >= 0 || h.indexOf("consent") >= 0 || h.indexOf("terms") >= 0) return data.agree || "";
  if (h.indexOf("date") >= 0 || h.indexOf("time") >= 0 || h.indexOf("submitted") >= 0) return data.submittedAt || new Date().toISOString();
  return "";
}

function defaultHeaders(type) {
  if (type === "developer") return ["Dev ID", "Name", "Email", "Phone", "Skill", "Link", "Message", "Agree", "Submitted At"];
  if (type === "suggestion") return ["ID", "Dev Name", "Submitted At"];
  return ["Tester ID", "Name", "Email", "Android", "Agree", "Submitted At"];
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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
