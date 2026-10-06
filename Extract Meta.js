function extractSourceMeta() {
  const sh      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.SOURCE_META);
  const c       = COLS_SOURCE_META;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;

  const width = c.INTEREST - c.STATUS + 1;
  let processed = 0;

  for (let start = 2; start <= lastRow; start += SM_CFG.CHUNK_ROWS) {
    const rows = Math.min(SM_CFG.CHUNK_ROWS, lastRow - start + 1);
    const data = sh.getRange(start, 1, rows, c.INTEREST + 1).getValues();
    const out  = new Array(rows).fill(null);

    for (let r = 0; r < rows; r++) {
      const row = data[r];
      const raw = toStr_(row[c.RAW_JSON]);
      if (!raw || toStr_(row[c.STATUS]) === STATUS_SM.EXTRACTED) continue;

      const buf = new Array(width).fill('');
      buf[c.RAW_JSON - c.STATUS] = row[c.RAW_JSON];

      try {
        const f = parseSmJson_(raw);
        buf[c.LEADGEN_ID - c.STATUS] = f.leadgenId;
        buf[c.CREATED_AT - c.STATUS] = f.createdAt;
        buf[c.FULL_NAME  - c.STATUS] = f.fullName;
        buf[c.EMAIL      - c.STATUS] = f.email;
        buf[c.PHONE      - c.STATUS] = f.phone;
        buf[c.COMPANY    - c.STATUS] = f.company;
        buf[c.INTEREST   - c.STATUS] = f.interest;
        buf[0] = STATUS_SM.EXTRACTED;
      } catch (e) {
        buf[0] = STATUS_SM.ERROR;
        buf[c.ERROR_MSG - c.STATUS] = 'JSON parse: ' + e.message;
      }

      out[r] = buf;
      processed++;
    }

    writeRuns_(sh, start, c.STATUS + 1, width, out);
  }
  return processed;
}

function parseSmJson_(raw) {
  const o = JSON.parse(raw);
  if (o === null || typeof o !== 'object' || Array.isArray(o)) throw new Error('not a JSON object');

  const f = {};
  if (Array.isArray(o['field_data'])) {
    for (let i = 0; i < o['field_data'].length; i++) {
      const item = o['field_data'][i];
      if (!item || typeof item !== 'object') continue;
      const key = String(item['field_name'] || '').toLowerCase();
      const v   = Array.isArray(item['values']) && item['values'].length ? item['values'][0] : '';
      if (key && !(key in f)) f[key] = v;
    }
  }

  return {
    leadgenId: toStr_(o['id']),
    createdAt: parseSmDate_(o['created_time']),
    fullName : toStr_(f['full_name']      || f['name']),
    email    : toStr_(f['email']),
    phone    : toStr_(f['phone_number']   || f['phone']),
    company  : toStr_(f['company_name']   || f['company']),
    interest : toStr_(f['interest'])
  };
}

function parseSmDate_(s) {
  s = toStr_(s);
  if (!s) return '';
  const m = s.match(SM_DATE_RE);
  if (!m) return '';
  const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4] || 0, +m[5] || 0, +m[6] || 0);
  if (d.getFullYear() !== +m[3] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return '';
  return d;
}