function extractWebsite() {
  const sh      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.SOURCE_WEBSITE);
  const c       = COLS_SOURCE_WEBSITE;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;

  const width = c.PAGE - c.STATUS + 1;
  let processed = 0;

  for (let start = 2; start <= lastRow; start += SW_CFG.CHUNK_ROWS) {
    const rows = Math.min(SW_CFG.CHUNK_ROWS, lastRow - start + 1);
    const data = sh.getRange(start, 1, rows, c.PAGE + 1).getValues();
    const out  = new Array(rows).fill(null);

    for (let r = 0; r < rows; r++) {
      const row = data[r];
      const raw = toStr_(row[c.RAW_JSON]);
      if (!raw || toStr_(row[c.STATUS]) === STATUS_SW.EXTRACTED) continue;

      const buf = new Array(width).fill('');
      buf[c.RAW_JSON - c.STATUS] = row[c.RAW_JSON];

      try {
        const f = parseSwJson_(raw);
        buf[c.NAME    - c.STATUS] = f.name;
        buf[c.EMAIL   - c.STATUS] = f.email;
        buf[c.PHONE   - c.STATUS] = f.phone;
        buf[c.COMPANY - c.STATUS] = f.company;
        buf[c.MESSAGE - c.STATUS] = f.message;
        buf[c.PAGE    - c.STATUS] = f.page;
        buf[0] = STATUS_SW.EXTRACTED;
      } catch (e) {
        buf[0] = STATUS_SW.ERROR;
        buf[c.ERROR_MSG - c.STATUS] = 'JSON parse: ' + e.message;
      }

      out[r] = buf;
      processed++;
    }

    writeRuns_(sh, start, c.STATUS + 1, width, out);
  }
  return processed;
}

function parseSwJson_(raw) {
  const o = JSON.parse(raw);
  if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new Error('not a JSON object');
  const k = {};
  for (const p in o) k[String(p).toLowerCase()] = o[p];
  return {
    name   : toStr_(k['name']),
    email  : toStr_(k['email']),
    phone  : toStr_(k['phone']),
    company: toStr_(k['company']),
    message: toStr_(k['message']),
    page   : toStr_(k['page'])
  };
}