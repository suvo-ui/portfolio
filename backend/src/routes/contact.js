import express from "express";

import sql from "../config/db.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

const allowedRequestTypes = new Set(["inquiry", "commission", "purchase", "collaboration"]);

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

router.post("/contact", async (req, res) => {
  try {
    await ensureContactTable();

    const requestType = String(req.body?.type || "").trim().toLowerCase();
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!allowedRequestTypes.has(requestType)) {
      return res.status(400).json({ error: "Invalid request type" });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const created = await sql`
      INSERT INTO contact_requests (request_type, name, email, subject, message)
      VALUES (${requestType}, ${name}, ${email}, ${subject}, ${message})
      RETURNING id, request_type, name, email, subject, message, created_at;
    `;

    res.status(201).json({
      success: true,
      request: created[0],
    });
  } catch (err) {
    console.error("CONTACT REQUEST ERROR:", err);
    res.status(500).json({ error: "Failed to submit contact request" });
  }
});

router.get("/admin/contact-requests", adminAuth, async (req, res) => {
  try {
    await ensureContactTable();

    const requests = await sql`
      SELECT id, request_type, name, email, subject, message, created_at
      FROM contact_requests
      ORDER BY created_at DESC
      LIMIT 12;
    `;

    res.json(requests);
  } catch (err) {
    console.error("FETCH CONTACT REQUESTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch contact requests" });
  }
});

export default router;
