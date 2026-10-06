const STATUS_SW = {
  EXTRACTED: 'Extracted',
  ERROR    : 'Error'
};

const SW_CFG = {
  CHUNK_ROWS: 5000
};

const STATUS_SM = {
  EXTRACTED: 'Extracted',
  ERROR    : 'Error'
};

const SM_CFG = {
  CHUNK_ROWS: 5000
};

const SM_DATE_RE = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

const STATUS_SL = {
  EXTRACTED: 'Extracted',
  ERROR    : 'Error'
};

const SL_CFG = {
  CHUNK_ROWS : 5000,
  FIELD_WIDTH: 5
};

const SL_KEYS = {
  FULL_NAME: [['first name', 'last name'], 'full name', 'name'],
  EMAIL    : ['business email', 'work email', 'email'],
  PHONE    : ['direct phone', 'phone', 'mobile'],
  COMPANY  : ['company name', 'company', 'organisation', 'organization'],
  TITLE    : ['title']
};