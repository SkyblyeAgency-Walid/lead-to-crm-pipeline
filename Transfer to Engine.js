function transferToEngine() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(TR_CFG.LOCK_WAIT)) {
    console.warn('transferToEngine: another run is active.');
    return 0;
  }
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const engSh = ss.getSheetByName(SHEET.ENGINE);
    if (!engSh) throw new Error('Missing sheet: ' + SHEET.ENGINE);

    const lastEng = engSh.getLastRow();
    const scanned = scanEngineColA_(engSh, lastEng);
    const st = {
      nextId   : scanned.max + 1,
      slots    : scanned.slots,
      slotIdx  : 0,
      appendRow: scanned.appendRow
    };

    let total = 0;
    for (let s = 0; s < TR_SOURCES.length; s++) {
      total += processTransferSource_(TR_SOURCES[s], ss, engSh, st);
    }
    return total;
  } finally {
    lock.releaseLock();
  }
}

function processTransferSource_(src, ss, engSh, st) {
  const sh = ss.getSheetByName(src.sheet);
  if (!sh) throw new Error('Missing sheet: ' + src.sheet);
  const c  = src.cols;
  const E  = COLS_ENGINE;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;

  let done = 0;

  for (let start = 2; start <= lastRow; start += TR_CFG.CHUNK_ROWS) {
    const rows = Math.min(TR_CFG.CHUNK_ROWS, lastRow - start + 1);
    const blk  = sh.getRange(start, 1, rows, src.readW).getValues();

    const srcOut  = new Array(rows).fill(null);
    const engRows = [];

    for (let r = 0; r < rows; r++) {
      const row = blk[r];
      if (toStr_(row[c.STATUS]) !== STATUS_TR.EXTRACTED) continue;

      try {
        const name  = toStr_(row[src.name]);
        const email = toStr_(row[src.email]);
        const phone = toStr_(row[src.phone]);

        if (countFilled_(name, email, phone) < 2) throw new Error(TR_ERR.INSUFFICIENT);

        const when   = new Date();
        const engRow = new Array(E.NOTE + 1).fill('');
        engRow[E.LEAD_ID]     = padLeadId_(st.nextId++);
        engRow[E.UID]         = toStr_(row[c.UID]);
        engRow[E.SOURCE]      = src.source;
        engRow[E.RECEIVED_AT] = when;
        engRow[E.FULL_NAME]   = name;
        engRow[E.EMAIL]       = email;
        engRow[E.PHONE]       = phone;
        engRow[E.COMPANY]     = toStr_(row[src.company]);
        engRow[E.NOTE]        = toStr_(row[src.message]);
        engRows.push(engRow);

        srcOut[r] = [STATUS_TR.PARSED, when, ''];
      } catch (e) {
        srcOut[r] = [STATUS_TR.ERROR, '', String(e && e.message || e)];
      }
    }

    writeRuns_(sh, start, c.STATUS + 1, 3, srcOut);
    placeEngineRows_(engSh, st, engRows);
    done += engRows.length;
  }
  return done;
}

function placeEngineRows_(engSh, st, rows) {
  if (!rows.length) return;
  const E = COLS_ENGINE;
  let i = 0;

  while (i < rows.length && st.slotIdx < st.slots.length) {
    const runStart = st.slots[st.slotIdx];
    let j = i, prev = runStart - 1;
    while (j < rows.length && st.slotIdx < st.slots.length &&
           st.slots[st.slotIdx] === prev + 1) {
      prev = st.slots[st.slotIdx];
      st.slotIdx++;
      j++;
    }
    writeEngineBlock_(engSh, runStart, rows.slice(i, j), E);
    i = j;
  }

  if (i < rows.length) {
    writeEngineBlock_(engSh, st.appendRow, rows.slice(i), E);
    st.appendRow += rows.length - i;
  }
}

function writeEngineBlock_(engSh, row, rows, E) {
  const n = rows.length;
  engSh.getRange(row, 1, n, E.EMAIL + 1)
       .setValues(rows.map(r => r.slice(0, E.EMAIL + 1)));
  engSh.getRange(row, E.PHONE        + 1, n, 1).setValues(rows.map(r => [r[E.PHONE]]));
  engSh.getRange(row, E.COMPANY      + 1, n, 1).setValues(rows.map(r => [r[E.COMPANY]]));
  engSh.getRange(row, E.NOTE         + 1, n, 1).setValues(rows.map(r => [r[E.NOTE]]));
  engSh.getRange(row, E.ENG_NORM_COL + 1, n, 1).setValues(rows.map(r => [ENG_NORM.PENDING]));
}

function scanEngineColA_(engSh, lastEng) {
  const slots = [];
  let max = 0;
  if (lastEng < 2) return { slots: slots, max: 0, appendRow: 2 };
  const vals = engSh.getRange(2, 1, lastEng - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    const s = toStr_(vals[i][0]);
    if (!s) {
      slots.push(i + 2);
    } else {
      const m = LEAD_ID_RE.exec(s);
      if (m) { const n = +m[1]; if (n > max) max = n; }
    }
  }
  return { slots: slots, max: max, appendRow: lastEng + 1 };
}

function padLeadId_(n) {
  let s = String(n);
  while (s.length < LEAD_ID_PAD) s = '0' + s;
  return LEAD_ID_PREFIX + s;
}

function countFilled_(v1, v2, v3) {
  let n = 0;
  if (v1) n++;
  if (v2) n++;
  if (v3) n++;
  return n;
}