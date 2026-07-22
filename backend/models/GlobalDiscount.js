const mongoose = require('mongoose');

const dateDiscountSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    title: { type: String, default: 'Special Date Discount' },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const globalDiscountSchema = new mongoose.Schema(
  {
    stayDiscounts: {
      sevenDays: {
        enabled: { type: Boolean, default: true },
        percentage: { type: Number, default: 10, min: 0, max: 100 }
      },
      fifteenDays: {
        enabled: { type: Boolean, default: true },
        percentage: { type: Number, default: 15, min: 0, max: 100 }
      },
      thirtyDays: {
        enabled: { type: Boolean, default: true },
        percentage: { type: Number, default: 25, min: 0, max: 100 }
      }
    },
    dateDiscounts: [dateDiscountSchema]
  },
  { timestamps: true }
);

globalDiscountSchema.statics.getGlobalDiscount = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
      stayDiscounts: {
        sevenDays: { enabled: true, percentage: 10 },
        fifteenDays: { enabled: true, percentage: 15 },
        thirtyDays: { enabled: true, percentage: 25 }
      },
      dateDiscounts: []
    });
  }
  return doc;
};

module.exports = mongoose.model('GlobalDiscount', globalDiscountSchema);
