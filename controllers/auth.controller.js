const { ObjectId } = require("mongodb");
const client = require("../config/db");

const adminCollection = client.db("sishuSheba").collection("admin");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await adminCollection.findOne({ email, psk: password });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const sessionToken = user._id.toString();
    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const user = await adminCollection.findOne({ _id: new ObjectId(token) });
    if (!user) return res.status(403).json({ message: "Invalid token" });

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("session_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.json({ message: "Logged out" });
};
