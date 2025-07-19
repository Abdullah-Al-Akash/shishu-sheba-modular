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
    'shishu-sheba-server.onrender.com', // Added Render domain
    'localhost:5173'
  ];

  // Extract domain from request origin
  let domain;
  try {
    const originUrl = new URL(requestOrigin);
    domain = originUrl.hostname;
    
    // Special handling for Render's domain
    if (domain.endsWith('.onrender.com')) {
      domain = 'shishu-sheba-server.onrender.com';
    }
    
    console.log('Resolved domain:', domain);
  } catch (e) {
    domain = undefined;
  }

  // Validate if domain is allowed (including subdomains)
  const isValidDomain = domain && allowedDomains.some(allowed => {
    return domain === allowed || 
           domain.endsWith(`.${allowed}`) ||
           (allowed === 'shishuseba.com' && domain.match(/\.shishuseba\.com$/));
  });

  return {
    secure: isProduction, // Use secure in production
    sameSite: isProduction ? 'none' : 'lax',
    domain: isValidDomain ? (domain === 'localhost:5173' ? undefined : domain) : undefined,
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

    console.log('Setting cookie with:', cookieSettings);
    res.cookie("session_token", sessionToken, cookieSettings);
    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.logout = (req, res) => {
  const cookieSettings = getCookieSettings(req);
  console.log('Clearing cookie with:', cookieSettings);
  res.clearCookie("session_token", cookieSettings);
  res.json({ message: "Logged out" });
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