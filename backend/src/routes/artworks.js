import express from "express";

import sql from "../config/db.js";
import { sendRouteError } from "../lib/http.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await sql`
      SELECT artworks.*, categories.name AS category
      FROM artworks
      LEFT JOIN categories ON artworks.category_id = categories.id
      WHERE artworks.deleted_at IS NULL
      ORDER BY artworks.created_at DESC;
    `;

    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch artworks");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await sql`
      SELECT artworks.*, categories.name AS category
      FROM artworks
      LEFT JOIN categories ON artworks.category_id = categories.id
      WHERE artworks.id = ${req.params.id}
        AND artworks.deleted_at IS NULL
      LIMIT 1;
    `;

    if (!result[0]) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    return res.json(result[0]);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch artwork");
  }
});

export default router;
