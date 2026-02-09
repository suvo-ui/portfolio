import express from "express";
import sql from "../config/db.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

/* =====================================================
   GET ALL CATEGORIES (PUBLIC)
   Endpoint → GET /api/categories
===================================================== */
router.get("/categories", async (req, res) => {
  try {
    const categories = await sql`
      SELECT * FROM categories
      ORDER BY id ASC
    `;

    res.json(categories);
  } catch (err) {
    console.error("FETCH CATEGORIES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* =====================================================
   CREATE CATEGORY (ADMIN ONLY)
   Endpoint → POST /api/admin/categories
===================================================== */
router.post("/admin/categories", adminAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const result = await sql`
      INSERT INTO categories (name)
      VALUES (${name.trim()})
      RETURNING *;
    `;

    res.json(result[0]);
  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err);

    // duplicate name protection
    if (err.code === "23505") {
      return res.status(400).json({ error: "Category already exists" });
    }

    res.status(500).json({ error: "Failed to create category" });
  }
});

/* =====================================================
   DELETE CATEGORY (ADMIN ONLY)
   Endpoint → DELETE /api/admin/categories/:id
===================================================== */
router.delete("/admin/categories/:id", adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await sql`DELETE FROM categories WHERE id = ${id}`;

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
