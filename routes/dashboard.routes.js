const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Dashboard analytics routes
router.get(
  '/analytics',
  dashboardController.getDashboardAnalytics
);

// Product performance routes
router.get(
  '/products', dashboardController.getProductPerformance
);

module.exports = router;