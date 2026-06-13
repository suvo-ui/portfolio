import express from "express";
import fs from "fs";
import os from "os";
import multer from "multer";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { recordAuditEvent } from "../lib/audit.js";
import { sendRouteError } from "../lib/http.js";
import {
  getConfiguredPublicUrlForKey,
  getSupabasePublicUrl,
  isExternalMediaStorageEnabled,
  uploadPublicMediaObject,
} from "../lib/mediaStorage.js";
import {
  buildStorageObjectPath,
  detectUploadedFileType,
} from "../lib/storage.js";
import { requireString } from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const COURSE_VIDEO_SUPABASE_BUCKET = "course vids";
const COURSE_VIDEO_MEDIA_BUCKET = "course-vids";
const MAX_COURSE_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
const MEDIA_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for large video uploads
const adminCourseLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "admin-course",
  message: "Too many course update attempts. Please wait before trying again.",
});

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename(req, file, cb) {
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 120);
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: {
    fileSize: MAX_COURSE_VIDEO_SIZE_BYTES,
    files: 1,
  },
});

async function readFileHeader(filePath, length = 128) {
  const handle = await fs.promises.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.slice(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function deleteTempFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // best effort cleanup
  }
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

  let videoUrl = null;

  if (course.video_path) {
    if (/^https?:\/\//i.test(course.video_path)) {
      videoUrl = course.video_path;
    } else if (course.video_path.startsWith(`${COURSE_VIDEO_MEDIA_BUCKET}/`)) {
      videoUrl = getConfiguredPublicUrlForKey(course.video_path);
    } else {
      videoUrl = getSupabasePublicUrl(
        supabase,
        COURSE_VIDEO_SUPABASE_BUCKET,
        course.video_path,
      );
    }
  }

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
      let tempVideoPath = null;

      if (req.file) {
        tempVideoPath = req.file.path;
        console.info("Course video upload started", {
          adminId: req.adminId,
          originalName: req.file.originalname,
          size: req.file.size,
          path: tempVideoPath,
        });

        const headerBuffer = await readFileHeader(tempVideoPath, 128);
        const detectedType = detectUploadedFileType(
          { buffer: headerBuffer },
          "video",
        );
        newVideoPath = buildStorageObjectPath("course", detectedType.extension);
        const mediaBucketName = isExternalMediaStorageEnabled()
          ? COURSE_VIDEO_MEDIA_BUCKET
          : COURSE_VIDEO_SUPABASE_BUCKET;

        // TRACING: Log file state before upload
        console.log("=== COURSE VIDEO UPLOAD TRACE ===");
        console.log("req.file", req.file);
        console.log("tempVideoPath", tempVideoPath);
        console.log(
          "file exists",
          tempVideoPath ? fs.existsSync(tempVideoPath) : false,
        );

        const uploadBody = fs.createReadStream(tempVideoPath);
        console.log("uploadBody (stream)", uploadBody);
        console.log("uploadBody constructor", uploadBody?.constructor?.name);

        const uploadPayload = {
          supabase,
          bucketName: mediaBucketName,
          objectPath: newVideoPath,
          body: uploadBody,
          contentType: detectedType.contentType,
          cacheControl: "31536000",
          upsert: false,
        };
        console.log("uploadPayload object", uploadPayload);
        console.log("uploadPayload.body", uploadPayload.body);
        console.log("=== END TRACE ===");

        const uploaded = await withTimeout(
          uploadPublicMediaObject(uploadPayload),
          MEDIA_UPLOAD_TIMEOUT_MS,
          "Course video upload",
        );

        newVideoPath =
          uploaded.driver === "supabase"
            ? uploaded.objectKey
            : uploaded.publicUrl;
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
      console.error("Course update failed", {
        adminId: req.adminId,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        error: err,
      });

      if (err instanceof multer.MulterError) {
        console.error("Course video multer error", err);

        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "Course video is too large. Please keep it under 500 MB.",
          });
        }

        return res.status(400).json({ error: err.message });
      }

      return sendRouteError(res, err, "Course update failed");
    } finally {
      if (tempVideoPath) {
        await deleteTempFile(tempVideoPath);
      }
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
