# Glyph-Database

Static site for displaying glyph cards from spreadsheet data.

## Updating the data

### Simple manual refresh

1. Download the latest Excel file from OneDrive.
2. In GitHub, replace `src/sheet.xlsx` with the new file.
3. Commit the change to `main`.

That push rebuilds `data/glyphs.json` and republishes the Pages site automatically.

### Automatic refresh

The repo is configured to pull from this published Google Sheets URL every hour:

`https://docs.google.com/spreadsheets/d/e/2PACX-1vSCEpYDEzWrpUaiujkZQhdMJUo5h_o8E_BCTeWPe0ZoNwcWvdtvoJ_qHsyh9stDmHkEE3U11MMvi4Ft/pub?output=xlsx`

- The `Scheduled glyph-data update` workflow runs every hour.
- You can also run that workflow manually from the GitHub Actions tab.
- If the remote download fails, the workflow falls back to `src/sheet.xlsx`.
- Remote sources can be either an `.xlsx` file URL or a published CSV URL.

## OneDrive note

Some OneDrive share links work in a browser but block automated downloads. If that happens, keep using the manual refresh flow or switch to a true direct-download link.

## If the Google link changes

If you re-publish the Google Sheet and it gets a new URL, update the URL in:

- `.github/workflows/data-update.yml`
