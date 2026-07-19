const BOOKING_STATUS = Object.freeze({
  REQUESTED: 'requested',      // Requested by customer, awaiting admin approval
  PENDING: 'pending',          // Booking created, payment not started
  AWAITING_PAYMENT: 'awaiting_payment',
  CONFIRMED: 'confirmed',      // Paid online & verified
  CONFIRMED_HALF_PAID: 'confirmed_half_paid', // Confirmed but half paid
  CASH_PAID: 'cash_paid',      // Manually marked as paid in cash
  CANCELLED: 'cancelled',      // Cancelled by admin or user
  NO_SHOW: 'no_show',          // Guest didn’t arrive
  COMPLETED: 'completed'       // Stay completed
});

module.exports = BOOKING_STATUS;
