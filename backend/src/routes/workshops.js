import express from "express";
import multer from "multer";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { recordAuditEvent } from "../lib/audit.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import {
  buildStorageObjectPath,
  detectUploadedFileType,
  uploadImageVariantsToStorage,
} from "../lib/storage.js";
import {
  optionalString,
  parseBoolean,
  parseOptionalNumber,
  parsePositiveId,
  requireIsoLikeDateTime,
  requireString,
} from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const SUPABASE_UPLOAD_TIMEOUT_MS = 30_000;
const WORKSHOP_IMAGE_BUCKET = "workshop-image";
const WORKSHOP_VIDEO_BUCKET = "workshop-videos";
const adminWorkshopLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "admin-workshop",
});
const destructiveWorkshopLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 8,
  keyPrefix: "admin-workshop-delete",
  message: "Too many destructive workshop actions. Please slow down.",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
    files: 2,
  },
});

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

function normalizeWorkshopPayload(body) {
  return {
    title: requireString(body?.title, {
      field: "title",
      maxLength: 160,
    }),
    description: optionalString(body?.description, {
      field: "description",
      maxLength: 4000,
    }),
    date: requireIsoLikeDateTime(body?.date, {
      field: "date",
    }),
    duration: optionalString(body?.duration, {
      field: "duration",
      maxLength: 80,
    }),
    price: parseOptionalNumber(body?.price, {
      field: "price",
      min: 0,
      max: 1_000_000,
    }),
    maxSeats: parseOptionalNumber(body?.max_seats, {
      field: "max seats",
      min: 1,
      max: 1000,
      integer: true,
    }),
    venue: optionalString(body?.venue, {
      field: "venue",
      maxLength: 255,
    }),
  };
}

async function uploadWorkshopAsset(file, kind) {
  const detectedType = detectUploadedFileType(file, kind);
  const bucketName =
    kind === "image" ? WORKSHOP_IMAGE_BUCKET : WORKSHOP_VIDEO_BUCKET;
  const folder = kind === "image" ? "images" : "videos";

  if (kind === "image") {
    const variants = await uploadImageVariantsToStorage({
      supabase,
      bucketName,
      prefix: folder,
      sourceBuffer: file.buffer,
      timeoutMs: SUPABASE_UPLOAD_TIMEOUT_MS,
    });

    return {
      url: variants.large,
      variants,
    };
  }

  const objectPath = buildStorageObjectPath(folder, detectedType.extension);

  const { error } = await withTimeout(
    supabase.storage.from(bucketName).upload(objectPath, file.buffer, {
      contentType: detectedType.contentType,
      upsert: false,
    }),
    SUPABASE_UPLOAD_TIMEOUT_MS,
    `Supabase ${kind} upload`,
  );

  if (error) {
    throw new HttpError(502, error.message || `${kind} upload failed`);
  }

  return {
    url: supabase.storage.from(bucketName).getPublicUrl(objectPath).data
      .publicUrl,
    variants: null,
  };
}

router.get("/", async (req, res) => {
  try {
    await sql`
      UPDATE workshops
      SET completed = TRUE
      WHERE date < NOW()
        AND completed = FALSE
        AND deleted_at IS NULL
    `;

    const result = await sql`
      SELECT *
      FROM workshops
      WHERE deleted_at IS NULL
      ORDER BY date DESC
    `;

    return res.json(result);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch workshops");
  }
});

router.post(
  "/",
  adminAuth,
  adminWorkshopLimiter,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const payload = normalizeWorkshopPayload(req.body);
      const imageFile = req.files?.image?.[0] || null;
      const videoFile = req.files?.video?.[0] || null;

      if (imageFile && imageFile.size > MAX_IMAGE_SIZE_BYTES) {
        throw new HttpError(
          413,
          "Workshop image is too large. Please keep it under 10 MB.",
        );
      }

      if (videoFile && videoFile.size > MAX_VIDEO_SIZE_BYTES) {
        throw new HttpError(
          413,
          "Workshop video is too large. Please keep it under 50 MB.",
        );
      }

      const [imageUpload, videoUpload] = await Promise.all([
        imageFile ? uploadWorkshopAsset(imageFile, "image") : null,
        videoFile ? uploadWorkshopAsset(videoFile, "video") : null,
      ]);

      const createdWorkshop = await sql.begin(async (tx) => {
        const createdRows = await tx`
          INSERT INTO workshops (
            title,
            description,
            date,
            duration,
            price,
            max_seats,
            image_url,
            image_variants,
            video_url,
            venue,
            completed
          )
          VALUES (
            ${payload.title},
            ${payload.description},
            ${payload.date},
            ${payload.duration},
            ${payload.price},
            ${payload.maxSeats},
            ${imageUpload?.url ?? null},
            ${imageUpload?.variants ? JSON.stringify(imageUpload.variants) : null}::jsonb,
            ${videoUpload?.url ?? null},
            ${payload.venue},
            FALSE
          )
          RETURNING *
        `;
        const created = createdRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "workshop_create",
          entityType: "workshop",
          entityId: created.id,
          after: created,
          req,
        });

        return created;
      });

      return res.status(201).json(createdWorkshop);
    } catch (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "Workshop media is too large. Keep uploads under 50 MB.",
          });
        }

        return res.status(400).json({ error: err.message });
      }

      return sendRouteError(res, err, "Workshop creation failed");
    }
  },
);

router.put(
  "/:id",
  adminAuth,
  adminWorkshopLimiter,
  async (req, res) => {
    try {
      const workshopId = parsePositiveId(req.params.id, "workshop id");
      const completed = parseBoolean(req.body?.completed, {
        field: "completed",
        defaultValue: null,
      });

      if (completed === null) {
        throw new HttpError(400, "Completed status is required");
      }

      const updatedWorkshop = await sql.begin(async (tx) => {
        const existingRows = await tx`
          SELECT *
          FROM workshops
          WHERE id = ${workshopId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const existing = existingRows[0] || null;

        if (!existing) {
          throw new HttpError(404, "Workshop not found");
        }

        const updatedRows = await tx`
          UPDATE workshops
          SET completed = ${completed}
          WHERE id = ${workshopId}
          RETURNING *
        `;
        const updated = updatedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "workshop_complete_toggle",
          entityType: "workshop",
          entityId: updated.id,
          before: existing,
          after: updated,
          req,
        });

        return updated;
      });

      return res.json(updatedWorkshop);
    } catch (err) {
      return sendRouteError(res, err, "Failed to update workshop");
    }
  },
);

router.delete(
  "/:id",
  adminAuth,
  destructiveWorkshopLimiter,
  async (req, res) => {
    try {
      const workshopId = parsePositiveId(req.params.id, "workshop id");

      await sql.begin(async (tx) => {
        const workshopRows = await tx`
          SELECT *
          FROM workshops
          WHERE id = ${workshopId}
            AND deleted_at IS NULL
          LIMIT 1
        `;
        const workshop = workshopRows[0] || null;

        if (!workshop) {
          throw new HttpError(404, "Workshop not found");
        }

        const deletedRows = await tx`
          UPDATE workshops
          SET
            deleted_at = NOW(),
            is_active = FALSE
          WHERE id = ${workshopId}
          RETURNING *
        `;
        const deletedWorkshop = deletedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "workshop_soft_delete",
          entityType: "workshop",
          entityId: deletedWorkshop.id,
          before: workshop,
          after: deletedWorkshop,
          req,
        });
      });

      return res.json({ success: true });
    } catch (err) {
      return sendRouteError(res, err, "Failed to delete workshop");
    }
  },
);

export default router;
