const express = require('express');
const router = express.Router();

const paymentOptionsController = require('../controllers/paymentOptions.controller');

// Public: Only active options — for customer payment page
router.get('/', paymentOptionsController.getActiveOptions);

module.exports = router;
