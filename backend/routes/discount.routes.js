const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Public endpoints
router.get('/public', discountController.getPublicDiscounts);
router.post('/evaluate', discountController.evaluateBookingDiscounts);

// Admin protected endpoints
router.get('/admin', auth, role('owner'), discountController.getAdminDiscounts);
router.put('/admin/stay', auth, role('owner'), discountController.updateStayDiscounts);
router.post('/admin/date', auth, role('owner'), discountController.addDateDiscount);
router.put('/admin/date/:id', auth, role('owner'), discountController.updateDateDiscount);
router.delete('/admin/date/:id', auth, role('owner'), discountController.deleteDateDiscount);

module.exports = router;
