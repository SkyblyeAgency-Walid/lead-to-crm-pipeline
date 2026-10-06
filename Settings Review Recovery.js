
const RQ_CFG = {
  CHUNK_ROWS: 5000,
  LOCK_WAIT : 5000
};

const DECISION_RQ = {
  APPROVE: 'Approve',
  REJECT : 'Reject'
};

const RQ_OUT = {
  ACCEPTED_VIA: 'Human review',
  REJECTED_BY : 'Human review',
  SYNC_PENDING: 'Pending',
  ARCHIVED    : 'Archived'
};

const REC_CFG = {
  CHUNK_ROWS: 5000,
  LOCK_WAIT : 5000 
};

const RECOVER = {
  STATUS: 'Recovered'
};

const REC_OUT = {
  ACCEPTED_VIA: 'Human review',
  SYNC_PENDING: 'Pending'
};