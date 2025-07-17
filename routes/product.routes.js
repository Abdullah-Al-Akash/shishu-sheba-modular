const express = require("express");
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  addProductPreview,
  updateProduct,
  getSingleProduct
} = require("../controllers/product.controller");

router.post("/", addProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/single/:id", getSingleProduct);
router.get("/category/:category", getProductsByCategory);
router.post("/add-product", addProductPreview);
router.post("/:id", updateProduct);

module.exports = router;
