const smsConfig = require('../config/sms');

/**
 * Send booking confirmation SMS to the customer.
 */
exports.sendBookingConfirmationSMS = async ({
  phone,
  bookingId,
  amount,
  room,
  customerName
}) => {
  if (!smsConfig.isEnabled) {
    console.log(`[SMS] Skipped (SMS disabled). Would send to: ${phone}`);
    return;
  }

  const message = `Hi ${customerName || 'Guest'}! Your booking is CONFIRMED.\n` +
    `Booking ID: ${bookingId}\n` +
    `Room: ${room}\n` +
    `Amount: PKR ${amount}\n` +
    `Thank you for choosing Guest House!`;

  try {
    await smsConfig.sendSMS({ to: phone, message });
    console.log(`[SMS] Confirmation sent to: ${phone}`);
  } catch (error) {
    // If it fails (due to dummy API keys), or if we are in dev, log a mock SMS
    console.error(`[SMS] Real API Failed to send to ${phone} (Mocking instead). Error: ${error.message}`);
    console.log(`\n================= MOCK SMS =================`);
    console.log(`To: ${phone}`);
    console.log(`Message: \n${message}`);
    console.log(`============================================\n`);
  }
};

/**
 * Legacy export for backward compatibility.
 */
exports.sendBookingSMS = exports.sendBookingConfirmationSMS;
