const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const webhook = require('../middlewares/webhook.middleware');

// Customer → Pay
router.post(
  '/initiate/:bookingId',
  paymentController.initiatePayment
);

// Bank redirect (GET/POST depending on bank)
router.post(
  '/return',
  paymentController.handlePaymentReturn
);

// Bank webhook / callback (server-to-server)
router.post(
  '/webhook',
  webhook,
  paymentController.handleWebhook
);

module.exports = router;
