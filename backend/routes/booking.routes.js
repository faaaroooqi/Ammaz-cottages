const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const bookingSchema = require('../validations/booking.schema');
const { uploadScreenshot, uploadRoomImages } = require('../middlewares/multer.middleware');

// ─── Customer Routes ───────────────────────────────────────────────

// Create a new booking
router.post(
  '/',
  auth,
  bookingController.createBooking
);

// Get my bookings
router.get(
  '/my',
  auth,
  bookingController.getMyBookings
);

// Upload payment screenshot (Cloudinary via memory buffer)
router.post(
  '/:bookingId/screenshot',
  auth,
  (req, res, next) => {
    uploadScreenshot(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  bookingController.uploadScreenshot
);

// Get booking by ID
router.get(
  '/:bookingId',
  bookingController.getBookingById
);

// Get room booked dates
router.get(
  '/room/:roomId/dates',
  bookingController.getRoomBookedDates
);

// Upload ID Card images
router.post(
  '/:bookingId/idcards',
  auth,
  (req, res, next) => {
    uploadRoomImages(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  bookingController.uploadIdCards
);

// Customer delete booking
router.delete(
  '/:bookingId/my',
  auth,
  bookingController.cancelMyBooking
);

// ─── Admin / Staff Routes ──────────────────────────────────────────

// Get all bookings
router.get(
  '/',
  auth,
  role('owner', 'staff'),
  bookingController.getAllBookings
);

// Manual cash payment (Owner only)
router.patch(
  '/:bookingId/mark-cash-paid',
  auth,
  role('owner'),
  bookingController.markAsCashPaid
);

// Update a booking
router.put(
  '/:bookingId',
  auth,
  role('owner', 'staff'),
  validate(bookingSchema.updateBookingSchema),
  bookingController.updateBooking
);

// Delete a booking
router.delete(
  '/:bookingId',
  auth,
  role('owner'),
  bookingController.deleteBooking
);

module.exports = router;
