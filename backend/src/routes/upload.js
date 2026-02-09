import express from "express";
import multer from "multer";
import supabase from "../config/supabase.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ================= UPLOAD IMAGE TO SUPABASE ================= */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;

    /* 🔐 SANITIZE filename (VERY IMPORTANT) */
    const cleanName = file.originalname
      .replace(/\s+/g, "-")        // spaces → dash
      .replace(/[^a-zA-Z0-9.-]/g, ""); // remove weird chars

    const fileName = `${Date.now()}-${cleanName}`;

    /* 📤 Upload to Supabase */
    const { error } = await supabase.storage
      .from("artworks")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    /* 🌍 Get public URL */
    const { data } = supabase.storage
      .from("artworks")
      .getPublicUrl(fileName);

    res.json({ url: data.publicUrl });

  } catch (err) {
    console.error("SUPABASE UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
