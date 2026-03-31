import express from "express";
import multer from "multer";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const COURSE_VIDEO_BUCKET = "course vids";

/* ---------- GET course (public) ---------- */
router.get("/", async (req, res) => {
  const result = await sql`SELECT * FROM course_page WHERE id = true`;
  const course = result[0] || null;

  if (!course) {
    return res.json(null);
  }

  const video_url = course.video_path
    ? supabase.storage.from(COURSE_VIDEO_BUCKET).getPublicUrl(course.video_path).data.publicUrl
    : null;

  res.json({
    ...course,
    video_url,
  });
});

/* ---------- PUT course (admin) ---------- */
router.put("/", adminAuth, upload.single("video"), async (req, res) => {
  try {
    const { markdown } = req.body;

    const existing = await sql`
      SELECT markdown, video_path FROM course_page WHERE id = true
    `;
    const existingCourse = existing[0] || null;
    const oldVideoPath = existingCourse?.video_path || null;
    const markdownToSave =
      typeof markdown === "string" && markdown.trim()
        ? markdown
        : existingCourse?.markdown || "";

    if (!markdownToSave.trim()) {
      return res.status(400).json({ error: "Markdown required" });
    }

    let newVideoPath = null;

    if (req.file) {
      const safeName = req.file.originalname.replace(/\s+/g, "-");
      newVideoPath = `course/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from(COURSE_VIDEO_BUCKET)
        .upload(newVideoPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;
    }

    if (newVideoPath && oldVideoPath) {
      await supabase.storage.from(COURSE_VIDEO_BUCKET).remove([oldVideoPath]);
    }

    const result = await sql`
      UPDATE course_page
      SET
        markdown = ${markdownToSave},
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
router.delete("/video", adminAuth, async (req, res) => {
  try {
    const result = await sql`
      SELECT video_path FROM course_page WHERE id = true
    `;

    const videoPath = result[0]?.video_path;
    if (!videoPath) {
      return res.json({ success: true, message: "No video to delete" });
    }

    const { error } = await supabase.storage
      .from(COURSE_VIDEO_BUCKET)
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
