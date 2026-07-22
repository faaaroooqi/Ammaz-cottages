const dateUtils = require('../utils/dateUtils');

exports.calculateBookingPrice = ({
  pricePerNight,
  checkIn,
  checkOut,
  discount = 0,               // User explicit loyalty discount
  durationDiscount = 0,       // Duration discount %
  dateDiscount = 0            // Specific date discount %
}) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(outDate - inDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const nights = diffDays > 0 ? diffDays : 1;
  const baseAmount = pricePerNight * nights;

  const totalDiscountPercentage = Math.min(
    100,
    (discount || 0) + (durationDiscount || 0) + (dateDiscount || 0)
  );

  const discountAmount = (baseAmount * totalDiscountPercentage) / 100;
  const total = Math.max(0, baseAmount - discountAmount);

  return {
    nights,
    baseAmount,
    discountAmount,
    totalDiscountPercentage,
    total
  };
};
