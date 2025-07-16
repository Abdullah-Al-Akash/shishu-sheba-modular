const express = require("express");
const router = express.Router();
const {
  login,
  getMe,
  logout,
} = require("../controllers/auth.controller");

router.post("/login", login);
router.get("/auth/me", getMe);
router.post("/logout", logout);

module.exports = router;
