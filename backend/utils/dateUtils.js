exports.getDateRange = (start, end) => {
  const dates = [];
  const current = new Date(start);

  while (current < new Date(end)) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

exports.isDateOverlap = (start1, end1, start2, end2) => {
  return new Date(start1) < new Date(end2) &&
         new Date(start2) < new Date(end1);
};

exports.formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};
