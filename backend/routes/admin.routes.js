const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const expenseController = require('../controllers/expense.controller');
const noteController = require('../controllers/note.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.use(auth);

// Dashboard
router.get(
  '/dashboard',
  role('owner', 'staff'),
  adminController.dashboardStats
);

// Booking filters
router.get(
  '/bookings',
  role('owner', 'staff'),
  adminController.filterBookings
);

// Manual cash payment
router.post(
  '/cash-payment',
  role('owner'),
  adminController.markCashPayment
);

// Verify payment screenshot
router.patch(
  '/bookings/:bookingId/verify',
  role('owner', 'staff'),
  adminController.verifyPayment
);

// Customers details
router.get(
  '/customers/details',
  role('owner', 'staff'),
  adminController.getCustomerDetails
);

// Apply discount
router.patch(
  '/customers/:userId/discount',
  role('owner', 'staff'),
  adminController.applyDiscount
);

// Expenses
router.get(
  '/expenses',
  role('owner', 'staff'),
  expenseController.getExpenses
);

router.post(
  '/expenses',
  role('owner', 'staff'),
  expenseController.createExpense
);

router.put(
  '/expenses/:id',
  role('owner', 'staff'),
  expenseController.updateExpense
);

router.delete(
  '/expenses/:id',
  role('owner', 'staff'),
  expenseController.deleteExpense
);

// Notes
router.get(
  '/notes',
  role('owner', 'staff'),
  noteController.getNotes
);

router.post(
  '/notes',
  role('owner', 'staff'),
  noteController.createNote
);

router.put(
  '/notes/:id',
  role('owner', 'staff'),
  noteController.updateNote
);

router.delete(
  '/notes/:id',
  role('owner', 'staff'),
  noteController.deleteNote
);

// Trash
const trashController = require('../controllers/trash.controller');

router.get(
  '/trash/counts',
  role('owner', 'staff'),
  trashController.getTrashCounts
);

router.get(
  '/trash/:type',
  role('owner', 'staff'),
  trashController.getTrash
);

router.patch(
  '/trash/:type/:id/restore',
  role('owner'),
  trashController.restoreItem
);

router.delete(
  '/trash/:type/:id',
  role('owner'),
  trashController.permanentDelete
);

// Password Reset Requests
router.get(
  '/password-resets',
  role('owner', 'staff'),
  adminController.getPasswordResetRequests
);

router.post(
  '/password-resets/:requestId/approve',
  role('owner', 'staff'),
  adminController.approvePasswordReset
);

// Send Discount Email Notification Manually
router.post(
  '/customers/:userId/send-discount-email',
  role('owner', 'staff'),
  adminController.sendDiscountEmail
);

// Polling Alerts Endpoint for Admin
router.get(
  '/alerts',
  role('owner', 'staff'),
  adminController.getRecentAlerts
);

// Payment Options CRUD
const paymentOptionsController = require('../controllers/paymentOptions.controller');

router.get(
  '/payment-options',
  role('owner', 'staff'),
  paymentOptionsController.getAllOptions
);

router.post(
  '/payment-options',
  role('owner'),
  paymentOptionsController.createOption
);

router.put(
  '/payment-options/:id',
  role('owner'),
  paymentOptionsController.updateOption
);

router.delete(
  '/payment-options/:id',
  role('owner'),
  paymentOptionsController.deleteOption
);

// Email Auditing / Mailbox Endpoints
router.get(
  '/emails',
  role('owner', 'staff'),
  adminController.getEmailLogs
);

router.get(
  '/emails/:id',
  role('owner', 'staff'),
  adminController.getEmailLogById
);

router.post(
  '/emails/:id/resend',
  role('owner', 'staff'),
  adminController.resendEmail
);

module.exports = router;

