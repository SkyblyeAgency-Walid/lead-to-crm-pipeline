const MENU_TITLE = '⚡ Lead → CRM Pipeline';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MENU_TITLE)
    .addItem('1 · Extract — Source Website',        'menuExtractWebsite')
    .addItem('1 · Extract — Source Meta',           'menuExtractMeta')
    .addItem('1 · Extract — Source List Upload',    'menuExtractListUpload')
    .addSeparator()
    .addItem('2 · Transfer — Sources → Engine',     'menuTransfer')
    .addSeparator()
    .addItem('3 · Normalize — Engine',              'menuNormalize')
    .addSeparator()
    .addItem('4 · Engine Pipeline — Validate → Route', 'menuEnginePipeline')
    .addSeparator()
    .addItem('5 · Review — Process Decisions',      'menuReviewDecisions')
    .addItem('5 · Recovery — Archived → Validated', 'menuRecovery')
    .addSeparator()
    .addItem('6 · HubSpot — Sync Validated',        'menuHubspotSync')
    .addSeparator()
    .addItem('❓ Check Sync Logs write row',         'menuTestLogsRow')
    .addToUi();
}


function menuExtractWebsite()    { menuRun_('Extract Source Website',    extractSourceWebsite); }
function menuExtractMeta()       { menuRun_('Extract Source Meta',       extractSourceMeta); }
function menuExtractListUpload() { menuRun_('Extract Source List Upload',extractSourceListUpload); }
function menuTransfer()          { menuRun_('Transfer → Engine',         transferToEngine); }
function menuNormalize()         { menuRun_('Normalize Engine',          normalizeEngineData); }
function menuEnginePipeline()    { menuRun_('Engine Pipeline',           runEnginePipeline); }
function menuReviewDecisions()   { menuRun_('Review Decisions',          processReviewDecisions); }
function menuRecovery()          { menuRun_('Recovery → Validated',      recoverArchivedLeads); }
function menuHubspotSync()       { menuRun_('HubSpot Sync',              syncValidatedToHubspot); }

function menuRun_(label, fn) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const toastId = ss.toast('Running "' + label + '"…', MENU_TITLE, -1);
  try {
    const result = fn();
    const summary = (result && typeof result === 'object')
      ? Object.keys(result).map(k => k + ': ' + result[k]).join('   ·   ')
      : String(result);
    ss.toast('Done.', MENU_TITLE, 2);
    ui.alert(MENU_TITLE + ' — ' + label,
             'Finished successfully.\n\n' + summary,
             ui.ButtonSet.OK);
  } catch (e) {
    ss.toast('Failed.', MENU_TITLE, 2);
    ui.alert(MENU_TITLE + ' — ' + label,
             '❌ ' + (e && e.message ? e.message : e),
             ui.ButtonSet.OK);
  }
}

function menuTestLogsRow() {
  const ui = SpreadsheetApp.getUi();
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.SYNC_LOGS);
    const st = scanLogGaps_(sh);
    const first = st.gaps.length ? st.gaps[0] : st.appendRow;
    ui.alert(MENU_TITLE + ' — Sync Logs placement',
             'lastRow: ' + sh.getLastRow() +
             '\nempty col A slots: ' + st.gaps.length +
             '\nfirst write row: ' + first,
             ui.ButtonSet.OK);
  } catch (e) {
    ui.alert(MENU_TITLE, '❌ ' + (e && e.message ? e.message : e), ui.ButtonSet.OK);
  }
}