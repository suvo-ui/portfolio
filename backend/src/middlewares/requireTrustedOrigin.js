import { isAllowedOrigin } from "../config/cors.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function extractRefererOrigin(referer) {
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export default function requireTrustedOrigin(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  const refererOrigin = extractRefererOrigin(req.get("referer"));

  if (!origin && !refererOrigin) {
    return next();
  }

  if (origin && isAllowedOrigin(origin)) {
    return next();
  }

  if (!origin && refererOrigin && isAllowedOrigin(refererOrigin)) {
    return next();
  }

  return res.status(403).json({ error: "Untrusted origin" });
}
