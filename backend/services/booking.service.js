const Booking = require('../models/Booking');
const Room = require('../models/Room');
const BOOKING_STATUS = require('../constants/bookingStatus');
const availabilityService = require('./availability.service');
const pricingService = require('./pricing.service');
const { v4: uuidv4 } = require('uuid');

exports.createBooking = async (bookingData) => {
  const { userId, roomId, checkIn, checkOut, customerName, customerEmail, customerPhone, customerCnic } = bookingData;

  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    throw new Error('Room not found or inactive');
  }

  const isAvailable = await availabilityService.isRoomAvailable(
    roomId,
    new Date(checkIn),
    new Date(checkOut)
  );

  if (!isAvailable) {
    throw new Error('Room is booked, kindly wait or book another room.');
  }

  const User = require('../models/User');
  const discountService = require('./discount.service');
  const user = await User.findById(userId);
  const discount = user ? (user.discountPercentage || 0) : 0;

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  const calcNights = Math.max(1, Math.ceil(Math.abs(outDate - inDate) / (1000 * 60 * 60 * 24)));

  const globalEval = await discountService.evaluateGlobalDiscounts({
    nights: calcNights,
    checkIn,
    checkOut
  });

  const pricing = pricingService.calculateBookingPrice({
    pricePerNight: room.pricePerNight,
    checkIn,
    checkOut,
    discount,
    durationDiscount: globalEval.durationDiscount.percentage,
    dateDiscount: globalEval.dateDiscount.percentage
  });

  const bookingId = `BKG-${uuidv4().substring(0, 8).toUpperCase()}`;

  const booking = await Booking.create({
    bookingId,
    room: roomId,
    user: userId,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      cnic: customerCnic
    },
    checkIn,
    checkOut,
    nights: pricing.nights,
    totalAmount: pricing.total,
    status: bookingData.status || BOOKING_STATUS.REQUESTED
  });

  // If created directly with a confirmed/completed/half-paid status, create a payment record
  if (
    booking.status === BOOKING_STATUS.CONFIRMED ||
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CONFIRMED_HALF_PAID
  ) {
    const Payment = require('../models/Payment');
    const isHalf = booking.status === BOOKING_STATUS.CONFIRMED_HALF_PAID;
    await Payment.create({
      bookingId: booking._id,
      amount: isHalf ? booking.totalAmount * 0.5 : booking.totalAmount,
      gateway: 'MANUAL',
      orderId: `MAN-${uuidv4()}`,
      status: require('../constants/paymentStatus').SUCCESS,
      verified: true,
      paidAt: new Date(),
      remarks: `Manually marked as ${booking.status}`
    });
  }

  return booking;
};

exports.getMyBookings = async (userId) => {
  return Booking.find({ user: userId, isDeleted: { $ne: true }, isDeletedByCustomer: { $ne: true } }).populate('room').sort({ createdAt: -1 });
};

exports.getBookingById = async (bookingId) => {
  return Booking.findById(bookingId).populate('room');
};

exports.getAllBookings = async () => {
  return Booking.find({ isDeleted: { $ne: true } }).populate('room').sort({ createdAt: -1 });
};

exports.updateBooking = async (bookingId, updateData) => {
  // If customer details are included, format them properly
  const formattedUpdate = { ...updateData };
  
  if (updateData.customerName || updateData.customerEmail || updateData.customerPhone || updateData.customerCnic) {
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) throw new Error('Booking not found');

    formattedUpdate.customer = {
      name: updateData.customerName || existingBooking.customer.name,
      email: updateData.customerEmail || existingBooking.customer.email,
      phone: updateData.customerPhone || existingBooking.customer.phone,
      cnic: updateData.customerCnic !== undefined ? updateData.customerCnic : existingBooking.customer.cnic
    };

    delete formattedUpdate.customerName;
    delete formattedUpdate.customerEmail;
    delete formattedUpdate.customerPhone;
    delete formattedUpdate.customerCnic;
  }

  const oldBooking = await Booking.findById(bookingId);
  if (!oldBooking) throw new Error('Booking not found');

  const updatedBooking = await Booking.findByIdAndUpdate(bookingId, formattedUpdate, { new: true });

  // Automatic Loyalty Discount logic
  if (
    (formattedUpdate.status === BOOKING_STATUS.COMPLETED && oldBooking.status !== BOOKING_STATUS.COMPLETED) ||
    (formattedUpdate.status && formattedUpdate.status !== BOOKING_STATUS.COMPLETED && oldBooking.status === BOOKING_STATUS.COMPLETED)
  ) {
    const userId = updatedBooking.user;
    if (userId) {
      await exports.recalculateUserDiscount(userId);
    }
  }

  // If status is updated to confirmed, completed, or confirmed_half_paid, ensure a Payment record exists
  if (
    formattedUpdate.status === BOOKING_STATUS.CONFIRMED ||
    formattedUpdate.status === BOOKING_STATUS.COMPLETED ||
    formattedUpdate.status === BOOKING_STATUS.CONFIRMED_HALF_PAID
  ) {
    const Payment = require('../models/Payment');
    const PAYMENT_STATUS = require('../constants/paymentStatus');
    // Check for ANY existing successful payment (SUCCESS or CASH) to prevent duplicates
    const existingPayment = await Payment.findOne({
      bookingId: updatedBooking._id,
      status: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.CASH] }
    });
    
    if (!existingPayment) {
      const { v4: uuidv4 } = require('uuid');
      const isHalf = formattedUpdate.status === BOOKING_STATUS.CONFIRMED_HALF_PAID;
      await Payment.create({
        bookingId: updatedBooking._id,
        amount: isHalf ? updatedBooking.totalAmount * 0.5 : updatedBooking.totalAmount,
        gateway: 'MANUAL',
        orderId: `MAN-${uuidv4()}`,
        status: PAYMENT_STATUS.SUCCESS,
        verified: true,
        paidAt: new Date(),
        remarks: `Manually marked as ${formattedUpdate.status}`
      });
    }
  }

  return updatedBooking;
};

exports.deleteBooking = async (bookingId) => {
  return Booking.findByIdAndUpdate(bookingId, { isDeleted: true, deletedAt: new Date() }, { new: true });
};

exports.recalculateUserDiscount = async (userId) => {
  if (!userId) return;
  const User = require('../models/User');
  const completedCount = await Booking.countDocuments({
    user: userId,
    status: BOOKING_STATUS.COMPLETED,
    isDeleted: { $ne: true }
  });

  let newDiscount = 0;
  if (completedCount >= 10) {
    newDiscount = 20;
  } else if (completedCount >= 5) {
    newDiscount = 15;
  } else if (completedCount >= 3) {
    newDiscount = 10;
  }

  const user = await User.findById(userId);
  if (user) {
    const oldDiscount = user.discountPercentage || 0;
    user.discountPercentage = newDiscount;
    await user.save();

    // Send email notification ONLY if the discount increased
    if (newDiscount > oldDiscount) {
      const emailService = require('./email.service');
      await emailService.sendDiscountNotification({
        to: user.email,
        customerName: user.name,
        discountPercentage: newDiscount
      }).catch((err) => console.error('[NOTIFICATION] Failed to send auto-discount email:', err.message));
    }
  }
};
