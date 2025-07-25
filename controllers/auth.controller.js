const { ObjectId } = require("mongodb");
const client = require("../config/db");
const usersCollection = client.db("sishuSheba").collection("admin");

// === Register Controller ===
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email, and password are required" 
      });
    }

    // Validate role if provided
    if (role && !['admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be either 'admin' or 'moderator'"
      });
    }

    // Check for existing user
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Create new user object
    const newUser = {
      name,
      email,
      password, // Storing plain password (not recommended for production)
      role: role || 'moderator', // Default to moderator if not specified
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database
    const result = await usersCollection.insertOne(newUser);

    // Return success response without sensitive data
    res.status(201).json({ 
      success: true,
      message: "Registration successful",
      data: {
        id: result.insertedId,
        name,
        email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

// === Login Controller ===
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await usersCollection.findOne({ email, password });
    console.log(user);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return user
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// === Delete User Controller ===
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if (user.role !== "admin") {
    //   return res
    //     .status(403)
    //     .json({ message: "Cannot delete: user is not an admin" });
    // }

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to delete user" });
    }

    res.status(200).json({ message: "Admin user deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// === Get All Admins ===
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await usersCollection
      .find()
      .project({ password: 0 }) // exclude password
      .toArray();

    res.status(200).json(admins);
  } catch (error) {
    console.error("Get Admins Error:", error);
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};
