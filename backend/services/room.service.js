const Room = require('../models/Room');

exports.getAllRooms = async (includeInactive = false) => {
  const matchStage = includeInactive ? { isDeleted: { $ne: true } } : { isActive: true, isDeleted: { $ne: true } };
  
  return Room.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'room',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        activeReviews: {
          $filter: {
             input: "$reviews",
             as: "review",
             cond: { $ne: ["$$review.isDeleted", true] }
          }
        }
      }
    },
    {
      $addFields: {
        reviewCount: { $size: "$activeReviews" },
        averageRating: { $round: [{ $avg: "$activeReviews.rating" }, 1] },
        id: "$_id"
      }
    },
    {
      $project: {
        reviews: 0,
        activeReviews: 0
      }
    }
  ]);
};

exports.getRoomById = async (roomId) => {
  return Room.findById(roomId);
};

exports.createRoom = async (roomData) => {
  return Room.create(roomData);
};

exports.updateRoom = async (roomId, updateData) => {
  return Room.findByIdAndUpdate(roomId, updateData, { new: true, runValidators: true });
};

exports.softDeleteRoom = async (roomId) => {
  return Room.findByIdAndUpdate(roomId, { isActive: false, isDeleted: true, deletedAt: new Date() }, { new: true });
};

exports.hardDeleteRoom = async (roomId) => {
  return Room.findByIdAndDelete(roomId);
};
