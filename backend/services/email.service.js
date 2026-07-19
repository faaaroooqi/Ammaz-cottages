const mailConfig = require('../config/mail');

const sendAndLogMail = async ({ to, subject, html }) => {
  const EmailLog = require('../models/EmailLog');
  const transporter = mailConfig.getTransporter();

  if (!mailConfig.isEnabled && !transporter) {
    console.log(`[EMAIL] Skipped (mail disabled). Logged locally. Subject: ${subject} to: ${to}`);
    try {
      await EmailLog.create({ to, subject, html, status: 'success' });
    } catch (err) {
      console.error('Failed to create email log:', err.message);
    }
    return;
  }

  if (!transporter) {
    console.log(`[EMAIL] Transporter not ready. Logged as failed.`);
    try {
      await EmailLog.create({ to, subject, html, status: 'failed', errorMessage: 'Transporter not ready' });
    } catch (err) {
      console.error('Failed to create email log:', err.message);
    }
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html
    });

    try {
      await EmailLog.create({ to, subject, html, status: 'success' });
    } catch (err) {
      console.error('Failed to log email:', err.message);
    }

    if (mailConfig.isEthereal && mailConfig.isEthereal()) {
      const nodemailer = require('nodemailer');
      console.log(`📧 Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
    try {
      await EmailLog.create({ to, subject, html, status: 'failed', errorMessage: error.message });
    } catch (err) {
      console.error('Failed to log email error:', err.message);
    }
  }
};

/**
 * Send booking confirmation email to the customer.
 */
exports.sendBookingConfirmation = async ({
  to,
  bookingId,
  amount,
  room,
  dates,
  customerName
}) => {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #312e81, #1e40af); padding: 40px 32px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 28px; margin: 0 0 8px 0; }
        .header p { color: #93c5fd; font-size: 14px; margin: 0; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 16px; }
        .details { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; font-size: 14px; }
        .detail-value { color: #1e293b; font-weight: 600; font-size: 14px; }
        .total { background: linear-gradient(135deg, #312e81, #1e40af); color: #fff; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .total-label { font-size: 14px; opacity: 0.8; }
        .total-amount { font-size: 32px; font-weight: 800; margin-top: 4px; }
        .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Booking Confirmed!</h1>
          <p>Your reservation has been verified</p>
        </div>
        <div class="content">
          <p class="greeting">Hello ${customerName || 'Guest'},</p>
          <p style="color: #4b5563; line-height: 1.6;">
            Great news! Your booking has been <span class="badge">✅ Confirmed</span>. 
            Here are your reservation details:
          </p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room</span>
              <span class="detail-value">${room}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dates</span>
              <span class="detail-value">${dates}</span>
            </div>
          </div>

          <div class="total">
            <div class="total-label">Total Amount Paid</div>
            <div class="total-amount">PKR ${amount}</div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions about your booking, please don't hesitate to contact us. 
            We look forward to welcoming you!
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guest House. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAndLogMail({
    to,
    subject: '🏨 Booking Confirmed — Guest House',
    html
  });
};

/**
 * Send payment failure email.
 */
exports.sendPaymentFailure = async ({ to, bookingId }) => {
  const html = `
    <p>Payment failed for Booking ID: <b>${bookingId}</b></p>
    <p>Please retry your payment.</p>
  `;

  await sendAndLogMail({
    to,
    subject: '❌ Payment Failed',
    html
  });
};

/**
 * Send password reset notification — tells customer their temporary password.
 */
exports.sendPasswordResetNotification = async ({ to, customerName }) => {
  const transporter = mailConfig.getTransporter();
  if (!mailConfig.isEnabled && !transporter) {
    console.log(`[EMAIL] Skipped (mail disabled). Password reset notification would be sent to: ${to}`);
    return;
  }
  if (!transporter) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 40px 32px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 28px; margin: 0 0 8px 0; }
        .header p { color: #bfdbfe; font-size: 14px; margin: 0; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 16px; }
        .password-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .password-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .password-value { font-size: 36px; font-weight: 800; color: #1e40af; letter-spacing: 0.15em; font-family: monospace; }
        .tip { background: #fefce8; border-left: 4px solid #eab308; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #713f12; line-height: 1.6; margin: 20px 0; }
        .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Has Been Reset</h1>
          <p>Your account password has been reset by admin</p>
        </div>
        <div class="content">
          <p class="greeting">Hello ${customerName || 'Guest'},</p>
          <p style="color: #4b5563; line-height: 1.6;">
            Your password reset request has been approved. Your account password has been reset to a temporary password:
          </p>

          <div class="password-box">
            <div class="password-label">Your Temporary Password</div>
            <div class="password-value">12345678</div>
          </div>

          <div class="tip">
            💡 <strong>Important:</strong> Please log in using this temporary password and then go to
            <strong>My Profile → Change Password</strong> to set a new secure password of your choice.
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you did not make this request, please contact our support team immediately.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guest House. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAndLogMail({
    to,
    subject: '🔐 Password Reset Approved — Guest House',
    html
  });
};

/**
 * Send discount notification email.
 */
exports.sendDiscountNotification = async ({ to, customerName, discountPercentage }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669, #10b981); padding: 40px 32px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 28px; margin: 0 0 8px 0; }
        .header p { color: #a7f3d0; font-size: 14px; margin: 0; }
        .content { padding: 32px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 16px; text-align: left; }
        .discount-badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 36px; font-weight: 800; padding: 16px 32px; border-radius: 16px; margin: 24px 0; border: 2px dashed #34d399; }
        .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Special Discount Unlocked!</h1>
          <p>Thank you for choosing Guest House</p>
        </div>
        <div class="content">
          <p class="greeting">Hello ${customerName || 'Guest'},</p>
          <p style="color: #4b5563; line-height: 1.6; text-align: left;">
            As a token of our appreciation for your loyalty and bookings with us, we have unlocked a special discount for your next booking!
          </p>
          <div class="discount-badge">
            ${discountPercentage}% OFF
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: left;">
            This discount will be automatically applied to your next reservation when you book a room. We look forward to hosting you again soon!
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guest House. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAndLogMail({
    to,
    subject: '🎉 Special Discount Unlocked! — Guest House',
    html
  });
};

/**
 * Send booking voucher/receipt email after payment is confirmed.
 */
exports.sendBookingVoucher = async ({
  to,
  customerName,
  bookingId,
  room,
  checkIn,
  checkOut,
  nights,
  totalAmount,
  customerPhone,
  customerCnic,
  paymentMethod
}) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a, #1e3a8a); padding: 40px 32px; text-align: center; position: relative; }
        .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6); }
        .header h1 { color: #ffffff; font-size: 24px; margin: 0 0 4px 0; }
        .header p { color: #93c5fd; font-size: 13px; margin: 0; }
        .voucher-id { background: rgba(255,255,255,0.1); display: inline-block; padding: 8px 20px; border-radius: 8px; margin-top: 16px; border: 1px solid rgba(255,255,255,0.2); }
        .voucher-id span { color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: 0.05em; font-family: monospace; }
        .content { padding: 32px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
        .details { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e2e8f0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #64748b; font-size: 14px; }
        .detail-value { color: #1e293b; font-weight: 600; font-size: 14px; text-align: right; }
        .total-box { background: linear-gradient(135deg, #0f172a, #1e3a8a); color: #fff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }
        .total-amount { font-size: 36px; font-weight: 800; margin-top: 4px; }
        .paid-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-top: 12px; }
        .note { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #1e40af; line-height: 1.6; margin: 20px 0; }
        .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; }
        .watermark { color: #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧾 Booking Receipt</h1>
          <p>Official Booking Voucher — Guest House</p>
          <div class="voucher-id">
            <span>${bookingId}</span>
          </div>
        </div>
        <div class="content">
          <!-- Guest Details -->
          <p class="section-title">Guest Information</p>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Guest Name</span>
              <span class="detail-value">${customerName || 'Guest'}</span>
            </div>
            ${customerPhone ? `
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${customerPhone}</span>
            </div>` : ''}
            ${customerCnic ? `
            <div class="detail-row">
              <span class="detail-label">CNIC</span>
              <span class="detail-value">${customerCnic}</span>
            </div>` : ''}
          </div>

          <!-- Booking Details -->
          <p class="section-title">Reservation Details</p>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Room</span>
              <span class="detail-value">${room}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in</span>
              <span class="detail-value">${checkIn}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out</span>
              <span class="detail-value">${checkOut}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${nights} Night${nights > 1 ? 's' : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment</span>
              <span class="detail-value">${paymentMethod || 'Verified'}</span>
            </div>
          </div>

          <!-- Total -->
          <div class="total-box">
            <div class="total-label">Total Amount</div>
            <div class="total-amount">PKR ${Number(totalAmount).toLocaleString()}</div>
            <div class="paid-badge">✅ PAYMENT CONFIRMED</div>
          </div>

          <div class="note">
            📌 Please keep this email as your official booking receipt. You may be asked to present it at check-in.
            You can also view and print your voucher from <strong>My Bookings</strong> in your Guest House account.
          </div>
        </div>
        <div class="footer">
          <p class="watermark">OFFICIAL BOOKING VOUCHER</p>
          <p>© ${new Date().getFullYear()} Guest House. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendAndLogMail({
    to,
    subject: `🧾 Booking Receipt — ${bookingId} — Guest House`,
    html
  });
};
