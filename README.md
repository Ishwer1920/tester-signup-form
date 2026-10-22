# Frontend Join Form

A dark, glassmorphic "fill-up" form with two flows — a quick **Join us** form
(Name, Email, agree, Submit) and a **"Wanna join the developer?"** application
form. Styled with a warm dark background, frosted-glass card, an animated glowing
gradient border, floating orbs, a shimmering lime button, and a confetti +
"Thanks — we'll reach you shortly" animation on submit.

**Pure frontend** — plain HTML, CSS and JS, no build step and no framework.
Drop it on GitHub Pages and you have a live site.

## Files

| File | What it is |
|------|------------|
| `index.html` | The page and the form markup |
| `styles.css` | All the styling / theme (colors live in `:root` at the top) |
| `script.js`  | Validation, show/hide password, success screen |

## Preview locally

Just double-click `index.html`, or run a tiny server:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Host it free on GitHub Pages

1. Create a repo and push these files to the **root**:
   ```bash
   git init
   git add .
   git commit -m "CryptoNest frontend form"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment**
   → Source: **Deploy from a branch** → Branch: **main** / **/ (root)** → Save.
3. Your site goes live at `https://<you>.github.io/<repo>/` in a minute or two.

## Make it yours

- **Colors:** edit the variables in `:root` at the top of `styles.css`
  (`--lime`, `--pink`, `--bg-0`, …).
- **Fields:** add/remove a `.field` block in `index.html`. If a field needs
  validation, add a matching rule in the `rules` object in `script.js`.
- **Logo / title:** change the `.brand` and `<h1>` in `index.html`.

## Save submissions to a Google Sheet (Testers & Developers kept separate)

Out of the box the form validates and shows a thank-you screen, and the data is
logged to the browser console. To make every submission land in a spreadsheet —
with **testers and developers on separate tabs**, and a link you can share or
download as Excel — follow **[SETUP-SHEET.md](SETUP-SHEET.md)**.

In short: create a Google Sheet → add the provided Apps Script → deploy it as a
Web App → paste the URL into `SHEET_ENDPOINT` at the top of `script.js`. Done, no
backend needed. The form already tags each submission with `type: "tester"` or
`type: "developer"` so the script can route it to the right tab.
