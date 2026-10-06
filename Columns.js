/* Source: Website */
const COLS_SOURCE_WEBSITE = {
  UID      : 0,   // A
  RECEIVED : 1,   // B
  SOURCE   : 2,   // C
  STATUS   : 3,   // D
  PARSED_AT: 4,   // E
  ERROR_MSG: 5,   // F
  RAW_JSON : 6,   // G
  NAME     : 7,   // H
  EMAIL    : 8,   // I
  PHONE    : 9,   // J
  COMPANY  : 10,  // K
  MESSAGE  : 11,  // L
  PAGE     : 12   // M
};

/* Source: Meta */
const COLS_SOURCE_META = {
  UID       : 0,   // A
  RECEIVED  : 1,   // B
  SOURCE    : 2,   // C
  STATUS    : 3,   // D
  PARSED_AT : 4,   // E
  ERROR_MSG : 5,   // F
  RAW_JSON  : 6,   // G
  LEADGEN_ID: 7,   // H
  CREATED_AT: 8,   // I
  FULL_NAME : 9,   // J
  EMAIL     : 10,  // K
  PHONE     : 11,  // L
  COMPANY   : 12,  // M
  INTEREST  : 13   // N
};

/* Source: List Upload */
const COLS_SOURCE_LIST_UPLOAD = {
  UID      : 0,   // A
  RECEIVED : 1,   // B
  SOURCE   : 2,   // C
  STATUS   : 3,   // D
  PARSED_AT: 4,   // E
  ERROR_MSG: 5,   // F
  BATCH_ID : 6,   // G
  VENDOR   : 7,   // H
  RAW_JSON : 8,   // I
  FULL_NAME: 9,   // J
  EMAIL    : 10,  // K
  PHONE    : 11,  // L
  COMPANY  : 12,  // M
  TITLE    : 13   // N
};

/* Engine */
const COLS_ENGINE = {
  LEAD_ID     : 0,   // A
  UID         : 1,   // B
  SOURCE      : 2,   // C
  RECEIVED_AT : 3,   // D
  FULL_NAME   : 4,   // E
  EMAIL       : 5,   // F
  EMAIL_VALID : 6,   // G
  EMAIL_ROLE  : 7,   // H
  PHONE       : 8,   // I
  PHONE_VALID : 9,   // J
  COMPANY     : 10,  // K
  NOTE        : 11,  // L
  ENG_NORM_COL: 12,  // M
  QUALITY     : 13,  // N
  DISPOSITION : 14,  // O
  REASON      : 15,  // P
  DUPLICATE   : 16,  // Q
  ROUTED_AT   : 17   // R
};

/* Review queue */
const COLS_REVIEW_QUEUE = {
  LEAD_ID    : 0,   // A
  UID        : 1,   // B
  SOURCE     : 2,   // C
  RECEIVED_AT: 3,   // D
  FULL_NAME  : 4,   // E
  EMAIL      : 5,   // F
  PHONE      : 6,   // G
  COMPANY    : 7,   // H
  QUALITY    : 8,   // I
  REASON     : 9,   // J
  FLAG_TYPE  : 10,  // K
  DECISION   : 11,  // L
  NOTE       : 12,  // M
  REVIEWED_AT: 13,  // N
  SYNC_STATUS: 14   // O
};

/* Validated */
const COLS_VALIDATED = {
  LEAD_ID      : 0,   // A
  UID          : 1,   // B
  ACCEPTED_VIA : 2,   // C
  ACCEPTED_AT  : 3,   // D
  SOURCE       : 4,   // E
  FULL_NAME    : 5,   // F
  EMAIL        : 6,   // G
  PHONE        : 7,   // H
  COMPANY      : 8,   // I
  NOTE         : 9,   // J
  QUALITY      : 10,  // K
  SYNC_STATUS  : 11,  // L
  CRM_RECORD   : 12,  // M
  SYNCED_AT    : 13,  // N
  SYNC_ATTEMPTS: 14   // O
};

/* Archived rejected */
const COLS_ARCHIVED_REJECTED = {
  LEAD_ID       : 0,   // A
  UID           : 1,   // B
  REJECTED_BY   : 2,   // C
  REJECTED_AT   : 3,   // D
  SOURCE        : 4,   // E
  FULL_NAME     : 5,   // F
  EMAIL         : 6,   // G
  PHONE         : 7,   // H
  COMPANY       : 8,   // I
  QUALITY       : 9,   // J
  RECOVER_STATUS: 10,  // K
  REJECT_REASONS: 11   // L
};

/* Sync Logs */
const COLS_SYNC_LOGS = {
  SYNC_ID    : 0,   // A
  LEAD_ID    : 1,   // B
  UID        : 2,   // C
  ATTEMPT_AT : 3,   // D
  ATTEMPT_N  : 4,   // E
  ENDPOINT   : 5,   // F
  HTTP_STATUS: 6,   // G
  SUCCESS    : 7,   // H
  ERROR_MSG  : 8    // I
};