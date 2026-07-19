const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.use(auth);
router.use(role('owner'));

router.get(
  '/revenue',
  reportController.getRevenueReport
);
router.get(
  '/daily',
  reportController.getDailyRevenue
);
router.get(
  '/export',
  reportController.exportRevenueReport
);
router.get(
  '/export/expenses',
  reportController.exportExpensesReport
);
router.get(
  '/export/notes',
  reportController.exportNotesReport
);

module.exports = router;
