// assets/js/convert.js
const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

// helper: title-case a string
function titleCase(str) {
  if (!str) return '';
  const s = String(str).trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// helper: coerce to boolean
function toBool(val) {
  if (typeof val === 'boolean') return val;
  const v = String(val).trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1';
}

// 1) Load the spreadsheet
const workbook = XLSX.readFile(path.join(__dirname, '..', 'src', 'sheet.xlsx'));
const sheet    = workbook.SheetNames[0];
const rows     = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' });

// 2) Normalize each row
const processed = rows.map(r => ({
  ...r,
  // ensure proper-case school names
  School: titleCase(r.School),
  // Booleans
  V:           toBool(r.V),
  S:           toBool(r.S),
  Concentration: toBool(r.Concentration),
  // numeric coercion (optional, but keeps JSON tidy)
  Tier:      Number(r.Tier),
  Points:    Number(r.Points)
  // leave all other fields (Name, Casting Time, Duration, New Text, Higher Tiers) as-is
}));

// 3) Sort by Name, case-insensitive
processed.sort((a, b) =>
  a.Name.localeCompare(b.Name, undefined, { sensitivity: 'base' })
);

// 4) Write out the JSON
const outPath = path.join(__dirname, '..', 'data', 'glyphs.json');
fs.writeFileSync(outPath, JSON.stringify(processed, null, 2), 'utf8');

console.log(`glyphs.json generated with ${processed.length} entries`);
