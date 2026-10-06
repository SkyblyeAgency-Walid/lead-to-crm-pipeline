function extractSourceListUpload() {
  const sh      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.SOURCE_LIST_UPLOAD);
  const c       = COLS_SOURCE_LIST_UPLOAD;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;

  const readW = c.RAW_JSON + 1;
  let processed = 0;

  for (let start = 2; start <= lastRow; start += SL_CFG.CHUNK_ROWS) {
    const rows = Math.min(SL_CFG.CHUNK_ROWS, lastRow - start + 1);
    const blk  = sh.getRange(start, 1, rows, readW).getValues();

    const stOut = new Array(rows).fill(null);
    const fOut  = new Array(rows).fill(null);

    for (let r = 0; r < rows; r++) {
      const row = blk[r];
      const raw = toStr_(row[c.RAW_JSON]);
      if (!raw || toStr_(row[c.STATUS]) === STATUS_SL.EXTRACTED) continue;

      try {
        const f = parseSlJson_(raw);
        fOut[r]  = [f.fullName, f.email, f.phone, f.company, f.title];
        stOut[r] = [STATUS_SL.EXTRACTED];
      } catch (e) {
        stOut[r] = [STATUS_SL.ERROR];
        console.warn('Row ' + (start + r) + ' UID ' + row[c.UID] + ': JSON parse: ' + e.message);
      }
      processed++;
    }

    writeRuns_(sh, start, c.STATUS    + 1, 1,                  stOut);
    writeRuns_(sh, start, c.FULL_NAME + 1, SL_CFG.FIELD_WIDTH, fOut);
  }
  return processed;
}

function parseSlJson_(raw) {
  const o = JSON.parse(raw);
  if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new Error('not a JSON object');

  const k = {};
  for (const p in o) k[String(p).toLowerCase()] = o[p];

  return {
    fullName: parseSlFullName_(k),
    email   : pickSl_(k, SL_KEYS.EMAIL),
    phone   : pickSl_(k, SL_KEYS.PHONE),
    company : pickSl_(k, SL_KEYS.COMPANY),
    title   : pickSl_(k, SL_KEYS.TITLE)
  };
}

function parseSlFullName_(k) {
  const [firstKey, lastKey] = SL_KEYS.FULL_NAME[0];
  const first = toStr_(k[firstKey]);
  const last  = toStr_(k[lastKey]);
  const combined = (first && last) ? first + ' ' + last : (first || last);
  return combined || pickSl_(k, SL_KEYS.FULL_NAME.slice(1));
}

function pickSl_(k, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = toStr_(k[keys[i]]);
    if (v) return v;
  }
  return '';
}