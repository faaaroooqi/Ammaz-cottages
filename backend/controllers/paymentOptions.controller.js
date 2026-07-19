const PaymentOption = require('../models/PaymentOption');

/**
 * PUBLIC: Get all active payment options (for customer payment page)
 */
exports.getActiveOptions = async (req, res) => {
  try {
    const options = await PaymentOption.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select('-__v');

    res.status(200).json({ paymentOptions: options });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Get all payment options (active + inactive)
 */
exports.getAllOptions = async (req, res) => {
  try {
    const options = await PaymentOption.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .select('-__v');

    res.status(200).json({ paymentOptions: options });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Create a new payment option
 */
exports.createOption = async (req, res) => {
  try {
    const { type, provider, accountTitle, accountNumber, isActive, sortOrder } = req.body;

    if (!type || !provider || !accountTitle || !accountNumber) {
      return res.status(400).json({
        message: 'Fields required: type, provider, accountTitle, accountNumber'
      });
    }

    const option = await PaymentOption.create({
      type,
      provider: provider.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      message: 'Payment option created successfully',
      paymentOption: option
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Update an existing payment option
 */
exports.updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, provider, accountTitle, accountNumber, isActive, sortOrder } = req.body;

    const option = await PaymentOption.findById(id);
    if (!option) {
      return res.status(404).json({ message: 'Payment option not found' });
    }

    if (type !== undefined) option.type = type;
    if (provider !== undefined) option.provider = provider.trim();
    if (accountTitle !== undefined) option.accountTitle = accountTitle.trim();
    if (accountNumber !== undefined) option.accountNumber = accountNumber.trim();
    if (isActive !== undefined) option.isActive = isActive;
    if (sortOrder !== undefined) option.sortOrder = sortOrder;

    await option.save();

    res.status(200).json({
      message: 'Payment option updated successfully',
      paymentOption: option
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN: Delete a payment option permanently
 */
exports.deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    const option = await PaymentOption.findByIdAndDelete(id);
    if (!option) {
      return res.status(404).json({ message: 'Payment option not found' });
    }

    res.status(200).json({ message: 'Payment option deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
