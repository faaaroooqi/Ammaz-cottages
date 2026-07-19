require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const { v4: uuidv4 } = require('uuid');
const PAYMENT_STATUS = require('./constants/paymentStatus');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const confirmedBookings = await Booking.find({
    status: { $in: ['confirmed', 'completed', 'cash_paid'] }
  });

  console.log(`Found ${confirmedBookings.length} confirmed/completed/cash_paid bookings.`);

  let createdCount = 0;

  for (const booking of confirmedBookings) {
    const existingPayment = await Payment.findOne({ bookingId: booking._id, status: PAYMENT_STATUS.SUCCESS });
    const existingCashPayment = await Payment.findOne({ bookingId: booking._id, status: PAYMENT_STATUS.CASH });
    
    if (!existingPayment && !existingCashPayment) {
      console.log(`Missing payment for booking: ${booking.bookingId} (${booking.totalAmount} PKR)`);
      
      await Payment.create({
        bookingId: booking._id,
        amount: booking.totalAmount,
        gateway: 'MANUAL',
        orderId: `MIG-${uuidv4()}`,
        status: PAYMENT_STATUS.SUCCESS,
        verified: true,
        paidAt: booking.updatedAt || booking.createdAt,
        remarks: 'Migrated from missing payment record'
      });
      
      createdCount++;
    }
  }

  console.log(`Successfully created ${createdCount} missing payment records.`);
  process.exit(0);
}).catch(console.error);
