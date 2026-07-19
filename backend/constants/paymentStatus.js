const PAYMENT_STATUS = Object.freeze({
  INITIATED: 'initiated',     // Redirected to bank
  PENDING: 'pending',         // Awaiting bank callback
  SUCCESS: 'success',         // Verified & paid
  FAILED: 'failed',           // Bank failure
  CASH: 'cash',               // Manual bypass by owner
  REFUNDED: 'refunded'
});

module.exports = PAYMENT_STATUS;
