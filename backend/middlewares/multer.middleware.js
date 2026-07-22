const multer = require('multer');

// ─── Memory Storage (no temp files on disk) ────────────────────────
const storage = multer.memoryStorage();

// ─── File Type Validation ──────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const imageFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are allowed.`
      ),
      false
    );
  }
};

// ─── Room Images (up to 5) ─────────────────────────────────────────
const uploadRoomImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: imageFilter
}).array('images', 10);

// ─── Single Image (generic) ────────────────────────────────────────
const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('image');

// ─── Payment Screenshot ────────────────────────────────────────────
const uploadScreenshot = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
}).single('screenshot');

module.exports = {
  uploadRoomImages,
  uploadSingleImage,
  uploadScreenshot
};
