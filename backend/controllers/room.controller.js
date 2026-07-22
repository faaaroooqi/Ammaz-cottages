const roomService = require('../services/room.service');
const Booking = require('../models/Booking');
const BOOKING_STATUS = require('../constants/bookingStatus');


exports.createRoom = async (req, res) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const rooms = await roomService.getAllRooms(includeInactive);
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room updated successfully', room });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for any active/future bookings for this room
    const activeBooking = await Booking.findOne({
      room: req.params.id,
      isDeleted: { $ne: true },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW, BOOKING_STATUS.COMPLETED] },
      checkOut: { $gte: today }
    });

    if (activeBooking) {
      const checkInStr = new Date(activeBooking.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      const checkOutStr = new Date(activeBooking.checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      return res.status(400).json({
        message: `This room cannot be deleted because a customer has booked it from ${checkInStr} to ${checkOutStr}. The room can only be deleted once this booking completes or is cancelled.`
      });
    }

    const room = await roomService.softDeleteRoom(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

