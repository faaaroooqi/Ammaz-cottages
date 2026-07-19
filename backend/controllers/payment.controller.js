const paymentService = require('../services/payment.service');
const bookingService = require('../services/booking.service');
const BOOKING_STATUS = require('../constants/bookingStatus');

exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { gateway } = req.body;

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
      return res.status(400).json({ message: 'Booking is not payable' });
    }

    const { payment, redirectUrl } = await paymentService.createPaymentIntent({
      bookingId: booking._id,
      amount: booking.totalAmount,
      gateway
    });

    res.status(200).json({
      message: 'Redirect to payment gateway',
      orderId: payment.orderId,
      redirectUrl,
      gateway
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handlePaymentReturn = async (req, res) => {
  try {
    const { orderId, transactionRef, success } = req.body;

    const payment = await paymentService.verifyPayment({
      orderId,
      transactionRef,
      gatewayResponse: req.body,
      success
    });

    res.status(200).json({
      message: 'Payment processed successfully',
      paymentStatus: payment.status
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { orderId, transactionRef, success } = req.body;

    await paymentService.verifyPayment({
      orderId,
      transactionRef,
      gatewayResponse: req.body,
      success
    });

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
