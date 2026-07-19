const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Expense = require('../models/Expense');
const Note = require('../models/Note');

const MODELS = {
  bookings: Booking,
  rooms: Room,
  expenses: Expense,
  notes: Note
};

const POPULATE_MAP = {
  bookings: 'room',
  notes: 'bookingId'
};

/**
 * Get counts of trashed items per type
 */
exports.getTrashCounts = async (req, res) => {
  try {
    const [bookings, rooms, expenses, notes] = await Promise.all([
      Booking.countDocuments({ isDeleted: true }),
      Room.countDocuments({ isDeleted: true }),
      Expense.countDocuments({ isDeleted: true }),
      Note.countDocuments({ isDeleted: true })
    ]);
    res.status(200).json({ counts: { bookings, rooms, expenses, notes } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get soft-deleted items by type
 */
exports.getTrash = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = MODELS[type];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid type. Use: bookings, rooms, expenses, notes' });
    }

    let query = Model.find({ isDeleted: true }).sort({ deletedAt: -1 });
    if (POPULATE_MAP[type]) {
      query = query.populate(POPULATE_MAP[type]);
    }

    const items = await query;
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Restore a soft-deleted item
 */
exports.restoreItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = MODELS[type];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const updateData = { isDeleted: false, deletedAt: null };
    // For rooms, also restore isActive
    if (type === 'rooms') {
      updateData.isActive = true;
    }

    const item = await Model.findOneAndUpdate(
      { _id: id, isDeleted: true },
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in trash' });
    }

    res.status(200).json({ message: `${type.slice(0, -1)} restored successfully`, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Permanently delete an item
 */
exports.permanentDelete = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = MODELS[type];
    if (!Model) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const item = await Model.findOneAndDelete({ _id: id, isDeleted: true });

    if (!item) {
      return res.status(404).json({ message: 'Item not found in trash' });
    }

    res.status(200).json({ message: `${type.slice(0, -1)} permanently deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
