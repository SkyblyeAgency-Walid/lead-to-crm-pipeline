const HS_CFG = {
  VERSION          : '2.2-gapfill-logs',
  CHUNK_ROWS       : 2000,
  MAX_RUNTIME_MS   : 270000,
  PACE_MS          : 110,
  RETRY_429_MAX    : 3,
  RETRY_429_BACKOFF: 10000,
  MAX_ATTEMPTS     : 3,
  RETRY_FAILED     : true,
  ERR_MSG_MAX      : 400
};

const HS_SYNC = {
  PENDING: 'Pending',
  SYNCED : 'Synced',
  FAILED : 'Failed',
  SKIPPED: 'Skipped'
};

const HS_LOGS = {
  SCAN_CHUNK: 10000 
};

const HS_TOKEN_PROP = 'HUBSPOT_TOKEN';

const HS_API = {
  BASE    : 'https://api.hubapi.com',
  CONTACTS: '/crm/v3/objects/contacts',
  SEARCH  : 'POST /crm/v3/objects/contacts/search',
  CREATE  : 'POST /crm/v3/objects/contacts'
};

const HS_PROPS = {
  LEAD_ID : 'lead_id',
  UID     : 'lead_uid',
  SOURCE  : 'lead_source',
  QUALITY : 'lead_quality',
  NOTE    : 'lead_note'
};

const HS_LOG = { YES: 'TRUE', NO: 'FALSE' };