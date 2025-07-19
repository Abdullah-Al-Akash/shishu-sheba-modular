const { ObjectId } = require("mongodb");
const client = require("../config/db");
const adminCollection = client.db("sishuSheba").collection("admin");

// Production-ready cookie configuration
const getCookieConfig = (req) => {
  const isProduction = process.env.NODE_ENV === "production";
  const origin = req.get('origin') || '';
  
  // Domain configuration
  let domain;
  if (isProduction) {
    // Production domains
    if (origin.includes('shishuseba.com')) {
      domain = '.shishuseba.com'; // Main domain with subdomain support
    } else if (origin.includes('netlify.app')) {
      domain = 'shishu-sheba.netlify.app'; // Netlify app
    } else if (origin.includes('onrender.com')) {
      domain = 'shishu-sheba-server.onrender.com'; // Render backend
    }
  }

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: domain,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    path: '/'
  };
};

// Enhanced login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await adminCollection.findOne({ email });
    
    // Security: Don't reveal if user exists
    if (!user || user.psk !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sessionToken = user._id.toString();
    const cookieConfig = getCookieConfig(req);

    res.cookie("session_token", sessionToken, cookieConfig);
    res.json({ 
      message: "Logged in successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Secure logout controller
exports.logout = (req, res) => {
  const cookieConfig = getCookieConfig(req);
  res.clearCookie("session_token", cookieConfig);
  res.json({ message: "Logged out successfully" });
};

// Protected user profile endpoint
exports.getMe = async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const user = await adminCollection.findOne({ 
      _id: new ObjectId(token) 
    }, {
      projection: { psk: 0 } // Exclude password from response
    });

    if (!user) {
      // Clear invalid cookie
      res.clearCookie("session_token", getCookieConfig(req));
      return res.status(403).json({ message: "Invalid session" });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add these new utility endpoints:

// Check authentication status
exports.checkAuth = async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.json({ authenticated: false });

    const user = await adminCollection.findOne({ 
      _id: new ObjectId(token) 
    }, {
      projection: { _id: 1 }
    });

    res.json({ authenticated: !!user });
  } catch (error) {
    res.json({ authenticated: false });
  }
};

// Refresh session (extend cookie lifetime)
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const user = await adminCollection.findOne({ 
      _id: new ObjectId(token) 
    });

    if (!user) return res.status(403).json({ message: "Invalid session" });

    // Reset cookie with new expiration
    res.cookie("session_token", token, getCookieConfig(req));
    res.json({ message: "Session refreshed" });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
