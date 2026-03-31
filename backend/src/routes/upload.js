import express from "express";
import multer from "multer";
import supabase from "../config/supabase.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;

    const cleanName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const fileName = `${Date.now()}-${cleanName}`;

    const { error } = await supabase.storage
      .from("artworks")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("artworks").getPublicUrl(fileName);

    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
