const GlobalDiscount = require('../models/GlobalDiscount');

exports.getGlobalDiscounts = async () => {
  return GlobalDiscount.getGlobalDiscount();
};

exports.updateStayDiscounts = async (stayData) => {
  const doc = await GlobalDiscount.getGlobalDiscount();
  if (stayData.sevenDays !== undefined) {
    doc.stayDiscounts.sevenDays = { ...doc.stayDiscounts.sevenDays, ...stayData.sevenDays };
  }
  if (stayData.fifteenDays !== undefined) {
    doc.stayDiscounts.fifteenDays = { ...doc.stayDiscounts.fifteenDays, ...stayData.fifteenDays };
  }
  if (stayData.thirtyDays !== undefined) {
    doc.stayDiscounts.thirtyDays = { ...doc.stayDiscounts.thirtyDays, ...stayData.thirtyDays };
  }
  await doc.save();
  return doc;
};

exports.addDateDiscount = async ({ date, discountPercentage, title, enabled }) => {
  const doc = await GlobalDiscount.getGlobalDiscount();
  doc.dateDiscounts.push({
    date,
    discountPercentage: Number(discountPercentage),
    title: title || 'Special Date Discount',
    enabled: enabled !== undefined ? Boolean(enabled) : true
  });
  await doc.save();
  return doc;
};

exports.updateDateDiscount = async (discountId, updateData) => {
  const doc = await GlobalDiscount.getGlobalDiscount();
  const subDoc = doc.dateDiscounts.id(discountId);
  if (!subDoc) throw new Error('Date discount not found');

  if (updateData.date !== undefined) subDoc.date = updateData.date;
  if (updateData.discountPercentage !== undefined) subDoc.discountPercentage = Number(updateData.discountPercentage);
  if (updateData.title !== undefined) subDoc.title = updateData.title;
  if (updateData.enabled !== undefined) subDoc.enabled = Boolean(updateData.enabled);

  await doc.save();
  return doc;
};

exports.deleteDateDiscount = async (discountId) => {
  const doc = await GlobalDiscount.getGlobalDiscount();
  doc.dateDiscounts.pull({ _id: discountId });
  await doc.save();
  return doc;
};

/**
 * Calculate active storewide & duration discount for a stay
 */
exports.evaluateGlobalDiscounts = async ({ nights, checkIn, checkOut }) => {
  const doc = await GlobalDiscount.getGlobalDiscount();
  let durationDiscount = { percentage: 0, label: '', tier: null };
  let dateDiscount = { percentage: 0, label: '', date: null };

  // 1. Duration Discount
  const { sevenDays, fifteenDays, thirtyDays } = doc.stayDiscounts || {};

  if (nights >= 30 && thirtyDays?.enabled && thirtyDays.percentage > 0) {
    durationDiscount = {
      percentage: thirtyDays.percentage,
      label: `30+ Days Long Stay Discount (${thirtyDays.percentage}%)`,
      tier: 30
    };
  } else if (nights >= 15 && fifteenDays?.enabled && fifteenDays.percentage > 0) {
    durationDiscount = {
      percentage: fifteenDays.percentage,
      label: `15+ Days Long Stay Discount (${fifteenDays.percentage}%)`,
      tier: 15
    };
  } else if (nights >= 7 && sevenDays?.enabled && sevenDays.percentage > 0) {
    durationDiscount = {
      percentage: sevenDays.percentage,
      label: `7+ Days Long Stay Discount (${sevenDays.percentage}%)`,
      tier: 7
    };
  }

  // 2. Specific Date Discount (matches if checkIn or stay range overlaps a configured date)
  if (checkIn && doc.dateDiscounts && doc.dateDiscounts.length > 0) {
    const activeDates = doc.dateDiscounts.filter((d) => d.enabled);

    // Build list of dates for the stay range
    const stayDates = [];
    let cur = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date(checkIn);
    cur.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // loop through stay dates
    while (cur < end || (cur.getTime() === end.getTime())) {
      stayDates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
      if (stayDates.length > 365) break; // guard
    }

    // Find highest matching date discount
    for (const d of activeDates) {
      if (stayDates.includes(d.date)) {
        if (d.discountPercentage > dateDiscount.percentage) {
          dateDiscount = {
            percentage: d.discountPercentage,
            label: `${d.title || 'Date Discount'} (${d.discountPercentage}%)`,
            date: d.date
          };
        }
      }
    }
  }

  return {
    doc,
    durationDiscount,
    dateDiscount
  };
};
