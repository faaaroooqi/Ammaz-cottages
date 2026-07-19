const crypto = require('crypto');

module.exports = ({
  payload,
  receivedSignature,
  secret
}) => {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return generatedSignature === receivedSignature;
};
