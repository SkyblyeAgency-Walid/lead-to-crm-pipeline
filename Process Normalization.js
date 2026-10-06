function normalizeEngineData() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(NM_CFG.LOCK_WAIT)) {
    console.warn('normalizeEngineData: another run is active.');
    return 0;
  }
  try {
    const sh      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.ENGINE);
    if (!sh) throw new Error('Missing sheet: ' + SHEET.ENGINE);
    const E       = COLS_ENGINE;
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return 0;

    let processed = 0;

    for (let start = 2; start <= lastRow; start += NM_CFG.CHUNK_ROWS) {
      const rows = Math.min(NM_CFG.CHUNK_ROWS, lastRow - start + 1);

      const nameEmail = sh.getRange(start, E.FULL_NAME + 1, rows, 2).getValues();
      const phones    = sh.getRange(start, E.PHONE + 1, rows, 1).getValues();
      const statuses  = sh.getRange(start, E.ENG_NORM_COL + 1, rows, 1).getValues();

      const efOut = new Array(rows).fill(null);
      const iOut  = new Array(rows).fill(null);
      const mOut  = new Array(rows).fill(null);

      for (let r = 0; r < rows; r++) {
        if (toStr_(statuses[r][0]) !== ENG_NORM.PENDING) continue;

        efOut[r] = [titleCaseName_(nameEmail[r][0]),
                    toStr_(nameEmail[r][1]).toLowerCase()];
        iOut[r]  = [normalizePhone_(phones[r][0])];
        mOut[r]  = [ENG_NORM.COMPLETED];
        processed++;
      }

      writeRuns_(sh, start, E.FULL_NAME + 1, 2,              efOut);
      writeRuns_(sh, start, E.PHONE + 1,    1,               iOut);
      writeRuns_(sh, start, E.ENG_NORM_COL + 1, 1,           mOut);
    }
    return processed;
  } finally {
    lock.releaseLock();
  }
}

function titleCaseName_(v) {
  let s = toStr_(v);
  if (!s) return '';
  s = s.replace(NM_NAME_STRIP_RE, ' ')
       .replace(/\s+/g, ' ')
       .trim()
       .toLowerCase();
  if (!s) return '';
  let out = '', cap = true;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (ch === ' ') { out += ch; cap = true; }
    else { out += cap ? ch.toUpperCase() : ch; cap = false; }
  }
  return out;
}

function normalizePhone_(v) {
  const orig = toStr_(v);
  if (!orig) return '';
  let s = orig.replace(/^['\u2019"]+/, '')
              .replace(/[()\[\]\s.\-\/]/g, '');

  let plus = false;
  if (s.charAt(0) === '+') { plus = true; s = s.slice(1); }
  else if (s.indexOf('+') !== -1) return orig;
  if (!/^\d+$/.test(s) || !s) return orig;

  if (!plus && s.lastIndexOf(PHONE_NORM.INTL_PREFIX, 0) === 0 && s.length > PHONE_NORM.INTL_PREFIX.length) {
    s = s.slice(PHONE_NORM.INTL_PREFIX.length);       // 00… → intl
    plus = true;
  }

  let cc, nat;
  if (plus) {
    cc = matchCountryCode_(s);
    if (!cc) return orig;
    nat = s.slice(cc.length);
  } else if (s.charAt(0) === PHONE_NORM.TRUNK) {
    cc = PHONE_NORM.DEFAULT_CC; nat = s.slice(1);
  } else if (s.length === 9) {
    cc = PHONE_NORM.DEFAULT_CC; nat = s;
  } else {
    cc = matchCountryCode_(s);
    if (!cc) return orig;
    nat = s.slice(cc.length);
  }

  if (nat.charAt(0) === PHONE_NORM.TRUNK) nat = nat.slice(1);

  if (nat.length < PHONE_NORM.MIN_DIGITS ||
      nat.length + cc.length > PHONE_NORM.MAX_DIGITS) return orig;

  return '+' + cc + nat;
}

function matchCountryCode_(digits) {
  const list = PHONE_NORM.COUNTRY_CODES;
  let best = '';
  for (let i = 0; i < list.length; i++) {
    const code = list[i];
    if (code.length > best.length &&
        digits.length > code.length &&
        digits.substring(0, code.length) === code) {
      best = code;
    }
  }
  return best || '';
}