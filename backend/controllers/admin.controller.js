const paymentService = require('../services/payment.service');
const reportService = require('../services/report.service');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const Booking = require('../models/Booking');
const BOOKING_STATUS = require('../constants/bookingStatus');

/**
 * Helper: Send confirmation notifications (email + SMS) + voucher to customer.
 */
const sendBookingNotifications = async (booking, paymentMethod = 'Online Transfer') => {
  try {
    // Populate room if needed
    const populatedBooking = booking.room?.name
      ? booking
      : await Booking.findById(booking._id).populate('room');

    const roomName = populatedBooking.room?.name || 'Room';
    const checkIn = new Date(populatedBooking.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const checkOut = new Date(populatedBooking.checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const dates = `${checkIn} — ${checkOut}`;

    // Send confirmation email
    if (populatedBooking.customer?.email) {
      await emailService.sendBookingConfirmation({
        to: populatedBooking.customer.email,
        bookingId: populatedBooking.bookingId,
        amount: populatedBooking.totalAmount,
        room: roomName,
        dates,
        customerName: populatedBooking.customer.name
      });

      // Send booking voucher/receipt email
      await emailService.sendBookingVoucher({
        to: populatedBooking.customer.email,
        customerName: populatedBooking.customer.name,
        bookingId: populatedBooking.bookingId,
        room: roomName,
        checkIn,
        checkOut,
        nights: populatedBooking.nights,
        totalAmount: populatedBooking.totalAmount,
        customerPhone: populatedBooking.customer.phone,
        customerCnic: populatedBooking.customer.cnic,
        paymentMethod
      });
    }

    // Send SMS
    if (populatedBooking.customer?.phone) {
      await smsService.sendBookingConfirmationSMS({
        phone: populatedBooking.customer.phone,
        bookingId: populatedBooking.bookingId,
        amount: populatedBooking.totalAmount,
        room: roomName,
        customerName: populatedBooking.customer.name
      });
    }
  } catch (error) {
    // Non-critical — don't fail the request if notifications fail
    console.error('[NOTIFICATION] Failed to send booking notifications:', error.message);
  }
};

/**
 * OWNER: Mark booking as paid by cash
 */
exports.markCashPayment = async (req, res) => {
  const { bookingId, remarks, isHalfPaid } = req.body;
  const ownerId = req.user.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    return res.status(400).json({ message: 'Booking already fully paid' });
  }

  // Determine cash payment amount and remarks
  let paymentAmount = booking.totalAmount;
  let finalRemarks = remarks;

  if (isHalfPaid) {
    if (booking.status === BOOKING_STATUS.CONFIRMED_HALF_PAID) {
      return res.status(400).json({ message: 'Booking already marked as half paid' });
    }
    paymentAmount = booking.totalAmount * 0.5;
    finalRemarks = remarks || 'Half payment paid at reception';
  } else {
    // If it was already half paid, we collect the remaining 50%
    if (booking.status === BOOKING_STATUS.CONFIRMED_HALF_PAID) {
      paymentAmount = booking.totalAmount * 0.5;
      finalRemarks = remarks || 'Remaining half payment paid at reception';
    } else {
      finalRemarks = remarks || 'Full payment paid at reception';
    }
  }

  // 1️⃣ Create cash payment record (also sets booking status to CONFIRMED or CONFIRMED_HALF_PAID)
  await paymentService.markCashPayment({
    bookingId,
    amount: paymentAmount,
    approvedBy: ownerId,
    remarks: finalRemarks,
    isHalfPaid
  });

  // 2️⃣ Reload booking with updated status for notifications
  const updatedBooking = await Booking.findById(bookingId).populate('room');

  // 3️⃣ Send confirmation notifications
  await sendBookingNotifications(updatedBooking, 'Cash');

  res.status(200).json({
    message: isHalfPaid ? 'Booking marked as half paid' : 'Booking marked as fully paid'
  });
};

/**
 * Revenue report (date range)
 */
exports.getRevenueReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const report = await reportService.getRevenueReport({
    startDate,
    endDate
  });

  res.status(200).json({
    report: report[0] || {
      totalRevenue: 0,
      transactions: 0
    }
  });
};

/**
 * Daily revenue (dashboard)
 */
exports.getDailyRevenue = async (req, res) => {
  const data = await reportService.getDailyRevenue();
  res.status(200).json({ data });
};

exports.dashboardStats = async (req, res) => {
  try {
    const notDeleted = { isDeleted: { $ne: true } };
    const totalBookings = await Booking.countDocuments(notDeleted);
    const confirmedBookings = await Booking.countDocuments({ ...notDeleted, status: BOOKING_STATUS.CONFIRMED });
    const awaitingPayment = await Booking.countDocuments({ ...notDeleted, status: BOOKING_STATUS.AWAITING_PAYMENT });
    const cancelledBookings = await Booking.countDocuments({ ...notDeleted, status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ ...notDeleted, status: 'completed' });

    // Room Stats
    const Room = require('../models/Room');
    const totalRooms = await Room.countDocuments(notDeleted);
    const availableRooms = await Room.countDocuments({ ...notDeleted, status: 'available' });
    const occupiedRooms = await Room.countDocuments({ ...notDeleted, status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ ...notDeleted, status: 'maintenance' });

    res.status(200).json({
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        awaitingPayment,
        cancelled: cancelledBookings,
        completed: completedBookings
      },
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Filter bookings (Admin / Owner)
 */
exports.filterBookings = async (req, res) => {
  const { status, startDate, endDate } = req.query;

  let filter = { isDeleted: { $ne: true } };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const bookings = await Booking.find(filter).populate('room').sort({ createdAt: -1 });

  res.status(200).json({
    total: bookings.length,
    bookings
  });
};

/**
 * Fetch users (specifically customers) for Admin booking creation
 */
exports.getCustomers = async (req, res) => {
  try {
    const User = require('../models/User');
    // Fetch users with role 'customer'
    const customers = await User.find({ role: 'customer' }).select('name email phone');
    res.status(200).json({
      customers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify payment from screenshot
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      return res.status(400).json({ message: 'Booking already confirmed' });
    }

    // 1️⃣ Create a Payment record for the screenshot verification
    const paymentService = require('../services/payment.service');
    // Using internal logic to create a record directly, or we can use markCashPayment with a specific gateway. 
    // Since paymentService doesn't have a direct 'markScreenshotPayment', we'll use the Payment model.
    const Payment = require('../models/Payment');
    const PAYMENT_STATUS = require('../constants/paymentStatus');
    const { v4: uuidv4 } = require('uuid');

    await Payment.create({
      bookingId: booking._id,
      amount: booking.totalAmount,
      gateway: 'BANK_TRANSFER', // or SCREENSHOT
      orderId: `BT-${uuidv4()}`,
      status: PAYMENT_STATUS.SUCCESS,
      verified: true,
      paidAt: new Date(),
      remarks: 'Verified via screenshot by Admin'
    });

    booking.status = BOOKING_STATUS.CONFIRMED;
    await booking.save();

    // Send confirmation notifications (email + SMS)
    await sendBookingNotifications(booking);

    res.status(200).json({
      message: 'Booking payment verified and confirmed successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get aggregated customer details including booking history
 */
exports.getCustomerDetails = async (req, res) => {
  try {
    const User = require('../models/User');

    // 1. Get all customers
    const customers = await User.find({ role: 'customer' }).select('-password');

    // 2. Aggregate bookings for these customers
    const customerDetails = await Promise.all(customers.map(async (customer) => {
      const bookings = await Booking.find({ user: customer._id }).populate('room', 'name');

      const bookingsCount = bookings.length;
      const roomsBooked = [...new Set(bookings.map(b => b.room?.name).filter(Boolean))];

      return {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        discountPercentage: customer.discountPercentage || 0,
        bookingsCount,
        roomsBooked
      };
    }));

    res.status(200).json({
      customers: customerDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply or update a discount for a customer
 */
exports.applyDiscount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { discountPercentage } = req.body;

    const User = require('../models/User');
    const customer = await User.findById(userId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.discountPercentage = discountPercentage;
    await customer.save();

    // Send discount notification email automatically
    if (discountPercentage > 0 && customer.email) {
      await emailService.sendDiscountNotification({
        to: customer.email,
        customerName: customer.name,
        discountPercentage
      });
    }

    res.status(200).json({
      message: `Discount of ${discountPercentage}% applied to customer`,
      customer: {
        _id: customer._id,
        name: customer.name,
        discountPercentage: customer.discountPercentage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all password reset requests (for admin panel)
 */
exports.getPasswordResetRequests = async (req, res) => {
  try {
    const PasswordResetRequest = require('../models/PasswordResetRequest');
    const requests = await PasswordResetRequest.find()
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name');

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Approve a password reset request.
 * Sets the customer's password to a temporary value (12345678),
 * saves it to the DB (the pre-save hook will hash it), and
 * emails the customer their temporary password.
 */
exports.approvePasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const PasswordResetRequest = require('../models/PasswordResetRequest');
    const User = require('../models/User');

    const resetRequest = await PasswordResetRequest.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({ message: 'Reset request not found' });
    }

    if (resetRequest.status === 'resolved') {
      return res.status(400).json({ message: 'This request has already been resolved' });
    }

    const user = await User.findById(resetRequest.user).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const TEMP_PASSWORD = '12345678';

    // Set new password — pre-save hook will hash it automatically
    user.password = TEMP_PASSWORD;
    // Clear any leftover token fields
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Email the customer their temporary password
    await emailService.sendPasswordResetNotification({
      to: user.email,
      customerName: user.name
    });

    // Mark request as resolved
    resetRequest.status = 'resolved';
    resetRequest.resolvedBy = req.user.id;
    resetRequest.resolvedAt = new Date();
    await resetRequest.save();

    res.status(200).json({
      message: `Password reset to temporary value. Customer notified at ${user.email}.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send discount notification email to a customer
 */
exports.sendDiscountEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/User');
    const customer = await User.findById(userId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.discountPercentage || customer.discountPercentage <= 0) {
      return res.status(400).json({ message: 'Customer has no active discount' });
    }

    await emailService.sendDiscountNotification({
      to: customer.email,
      customerName: customer.name,
      discountPercentage: customer.discountPercentage
    });

    res.status(200).json({
      message: `Discount notification email sent to ${customer.email}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get recent administrative alerts (new bookings with awaiting_payment status, pending password reset requests)
 * since a given timestamp 'since'.
 */
exports.getRecentAlerts = async (req, res) => {
  try {
    const { since } = req.query;
    if (!since) {
      return res.status(400).json({ message: "Parameter 'since' (ISO timestamp) is required" });
    }

    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.status(400).json({ message: "Invalid 'since' timestamp format" });
    }

    const Booking = require('../models/Booking');
    const PasswordResetRequest = require('../models/PasswordResetRequest');
    const Review = require('../models/Review');

    // 1. Fetch bookings updated since 'since' with 'requested' or 'awaiting_payment' status
    const bookings = await Booking.find({
      updatedAt: { $gt: sinceDate },
      status: { $in: ['requested', 'awaiting_payment'] }
    }).populate('room');

    // 2. Fetch pending password reset requests created since 'since'
    const passwordResets = await PasswordResetRequest.find({
      createdAt: { $gt: sinceDate },
      status: 'pending'
    });

    // 3. Fetch reviews created since 'since'
    const reviews = await Review.find({
      createdAt: { $gt: sinceDate }
    }).populate('user', 'name').populate('room', 'name');

    res.status(200).json({ bookings, passwordResets, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch list of all logged emails sent to customers.
 */
exports.getEmailLogs = async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    const { to, search } = req.query;
    
    let filter = {};
    if (to) {
      filter.to = new RegExp(to, 'i');
    }
    if (search) {
      filter.$or = [
        { to: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') }
      ];
    }

    const emailLogs = await EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200); // cap at 200 logs for stability

    res.status(200).json({ emailLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch a single logged email.
 */
exports.getEmailLogById = async (req, res) => {
  try {
    const EmailLog = require('../models/EmailLog');
    const emailLog = await EmailLog.findById(req.params.id);
    if (!emailLog) {
      return res.status(404).json({ message: 'Email log not found' });
    }
    res.status(200).json({ emailLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Resend a logged email.
 */
exports.resendEmail = async (req, res) => {
  try {
    const emailService = require('../services/email.service');
    const result = await emailService.resendEmail(req.params.id);
    if (result.success) {
      res.status(200).json({ message: 'Email resent successfully', result });
    } else {
      res.status(500).json({ message: `Resend failed: ${result.error}`, result });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};