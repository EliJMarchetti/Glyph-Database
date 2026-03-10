// assets/js/convert.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// helper: title-case a string
function titleCase(str) {
  const s = String(str || '').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// helper: coerce to Boolean
function toBool(val) {
  const v = String(val).trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1';
}

// locate files relative to project root
const ROOT = path.resolve(__dirname, '..', '..');
const SHEET_PATH = path.join(ROOT, 'src', 'sheet.xlsx');
const OUT_PATH = path.join(ROOT, 'data', 'glyphs.json');
const SOURCE_URL = String(process.env.GLYPH_SOURCE_URL || '').trim();
const SAVE_DOWNLOADED_SOURCE =
  String(process.env.SAVE_DOWNLOADED_SOURCE || '').trim().toLowerCase() === 'true';
const EXPECTED_HEADERS = [
  'Name',
  'Tier',
  'Points',
  'School',
  'V',
  'S',
  'Casting Time',
  'Concentration',
  'Duration',
  'Range',
  'Rite',
  'New Text',
  'Higher Tiers',
  'Ignore'
];

function rowsToObjects(sheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const firstRow = rawRows[0] || [];
  const hasExpectedHeader = EXPECTED_HEADERS.every(
    (header, index) => String(firstRow[index] || '').trim() === header
  );
  const dataRows = hasExpectedHeader ? rawRows.slice(1) : rawRows;

  return dataRows
    .map(cols =>
      Object.fromEntries(
        EXPECTED_HEADERS.map((header, index) => [header, cols[index] ?? ''])
      )
    )
    .filter(row => Object.values(row).some(value => String(value).trim() !== ''));
}

async function loadWorkbook() {
  if (!SOURCE_URL) {
    console.log(`Using local spreadsheet: ${SHEET_PATH}`);
    return XLSX.readFile(SHEET_PATH);
  }

  console.log(`Attempting remote spreadsheet download from ${SOURCE_URL}`);

  try {
    const response = await fetch(SOURCE_URL, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Glyph-Database-Updater/1.0',
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,text/csv,text/plain,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const buffer = Buffer.from(await response.arrayBuffer());
    const looksLikeCsv =
      SOURCE_URL.toLowerCase().includes('.csv') ||
      SOURCE_URL.toLowerCase().includes('format=csv') ||
      contentType.includes('text/csv') ||
      contentType.includes('text/plain');
    const workbook = looksLikeCsv
      ? XLSX.read(buffer.toString('utf8'), { type: 'string' })
      : XLSX.read(buffer, { type: 'buffer' });

    if (SAVE_DOWNLOADED_SOURCE) {
      fs.writeFileSync(SHEET_PATH, buffer);
      console.log(`Saved downloaded spreadsheet to ${SHEET_PATH}`);
    }

    return workbook;
  } catch (error) {
    console.warn(`Remote download failed (${error.message}). Falling back to local spreadsheet.`);
    return XLSX.readFile(SHEET_PATH);
  }
}

async function main() {
  // 1) read the spreadsheet
  const wb = await loadWorkbook();
  const ws = wb.SheetNames[0];
  const rows = rowsToObjects(wb.Sheets[ws]);

  // 2) normalize & clean up each row
  const processed = rows.map(r => ({
    ...r,
    School: titleCase(r.School),
    V: toBool(r.V),
    S: toBool(r.S),
    Concentration: toBool(r.Concentration),
    Tier: Number(r.Tier),
    Points: Number(r.Points)
  }));

  // 3) sort by Name, case-insensitive
  const sorted = processed
    .filter(r => String(r.Name || '').trim())
    .sort((a, b) =>
      a.Name.localeCompare(b.Name, undefined, { sensitivity: 'base' })
    );

  // 4) write out JSON
  fs.writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf8');
  console.log(`glyphs.json generated with ${sorted.length} entries`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
