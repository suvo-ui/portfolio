import express from "express";
import multer from "multer";
import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ---------- GET course (public) ---------- */
router.get("/", async (req, res) => {
  const result = await sql`SELECT * FROM course_page WHERE id = true`;
  res.json(result[0] || null);
});

/* ---------- PUT course (admin) ---------- */

router.put("/",adminAuth, upload.single("video"), async (req, res) => {
  try {
    const { markdown } = req.body;

    if (!markdown || !markdown.trim()) {
      return res.status(400).json({ error: "Markdown required" });
    }

    // 1️⃣ Get existing video path
    const existing = await sql`
      SELECT video_path FROM course_page WHERE id = true
    `;
    const oldVideoPath = existing[0]?.video_path;

    let newVideoPath = null;

    // 2️⃣ Upload new video if provided
    if (req.file) {
      const safeName = req.file.originalname.replace(/\s+/g, "-");
      newVideoPath = `course/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("course-videos")
        .upload(newVideoPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;
    }

    // 3️⃣ Delete OLD video only AFTER new upload succeeds
    if (newVideoPath && oldVideoPath) {
      await supabase.storage
        .from("course-videos")
        .remove([oldVideoPath]);
    }

    // 4️⃣ Update DB
    const result = await sql`
      UPDATE course_page
      SET
        markdown = ${markdown},
        video_path = COALESCE(${newVideoPath}, video_path),
        updated_at = NOW()
      WHERE id = true
      RETURNING *;
    `;

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Course update failed" });
  }
});
/* ---------- DELETE video (admin) ---------- */

router.delete("/video",adminAuth, async (req, res) => {
  try {
    const result = await sql`
      SELECT video_path FROM course_page WHERE id = true
    `;

    const videoPath = result[0]?.video_path;
    if (!videoPath) {
      return res.json({ success: true, message: "No video to delete" });
    }

    const { error } = await supabase.storage
      .from("course-videos")
      .remove([videoPath]);

    if (error) throw error;

    await sql`
      UPDATE course_page
      SET video_path = NULL, updated_at = NOW()
      WHERE id = true
    `;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete video" });
  }
});


export default router;
