const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();

// === Security Middlewares ===
app.use(helmet()); // Adds security headers
app.set("trust proxy", 1); // Important for Render and cookies

// === Rate Limiting ===
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: "Too many requests, please try again later"
});

// === Enhanced CORS ===
const allowedOrigins = [
  "http://localhost:5173",
  "https://shishu-sheba.netlify.app",
  "https://shishuseba.com",
  "https://shishu-sheba-server.onrender.com" // Add your Render URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["set-cookie"]
  })
);

// === Standard Middlewares ===
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Apply Rate Limiting to API Routes ===
app.use("/v1", apiLimiter);

// === Routes ===
app.use("/v1/products", require("./routes/product.routes"));
app.use("/v1", require("./routes/order.routes"));
app.use("/v1", require("./routes/auth.routes"));
app.use("/v1/banner", require("./routes/banner.routes"));
app.use("/v1/youtube", require("./routes/youtube.routes"));
app.use("/v1/categories", require("./routes/category.routes"));
app.use("/v1/reports", require("./routes/orderReportsRoutes"));

// === Health Check Endpoint ===
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});

// === Enhanced Error Handling ===
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ 
      message: "CORS policy violation",
      allowedOrigins
    });
  }
  
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

module.exports = app;