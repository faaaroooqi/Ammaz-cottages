const mongoose = require("mongoose");
process.env.MONGOMS_DEBUG = "1";
const seedDevData = require("../utils/seedDevData");
let MongoMemoryServer;
try {
  MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
} catch (e) {}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected to Atlas");

    // Seed data if in dev mode
    if (process.env.NODE_ENV === "development") {
      await seedDevData();
    }
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
