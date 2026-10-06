function syncValidatedToHubspot() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    console.warn('syncValidatedToHubspot: another run is active.');
    return null;
  }
  try {
    const startedAt = Date.now();
    const token   = hsToken_();
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const valSh   = ss.getSheetByName(SHEET.VALIDATED);
    if (!valSh) throw new Error('Missing sheet: ' + SHEET.VALIDATED);
    const V       = COLS_VALIDATED;
    const lastRow = valSh.getLastRow();

    const counts = { scanned: 0, synced: 0, skipped: 0, failed: 0, stoppedEarly: false };
    if (lastRow < 2) return counts;

    const logSh = ss.getSheetByName(SHEET.SYNC_LOGS);
    if (!logSh) throw new Error('Missing sheet: ' + SHEET.SYNC_LOGS);
    const logSt = scanLogGaps_(logSh);
    console.log('HubSpot sync v' + HS_CFG.VERSION +
                ' — empty col A slots: ' + logSt.gaps.length +
                ', first write row: ' + (logSt.gaps.length ? logSt.gaps[0] : logSt.appendRow));

    const pendLow = HS_SYNC.PENDING.toLowerCase();
    const failLow = HS_SYNC.FAILED.toLowerCase();

    for (let start = 2; start <= lastRow; start += HS_CFG.CHUNK_ROWS) {
      const rows = Math.min(HS_CFG.CHUNK_ROWS, lastRow - start + 1);
      const blk  = valSh.getRange(start, 1, rows, V.SYNC_ATTEMPTS + 1).getValues();

      const out  = new Array(rows).fill(null);
      const logs = [];
      let stopped = false;

      for (let r = 0; r < rows; r++) {
        if (Date.now() - startedAt > HS_CFG.MAX_RUNTIME_MS) { stopped = true; counts.stoppedEarly = true; break; }

        counts.scanned++;
        const row    = blk[r];
        const leadId = toStr_(row[V.LEAD_ID]);
        if (!leadId) continue;

        const st       = toStr_(row[V.SYNC_STATUS]).toLowerCase();
        const attempts = Number(row[V.SYNC_ATTEMPTS]) || 0;
        const retryable = HS_CFG.RETRY_FAILED &&
                          st === failLow && attempts < HS_CFG.MAX_ATTEMPTS;
        if (st !== pendLow && !retryable) continue;

        const uid      = toStr_(row[V.UID]);
        const email    = toStr_(row[V.EMAIL]);
        const now      = new Date();
        const attemptN = attempts + 1;

        let status = HS_SYNC.FAILED, crmId = '', syncedAt = '';
        let epLabel = HS_API.SEARCH, http = 0, ok = false, errMsg = '';

        try {
          if (email) {
            const sres = hsFetch_(hsSearchOptions_(token, email));
            http = sres.getResponseCode();
            if (http === 401 || http === 403) throw new Error('HubSpot auth failed (HTTP ' + http + ') — check ' + HS_TOKEN_PROP);
            const existing = (http === 200) ? hsSearchId_(sres) : '';
            if (existing) {
              status = HS_SYNC.SKIPPED;
              errMsg = 'Contact exists in HubSpot (id ' + existing + ') — skipped';
            } else if (http !== 200) {
              epLabel = HS_API.SEARCH;
              errMsg = 'search: ' + hsErrMsg_(sres);
            } else {
              epLabel = HS_API.CREATE;
              const cres = hsFetch_(hsCreateOptions_(token, hsPayload_(row)));
              http = cres.getResponseCode();
              if (http === 401 || http === 403) throw new Error('HubSpot auth failed (HTTP ' + http + ') — check ' + HS_TOKEN_PROP);
              if (http === 201) {
                crmId = hsCreatedId_(cres);
                status = HS_SYNC.SYNCED; syncedAt = now; ok = true;
              } else {
                errMsg = 'create: ' + hsErrMsg_(cres);
              }
            }
          } else {
            epLabel = HS_API.CREATE;
            const cres = hsFetch_(hsCreateOptions_(token, hsPayload_(row)));
            http = cres.getResponseCode();
            if (http === 401 || http === 403) throw new Error('HubSpot auth failed (HTTP ' + http + ') — check ' + HS_TOKEN_PROP);
            if (http === 201) {
              crmId = hsCreatedId_(cres);
              status = HS_SYNC.SYNCED; syncedAt = now; ok = true;
            } else {
              errMsg = 'create: ' + hsErrMsg_(cres);
            }
          }
        } catch (e) {
          status = HS_SYNC.FAILED;
          errMsg = String(e && e.message || e);
          if (errMsg.indexOf('auth failed') !== -1) throw e;
        }

        out[r] = [status, crmId, syncedAt, attemptN];
        logs.push([makeSyncId_(), leadId, uid, now, attemptN,
                   epLabel, http, ok ? HS_LOG.YES : HS_LOG.NO, errMsg]);

        if (status === HS_SYNC.SYNCED)       counts.synced++;
        else if (status === HS_SYNC.SKIPPED) counts.skipped++;
        else                                 counts.failed++;
      }
      placeLogRows_(logSh, logSt, logs);
      writeRuns_(valSh, start, V.SYNC_STATUS + 1, 4, out);
      if (stopped) break;
    }
    console.log('HubSpot sync summary: ' + JSON.stringify(counts));
    return counts;
  } finally {
    lock.releaseLock();
  }
}

function scanLogGaps_(sh) {
  const gaps = [];
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { gaps: gaps, appendRow: 2 };
  for (let start = 2; start <= lastRow; start += HS_LOGS.SCAN_CHUNK) {
    const rows = Math.min(HS_LOGS.SCAN_CHUNK, lastRow - start + 1);
    const vals = sh.getRange(start, 1, rows, 1).getValues();
    for (let i = 0; i < rows; i++) {
      if (!toStr_(vals[i][0])) gaps.push(start + i);
    }
  }
  return { gaps: gaps, appendRow: lastRow + 1 };
}

function placeLogRows_(sh, st, rows) {
  if (!rows.length) return;
  if (st.idx === undefined) st.idx = 0;
  const W = COLS_SYNC_LOGS.ERROR_MSG + 1;
  let i = 0;

  while (i < rows.length && st.idx < st.gaps.length) {
    const runStart = st.gaps[st.idx];
    let j = i, prev = runStart - 1;
    while (j < rows.length && st.idx < st.gaps.length &&
           st.gaps[st.idx] === prev + 1) {
      prev = st.gaps[st.idx];
      st.idx++;
      j++;
    }
    sh.getRange(runStart, 1, j - i, W).setValues(rows.slice(i, j));
    i = j;
  }
  if (i < rows.length) {
    sh.getRange(st.appendRow, 1, rows.length - i, W).setValues(rows.slice(i));
    st.appendRow += rows.length - i;
  }
}

function hsToken_() {
  const t = PropertiesService.getScriptProperties().getProperty(HS_TOKEN_PROP);
  if (!t) throw new Error('Missing Script Property: ' + HS_TOKEN_PROP);
  return t;
}

function hsFetch_(options) {
  Utilities.sleep(HS_CFG.PACE_MS);
  for (let i = 0; ; i++) {
    const res = UrlFetchApp.fetch(options.url, options);
    if (res.getResponseCode() === 429 && i < HS_CFG.RETRY_429_MAX) {
      const wait = (Number(res.getHeaders()['Retry-After']) * 1000) || HS_CFG.RETRY_429_BACKOFF;
      Utilities.sleep(wait);
      continue;
    }
    return res;
  }
}

function hsSearchOptions_(token, email) {
  return {
    url        : HS_API.BASE + HS_API.CONTACTS + '/search',
    method     : 'post',
    contentType: 'application/json',
    headers    : { Authorization: 'Bearer ' + token },
    payload    : JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties  : ['email'],
      limit       : 1
    }),
    muteHttpExceptions: true
  };
}

function hsCreateOptions_(token, props) {
  return {
    url        : HS_API.BASE + HS_API.CONTACTS,
    method     : 'post',
    contentType: 'application/json',
    headers    : { Authorization: 'Bearer ' + token },
    payload    : JSON.stringify({ properties: props }),
    muteHttpExceptions: true
  };
}

function hsSearchId_(res) {
  const o = JSON.parse(res.getContentText());
  const r = o && o.results;
  return (r && r.length) ? String(r[0].id) : '';
}

function hsCreatedId_(res) {
  return String(JSON.parse(res.getContentText()).id);
}

function hsErrMsg_(res) {
  let msg = '';
  try { msg = (JSON.parse(res.getContentText()) || {}).message || ''; } catch (e) {}
  if (!msg) msg = String(res.getContentText());
  return msg.slice(0, HS_CFG.ERR_MSG_MAX);
}

function hsPayload_(row) {
  const V = COLS_VALIDATED;
  const name = splitFullName_(toStr_(row[V.FULL_NAME]));
  const props = {
    firstname              : name[0],
    lastname               : name[1],
    phone                  : toStr_(row[V.PHONE]),
    company                : toStr_(row[V.COMPANY]),
  };
  props[HS_PROPS.LEAD_ID]  = toStr_(row[V.LEAD_ID]);
  props[HS_PROPS.UID]      = toStr_(row[V.UID]);
  props[HS_PROPS.SOURCE]   = toStr_(row[V.SOURCE]);
  props[HS_PROPS.QUALITY]  = toStr_(row[V.QUALITY]);
  props[HS_PROPS.NOTE]     = toStr_(row[V.NOTE]);
  const email = toStr_(row[V.EMAIL]);
  if (email) props['email'] = email;
  return props;
}

function splitFullName_(s) {
  if (!s) return ['', ''];
  const i = s.indexOf(' ');
  if (i === -1) return [s, ''];
  return [s.slice(0, i), s.slice(i + 1)];
}

function makeSyncId_() {
  return 'SYN-' + Date.now().toString(36) + '-' +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}


function testLogsRow() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.SYNC_LOGS);
  const st = scanLogGaps_(sh);
  console.log('Sync Logs lastRow = ' + sh.getLastRow());
  console.log('empty col A slots = ' + st.gaps.length +
              (st.gaps.length ? ' (first: ' + st.gaps[0] + ')' : ''));
  console.log('first write row   = ' + (st.gaps.length ? st.gaps[0] : st.appendRow));
}