const STATUS_TR = {
  EXTRACTED: 'Extracted',
  PARSED   : 'Parsed',
  ERROR    : 'Error'
};

const ENG_NORM = {
  PENDING  : 'Pending',
  COMPLETED: 'Completed'
};

const TR_CFG = {
  CHUNK_ROWS: 5000,
  LOCK_WAIT : 5000
};

const TR_ERR = {
  INSUFFICIENT: 'Insufficient data: need at least 2 of Name / Email / Phone'
};

const LEAD_ID_PREFIX = 'Leads-';
const LEAD_ID_PAD    = 4;
const LEAD_ID_RE     = /^Leads-(\d+)$/;

const TR_SOURCES = [
  {
    sheet   : SHEET.SOURCE_WEBSITE,
    cols    : COLS_SOURCE_WEBSITE,
    source  : 'Website',
    readW   : COLS_SOURCE_WEBSITE.PAGE + 1,
    uid     : COLS_SOURCE_WEBSITE.UID,
    name    : COLS_SOURCE_WEBSITE.NAME,
    email   : COLS_SOURCE_WEBSITE.EMAIL,
    phone   : COLS_SOURCE_WEBSITE.PHONE,
    company : COLS_SOURCE_WEBSITE.COMPANY,
    message : COLS_SOURCE_WEBSITE.MESSAGE
  },
  {
    sheet   : SHEET.SOURCE_META,
    cols    : COLS_SOURCE_META,
    source  : 'Meta',
    readW   : COLS_SOURCE_META.INTEREST + 1,
    uid     : COLS_SOURCE_META.UID,
    name    : COLS_SOURCE_META.FULL_NAME,
    email   : COLS_SOURCE_META.EMAIL,
    phone   : COLS_SOURCE_META.PHONE,
    company : COLS_SOURCE_META.COMPANY,
    message : COLS_SOURCE_META.INTEREST 
  },
  {
    sheet   : SHEET.SOURCE_LIST_UPLOAD,
    cols    : COLS_SOURCE_LIST_UPLOAD,
    source  : 'List Upload',
    readW   : COLS_SOURCE_LIST_UPLOAD.TITLE + 1,
    uid     : COLS_SOURCE_LIST_UPLOAD.UID,
    name    : COLS_SOURCE_LIST_UPLOAD.FULL_NAME,
    email   : COLS_SOURCE_LIST_UPLOAD.EMAIL,
    phone   : COLS_SOURCE_LIST_UPLOAD.PHONE,
    company : COLS_SOURCE_LIST_UPLOAD.COMPANY,
    message : COLS_SOURCE_LIST_UPLOAD.TITLE
  }
];