const dateUtils = require('../utils/dateUtils');

exports.calculateBookingPrice = ({
  pricePerNight,
  checkIn,
  checkOut,
  discount = 0
}) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(outDate - inDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  const nights = diffDays > 0 ? diffDays : 1;

  let total = pricePerNight * nights;

  if (discount > 0) {
    total -= (total * discount) / 100;
  }

  return {
    nights,
    total
  };
};
