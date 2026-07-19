const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const authSchema = require('../validations/auth.schema');
const auth = require('../middlewares/auth.middleware');
const { uploadSingleImage } = require('../middlewares/multer.middleware');

router.post(
  '/login',
  validate(authSchema.loginSchema),
  authController.login
);

router.post(
  '/register',
  validate(authSchema.createUserSchema),
  authController.register
);

// Profile Management
router.patch(
  '/me',
  auth,
  authController.updateProfile
);

router.post(
  '/me/profile-pic',
  auth,
  (req, res, next) => {
    uploadSingleImage(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  authController.uploadProfilePic
);

router.delete(
  '/me/profile-pic',
  auth,
  authController.deleteProfilePic
);

// Password Reset Routes
router.post(
  '/forgot-password',
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  authController.resetPassword
);

// Public: returns admin contact phone for customer-facing footer
router.get('/contact', authController.getContactInfo);

module.exports = router;
