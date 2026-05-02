import express from "express";

import sql from "../config/db.js";
import { sendRouteError } from "../lib/http.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await sql`
      SELECT prints.*, categories.name AS category
      FROM prints
      LEFT JOIN categories ON prints.category_id = categories.id
      WHERE prints.deleted_at IS NULL
      ORDER BY prints.created_at DESC;
    `;

    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch prints");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await sql`
      SELECT prints.*, categories.name AS category
      FROM prints
      LEFT JOIN categories ON prints.category_id = categories.id
      WHERE prints.id = ${req.params.id}
        AND prints.deleted_at IS NULL
      LIMIT 1;
    `;

    if (!result[0]) {
      return res.status(404).json({ error: "Print not found" });
    }

    return res.json(result[0]);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch print");
  }
});

export default router;
