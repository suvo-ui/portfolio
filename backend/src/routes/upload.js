import express from "express";
import multer from "multer";

import supabase from "../config/supabase.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import {
  buildStorageObjectPath,
  detectUploadedFileType,
} from "../lib/storage.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPABASE_UPLOAD_TIMEOUT_MS = 30_000;
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

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

router.post("/", adminAuth, adminUploadLimiter, async (req, res) => {
  try {
    await runMulter(req, res);

    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    const detectedType = detectUploadedFileType(req.file, "image");
    const objectPath = buildStorageObjectPath("artworks", detectedType.extension);

    const { error } = await withTimeout(
      supabase.storage.from("artworks").upload(objectPath, req.file.buffer, {
        contentType: detectedType.contentType,
        upsert: false,
      }),
      SUPABASE_UPLOAD_TIMEOUT_MS,
      "Supabase image upload",
    );

    if (error) {
      return res.status(502).json({ error: error.message || "Upload failed" });
    }

    const { data } = supabase.storage.from("artworks").getPublicUrl(objectPath);

    return res.json({ url: data.publicUrl });
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
