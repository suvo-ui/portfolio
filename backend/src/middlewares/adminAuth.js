import jwt from "jsonwebtoken";

import { getJwtSecret } from "../config/auth.js";
import { sendRouteError } from "../lib/http.js";

export default function adminAuth(req, res, next) {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    req.adminId = decoded.adminId;
    return next();
  } catch (err) {
    if (
      err?.name === "JsonWebTokenError" ||
      err?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    return sendRouteError(res, err, "Authentication failed");
  }
}
