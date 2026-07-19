require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,

  // Payment
  meezan: {
    merchantId: process.env.MEEZAN_MERCHANT_ID,
    secretKey: process.env.MEEZAN_SECRET_KEY,
    returnUrl: process.env.MEEZAN_RETURN_URL,
    webhookUrl: process.env.MEEZAN_WEBHOOK_URL
  },

  ubl: {
    merchantId: process.env.UBL_MERCHANT_ID,
    secretKey: process.env.UBL_SECRET_KEY
  },

  cloudinary: {
    enabled: process.env.CLOUDINARY_ENABLED,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  // Email (Nodemailer)
  MAIL_ENABLED: process.env.MAIL_ENABLED || 'false',
  MAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: process.env.EMAIL_PORT || 587,
  MAIL_SECURE: process.env.EMAIL_SECURE || 'false',
  MAIL_USER: process.env.EMAIL_USER,
  MAIL_PASS: process.env.EMAIL_PASS,
  MAIL_FROM: process.env.EMAIL_FROM || '"Guest House" <no-reply@guesthouse.com>',

  // SMS
  SMS_ENABLED: process.env.SMS_ENABLED || 'false',
  SMS_API_URL: process.env.SMS_PROVIDER_URL,
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_SENDER_ID: process.env.SMS_SENDER_ID
};

// Fail fast if missing critical env vars
if (!env.mongoUri || !env.jwtSecret) {
  throw new Error("❌ Missing required environment variables");
}

module.exports = env;
