const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// === Environment Configuration ===
const isProduction = process.env.NODE_ENV === "production";

// === Enhanced CORS Configuration ===
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, postman, or server-to-server calls)
      if (!origin) return callback(null, true);
      
      // List of allowed domains and patterns
      const allowedOrigins = [
        /^https?:\/\/localhost(:\d+)?$/, // Localhost with any port
        /^https:\/\/shishu-sheba\.netlify\.app$/, // Netlify app
        /^https:\/\/shishuseba\.com$/, // Main domain
        /^https:\/\/shishu-sheba-server\.onrender\.com$/, // Render backend
        /^https:\/\/([a-z0-9-]+\.)?shishuseba\.com$/ // All subdomains
      ];

      // Check if origin matches any allowed pattern
      if (allowedOrigins.some(pattern => pattern.test(origin))) {
        return callback(null, true);
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["set-cookie"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,X-Requested-With"
  })
);

// === Cookie Parser with Enhanced Security ===
app.use(cookieParser());

// === Body Parsers ===
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Trust Proxy (Important for HTTPS and correct origin) ===
app.set("trust proxy", 1); // Trust first proxy

// === Preflight Cache ===
app.options('*', cors()); // Enable preflight caching for all routes

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
    cors: {
      origin: req.get('origin'),
      allowed: req.get('Access-Control-Allow-Origin')
    }
  });
});

// === Request Logger Middleware ===
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request from: ${req.get('origin')}`);
  console.log('Request headers:', req.headers);
  next();
});

// === Error Handling Middleware ===
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ 
      message: "CORS policy violation",
      yourOrigin: req.get('origin'),
      allowedOrigins: [
        "https://shishu-sheba.netlify.app",
        "https://shishuseba.com",
        "https://shishu-sheba-server.onrender.com",
        "http://localhost:5173"
      ]
    });
  }
  
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;