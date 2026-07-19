require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ROLES = require("../constants/roles");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@guesthouse.com";
    const password = "Admin@123"; // 👈 YOU choose this

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("ℹ️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Guest House Owner",
      email,
      password: hashedPassword,
      role: ROLES.OWNER
    });

    console.log("✅ Admin created");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
})();
