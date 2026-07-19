const Review = require('../models/Review');
const catchAsync = require('../utils/catchAsync');
const response = require('../utils/response');
const ROLES = require('../constants/roles');

const Booking = require('../models/Booking');

/**
 * Create a new review
 */
exports.createReview = catchAsync(async (req, res) => {
  // Ensure user is a customer (or allowed to review)
  const { room, rating, comment } = req.body;

  // Check if user has booked this room
  const hasBooked = await Booking.findOne({ user: req.user._id, room: room });
  if (!hasBooked) {
    return response.error(res, "Kindly book the room first to share your experience with the world.", 403);
  }

  // Check if user has already reviewed this room
  const existingReview = await Review.findOne({ user: req.user._id, room: room });
  if (existingReview) {
    return response.error(res, "You have already reviewed this room.", 400);
  }

  const review = await Review.create({
    user: req.user._id,
    room,
    rating,
    comment
  });

  return response.created(res, { review }, 'Review posted successfully');
});

/**
 * Get all reviews (Admin view)
 */
exports.getAllReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name profilePic')
    .populate('room', 'name type')
    .sort('-createdAt');

  return response.success(res, { reviews }, 'All reviews retrieved');
});

/**
 * Get reviews for a specific room
 */
exports.getRoomReviews = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const reviews = await Review.find({ room: roomId })
    .populate('user', 'name profilePic')
    .sort('-createdAt');

  return response.success(res, { reviews }, `Reviews for room ${roomId} retrieved`);
});

/**
 * Reply to a review (Admin only)
 */
exports.replyToReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const review = await Review.findByIdAndUpdate(
    id,
    {
      reply: {
        message,
        repliedBy: req.user._id,
        repliedAt: Date.now()
      }
    },
    { new: true, runValidators: true }
  );

  if (!review) {
    return response.error(res, 'Review not found', 404);
  }

  return response.success(res, { review }, 'Reply added successfully');
});

/**
 * Delete a review (Admin or Owner)
 */
exports.deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return response.error(res, 'Review not found', 404);
  }

  // Check if admin or owner of the review
  const isAdmin = [ROLES.OWNER, ROLES.STAFF].includes(req.user.role);
  const isOwner = review.user.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return response.error(res, 'You are not authorized to delete this review', 403);
  }

  // Soft delete
  review.isDeleted = true;
  await review.save();

  return response.success(res, {}, 'Review deleted successfully');
});
