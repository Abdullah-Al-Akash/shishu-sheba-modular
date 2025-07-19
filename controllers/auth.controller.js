const { ObjectId } = require("mongodb");
const client = require("../config/db");

const adminCollection = client.db("sishuSheba").collection("admin");

// Helper function to determine cookie settings
const getCookieSettings = (req) => {
  const isProduction = process.env.NODE_ENV === "production";
  const requestOrigin = req.get('origin') || '';
  
  // List of allowed domains
  const allowedDomains = [
    'shishuseba.com',
    'shishu-sheba.netlify.app',
    'localhost:5173'
  ];

  // Extract domain from request origin
  let domain;
  try {
    domain = new URL(requestOrigin).hostname;
  } catch (e) {
    domain = undefined;
  }

  // Validate if domain is allowed
  const isValidDomain = domain && allowedDomains.some(allowed => 
    domain === allowed || domain.endsWith(`.${allowed}`)
  );

  return {
    secure: isProduction, // Use secure in production
    sameSite: isProduction ? 'none' : 'lax',
    domain: isValidDomain ? domain : undefined,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await adminCollection.findOne({ email, psk: password });
    
    if (!user) return res.status(401).json({ message: "Invalid credentials"});

    const sessionToken = user._id.toString();
    const cookieSettings = getCookieSettings(req);

    res.cookie("session_token", sessionToken, cookieSettings);
    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.logout = (req, res) => {
  const cookieSettings = getCookieSettings(req);
  res.clearCookie("session_token", cookieSettings);
  res.json({ message: "Logged out" });
};

// getMe remains the same
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