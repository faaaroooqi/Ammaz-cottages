const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const PAYMENT_STATUS = require('../constants/paymentStatus');
const BOOKING_STATUS = require('../constants/bookingStatus');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Create payment record before redirect
 */
exports.createPaymentIntent = async ({
  bookingId,
  amount,
  gateway
}) => {
  const orderId = `ORD-${uuidv4()}`;

  const payment = await Payment.create({
    bookingId,
    amount,
    gateway,
    orderId,
    status: PAYMENT_STATUS.INITIATED
  });

  // Generate payload for Meezan / UBL Hosted Checkout
  const payloadStr = `${orderId}|${amount}|${gateway}`;
  const signature = crypto
    .createHmac('sha256', process.env.MEEZAN_SECRET_KEY || 'default_secret')
    .update(payloadStr)
    .digest('hex');

  const redirectUrl = `${process.env.MEEZAN_BASE_URL}?orderId=${orderId}&amount=${amount}&signature=${signature}`;

  return { payment, redirectUrl };
};

/**
 * Verify payment after bank callback
 */
exports.verifyPayment = async ({
  orderId,
  transactionRef,
  gatewayResponse,
  success
}) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new Error('Payment record not found');

  payment.transactionRef = transactionRef;
  payment.gatewayResponse = gatewayResponse;
  payment.status = success
    ? PAYMENT_STATUS.SUCCESS
    : PAYMENT_STATUS.FAILED;

  payment.verified = success;
  payment.paidAt = success ? new Date() : null;

  await payment.save();

  if (success) {
    await Booking.findByIdAndUpdate(payment.bookingId, { status: BOOKING_STATUS.CONFIRMED });
  }

  return payment;
};

/**
 * Manual cash payment (OWNER ONLY)
 */
exports.markCashPayment = async ({
  bookingId,
  amount,
  approvedBy,
  remarks,
  isHalfPaid
}) => {
  const finalStatus = isHalfPaid ? BOOKING_STATUS.CONFIRMED_HALF_PAID : BOOKING_STATUS.CONFIRMED;

  const payment = await Payment.create({
    bookingId,
    amount,
    gateway: 'CASH',
    orderId: `CASH-${uuidv4()}`,
    status: PAYMENT_STATUS.CASH,
    verified: true,
    paidAt: new Date(),
    cashApprovedBy: approvedBy,
    remarks
  });

  await Booking.findByIdAndUpdate(bookingId, { status: finalStatus });

  return payment;
};
