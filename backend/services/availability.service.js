const Booking = require('../models/Booking');
const BOOKING_STATUS = require('../constants/bookingStatus');

/**
 * Check if a room is available between dates
 */
exports.isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const conflict = await Booking.findOne({
    room: roomId,
    isDeleted: { $ne: true },
    status: {
      $in: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CONFIRMED_HALF_PAID,
        BOOKING_STATUS.AWAITING_PAYMENT,
      ]
    },
    $or: [
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
      }
    ]
  });

  return !conflict;
};

/**
 * Get all unavailable rooms for date range
 */
exports.getUnavailableRooms = async (checkIn, checkOut) => {
  return Booking.find({
    isDeleted: { $ne: true },
    status: {
      $in: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CONFIRMED_HALF_PAID,
        BOOKING_STATUS.AWAITING_PAYMENT,
      ]
    },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  }).select('room');
};

/**
 * Get all booked dates for a specific room
 */
exports.getBookedDatesForRoom = async (roomId) => {
  const bookings = await Booking.find({
    room: roomId,
    isDeleted: { $ne: true },
    status: {
      $in: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.CONFIRMED_HALF_PAID,
        BOOKING_STATUS.AWAITING_PAYMENT,
      ]
    },
    checkOut: { $gte: new Date() }
  }).select('checkIn checkOut');

  return bookings.map(b => ({
    checkIn: b.checkIn,
    checkOut: b.checkOut
  }));
};
