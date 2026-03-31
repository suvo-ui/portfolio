import express from "express";
import sql from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const result = await sql`
    SELECT artworks.*, categories.name AS category
    FROM artworks
    LEFT JOIN categories ON artworks.category_id = categories.id
    ORDER BY created_at DESC;
  `;
  res.json(result);
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT artworks.*, categories.name AS category
      FROM artworks
      LEFT JOIN categories ON artworks.category_id = categories.id
      WHERE artworks.id = ${id}
      LIMIT 1;
    `;

    if (!result[0]) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error("FETCH ARTWORK ERROR:", err);
    res.status(500).json({ error: "Failed to fetch artwork" });
  }
});

export default router;
