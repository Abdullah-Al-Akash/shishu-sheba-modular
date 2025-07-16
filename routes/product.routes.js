const express = require("express");
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  addProductPreview,
} = require("../controllers/product.controller");

router.post("/", addProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/category/:category", getProductsByCategory);
router.post("/add-product", addProductPreview);

module.exports = router;
