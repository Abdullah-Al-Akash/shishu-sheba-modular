const express = require("express");
const router = express.Router();
const { login, getMe, logout, checkAuth, refresh } = require("../controllers/auth.controller");
const rateLimit = require("express-rate-limit");

// Rate limiting for auth endpoints (security)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: "Too many attempts, please try again later"
});

// Enhanced routes with proper middleware
router.post("/login", authLimiter, login); // Protected against brute force
router.get("/auth/me", getMe);
router.post("/logout", logout);
router.get("/auth/check", checkAuth); // New endpoint
router.post("/auth/refresh", refresh); // New endpoint

// Route to verify the auth system is working
router.get("/auth/status", (req, res) => {
  res.json({ 
    status: "active",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;