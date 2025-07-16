const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrdersByStatus,
  updateOrder,
} = require("../controllers/order.controller");

router.post("/order", createOrder);
router.get("/order-request", getOrdersByStatus);
router.patch("/order-request/:id", updateOrder);

module.exports = router;
