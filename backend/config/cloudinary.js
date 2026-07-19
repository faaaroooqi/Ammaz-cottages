const cloudinary = require('cloudinary').v2;
const env = require('./env');

const isEnabled = env.cloudinary.enabled === 'true';

if (isEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true
  });
  console.log(`☁️  Cloudinary configured (cloud: ${env.cloudinary.cloudName})`);
} else {
  console.warn('⚠️  Cloudinary is disabled — set CLOUDINARY_ENABLED=true in .env');
}

module.exports = {
  cloudinary,
  isEnabled
};
