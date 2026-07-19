const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const ROLES = require('../constants/roles');

// Public routes
router.get('/room/:roomId', reviewController.getRoomReviews);

// Protected routes (Logged in users)
router.use(auth);

router.post('/', role(ROLES.CUSTOMER), reviewController.createReview);
router.delete('/:id', reviewController.deleteReview);

// Admin only routes
router.use(role(ROLES.OWNER, ROLES.STAFF));

router.get('/', reviewController.getAllReviews);
router.patch('/:id/reply', reviewController.replyToReview);

module.exports = router;
