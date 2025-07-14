// assets/js/convert.js
const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

// helper: title-case a string
function titleCase(str) {
  const s = String(str||'').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// helper: coerce to Boolean
function toBool(val) {
  const v = String(val).trim().toLowerCase();
  return (v==='true' || v==='yes' || v==='1');
}

// locate files relative to project root:
const ROOT = path.resolve(__dirname, '..','..');  
const SHEET_PATH = path.join(ROOT, 'src', 'sheet.xlsx');
const OUT_PATH   = path.join(ROOT, 'data', 'glyphs.json');

// 1) read the spreadsheet
const wb = XLSX.readFile(SHEET_PATH);
const ws = wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[ws], { defval: '' });

// 2) normalize & clean up each row
const processed = rows.map(r => ({
  ...r,
  School:        titleCase(r.School),
  V:             toBool(r.V),
  S:             toBool(r.S),
  Concentration: toBool(r.Concentration),
  Tier:      Number(r.Tier),
  Points:    Number(r.Points)
}));

// 3) sort by Name, case-insensitive
processed.sort((a,b)=>
  a.Name.localeCompare(b.Name, undefined, { sensitivity:'base' })
);

// 4) write out JSON
fs.writeFileSync(OUT_PATH, JSON.stringify(processed, null, 2), 'utf8');
console.log(`glyphs.json generated with ${processed.length} entries`);
