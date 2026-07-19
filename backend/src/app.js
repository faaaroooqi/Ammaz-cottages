const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require("../middlewares/error.middleware");

const app = express();

// Security & core middlewares
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.cloudinary.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "connect-src": ["'self'", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.cloudinary.com"]
    }
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 to prevent 429 errors during heavy admin usage/testing
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Guest House Backend is running"
  });
});

// Serve static uploads
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Routes (to be added gradually)
app.use("/api/auth", require("../routes/auth.routes"));
app.use("/api/rooms", require("../routes/room.routes"));
app.use("/api/bookings", require("../routes/booking.routes"));
app.use("/api/payments", require("../routes/payment.routes"));
app.use("/api/payment-options", require("../routes/paymentOptions.routes"));
app.use("/api/admin", require("../routes/admin.routes"));
app.use("/api/admin/reports", require("../routes/report.routes"));
app.use("/api/upload", require("../routes/upload.routes"));
app.use("/api/reviews", require("../routes/review.routes"));

// Wildcard route to serve index.html for client-side routing
app.get("*", (req, res, next) => {
  // Do not serve index.html for API requests
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;

