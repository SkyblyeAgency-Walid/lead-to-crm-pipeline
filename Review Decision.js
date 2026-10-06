function processReviewDecisions() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(RQ_CFG.LOCK_WAIT)) {
    console.warn('processReviewDecisions: another run is active.');
    return null;
  }
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const rqSh  = ss.getSheetByName(SHEET.REVIEW_QUEUE);
    if (!rqSh) throw new Error('Missing sheet: ' + SHEET.REVIEW_QUEUE);
    const Q     = COLS_REVIEW_QUEUE;
    const lastRow = rqSh.getLastRow();

    const counts = { scanned: 0, approved: 0, rejected: 0, alreadyRouted: 0 };
    if (lastRow < 2) return counts;

    const valIdx = buildLeadIdIndex_(ss, SHEET.VALIDATED);
    const arcIdx = buildLeadIdIndex_(ss, SHEET.ARCHIVED_REJECTED);

    const dests = {
      validated: makeDest_(ss, SHEET.VALIDATED),
      archived : makeDest_(ss, SHEET.ARCHIVED_REJECTED)
    };

    const apprLow = DECISION_RQ.APPROVE.toLowerCase();
    const rejLow  = DECISION_RQ.REJECT.toLowerCase();

    for (let start = 2; start <= lastRow; start += RQ_CFG.CHUNK_ROWS) {
      const rows = Math.min(RQ_CFG.CHUNK_ROWS, lastRow - start + 1);
      const blk  = rqSh.getRange(start, 1, rows, Q.SYNC_STATUS + 1).getValues();

      const stampOut = new Array(rows).fill(null);
      const valRows  = [], arcRows = [];

      for (let r = 0; r < rows; r++) {
        counts.scanned++;
        const row    = blk[r];
        const leadId = toStr_(row[Q.LEAD_ID]);
        if (!leadId) continue;

        const decision = toStr_(row[Q.DECISION]).toLowerCase();
        const isApprove = decision === apprLow;
        const isReject  = decision === rejLow;
        if (!isApprove && !isReject) continue;

        const idx = isApprove ? valIdx : arcIdx;
        if (idx[leadId]) { counts.alreadyRouted++; continue; }

        const now = new Date();
        if (isApprove) {
          valRows.push(toValidatedRow_(row, now));
          valIdx[leadId] = true;
          counts.approved++;
        } else {
          arcRows.push(toArchivedRow_(row, now));
          arcIdx[leadId] = true;
          counts.rejected++;
        }

        if (!toStr_(row[Q.REVIEWED_AT])) stampOut[r] = [now];
      }

      flushDest_(dests.validated, valRows);
      flushDest_(dests.archived,  arcRows);
      writeRuns_(rqSh, start, Q.REVIEWED_AT + 1, 1, stampOut);
    }

    console.log('Review decisions summary: ' + JSON.stringify(counts));
    return counts;
  } finally {
    lock.releaseLock();
  }
}

function toValidatedRow_(row, now) {
  const Q = COLS_REVIEW_QUEUE, V = COLS_VALIDATED;
  const out = new Array(V.SYNC_ATTEMPTS + 1).fill('');
  out[V.LEAD_ID]      = toStr_(row[Q.LEAD_ID]);
  out[V.UID]          = toStr_(row[Q.UID]);
  out[V.ACCEPTED_VIA] = RQ_OUT.ACCEPTED_VIA;
  out[V.ACCEPTED_AT]  = now;
  out[V.SOURCE]       = toStr_(row[Q.SOURCE]);
  out[V.FULL_NAME]    = toStr_(row[Q.FULL_NAME]);
  out[V.EMAIL]        = toStr_(row[Q.EMAIL]);
  out[V.PHONE]        = toStr_(row[Q.PHONE]);
  out[V.COMPANY]      = toStr_(row[Q.COMPANY]);
  out[V.NOTE]         = toStr_(row[Q.NOTE]);
  out[V.QUALITY]      = toStr_(row[Q.QUALITY]);
  out[V.SYNC_STATUS]  = RQ_OUT.SYNC_PENDING;
  return out;
}

function toArchivedRow_(row, now) {
  const Q = COLS_REVIEW_QUEUE, A = COLS_ARCHIVED_REJECTED;
  const out = new Array(A.REJECT_REASONS + 1).fill('');
  out[A.LEAD_ID]        = toStr_(row[Q.LEAD_ID]);
  out[A.UID]            = toStr_(row[Q.UID]);
  out[A.REJECTED_BY]    = RQ_OUT.REJECTED_BY;
  out[A.REJECTED_AT]    = now;
  out[A.SOURCE]         = toStr_(row[Q.SOURCE]);
  out[A.FULL_NAME]      = toStr_(row[Q.FULL_NAME]);
  out[A.EMAIL]          = toStr_(row[Q.EMAIL]);
  out[A.PHONE]          = toStr_(row[Q.PHONE]);
  out[A.COMPANY]        = toStr_(row[Q.COMPANY]);
  out[A.QUALITY]        = toStr_(row[Q.QUALITY]);
  out[A.RECOVER_STATUS] = RQ_OUT.ARCHIVED;
  out[A.REJECT_REASONS] = toStr_(row[Q.REASON]);
  return out;
}