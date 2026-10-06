function runEnginePipeline() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(ENG_PROC.LOCK_WAIT)) {
    console.warn('runEnginePipeline: another run is active.');
    return null;
  }
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const engSh = ss.getSheetByName(SHEET.ENGINE);
    if (!engSh) throw new Error('Missing sheet: ' + SHEET.ENGINE);
    const E = COLS_ENGINE;
    const lastRow = engSh.getLastRow();

    const counts = { scanned: 0, processed: 0, accepted: 0, flagged: 0, rejected: 0, errors: 0 };
    if (lastRow < 2) return counts;

    const fpIndex = buildFingerprintIndex_(engSh, lastRow);

    const uaMap = ENG_PROC.USE_UA_SIGNAL ? buildUaMap_(ss) : null;

    const dests = {
      validated: makeDest_(ss, SHEET.VALIDATED),
      review   : makeDest_(ss, SHEET.REVIEW_QUEUE),
      archived : makeDest_(ss, SHEET.ARCHIVED_REJECTED)
    };
    const now = new Date();

    for (let start = 2; start <= lastRow; start += ENG_PROC.CHUNK_ROWS) {
      const rows = Math.min(ENG_PROC.CHUNK_ROWS, lastRow - start + 1);
      const blk  = engSh.getRange(start, 1, rows, E.ROUTED_AT + 1).getValues();

      const ghOut = new Array(rows).fill(null);
      const jOut  = new Array(rows).fill(null);
      const nrOut = new Array(rows).fill(null);
      const valRows = [], revRows = [], arcRows = [];

      for (let r = 0; r < rows; r++) {
        counts.scanned++;
        const row = blk[r];
        if (!toStr_(row[E.LEAD_ID])) continue;
        if (toStr_(row[E.ENG_NORM_COL]) !== ENG_NORM.COMPLETED) continue;
        if (toStr_(row[E.DISPOSITION])) continue;

        try {
          const res = processEngineRow_(row, fpIndex, uaMap);

          ghOut[r] = [res.emailOk, res.isRole];
          jOut[r]  = [res.phoneOk];
          nrOut[r] = [res.score, res.dispo, res.reasons, res.dupOf, now];

          if (res.dispo === DISPO.ACCEPT)      { counts.accepted++; valRows.push(valRow_(row, res, now)); }
          else if (res.dispo === DISPO.FLAG)   { counts.flagged++;  revRows.push(revRow_(row, res)); }
          else                                 { counts.rejected++; arcRows.push(arcRow_(row, res, now)); }
          counts.processed++;
        } catch (e) {
          counts.errors++;
          console.warn('Engine row ' + (start + r) + ': ' + (e && e.message || e));
        }
      }

      flushDest_(dests.validated, valRows);
      flushDest_(dests.review,    revRows);
      flushDest_(dests.archived,  arcRows);

      writeRuns_(engSh, start, E.EMAIL_VALID + 1, 2, ghOut);
      writeRuns_(engSh, start, E.PHONE_VALID + 1, 1, jOut);
      writeRuns_(engSh, start, E.QUALITY + 1, E.ROUTED_AT - E.QUALITY + 1, nrOut);
    }

    console.log('Engine pipeline summary: ' + JSON.stringify(counts));
    return counts;
  } finally {
    lock.releaseLock();
  }
}

function processEngineRow_(row, fpIndex, uaMap) {
  const E = COLS_ENGINE;
  const leadId  = toStr_(row[E.LEAD_ID]);
  const uid     = toStr_(row[E.UID]);
  const source  = toStr_(row[E.SOURCE]);
  const name    = toStr_(row[E.FULL_NAME]);
  const email   = toStr_(row[E.EMAIL]);
  const phone   = toStr_(row[E.PHONE]);
  const company = toStr_(row[E.COMPANY]);
  const note    = toStr_(row[E.NOTE]);

  const emailOk = !!email && VALIDATE.EMAIL_RE.test(email);
  const isRole  = emailOk && isRoleEmail_(email);
  const phoneOk = isPhoneValid_(phone);

  const sig = [];
  if (!email) sig.push('no_email'); else if (!emailOk) sig.push('invalid_email');
  if (!phone) sig.push('no_phone'); else if (!phoneOk) sig.push('invalid_phone');

  if (emailOk) {
    if (isRole) sig.push('role_email');
    const dom = email.slice(email.indexOf('@') + 1);
    if (VALIDATE.DISPOSABLE_DOMAINS.indexOf(dom) !== -1)      sig.push('disposable_email');
    else if (VALIDATE.TYPO_DOMAINS.indexOf(dom) !== -1)       sig.push('email_domain_typo');
  }
  if (isJunkText_(name))    sig.push('junk_name');
  if (isJunkText_(company)) sig.push('junk_company');
  if (isJunkText_(note))    sig.push('junk_message');
  if (uaMap && uid) {
    const ua = uaMap[uid] || '';
    if (ua && VALIDATE.BOT_UA_RE.test(ua)) sig.push('bot_user_agent');
  }
  const trustFail = source === SOURCE_TRUST.SOURCE && !(emailOk && phoneOk && !isRole);
  if (trustFail) sig.push('source_trust');

  let score = ENG_PROC.SCORE_START;
  for (let i = 0; i < sig.length; i++) score -= SIG[sig[i]] || 0;
  if (score < 0) score = 0;

  const ek = emailKey_(email), pk = phoneKey_(phone);
  let dupOf = '';
  if (ek && fpIndex[ek]) dupOf = fpIndex[ek];
  else if (pk && fpIndex[pk]) dupOf = fpIndex[pk];
  if (ek && !fpIndex[ek]) fpIndex[ek] = leadId;
  if (pk && !fpIndex[pk]) fpIndex[pk] = leadId;

  let dispo;
  if (score >= ENG_PROC.ACCEPT_MIN)      dispo = DISPO.ACCEPT;
  else if (score >= ENG_PROC.FLAG_MIN)   dispo = DISPO.FLAG;
  else                                   dispo = DISPO.REJECT;

  const reasons = sig.slice();
  if (!emailOk && !phoneOk)                { dispo = DISPO.REJECT; reasons.push(FORCED.CONTACT); }
  if (trustFail && dispo === DISPO.ACCEPT) dispo = DISPO.FLAG;
  if (dupOf && dispo === DISPO.ACCEPT)     { dispo = DISPO.FLAG; reasons.push(FORCED.DUP); }

  const flagType = (dispo === DISPO.FLAG) ? resolveFlagType_(dupOf, sig) : '';

  return { score: score, dispo: dispo, reasons: reasons.join('; '), dupOf: dupOf,
           emailOk: emailOk, isRole: isRole, phoneOk: phoneOk, flagType: flagType };
}

function resolveFlagType_(dupOf, sig) {
  if (dupOf) return FLAG_TYPE_RQ.DUPLICATE;
  const cats = [];
  for (let i = 0; i < sig.length; i++) {
    const cat = FLAG_MAP[sig[i]];
    if (cat && cats.indexOf(cat) === -1) cats.push(cat);
  }
  for (let j = 0; j < FLAG_PRIORITY.length; j++) {
    if (cats.indexOf(FLAG_PRIORITY[j]) !== -1) return FLAG_PRIORITY[j];
  }
  return FLAG_TYPE_RQ.SUSPICIOUS;
}

function buildFingerprintIndex_(engSh, lastRow) {
  const E = COLS_ENGINE;
  const idx = {};
  const width = E.DISPOSITION + 1;
  for (let start = 2; start <= lastRow; start += ENG_PROC.CHUNK_ROWS) {
    const rows = Math.min(ENG_PROC.CHUNK_ROWS, lastRow - start + 1);
    const blk = engSh.getRange(start, 1, rows, width).getValues();
    for (let r = 0; r < rows; r++) {
      const row = blk[r];
      if (toStr_(row[E.ENG_NORM_COL]) !== ENG_NORM.COMPLETED) continue;
      if (!toStr_(row[E.DISPOSITION])) continue;
      const leadId = toStr_(row[E.LEAD_ID]);
      if (!leadId) continue;
      const ek = emailKey_(toStr_(row[E.EMAIL]));
      const pk = phoneKey_(toStr_(row[E.PHONE]));
      if (ek && !idx[ek]) idx[ek] = leadId;
      if (pk && !idx[pk]) idx[pk] = leadId;
    }
  }
  return idx;
}

function buildUaMap_(ss) {
  const sh = ss.getSheetByName(SHEET.SOURCE_WEBSITE);
  const map = {};
  if (!sh) return map;
  const c = COLS_SOURCE_WEBSITE;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return map;
  const width = c.RAW_JSON + 1;
  for (let start = 2; start <= lastRow; start += ENG_PROC.CHUNK_ROWS) {
    const rows = Math.min(ENG_PROC.CHUNK_ROWS, lastRow - start + 1);
    const blk = sh.getRange(start, 1, rows, width).getValues();
    for (let r = 0; r < rows; r++) {
      const uid = toStr_(blk[r][c.UID]);
      if (!uid) continue;
      const ua = extractUa_(blk[r][c.RAW_JSON]);
      if (ua) map[uid] = ua;
    }
  }
  return map;
}

function extractUa_(raw) {
  const s = String(raw || '');
  if (s.indexOf('user_agent') === -1) return '';
  const m = /"user_agent"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(s);
  return m ? m[1] : '';
}

function isRoleEmail_(email) {
  const at = email.indexOf('@');
  if (at <= 0) return false;
  const local = email.slice(0, at).toLowerCase();
  const list = VALIDATE.ROLE_LOCALS;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (local === p ||
        local.lastIndexOf(p + '.', 0) === 0 ||
        local.lastIndexOf(p + '-', 0) === 0 ||
        local.lastIndexOf(p + '_', 0) === 0) return true;
  }
  return false;
}

function isPhoneValid_(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < VALIDATE.PHONE_MIN || digits.length > VALIDATE.PHONE_MAX) return false;
  return /^\+?\d+$/.test(phone);
}

function isJunkText_(v) {
  const t = toStr_(v).toLowerCase();
  if (!t) return false;
  if (t.length < 2) return true;
  if (/(.)\1{3,}/.test(t)) return true;
  const mash = VALIDATE.JUNK_MASH;
  for (let i = 0; i < mash.length; i++) {
    if (t.indexOf(mash[i]) !== -1) return true;
  }
  const words = t.split(/\s+/);
  const list = VALIDATE.JUNK_WORDS;
  for (let i = 0; i < words.length; i++) {
    if (list.indexOf(words[i]) !== -1) return true;
  }
  return false;
}

function emailKey_(email) {
  if (!email) return '';
  const at = email.indexOf('@');
  if (at <= 0) return '';
  let local = email.slice(0, at).toLowerCase();
  const domain = email.slice(at + 1).toLowerCase();
  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);
  local = local.replace(/\./g, '');
  return local ? local + '@' + domain : '';
}

function phoneKey_(phone) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  return d.length >= VALIDATE.PHONE_MIN ? d : '';
}

function valRow_(row, res, now) {
  const E = COLS_ENGINE;
  return [toStr_(row[E.LEAD_ID]), toStr_(row[E.UID]), ACTOR.AUTO, now,
          toStr_(row[E.SOURCE]), toStr_(row[E.FULL_NAME]), toStr_(row[E.EMAIL]),
          toStr_(row[E.PHONE]), toStr_(row[E.COMPANY]), toStr_(row[E.NOTE]),
          res.score, ROUTE_CFG.SYNC_PENDING, '', '', ''];
}

function revRow_(row, res) {
  const E = COLS_ENGINE;
  return [toStr_(row[E.LEAD_ID]), toStr_(row[E.UID]), toStr_(row[E.SOURCE]),
          row[E.RECEIVED_AT], toStr_(row[E.FULL_NAME]), toStr_(row[E.EMAIL]),
          toStr_(row[E.PHONE]), toStr_(row[E.COMPANY]), res.score, res.reasons,
          res.flagType, ROUTE_CFG.DECISION_PENDING, '', '', ''];
}

function arcRow_(row, res, now) {
  const E = COLS_ENGINE;
  return [toStr_(row[E.LEAD_ID]), toStr_(row[E.UID]), ACTOR.AUTO, now,
          toStr_(row[E.SOURCE]), toStr_(row[E.FULL_NAME]), toStr_(row[E.EMAIL]),
          toStr_(row[E.PHONE]), toStr_(row[E.COMPANY]), res.score,
          ROUTE_CFG.ARCHIVED_STATUS, res.reasons];
}