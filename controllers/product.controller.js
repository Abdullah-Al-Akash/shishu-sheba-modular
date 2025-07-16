const { ObjectId } = require("mongodb");
const client = require("../config/db");

const productCollection = client.db("sishuSheba").collection("products");

exports.addProduct = async (req, res) => {
  try {
    const product = req.body;
    if (!product.name || !product.price || !product.image || !product.category) {
      return res.status(400).send({ error: "Missing required fields" });
    }
    const result = await productCollection.insertOne(product);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const result = await productCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productCollection.findOne({ _id: new ObjectId(id) });
    if (!product)
      return res.status(404).send({ message: "Product not found" });
    res.send(product);
  } catch (error) {
    console.error("Failed to fetch product by ID:", error);
    res.status(500).send({ message: "Server error" });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const result = await productCollection.find({ category }).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch by category:", error);
    res.status(500).json({ message: "Failed to fetch by category", error });
  }
};

exports.addProductPreview = async (req, res) => {
  try {
    const product = req.body;
    res.send({ product });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
};
