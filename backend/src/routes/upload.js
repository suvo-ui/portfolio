import express from "express";
import upload from "../config/multer.js";
import supabase from "../config/supabase.js";
import { randomUUID } from "crypto";

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const file = req.file;

    // unique filename
    const fileName = `${randomUUID()}-${file.originalname}`;

    // upload to Supabase bucket
    const { error } = await supabase.storage
      .from("artworks")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error);
      return res.status(500).json({ error: "Upload failed" });
    }

    // get public URL
    const { data } = supabase.storage.from("artworks").getPublicUrl(fileName);

    res.json({
      url: data.publicUrl,
      path: fileName,
    });
  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
