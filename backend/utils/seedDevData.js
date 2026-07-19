const User = require("../models/User");
const Room = require("../models/Room");
const ROLES = require("../constants/roles");

const seedDevData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("🌱 Database is empty. Seeding initial data...");

      // The pre('save') hook in User model will hash this password automatically
      await User.create({
        name: "Admin Owner",
        email: "admin@guesthouse.com",
        password: "password123",
        role: ROLES.OWNER
      });
      console.log("✅ Seeded Admin User (email: admin@guesthouse.com, password: password123)");

      await User.create({
        name: "Test Customer",
        email: "customer@test.com",
        password: "password123",
        role: ROLES.CUSTOMER
      });
      console.log("✅ Seeded Customer User (email: customer@test.com, password: password123)");

      await Room.create([
        {
          name: "Deluxe Ocean View",
          type: "Deluxe",
          pricePerNight: 15000,
          facilities: ["WiFi", "AC", "TV", "Ocean View", "Mini Fridge"],
          images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop"]
        },
        {
          name: "Standard Room",
          type: "Standard",
          pricePerNight: 8000,
          facilities: ["WiFi", "AC", "TV"],
          images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop"]
        }
      ]);
      console.log("✅ Seeded 2 Test Rooms");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  }
};

module.exports = seedDevData;
