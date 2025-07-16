const { ObjectId } = require("mongodb");
const client = require("../config/db");

const orderCollection = client.db("sishuSheba").collection("orders");

exports.createOrder = async (req, res) => {
  try {
    const item = req.body;
    const result = await orderCollection.insertOne(item);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.getOrdersByStatus = async (req, res) => {
  try {
    const status = req.query.status;
    const orders = await orderCollection.find({ status }).toArray();
    res.send(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, processBy, deliveredBy, cancelBy, admin_note } = req.body;

    let result;

    if (admin_note) {
      result = await orderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { admin_note } }
      );
    }
    if (approvedBy) {
      result = await orderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, approvedBy } }
      );
    }
    if (processBy) {
      result = await orderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, processBy } }
      );
    }
    if (deliveredBy) {
      // Currently you had some commented code here — keep or update if needed
      // For now, just find and respond (you can update later)
      const resultFind = await orderCollection.find({ _id: new ObjectId(id) }).toArray();
      console.log(resultFind);
      // Optionally update:
      // result = await orderCollection.updateOne(
      //   { _id: new ObjectId(id) },
      //   { $set: { status, deliveredBy } }
      // );
    }
    if (cancelBy) {
      result = await orderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, cancelBy } }
      );
    }

    if (result?.matchedCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, modifiedCount: result?.modifiedCount || 0 });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
