const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    pricePerNight: {
      type: Number,
      required: true
    },
    capacity: {
      type: Number,
      default: 2
    },
    description: {
      type: String,
      default: ""
    },
    facilities: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
