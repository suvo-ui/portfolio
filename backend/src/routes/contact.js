import express from "express";

import sql from "../config/db.js";
import { sendRouteError } from "../lib/http.js";
import {
  ensureAllowedValue,
  requireEmail,
  requireString,
} from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

import { sendEmail } from "../utils/sendEmails.js";

const router = express.Router();

const allowedRequestTypes = new Set([
  "inquiry",
  "commission",
  "purchase",
  "collaboration",
]);

const contactLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: "contact-form",
  message: "Too many contact requests. Please wait before trying again.",
});

let contactTableReady;

function ensureContactTable() {
  if (!contactTableReady) {
    contactTableReady = sql`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id SERIAL PRIMARY KEY,
        request_type TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
  }

  return contactTableReady;
}

/* -------------------------------------------------------------------------- */
/*                                CONTACT FORM                                */
/* -------------------------------------------------------------------------- */

router.post("/contact", contactLimiter, async (req, res) => {
  console.log("CONTACT ROUTE HIT");
  console.log(req.body);
  try {
    await ensureContactTable();

    // Honeypot spam protection
    if (String(req.body?.website || "").trim()) {
      return res.status(400).json({
        error: "Invalid request",
      });
    }

    // Validation
    const requestType = ensureAllowedValue(
      String(req.body?.type || "")
        .trim()
        .toLowerCase(),
      allowedRequestTypes,
      { field: "request type" },
    );

    const name = requireString(req.body?.name, {
      field: "name",
      maxLength: 120,
    });

    const email = requireEmail(req.body?.email);

    const subject = requireString(req.body?.subject, {
      field: "subject",
      maxLength: 160,
    });

    const message = requireString(req.body?.message, {
      field: "message",
      maxLength: 4000,
    });

    // Save in database
    const created = await sql`
      INSERT INTO contact_requests (
        request_type,
        name,
        email,
        subject,
        message
      )
      VALUES (
        ${requestType},
        ${name},
        ${email},
        ${subject},
        ${message}
      )
      RETURNING
        id,
        request_type,
        name,
        email,
        subject,
        message,
        created_at;
    `;

    // Send email notification
    await sendEmail({
      type: requestType,
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    return res.status(201).json({
      success: true,
      request: created[0],
    });
  } catch (err) {
    console.error("CONTACT ROUTE ERROR:", err);

    return sendRouteError(res, err, "Failed to submit contact request");
  }
});

/* -------------------------------------------------------------------------- */
/*                             ADMIN CONTACT LIST                             */
/* -------------------------------------------------------------------------- */

router.get("/admin/contact-requests", adminAuth, async (req, res) => {
  try {
    await ensureContactTable();

    const requests = await sql`
      SELECT
        id,
        request_type,
        name,
        email,
        subject,
        message,
        created_at
      FROM contact_requests
      ORDER BY created_at DESC
      LIMIT 12;
    `;

    return res.json(requests);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch contact requests");
  }
});

export default router;
