require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const bookings = await Booking.find({});
  console.log('Bookings:');
  console.table(bookings.map(b => ({ id: b.bookingId, status: b.status, totalAmount: b.totalAmount, _id: b._id.toString() })));
  
  const payments = await Payment.find({});
  console.log('Payments:');
  console.table(payments.map(p => ({ bookingId: p.bookingId.toString(), status: p.status, amount: p.amount, paidAt: p.paidAt })));
  process.exit(0);
}).catch(console.error);
