const mongoose = require('mongoose');
const PAYMENT_STATUS = require('../constants/paymentStatus');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: 'PKR'
    },

    gateway: {
      type: String,
      enum: ['MEEZAN', 'UBL', 'CASH', 'BANK_TRANSFER', 'MANUAL'],
      required: true
    },

    transactionRef: {
      type: String, // txn_id from bank
      unique: true,
      sparse: true
    },

    orderId: {
      type: String, // Generated before redirect
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.INITIATED
    },

    gatewayResponse: {
      type: Object // Full bank response (for audit)
    },

    paidAt: {
      type: Date
    },

    verified: {
      type: Boolean,
      default: false
    },

    cashApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    remarks: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// 🔐 Index for fast reports
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
