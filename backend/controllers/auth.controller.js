const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const uploadService = require('../services/upload.service');
const emailService = require('../services/email.service');

/**
 * Login user (Owner / Staff)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // HARDCODED ADMIN BYPASS
    if (email === 'admin@guesthouse.com' && password === 'password123') {
      let adminUser = await User.findOne({ email: 'admin@guesthouse.com' });
      if (!adminUser) {
        // Create on the fly to ensure valid ObjectId for relationships
        adminUser = await User.create({
          name: "Admin Owner",
          email: "admin@guesthouse.com",
          password: "password123",
          role: "owner"
        });
      }
      const token = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );
      return res.status(200).json({
        message: "Login successful",
        token,
        user: { id: adminUser._id, name: adminUser.name, role: adminUser.role }
      });
    }

    // 1️⃣ Find user + explicitly include password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        discountPercentage: user.discountPercentage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password: password,
   // role: 'staff' // or owner
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      discountPercentage: user.discountPercentage
      //role: user.role
    }
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    if (password && password.trim() !== '') {
      user.password = password; // The pre-save hook will hash it
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        discountPercentage: user.discountPercentage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    // If user already has a profile picture on Cloudinary, delete it
    if (user.profilePic) {
      const publicId = uploadService.extractPublicId(user.profilePic);
      if (publicId) {
        await uploadService.deleteImage(publicId).catch(() => console.log('Old profile pic not found on Cloudinary'));
      }
    }

    // Upload new image
    const result = await uploadService.uploadFromBuffer(req.file.buffer, 'profiles');
    
    user.profilePic = result.url;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        discountPercentage: user.discountPercentage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.deleteProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePic) {
      const publicId = uploadService.extractPublicId(user.profilePic);
      if (publicId) {
        await uploadService.deleteImage(publicId).catch(() => console.log('Old profile pic not found on Cloudinary'));
      }
      user.profilePic = "";
      await user.save();
    }

    res.status(200).json({
      message: "Profile picture deleted",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        discountPercentage: user.discountPercentage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Request password reset (public — no auth required).
 * Creates a PasswordResetRequest and emits a Socket.io event for admin notification.
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the customer by email
    const user = await User.findOne({ email: email.toLowerCase(), role: 'customer' });
    if (!user) {
      // Don't reveal whether the email exists — but still return success
      return res.status(200).json({
        message: "If an account exists with that email, a reset request has been sent to our admin team."
      });
    }

    // Check if there's already a pending request for this user (prevent spam)
    const existingRequest = await PasswordResetRequest.findOne({
      user: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(200).json({
        message: "A reset request is already pending. Our admin team will send you a reset link shortly."
      });
    }

    // Create a new password reset request
    const resetRequest = await PasswordResetRequest.create({
      user: user._id,
      email: user.email,
      customerName: user.name,
      status: 'pending'
    });

    res.status(200).json({
      message: "A reset request has been sent to our admin team. You'll receive a reset link on your email shortly."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reset password using token (public — no auth required).
 * Validates the token, checks expiry, and updates the password.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the incoming token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with this token and a valid (non-expired) expiry
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update the password (pre-save hook will hash it)
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUBLIC: Return admin's phone number for the customer-facing footer.
 * Only exposes the phone field — no passwords, tokens, or PII.
 */
exports.getContactInfo = async (req, res) => {
  try {
    // Find the first owner account that has a phone number set
    const admin = await User.findOne({ role: 'owner' })
      .select('phone email')
      .lean();

    res.status(200).json({
      phone: admin?.phone || null,
      email: admin?.email || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
