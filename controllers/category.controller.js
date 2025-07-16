const { ObjectId } = require("mongodb");
const client = require("../config/db");

const categoryCollection = client.db("sishuSheba").collection("categories");

exports.getCategories = async (req, res) => {
  try {
    const result = await categoryCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await categoryCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { bn, en, category } = req.body;
    if (!bn || !en || !category) {
      return res.status(400).json({ message: "bn, en and category are required" });
    }

    const exists = await categoryCollection.findOne({ en });
    if (exists) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const newCategory = { bn, en, category };
    const result = await categoryCollection.insertOne(newCategory);
    res.status(201).json({ message: "Category added", insertedId: result.insertedId });
  } catch (error) {
    console.error("Failed to add category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
