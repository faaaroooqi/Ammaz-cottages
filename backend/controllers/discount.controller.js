const discountService = require('../services/discount.service');

exports.getPublicDiscounts = async (req, res) => {
  try {
    const doc = await discountService.getGlobalDiscounts();
    const activeDateDiscounts = (doc.dateDiscounts || []).filter((d) => d.enabled);

    res.status(200).json({
      stayDiscounts: doc.stayDiscounts,
      dateDiscounts: activeDateDiscounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminDiscounts = async (req, res) => {
  try {
    const doc = await discountService.getGlobalDiscounts();
    res.status(200).json({ discountConfig: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStayDiscounts = async (req, res) => {
  try {
    const doc = await discountService.updateStayDiscounts(req.body);
    res.status(200).json({ message: 'Stay duration discounts updated', discountConfig: doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addDateDiscount = async (req, res) => {
  try {
    const { date, discountPercentage, title, enabled } = req.body;
    if (!date || discountPercentage === undefined) {
      return res.status(400).json({ message: 'Date and discountPercentage are required' });
    }
    const doc = await discountService.addDateDiscount({ date, discountPercentage, title, enabled });
    res.status(201).json({ message: 'Specific date discount added', discountConfig: doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDateDiscount = async (req, res) => {
  try {
    const doc = await discountService.updateDateDiscount(req.params.id, req.body);
    res.status(200).json({ message: 'Date discount updated', discountConfig: doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDateDiscount = async (req, res) => {
  try {
    const doc = await discountService.deleteDateDiscount(req.params.id);
    res.status(200).json({ message: 'Date discount deleted', discountConfig: doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.evaluateBookingDiscounts = async (req, res) => {
  try {
    const { nights, checkIn, checkOut } = req.body;
    const evaluated = await discountService.evaluateGlobalDiscounts({
      nights: Number(nights || 1),
      checkIn,
      checkOut
    });
    res.status(200).json({
      durationDiscount: evaluated.durationDiscount,
      dateDiscount: evaluated.dateDiscount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
