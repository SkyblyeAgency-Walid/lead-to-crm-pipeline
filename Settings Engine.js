const ENG_PROC = {
  CHUNK_ROWS   : 5000,
  LOCK_WAIT    : 5000,
  SCORE_START  : 100,
  ACCEPT_MIN   : 70,
  FLAG_MIN     : 40,
  USE_UA_SIGNAL: true
};

const DISPO = {
  ACCEPT: 'Accept',
  FLAG  : 'Flag',
  REJECT: 'Reject'
};

const SIG = {
  'no_email'         : 20,
  'invalid_email'    : 35,
  'no_phone'         : 15,
  'invalid_phone'    : 20,
  'role_email'       : 30,
  'disposable_email' : 40,
  'email_domain_typo': 20,
  'junk_name'        : 100,
  'junk_company'     : 15,
  'junk_message'     : 10,
  'bot_user_agent'   : 50,
  'source_trust'     : 10
};

const FORCED = {
  DUP    : 'forced: duplicate',
  CONTACT: 'forced: no contact channel'
};

const SOURCE_TRUST = {
  SOURCE: 'List Upload'
};

const VALIDATE = {
  EMAIL_RE : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
  PHONE_MIN: 8,
  PHONE_MAX: 15,

  ROLE_LOCALS: ['info','support','sales','contact','admin','hello','help','service',
                'billing','noreply','no-reply','office','marketing','hr','jobs',
                'careers','enquiry','inquiry','team','webmaster','postmaster'],

  DISPOSABLE_DOMAINS: ['mailinator.com','tempmail.com','temp-mail.org','guerrillamail.com',
                       '10minutemail.com','yopmail.com','trashmail.com','sharklasers.com',
                       'getnada.com','dispostable.com','maildrop.cc','throwawaymail.com',
                       'fakeinbox.com','tempinbox.com'],

  TYPO_DOMAINS: ['gamil.com','gmial.com','gmai.com','gmail.co','gmail.con','gnail.com',
                 'hotmail.co','hotmial.com','hotmai.com','yahooo.com','yaho.com',
                 'outlok.com','outllok.com','iclod.com'],

  JUNK_WORDS: ['test','asdf','qwerty','zxcv','fake','dummy','sample','xxx',
               'n/a','none','null','unknown'],
  JUNK_MASH : ['asdf','qwerty','zxcv','hjkl','asdfgh'],

  BOT_UA_RE : /python-requests|curl\/|wget|bot|crawler|spider|headless/i
};

const ACTOR = {
  AUTO : 'Auto Engine',
  HUMAN: 'Human review'
};

const FLAG_TYPE_RQ = {
  DUPLICATE   : 'Duplicate',
  WEAK_CONTACT: 'Weak Contact',
  SOURCE_TRUST: 'Source Trust',
  SUSPICIOUS  : 'Suspicious'
};

const FLAG_MAP = {
  duplicate        : FLAG_TYPE_RQ.DUPLICATE,
  source_trust     : FLAG_TYPE_RQ.SOURCE_TRUST,
  no_email         : FLAG_TYPE_RQ.WEAK_CONTACT,
  no_phone         : FLAG_TYPE_RQ.WEAK_CONTACT,
  invalid_email    : FLAG_TYPE_RQ.WEAK_CONTACT,
  invalid_phone    : FLAG_TYPE_RQ.WEAK_CONTACT,
  role_email       : FLAG_TYPE_RQ.WEAK_CONTACT,
  disposable_email : FLAG_TYPE_RQ.SUSPICIOUS,
  email_domain_typo: FLAG_TYPE_RQ.SUSPICIOUS,
  junk_name        : FLAG_TYPE_RQ.SUSPICIOUS,
  junk_company     : FLAG_TYPE_RQ.SUSPICIOUS,
  junk_message     : FLAG_TYPE_RQ.SUSPICIOUS,
  bot_user_agent   : FLAG_TYPE_RQ.SUSPICIOUS
};

const FLAG_PRIORITY = ['Source Trust', 'Weak Contact', 'Suspicious'];

const ROUTE_CFG = {
  SYNC_PENDING    : 'Pending',
  DECISION_PENDING: 'Pending',
  ARCHIVED_STATUS : 'Archived'
};