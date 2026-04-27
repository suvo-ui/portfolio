import { HttpError } from "./http.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeFieldLabel(field) {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

export function requireString(value, { field, minLength = 1, maxLength }) {
  const normalized = typeof value === "string" ? value.trim() : "";
  const label = normalizeFieldLabel(field);

  if (!normalized) {
    throw new HttpError(400, `${label} is required`);
  }

  if (normalized.length < minLength) {
    throw new HttpError(
      400,
      `${label} must be at least ${minLength} characters long`,
    );
  }

  if (maxLength && normalized.length > maxLength) {
    throw new HttpError(
      400,
      `${label} must be ${maxLength} characters or fewer`,
    );
  }

  return normalized;
}

export function optionalString(value, { field, maxLength }) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  if (maxLength && normalized.length > maxLength) {
    const label = normalizeFieldLabel(field);
    throw new HttpError(
      400,
      `${label} must be ${maxLength} characters or fewer`,
    );
  }

  return normalized;
}

export function parsePositiveId(value, field = "id") {
  const parsed = Number(value);
  const label = normalizeFieldLabel(field);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `Invalid ${label.toLowerCase()}`);
  }

  return parsed;
}

export function parseBoolean(value, { field, defaultValue = null }) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  const label = normalizeFieldLabel(field);
  throw new HttpError(400, `${label} must be true or false`);
}

export function parseOptionalNumber(
  value,
  { field, min = null, max = null, integer = false } = {},
) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  const label = normalizeFieldLabel(field);

  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `${label} must be a valid number`);
  }

  if (integer && !Number.isInteger(parsed)) {
    throw new HttpError(400, `${label} must be a whole number`);
  }

  if (min !== null && parsed < min) {
    throw new HttpError(400, `${label} must be at least ${min}`);
  }

  if (max !== null && parsed > max) {
    throw new HttpError(400, `${label} must be ${max} or less`);
  }

  return parsed;
}

export function requireEmail(value, { field = "email", maxLength = 254 } = {}) {
  const email = requireString(value, {
    field,
    minLength: 3,
    maxLength,
  }).toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    const label = normalizeFieldLabel(field);
    throw new HttpError(400, `${label} must be a valid email address`);
  }

  return email;
}

export function ensureAllowedValue(value, allowedValues, { field }) {
  if (!allowedValues.has(value)) {
    const label = normalizeFieldLabel(field);
    throw new HttpError(400, `${label} is invalid`);
  }

  return value;
}

export function requireIsoLikeDateTime(value, { field }) {
  const normalized = requireString(value, {
    field,
    minLength: 5,
    maxLength: 64,
  });

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) {
    const label = normalizeFieldLabel(field);
    throw new HttpError(400, `${label} must be a valid date`);
  }

  return normalized;
}

export function requireUrl(value, { field, maxLength = 2048 } = {}) {
  const normalized = requireString(value, {
    field,
    minLength: 8,
    maxLength,
  });

  try {
    const url = new URL(normalized);

    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    return url.toString();
  } catch {
    const label = normalizeFieldLabel(field);
    throw new HttpError(400, `${label} must be a valid URL`);
  }
}
