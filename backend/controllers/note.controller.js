const Note = require('../models/Note');
const catchAsync = require('../utils/catchAsync');
const response = require('../utils/response');

/**
 * Get all notes (optionally filtered by date) — excludes soft-deleted
 */
exports.getNotes = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  let filter = { isDeleted: { $ne: true } };
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const notes = await Note.find(filter)
    .populate('bookingId', 'bookingId customer totalAmount status')
    .sort({ date: -1 });
  return response.success(res, { notes }, 'Notes retrieved successfully');
});

/**
 * Create a new note
 */
exports.createNote = catchAsync(async (req, res) => {
  const { title, content, bookingId, date } = req.body;

  const newNote = await Note.create({
    title,
    content,
    bookingId: bookingId || null,
    date: date || Date.now()
  });

  return response.created(res, { note: newNote }, 'Note added successfully');
});

/**
 * Update a note
 */
exports.updateNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, content, bookingId, date } = req.body;

  const note = await Note.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { title, content, bookingId: bookingId || null, date },
    { new: true, runValidators: true }
  );

  if (!note) {
    return response.error(res, 'Note not found', 404);
  }

  return response.success(res, { note }, 'Note updated successfully');
});

/**
 * Soft-delete a note
 */
exports.deleteNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!note) {
    return response.error(res, 'Note not found', 404);
  }

  return response.success(res, {}, 'Note deleted successfully');
});
