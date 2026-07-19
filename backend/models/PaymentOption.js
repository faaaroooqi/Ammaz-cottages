const mongoose = require('mongoose');

const paymentOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mobile_wallet', 'bank_account'],
      required: true
    },

    provider: {
      type: String,
      required: true,
      trim: true
      // e.g. "EasyPaisa", "JazzCash", "SadaPay", "NayaPay", "Meezan Bank", "HBL", etc.
    },

    accountTitle: {
      type: String,
      required: true,
      trim: true
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true
      // Phone number, IBAN, or account number depending on provider
    },

    isActive: {
      type: Boolean,
      default: true
    },

    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for fast active-only lookups
paymentOptionSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('PaymentOption', paymentOptionSchema);
