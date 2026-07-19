const { z } = require('zod');

exports.createBookingSchema = z.object({
  body: z.object({
    roomId: z.string(),
    customerName: z.string().min(3),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(10),
    customerCnic: z.string().optional(),
    checkIn: z.string(),
    checkOut: z.string(),
    status: z.enum(['requested', 'pending', 'awaiting_payment', 'confirmed', 'confirmed_half_paid']).optional()
  })
});

exports.cashPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string(),
    amount: z.number().positive(),
    remarks: z.string().optional()
  })
});

exports.updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(['requested', 'pending', 'awaiting_payment', 'confirmed', 'confirmed_half_paid', 'cash_paid', 'no_show', 'cancelled', 'completed']).optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    totalAmount: z.number().positive().optional(),
    customerName: z.string().min(3).optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().min(10).optional(),
    customerCnic: z.string().optional()
  })
});
