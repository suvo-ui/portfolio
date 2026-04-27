import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import sql from "../config/db.js";
import {
  getAuthCookieClearOptions,
  getAuthCookieOptions,
  getJwtSecret,
} from "../config/auth.js";
import { recordAuditEvent } from "../lib/audit.js";
import { sendRouteError } from "../lib/http.js";
import { requireEmail, requireString } from "../lib/validation.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const INVALID_LOGIN_MESSAGE = "Invalid credentials";
const DUMMY_PASSWORD_HASH =
  "$2b$10$EIRjZFTAYJ.Txl72NrFks.ROGymflfRHkURfUL7zI3RogK8aTM0.G";
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "admin-login",
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
  message: "Too many login attempts. Please wait before trying again.",
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = requireEmail(req.body?.email);
    const password = requireString(req.body?.password, {
      field: "password",
      minLength: 8,
      maxLength: 256,
    });
    const jwtSecret = getJwtSecret();

    const admins = await sql`
      SELECT id, email, password_hash
      FROM admins
      WHERE email = ${email}
      LIMIT 1
    `;

    const admin = admins[0] || null;
    const passwordHash = admin?.password_hash || DUMMY_PASSWORD_HASH;
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!admin || !isValid) {
      return res.status(401).json({ error: INVALID_LOGIN_MESSAGE });
    }

    const token = jwt.sign({ adminId: admin.id }, jwtSecret, {
      expiresIn: "7d",
    });

    res.cookie("adminToken", token, getAuthCookieOptions(req));

    await recordAuditEvent(sql, {
      adminId: admin.id,
      action: "login_success",
      entityType: "auth",
      entityId: admin.id,
      after: { email: admin.email },
      req,
    });

    return res.json({ success: true });
  } catch (err) {
    return sendRouteError(res, err, "Server error");
  }
});

router.get("/me", (req, res) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    return res.json({
      success: true,
      isAdmin: true,
      adminId: decoded.adminId,
    });
  } catch (err) {
    if (
      err?.name === "JsonWebTokenError" ||
      err?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    return sendRouteError(res, err, "Failed to verify session");
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("adminToken", getAuthCookieClearOptions(req));
  return res.json({ success: true });
});

export default router;
