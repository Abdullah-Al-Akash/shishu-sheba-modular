const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// === Environment Configuration ===
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [
  "http://localhost:5173", 
  "https://shishu-sheba.netlify.app", 
  "https://shishuseba.com",
  "https://shishu-sheba-server.onrender.com"
];

// === Enhanced CORS Configuration ===
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin && !isProduction) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["set-cookie"] // Important for some clients
  })
);

// === Cookie Parser with Enhanced Security ===
app.use(cookieParser());

// === Body Parsers ===
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Trust Proxy (Important for HTTPS and correct origin) ===
app.set("trust proxy", 1); // Trust first proxy

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
  res.status(200).json({ status: "healthy" });
});

// === Error Handling Middleware ===
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;