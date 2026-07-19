const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { uploadRoomImages, uploadSingleImage } = require('../middlewares/multer.middleware');
const uploadService = require('../services/upload.service');

// ─── POST /api/upload ──────────────────────────────────────────────
// Upload multiple room images to Cloudinary
// Access: Owner / Staff
// ────────────────────────────────────────────────────────────────────
router.post(
  '/',
  auth,
  role('owner', 'staff'),
  (req, res, next) => {
    uploadRoomImages(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No images provided' });
      }

      // Upload all files to Cloudinary in parallel
      const results = await uploadService.uploadMultipleFromBuffer(
        files.map((f) => f.buffer),
        'rooms'
      );

      res.status(200).json({
        message: `${results.length} image(s) uploaded successfully`,
        images: results.map((r) => ({
          url: r.url,
          publicId: r.publicId
        }))
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ─── DELETE /api/upload ────────────────────────────────────────────
// Delete an image from Cloudinary by its public ID
// Access: Owner / Staff
// ────────────────────────────────────────────────────────────────────
router.delete(
  '/',
  auth,
  role('owner', 'staff'),
  async (req, res) => {
    try {
      const { publicId } = req.body;
      if (!publicId) {
        return res.status(400).json({ message: 'publicId is required' });
      }

      await uploadService.deleteImage(publicId);
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
