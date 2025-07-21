const { ObjectId } = require("mongodb");
const client = require("../config/db");

const productCollection = client.db("sishuSheba").collection("products");

exports.addProduct = async (req, res) => {
  try {
    const product = req.body;
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

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove _id from updateData if it exists
    if (updateData._id) {
      delete updateData._id;
    }

    const result = await productCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Product not found" });
    }

    res.send({ success: true, updatedId: id });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate MongoDB ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid product ID format" 
      });
    }

    const product = await productCollection.findOne({ 
      _id: new ObjectId(id) 
    });

    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: "Product not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error("Error fetching single product:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    // Validate MongoDB ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid product ID format" 
      });
    }

    const result = await productCollection.deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Product not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      deletedId: id
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};
