import express from "express";
import multer from "multer";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { recordAuditEvent } from "../lib/audit.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import {
  buildStorageObjectPath,
  detectUploadedFileType,
} from "../lib/storage.js";
import { requireString } from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const COURSE_VIDEO_BUCKET = "course vids";
const MAX_COURSE_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const SUPABASE_UPLOAD_TIMEOUT_MS = 30_000;
const adminCourseLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "admin-course",
  message: "Too many course update attempts. Please wait before trying again.",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_COURSE_VIDEO_SIZE_BYTES,
    files: 1,
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

async function fetchCurrentCourse(executor) {
  const rows = await executor`
    SELECT *
    FROM course_page
    WHERE id = TRUE
    LIMIT 1
  `;

  return rows[0] || null;
}

function buildCourseResponse(course) {
  if (!course) {
    return null;
  }

  const videoUrl = course.video_path
    ? supabase.storage
        .from(COURSE_VIDEO_BUCKET)
        .getPublicUrl(course.video_path).data.publicUrl
    : null;

  return {
    ...course,
    video_url: videoUrl,
  };
}

router.get("/", async (req, res) => {
  try {
    const course = await fetchCurrentCourse(sql);
    return res.json(buildCourseResponse(course));
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch course");
  }
});

router.put(
  "/",
  adminAuth,
  adminCourseLimiter,
  upload.single("video"),
  async (req, res) => {
    try {
      const existingCourse = await fetchCurrentCourse(sql);
      const rawMarkdown =
        req.body?.markdown === undefined
          ? existingCourse?.markdown
          : req.body.markdown;
      const markdown = requireString(rawMarkdown, {
        field: "course markdown",
        maxLength: 50_000,
      });

      let newVideoPath = null;

      if (req.file) {
        const detectedType = detectUploadedFileType(req.file, "video");
        newVideoPath = buildStorageObjectPath("course", detectedType.extension);

        const { error } = await withTimeout(
          supabase.storage.from(COURSE_VIDEO_BUCKET).upload(
            newVideoPath,
            req.file.buffer,
            {
              contentType: detectedType.contentType,
              upsert: false,
            },
          ),
          SUPABASE_UPLOAD_TIMEOUT_MS,
          "Supabase course video upload",
        );

        if (error) {
          throw new HttpError(502, error.message || "Course video upload failed");
        }
      }

      const updatedCourse = await sql.begin(async (tx) => {
        const previousCourse = await fetchCurrentCourse(tx);

        const upsertedRows = await tx`
          INSERT INTO course_page (id, markdown, video_path, updated_at)
          VALUES (
            TRUE,
            ${markdown},
            ${newVideoPath ?? previousCourse?.video_path ?? null},
            NOW()
          )
          ON CONFLICT (id)
          DO UPDATE SET
            markdown = EXCLUDED.markdown,
            video_path = EXCLUDED.video_path,
            updated_at = NOW()
          RETURNING *
        `;
        const updated = upsertedRows[0];

        await recordAuditEvent(tx, {
          adminId: req.adminId,
          action: "course_update",
          entityType: "course_page",
          entityId: "true",
          before: previousCourse,
          after: updated,
          req,
        });

        return updated;
      });

      return res.json(buildCourseResponse(updatedCourse));
    } catch (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "Course video is too large. Please keep it under 50 MB.",
          });
        }

        return res.status(400).json({ error: err.message });
      }

      return sendRouteError(res, err, "Course update failed");
    }
  },
);

router.delete("/video", adminAuth, adminCourseLimiter, async (req, res) => {
  try {
    const currentCourse = await fetchCurrentCourse(sql);

    if (!currentCourse?.video_path) {
      return res.json({ success: true, message: "No video to delete" });
    }

    await sql.begin(async (tx) => {
      const previousCourse = await fetchCurrentCourse(tx);

      const updatedRows = await tx`
        UPDATE course_page
        SET video_path = NULL, updated_at = NOW()
        WHERE id = TRUE
        RETURNING *
      `;
      const updatedCourse = updatedRows[0];

      await recordAuditEvent(tx, {
        adminId: req.adminId,
        action: "course_video_remove",
        entityType: "course_page",
        entityId: "true",
        before: previousCourse,
        after: updatedCourse,
        req,
      });
    });

    return res.json({ success: true });
  } catch (err) {
    return sendRouteError(res, err, "Failed to delete video");
  }
});

export default router;
