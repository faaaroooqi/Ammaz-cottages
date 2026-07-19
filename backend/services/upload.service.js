const { cloudinary, isEnabled } = require('../config/cloudinary');
const { Readable } = require('stream');

// ─── Cloudinary Upload Options ─────────────────────────────────────
const UPLOAD_PRESETS = {
  rooms: {
    folder: 'guest-house/rooms',
    transformation: [
      { width: 1920, crop: 'limit' },   // max width
      { quality: 'auto', fetch_format: 'auto' }
    ]
  },
  receipts: {
    folder: 'guest-house/receipts',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  },
  profiles: {
    folder: 'guest-house/profiles',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
};

/**
 * Upload a buffer directly to Cloudinary (no temp file).
 * @param {Buffer} buffer - File buffer from multer memory storage.
 * @param {string} preset - One of 'rooms' | 'receipts'.
 * @returns {Promise<{ url: string, publicId: string }>}
 */
exports.uploadFromBuffer = (buffer, preset = 'rooms') => {
  return new Promise((resolve, reject) => {
    if (!isEnabled) {
      return reject(new Error('Cloudinary is not configured or enabled.'));
    }

    const config = UPLOAD_PRESETS[preset] || UPLOAD_PRESETS.rooms;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: config.folder,
        resource_type: 'image',
        transformation: config.transformation,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    // Pipe the buffer into the upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Upload multiple buffers to Cloudinary in parallel.
 * @param {Array<Buffer>} buffers - Array of file buffers.
 * @param {string} preset - Upload preset key.
 * @returns {Promise<Array<{ url: string, publicId: string }>>}
 */
exports.uploadMultipleFromBuffer = async (buffers, preset = 'rooms') => {
  const uploads = buffers.map((buf) => exports.uploadFromBuffer(buf, preset));
  return Promise.all(uploads);
};

/**
 * Delete an image from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public_id.
 * @returns {Promise<object>}
 */
exports.deleteImage = async (publicId) => {
  if (!isEnabled) {
    throw new Error('Cloudinary is not configured or enabled.');
  }
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple images from Cloudinary.
 * @param {string[]} publicIds - Array of public IDs.
 * @returns {Promise<object>}
 */
exports.deleteMultipleImages = async (publicIds) => {
  if (!isEnabled || !publicIds.length) return;
  return cloudinary.api.delete_resources(publicIds);
};

/**
 * Extract the public_id from a Cloudinary secure URL.
 * Example: "https://res.cloudinary.com/.../guest-house/rooms/abc123.jpg"
 *   → "guest-house/rooms/abc123"
 * @param {string} url - Cloudinary secure URL.
 * @returns {string|null}
 */
exports.extractPublicId = (url) => {
  if (!url) return null;
  try {
    // Match everything after /upload/vXXXXXXXXXX/ and before the extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// ─── Legacy Support ────────────────────────────────────────────────
// Keep the old file-path-based upload for backward compat
const fs = require('fs');

/**
 * @deprecated Use uploadFromBuffer instead.
 * Uploads a local file to Cloudinary and deletes the local file.
 */
exports.uploadImage = async (localFilePath, folder = 'guest-house') => {
  try {
    if (!isEnabled) {
      throw new Error('Cloudinary is not configured or enabled.');
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
      resource_type: 'auto'
    });

    // Clean up local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result.secure_url;
  } catch (error) {
    // Attempt to clean up local file even on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new Error(`Image upload failed: ${error.message}`);
  }
};
