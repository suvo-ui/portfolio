import { deletePublicMediaObject } from "./mediaStorage.js";
import { collectStoredImageUrls } from "./imageVariants.js";

export const MEDIA_CLEANUP_GRACE_DAYS = 30;
const RETRY_DELAY_MS = 60 * 60 * 1000;
const MAX_DELETE_ATTEMPTS = 3;

function normalizeUrls(publicUrls) {
  return [
    ...new Set(
      (Array.isArray(publicUrls) ? publicUrls : [publicUrls])
        .filter(Boolean)
        .map((url) => String(url).trim())
        .filter(Boolean),
    ),
  ];
}

function buildNotBefore({ notBefore, delayDays = MEDIA_CLEANUP_GRACE_DAYS }) {
  if (notBefore) return notBefore;
  return new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
}

export async function enqueueMediaCleanupJobs(
  db,
  {
    publicUrls,
    bucketName,
    resourceType = "image",
    reason,
    notBefore = null,
    delayDays = MEDIA_CLEANUP_GRACE_DAYS,
  },
) {
  const urls = normalizeUrls(publicUrls);
  if (urls.length === 0) return 0;

  const cleanupAt = buildNotBefore({ notBefore, delayDays });
  let queued = 0;

  for (const publicUrl of urls) {
    const result = await db`
      INSERT INTO media_cleanup_jobs (
        public_url,
        bucket_name,
        resource_type,
        reason,
        not_before
      )
      VALUES (
        ${publicUrl},
        ${bucketName},
        ${resourceType},
        ${reason},
        ${cleanupAt}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    queued += result.length;
  }

  return queued;
}

export async function cancelMediaCleanupJobs(db, { publicUrls, bucketName }) {
  const urls = normalizeUrls(publicUrls);
  if (urls.length === 0) return 0;

  let cancelled = 0;

  for (const publicUrl of urls) {
    const result = await db`
      UPDATE media_cleanup_jobs
      SET
        status = 'cancelled',
        updated_at = NOW()
      WHERE status = 'pending'
        AND public_url = ${publicUrl}
        AND bucket_name = ${bucketName}
      RETURNING id
    `;

    cancelled += result.length;
  }

  return cancelled;
}

function rowReferencesUrl(row, publicUrl) {
  if (row?.video_url === publicUrl || row?.video_path === publicUrl) {
    return true;
  }

  return collectStoredImageUrls(row).includes(publicUrl);
}

export function rowsReferenceMediaUrl(rows, publicUrl) {
  return rows.some((row) => rowReferencesUrl(row, publicUrl));
}

export async function hasActiveMediaReference(db, publicUrl) {
  const [artworks, prints, heroImages, workshops, coursePages] =
    await Promise.all([
      db`
        SELECT image_url, image_variants
        FROM artworks
        WHERE deleted_at IS NULL
      `,
      db`
        SELECT image_url, image_variants
        FROM prints
        WHERE deleted_at IS NULL
      `,
      db`
        SELECT image_url, image_variants
        FROM hero_carousel_images
      `,
      db`
        SELECT image_url, image_variants, video_url
        FROM workshops
        WHERE deleted_at IS NULL
      `,
      db`
        SELECT video_path
        FROM course_page
      `,
    ]);

  return rowsReferenceMediaUrl(
    [...artworks, ...prints, ...heroImages, ...workshops, ...coursePages],
    publicUrl,
  );
}

async function markJobCompleted(db, jobId) {
  await db`
    UPDATE media_cleanup_jobs
    SET
      status = 'completed',
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${jobId}
  `;
}

async function markJobCancelled(db, jobId, reason) {
  await db`
    UPDATE media_cleanup_jobs
    SET
      status = 'cancelled',
      last_error = ${reason},
      updated_at = NOW()
    WHERE id = ${jobId}
  `;
}

async function markJobFailed(db, job, error) {
  const attempts = Number(job.attempts || 0) + 1;
  const status = attempts >= MAX_DELETE_ATTEMPTS ? "failed" : "pending";
  const retryAt = new Date(Date.now() + RETRY_DELAY_MS);

  await db`
    UPDATE media_cleanup_jobs
    SET
      status = ${status},
      attempts = ${attempts},
      last_error = ${error instanceof Error ? error.message : String(error)},
      not_before = ${retryAt},
      updated_at = NOW()
    WHERE id = ${job.id}
  `;
}

export async function processPendingMediaCleanupJobs({
  db,
  supabase,
  limit = 50,
  dryRun = false,
  deleteObject = deletePublicMediaObject,
}) {
  const jobs = await db`
    SELECT *
    FROM media_cleanup_jobs
    WHERE status = 'pending'
      AND not_before <= NOW()
    ORDER BY not_before ASC, id ASC
    LIMIT ${limit}
  `;

  const results = [];

  for (const job of jobs) {
    const stillReferenced = await hasActiveMediaReference(db, job.public_url);

    if (stillReferenced) {
      if (!dryRun) {
        await markJobCancelled(db, job.id, "Active media reference exists");
      }

      results.push({ id: job.id, status: "cancelled", referenced: true });
      continue;
    }

    if (dryRun) {
      results.push({ id: job.id, status: "would_delete", referenced: false });
      continue;
    }

    try {
      const deleted = await deleteObject({
        supabase,
        bucketName: job.bucket_name,
        publicUrl: job.public_url,
        resourceType: job.resource_type,
      });

      if (!deleted.deleted) {
        throw new Error(deleted.reason || "Media URL could not be deleted");
      }

      await markJobCompleted(db, job.id);
      results.push({ id: job.id, status: "completed", referenced: false });
    } catch (error) {
      await markJobFailed(db, job, error);
      results.push({
        id: job.id,
        status: "failed",
        referenced: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
