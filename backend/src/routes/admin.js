import express from "express";
import sql from "../config/db.js";
import adminAuth from "../middlewares/adminAuth.js";
import supabase from "../config/supabase.js";

const router = express.Router();

/* =====================================================
   CREATE ARTWORK
===================================================== */
router.post("/artworks", adminAuth, async (req, res) => {
  const { title, description, category_id, image_url, price_inr, size } = req.body;

  try {
    const result = await sql`
      INSERT INTO artworks (title, description, category_id, image_url, price_inr, size)
      VALUES (
        ${title},
        ${description ?? null},
        ${category_id},
        ${image_url},
        ${price_inr ?? null},
        ${size ?? null}
      )
      RETURNING *;
    `;

    res.json(result[0]);
  } catch (err) {
    console.error("CREATE ARTWORK ERROR:", err);
    res.status(500).json({ error: "Failed to save artwork" });
  }
});

/* =====================================================
   UPDATE ARTWORK (EDIT + IMAGE REPLACE)
===================================================== */
router.put("/artworks/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, image_url, price_inr, size } = req.body;

    // 1️⃣ Get current artwork
    const existingRows = await sql`
      SELECT * FROM artworks WHERE id = ${id};
    `;
    const existing = existingRows[0];

    if (!existing) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    /* -------------------------------------------------
       2️⃣ If NEW image provided → delete old Supabase file
    ------------------------------------------------- */
    if (image_url && image_url !== existing.image_url) {
      const oldPath = existing.image_url.split("/artworks/")[1];

      if (oldPath) {
        await supabase.storage.from("artworks").remove([oldPath]);
      }
    }

    /* -------------------------------------------------
       3️⃣ Update DB
    ------------------------------------------------- */
    const updated = await sql`
      UPDATE artworks
      SET
        title = ${title ?? existing.title},
        description = ${description ?? existing.description},
        category_id = ${category_id ?? existing.category_id},
        image_url = ${image_url ?? existing.image_url},
        price_inr = ${price_inr ?? existing.price_inr},
        size_text = ${size ?? existing.size}
      WHERE id = ${id}
      RETURNING *;
    `;

    res.json(updated[0]);
  } catch (err) {
    console.error("UPDATE ARTWORK ERROR:", err);
    res.status(500).json({ error: "Failed to update artwork" });
  }
});

/* =====================================================
   TOGGLE SOLD STATUS
===================================================== */
router.patch("/artworks/:id/sold", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_sold } = req.body;

    const updated = await sql`
      UPDATE artworks
      SET is_sold = ${is_sold}
      WHERE id = ${id}
      RETURNING *;
    `;

    res.json(updated[0]);
  } catch (err) {
    console.error("TOGGLE SOLD ERROR:", err);
    res.status(500).json({ error: "Failed to update sold status" });
  }
});

/* =====================================================
   DELETE ARTWORK (DB + SUPABASE STORAGE)
===================================================== */
router.delete("/artworks/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const artworks = await sql`
      SELECT * FROM artworks WHERE id = ${id};
    `;
    const artwork = artworks[0];

    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    // 🔴 Delete from Supabase Storage
    const path = artwork.image_url.split("/artworks/")[1];

    if (path) {
      await supabase.storage.from("artworks").remove([path]);
    }

    // 🔴 Delete from DB
    await sql`DELETE FROM artworks WHERE id = ${id};`;

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ARTWORK ERROR:", err);
    res.status(500).json({ error: "Failed to delete artwork" });
  }
});

export default router;
