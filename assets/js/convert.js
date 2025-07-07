const XLSX = require('xlsx');
   const fs   = require('fs');
   // Read the spreadsheet
   const wb = XLSX.readFile('./src/sheet.xlsx');
   const wsName = wb.SheetNames[0];
   const rows   = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { defval: '' });
   // Sort by Name
   rows.sort((a, b) => a.Name.localeCompare(b.Name));
   // Save as JSON
   fs.writeFileSync('./data/glyphs.json', JSON.stringify(rows, null, 2));
   console.log(`glyphs.json generated with ${rows.length} entries`);