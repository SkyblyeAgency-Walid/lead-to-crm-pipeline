function testHubspotToken() {
  const token = PropertiesService.getScriptProperties().getProperty('HUBSPOT_TOKEN');
  if (!token) throw new Error('Missing Script Property: HUBSPOT_TOKEN');
  const res = UrlFetchApp.fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  console.log('HTTP ' + res.getResponseCode());
  console.log(res.getContentText().slice(0, 300));
}