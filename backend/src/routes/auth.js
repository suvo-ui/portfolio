import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "../config/db.js";

const router = express.Router();

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admins = await sql`
      SELECT * FROM admins WHERE email = ${email}
    `;

    const admin = admins[0];
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔐 Set secure HttpOnly cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: false, // ⚠️ change to true in production (HTTPS)
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= CHECK CURRENT SESSION ================= */
router.get("/me", (req, res) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      adminId: decoded.adminId,
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
});

/* ================= LOGOUT ================= */
router.post("/logout", (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // ⚠️ true in production
  });

  res.json({ success: true });
});

export default router;
