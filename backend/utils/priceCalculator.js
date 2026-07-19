exports.calculateTotalPrice = ({
  pricePerNight,
  checkIn,
  checkOut
}) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const nights =
    Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (nights <= 0) return 0;

  return nights * pricePerNight;
};
