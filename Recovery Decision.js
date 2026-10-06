function recoverArchivedLeads() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(REC_CFG.LOCK_WAIT)) {
    console.warn('recoverArchivedLeads: another run is active.');
    return null;
  }
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const arcSh = ss.getSheetByName(SHEET.ARCHIVED_REJECTED);
    if (!arcSh) throw new Error('Missing sheet: ' + SHEET.ARCHIVED_REJECTED);
    const A     = COLS_ARCHIVED_REJECTED;
    const lastRow = arcSh.getLastRow();

    const counts = { scanned: 0, recovered: 0, alreadyRouted: 0 };
    if (lastRow < 2) return counts;

    const valIdx = buildLeadIdIndex_(ss, SHEET.VALIDATED);
    const dest   = makeDest_(ss, SHEET.VALIDATED);
    const recLow = RECOVER.STATUS.toLowerCase();

    for (let start = 2; start <= lastRow; start += REC_CFG.CHUNK_ROWS) {
      const rows = Math.min(REC_CFG.CHUNK_ROWS, lastRow - start + 1);
      const blk  = arcSh.getRange(start, 1, rows, A.REJECT_REASONS + 1).getValues();
      const valRows = [];

      for (let r = 0; r < rows; r++) {
        counts.scanned++;
        const row    = blk[r];
        const leadId = toStr_(row[A.LEAD_ID]);
        if (!leadId) continue;
        if (toStr_(row[A.RECOVER_STATUS]).toLowerCase() !== recLow) continue;
        if (valIdx[leadId]) { counts.alreadyRouted++; continue; }

        valRows.push(arcToValidatedRow_(row, new Date()));
        valIdx[leadId] = true;
        counts.recovered++;
      }
      flushDest_(dest, valRows);
    }
    console.log('Recovery summary: ' + JSON.stringify(counts));
    return counts;
  } finally {
    lock.releaseLock();
  }
}

function arcToValidatedRow_(row, now) {
  const A = COLS_ARCHIVED_REJECTED, V = COLS_VALIDATED;
  const out = new Array(V.SYNC_ATTEMPTS + 1).fill('');
  out[V.LEAD_ID]      = toStr_(row[A.LEAD_ID]);
  out[V.UID]          = toStr_(row[A.UID]);
  out[V.ACCEPTED_VIA] = REC_OUT.ACCEPTED_VIA;
  out[V.ACCEPTED_AT]  = now;
  out[V.SOURCE]       = toStr_(row[A.SOURCE]);
  out[V.FULL_NAME]    = toStr_(row[A.FULL_NAME]);
  out[V.EMAIL]        = toStr_(row[A.EMAIL]);
  out[V.PHONE]        = toStr_(row[A.PHONE]);
  out[V.COMPANY]      = toStr_(row[A.COMPANY]);
  out[V.NOTE]         = '';
  out[V.QUALITY]      = toStr_(row[A.QUALITY]);
  out[V.SYNC_STATUS]  = REC_OUT.SYNC_PENDING;
  return out;
}