function writeRuns_(sh, startRow, startCol, width, buf) {
  let i = 0;
  while (i < buf.length) {
    if (!buf[i]) { i++; continue; }
    let j = i;
    while (j < buf.length && buf[j]) j++;
    sh.getRange(startRow + i, startCol, j - i, width).setValues(buf.slice(i, j));
    i = j;
  }
}

function toStr_(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }

function makeDest_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing sheet: ' + sheetName);
  return { sh: sh, row: Math.max(sh.getLastRow() + 1, 2) };
}

function flushDest_(dest, rows) {
  if (!rows || !rows.length) return;
  dest.sh.getRange(dest.row, 1, rows.length, rows[0].length).setValues(rows);
  dest.row += rows.length;
}

function buildLeadIdIndex_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  const idx = {};
  if (!sh) throw new Error('Missing sheet: ' + sheetName);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return idx;
  const vals = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    const id = toStr_(vals[i][0]);
    if (id) idx[id] = true;
  }
  return idx;
}