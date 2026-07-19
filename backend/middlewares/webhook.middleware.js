const crypto = require('crypto');

module.exports = (req, res, next) => {
  try {
    const receivedSignature = req.headers['x-bank-signature'];

    if (!receivedSignature)
      return res.status(400).json({ message: 'Missing signature' });

    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', process.env.BANK_SECRET_KEY)
      .update(payload)
      .digest('hex');

    if (receivedSignature !== expectedSignature)
      return res.status(401).json({ message: 'Invalid webhook signature' });

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Webhook verification failed' });
  }
};
