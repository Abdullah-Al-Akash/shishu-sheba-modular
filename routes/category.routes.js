const express = require("express");
const router = express.Router();
const { getCategories, deleteCategory, addCategory } = require("../controllers/category.controller");

router.get("/", getCategories);
router.delete("/:id", deleteCategory);
router.post("/", addCategory);

module.exports = router;
