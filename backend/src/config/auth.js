import { HttpError } from "../lib/http.js";

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function resolveSecureCookie(req) {
  const explicitValue = process.env.COOKIE_SECURE?.trim().toLowerCase();

  if (explicitValue === "true") {
    return true;
  }

  if (explicitValue === "false") {
    return false;
  }

  return (
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.get("x-forwarded-proto") === "https"
  );
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new HttpError(500, "JWT secret is not configured");
  }

  return secret;
}

export function getAuthCookieOptions(req) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: resolveSecureCookie(req),
    sameSite: isProduction ? "none" : "lax", // ✅ allows cross-domain in prod
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  };
}

export function getAuthCookieClearOptions(req) {
  const { maxAge, ...cookieOptions } = getAuthCookieOptions(req);
  return cookieOptions;
}
