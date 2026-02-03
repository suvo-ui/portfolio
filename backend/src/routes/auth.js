import express from "express";

const router = express.Router();

// Temporary admin credentials (later move to DB)
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "123456";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      token: "admin-auth-token",
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

export default router;
