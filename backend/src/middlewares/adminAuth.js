import jwt from "jsonwebtoken";

export default function adminAuth(req, res, next) {
  try {
    // 🍪 get token from cookies
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 🔐 verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🧠 attach admin info to request
    req.adminId = decoded.adminId;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}
