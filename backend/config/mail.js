const nodemailer = require('nodemailer');
const env = require('./env');

let transporter = null;
let isEthereal = false;

const initTransporter = async () => {
  if (env.MAIL_ENABLED === 'true' && env.MAIL_USER && !env.MAIL_USER.includes('your_email')) {
    const port = parseInt(env.MAIL_PORT || '587', 10);
    const isSecure = env.MAIL_SECURE === 'true' || port === 465;

    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: port,
      secure: isSecure,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 15000, // 15 seconds connection timeout
      greetingTimeout: 15000,   // 15 seconds SMTP greeting timeout
      socketTimeout: 20000,     // 20 seconds socket inactivity timeout
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log(`📧 Configured Real SMTP Server: ${env.MAIL_HOST}:${port}`);

    // Verify SMTP connection on startup with automatic fallback if Port 587 is blocked
    transporter.verify((err) => {
      if (err) {
        console.error("⚠️ Primary SMTP Connection Warning:", err.message);
        if (port === 587 && env.MAIL_HOST.includes('brevo')) {
          console.log("🔄 Attempting fallback to SMTP Port 2525...");
          transporter = nodemailer.createTransport({
            host: env.MAIL_HOST,
            port: 2525,
            secure: false,
            pool: true,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            auth: {
              user: env.MAIL_USER,
              pass: env.MAIL_PASS
            },
            tls: { rejectUnauthorized: false }
          });
        }
      } else {
        console.log("📧 Real SMTP Server Connection Verified Successfully");
      }
    });

  } else {
    // Fallback to Ethereal
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
      console.log("📧 Using Ethereal Email (Mock) for Emails");
    } catch (err) {
      console.error("Failed to create Ethereal account", err);
    }
  }
};

initTransporter();

module.exports = {
  getTransporter: () => transporter,
  isEthereal: () => isEthereal,
  isEnabled: env.MAIL_ENABLED === 'true',
  from: env.MAIL_FROM
};

