const nodemailer = require('nodemailer');
const env = require('./env');

let transporter = null;
let isEthereal = false;

const initTransporter = async () => {
  if (env.MAIL_ENABLED === 'true' && env.MAIL_USER && !env.MAIL_USER.includes('your_email')) {
    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE === 'true',
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS
      }
    });
    console.log("📧 Using Real SMTP Server for Emails");
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
