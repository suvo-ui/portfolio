import express from "express";
import multer from "multer";

import supabase from "../config/supabase.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import {
  detectUploadedFileType,
  uploadImageVariantsToStorage,
} from "../lib/storage.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MEDIA_UPLOAD_TIMEOUT_MS = 30_000;
const adminUploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  keyPrefix: "admin-upload",
  message: "Too many upload attempts. Please wait before trying again.",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

router.post("/", adminAuth, adminUploadLimiter, async (req, res) => {
  try {
    await runMulter(req, res);

    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    detectUploadedFileType(req.file, "image");
    const imageVariants = await uploadImageVariantsToStorage({
      supabase,
      bucketName: "artworks",
      prefix: "artworks",
      sourceBuffer: req.file.buffer,
      timeoutMs: MEDIA_UPLOAD_TIMEOUT_MS,
    });

    return res.json({
      url: imageVariants.large,
      image_variants: imageVariants,
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "Image is too large. Please upload a file up to 10 MB.",
        });
      }

      return res.status(400).json({ error: err.message });
    }

    return sendRouteError(res, err, "Upload failed");
  }
});

export default router;
