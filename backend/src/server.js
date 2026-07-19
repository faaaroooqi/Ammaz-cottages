const app = require("./app");
const connectDB = require("../config/db");
const { startBookingScheduler } = require("../services/bookingScheduler");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Start the booking auto-complete scheduler
  startBookingScheduler();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
