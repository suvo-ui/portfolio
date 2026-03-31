import express from "express";
import multer from "multer";
import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (important)
  },
});

/* ================= GET WORKSHOPS ================= */
router.get("/", async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM workshops
      ORDER BY date DESC
    `;
    res.json(result);
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE WORKSHOP ================= */
router.post(
  "/",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, date, duration, price, max_seats } = req.body;

      let image_url = null;
      let video_url = null;

      /* ---------- IMAGE UPLOAD ---------- */
      if (req.files?.image) {
        console.log("📤 Uploading image...");

        const file = req.files.image[0];

        const cleanName = file.originalname
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9.-]/g, "");

        const fileName = `${Date.now()}-${cleanName}`;

        const { error } = await supabase.storage
          .from("workshop-image") // ⚠️ your actual bucket name
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("workshop-image")
          .getPublicUrl(fileName);

        image_url = data.publicUrl;
      }

      /* ---------- VIDEO UPLOAD (TEMP SAFE) ---------- */
      if (req.files?.video) {
        console.log("📤 Uploading video...");

        const file = req.files.video[0];

        const cleanName = file.originalname
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9.-]/g, "");

        const fileName = `${Date.now()}-${cleanName}`;

        const { error } = await supabase.storage
          .from("workshop-videos")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("workshop-videos")
          .getPublicUrl(fileName);

        video_url = data.publicUrl;

        console.log("✅ Video uploaded");
      }

      /* ---------- DB INSERT ---------- */
      console.log("💾 Saving to DB...");

      const result = await sql`
        INSERT INTO workshops
        (title, description, date, duration, price, max_seats, image_url, video_url)
        VALUES
        (${title}, ${description}, ${date}, ${duration}, ${price}, ${max_seats}, ${image_url}, ${video_url})
        RETURNING *
      `;

      res.json(result[0]);
    } catch (err) {
      console.error("❌ WORKSHOP ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

/* ================= DELETE WORKSHOP ================= */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await sql`
      DELETE FROM workshops
      WHERE id = ${id}
    `;

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
