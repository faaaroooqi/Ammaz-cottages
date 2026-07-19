const bookingService = require('../services/booking.service');
const paymentService = require('../services/payment.service');
const availabilityService = require('../services/availability.service');

exports.createBooking = async (req, res) => {
  try {
    const bookingPayload = {
      ...req.body,
      userId: req.user.id
    };
    const booking = await bookingService.createBooking(bookingPayload);
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.status(200).json({
      message: 'Bookings fetched successfully',
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({
      message: 'Booking fetched successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings();
    res.status(200).json({
      message: 'Bookings fetched successfully',
      total: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsCashPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, remarks } = req.body;
    
    // Using req.user.id populated by auth middleware
    const approvedBy = req.user.id;

    const payment = await paymentService.markCashPayment({
      bookingId,
      amount,
      approvedBy,
      remarks
    });

    res.status(200).json({
      message: 'Booking marked as cash paid',
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await bookingService.updateBooking(req.params.bookingId, req.body);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await bookingService.deleteBooking(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelMyBooking = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    if (bookingUserId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to manage this booking' });
    }

    const checkInDate = new Date(booking.checkIn);
    const now = new Date();

    // Check if the stay has started/passed OR if it is already in a final state like completed/cancelled
    if (now >= checkInDate || ['cancelled', 'completed'].includes(booking.status)) {
      // 1. Past/Final Booking: Soft-delete for customer side only (so admin still sees it)
      booking.isDeletedByCustomer = true;
      await booking.save();
      return res.status(200).json({ message: 'Booking removed from history' });
    } else {
      // 2. Future Booking: Cancel the booking in the system
      const previousStatus = booking.status;
      booking.status = 'cancelled';
      await booking.save();

      // Recalculate loyalty discount if the booking was completed
      if (previousStatus === 'completed') {
        await bookingService.recalculateUserDiscount(bookingUserId);
      }

      // Mark all successful/cash payment records as refunded
      const Payment = require('../models/Payment');
      const PAYMENT_STATUS = require('../constants/paymentStatus');
      await Payment.updateMany(
        { bookingId: booking._id, status: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.CASH] } },
        { $set: { status: PAYMENT_STATUS.REFUNDED } }
      );

      return res.status(200).json({ message: 'Booking cancelled successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadService = require('../services/upload.service');

exports.uploadScreenshot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No screenshot provided' });
    }
    
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If there's an existing screenshot, delete it from Cloudinary
    if (booking.paymentScreenshot) {
      const oldPublicId = uploadService.extractPublicId(booking.paymentScreenshot);
      if (oldPublicId) {
        try { await uploadService.deleteImage(oldPublicId); } catch (_) { /* non-critical */ }
      }
    }

    // Upload buffer to Cloudinary (memory storage — no temp file)
    const result = await uploadService.uploadFromBuffer(req.file.buffer, 'receipts');

    // Update booking with the screenshot and set status to awaiting_payment
    const BOOKING_STATUS = require('../constants/bookingStatus');
    const updateData = {
      paymentScreenshot: result.url,
      status: BOOKING_STATUS.AWAITING_PAYMENT
    };

    const updatedBooking = await bookingService.updateBooking(bookingId, updateData);

    res.status(200).json({
      message: 'Screenshot uploaded successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomBookedDates = async (req, res) => {
  try {
    const dates = await availabilityService.getBookedDatesForRoom(req.params.roomId);
    res.status(200).json({
      message: 'Booked dates fetched successfully',
      dates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadIdCards = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No ID card images provided' });
    }

    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Upload files to Cloudinary
    const results = await uploadService.uploadMultipleFromBuffer(
      files.map((f) => f.buffer),
      'idcards'
    );

    const imageUrls = results.map(r => r.url);

    // Update booking with the ID card URLs
    const updateData = {
      idCardImages: imageUrls
    };

    const updatedBooking = await bookingService.updateBooking(bookingId, updateData);

    res.status(200).json({
      message: 'ID cards uploaded successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
