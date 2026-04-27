import express from "express";

import sql from "../config/db.js";
import { recordAuditEvent } from "../lib/audit.js";
import { HttpError, sendRouteError } from "../lib/http.js";
import { requireUrl } from "../lib/validation.js";
import adminAuth from "../middlewares/adminAuth.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const router = express.Router();
const adminDemoVideoLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "admin-course-demo-videos",
  message: "Too many demo video update attempts. Please wait before trying again.",
});

function isAllowedYouTubeHost(hostname) {
  return (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube-nocookie.com" ||
    hostname.endsWith(".youtube-nocookie.com")
  );
}

function normalizeOptionalYouTubeUrl(value, field) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const url = requireUrl(normalized, { field });
  const hostname = new URL(url).hostname.toLowerCase();

  if (!isAllowedYouTubeHost(hostname)) {
    throw new HttpError(400, `${field} must be a valid YouTube URL`);
  }

  return url;
}

async function fetchDemoVideoRows(executor) {
  const rows = await executor`
    SELECT position, youtube_url
    FROM course_demo_videos
    ORDER BY position ASC
  `;

  if (rows.length > 0) {
    return rows;
  }

  const fallbackRows = await executor`
    SELECT demo_video_1_url, demo_video_2_url, demo_video_3_url
    FROM course_page
    WHERE id = TRUE
    LIMIT 1
  `;
  const fallback = fallbackRows[0] || null;

  if (!fallback) {
    return [];
  }

  return [
    fallback.demo_video_1_url || null,
    fallback.demo_video_2_url || null,
    fallback.demo_video_3_url || null,
  ]
    .map((youtubeUrl, index) =>
      youtubeUrl
        ? {
            position: index + 1,
            youtube_url: youtubeUrl,
          }
        : null,
    )
    .filter(Boolean);
}

router.get("/", async (req, res) => {
  try {
    const demoVideos = await fetchDemoVideoRows(sql);
    return res.json(demoVideos);
  } catch (err) {
    return sendRouteError(res, err, "Failed to fetch demo videos");
  }
});

router.put("/", adminAuth, adminDemoVideoLimiter, async (req, res) => {
  try {
    const normalizedLinks = [
      normalizeOptionalYouTubeUrl(req.body?.demo_video_1_url, "demo video 1 url"),
      normalizeOptionalYouTubeUrl(req.body?.demo_video_2_url, "demo video 2 url"),
      normalizeOptionalYouTubeUrl(req.body?.demo_video_3_url, "demo video 3 url"),
    ];

    const updatedRows = await sql.begin(async (tx) => {
      const before = await fetchDemoVideoRows(tx);

      await tx`DELETE FROM course_demo_videos`;

      for (const [index, youtubeUrl] of normalizedLinks.entries()) {
        if (!youtubeUrl) continue;

        await tx`
          INSERT INTO course_demo_videos (
            position,
            youtube_url,
            updated_at
          )
          VALUES (
            ${index + 1},
            ${youtubeUrl},
            NOW()
          )
        `;
      }

      const after = await fetchDemoVideoRows(tx);

      await recordAuditEvent(tx, {
        adminId: req.adminId,
        action: "course_demo_videos_update",
        entityType: "course_demo_videos",
        entityId: "course",
        before,
        after,
        req,
      });

      return after;
    });

    return res.json(updatedRows);
  } catch (err) {
    return sendRouteError(res, err, "Failed to update demo videos");
  }
});

export default router;
