const cron = require('node-cron');
const Booking = require('../models/Booking');
const BOOKING_STATUS = require('../constants/bookingStatus');

/**
 * Auto-complete bookings whose checkout date has passed.
 * Runs every day at midnight (00:00).
 *
 * Targets bookings with status 'confirmed'
 * where checkOut < start of today (i.e., the guest's stay is over).
 */
function startBookingScheduler() {
  // Runs at 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      // Start of today (midnight)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const result = await Booking.updateMany(
        {
          status: BOOKING_STATUS.CONFIRMED,
          checkOut: { $lt: today },
          isDeleted: { $ne: true }
        },
        { $set: { status: BOOKING_STATUS.COMPLETED } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[SCHEDULER] ✅ Auto-completed ${result.modifiedCount} booking(s) whose checkout date has passed.`);
      }
    } catch (error) {
      console.error('[SCHEDULER] ❌ Error auto-completing bookings:', error.message);
    }
  });

  console.log('[SCHEDULER] 📅 Booking auto-complete scheduler started (runs daily at midnight).');

  // Also run once immediately on server start to catch any backlog
  (async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const result = await Booking.updateMany(
        {
          status: BOOKING_STATUS.CONFIRMED,
          checkOut: { $lt: today },
          isDeleted: { $ne: true }
        },
        { $set: { status: BOOKING_STATUS.COMPLETED } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[SCHEDULER] ✅ Startup: auto-completed ${result.modifiedCount} overdue booking(s).`);
      }
    } catch (error) {
      console.error('[SCHEDULER] ❌ Startup auto-complete failed:', error.message);
    }
  })();
}

module.exports = { startBookingScheduler };
