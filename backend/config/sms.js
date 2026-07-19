const axios = require('axios');
const env = require('./env');

const sendSMS = async ({ to, message }) => {
  if (env.SMS_ENABLED !== 'true') return;

  try {
    await axios.post(
      env.SMS_API_URL,
      {
        to,
        message,
        sender: env.SMS_SENDER_ID
      },
      {
        headers: {
          Authorization: `Bearer ${env.SMS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('SMS failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendSMS,
  isEnabled: env.SMS_ENABLED === 'true'
};
