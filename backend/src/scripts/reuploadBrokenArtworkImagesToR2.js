import "dotenv/config";

import fs from "fs/promises";
import path from "path";

import sql from "../config/db.js";
import supabase from "../config/supabase.js";
import { getPreferredImageVariantUrl } from "../lib/imageVariants.js";
import { uploadImageVariantsToStorage } from "../lib/storage.js";

const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const listBroken = argv.includes("--list-broken");
const localDirArg = getArgValue("--local-dir");
const localDir = localDirArg
  ? path.resolve(localDirArg)
  : process.env.BROKEN_ARTWORK_LOCAL_DIR
    ? path.resolve(process.env.BROKEN_ARTWORK_LOCAL_DIR)
    : path.resolve(process.cwd(), "artwork-originals");

const summary = {
  migrated: 0,
  skipped: 0,
  failed: 0,
  unmatched: 0,
  broken: 0,
};

const failedRecords = [];

function getArgValue(flag) {
  const index = argv.findIndex((arg) => arg === flag);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function isBrokenArtworkUrl(value) {
  return (
    typeof value === "string" &&
    /(?:res\.cloudinary\.com|supabase\.co\/storage)/i.test(value)
  );
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_\-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function getUrlBasename(url) {
  try {
    const parsed = new URL(url);
    return path.basename(parsed.pathname, path.extname(parsed.pathname));
  } catch {
    return "";
  }
}

function collectVariantUrls(variants) {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return [];
  }

  return ["thumb", "card", "large"].flatMap((key) => {
    const value = variants[key];
    if (typeof value === "string") {
      return value;
    }
    if (value && typeof value === "object" && typeof value.url === "string") {
      return value.url;
    }
    return [];
  });
}

function hasBrokenArtworkReference(row) {
  if (isBrokenArtworkUrl(row.image_url)) return true;
  return collectVariantUrls(row.image_variants).some(isBrokenArtworkUrl);
}

function buildLocalFileIndex(files) {
  return files.map((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath, ext);
    const normalizedBase = normalizeKey(base);
    const normalizedPath = normalizeKey(filePath);
    return {
      filePath,
      ext,
      base,
      normalizedBase,
      normalizedPath,
    };
  });
}

function sortCandidates(candidates) {
  return [...new Set(candidates.filter(Boolean))];
}

function expectsLocalFile(row) {
  const candidates = [String(row.id), row.title, getUrlBasename(row.image_url)];
  const titleKey = normalizeKey(row.title);
  const urlName = normalizeKey(getUrlBasename(row.image_url));

  return sortCandidates([String(row.id), titleKey, urlName]);
}

function findLocalImageFile(row, indexedFiles) {
  const titleKey = normalizeKey(row.title);
  const urlBasename = normalizeKey(getUrlBasename(row.image_url));
  const variantUrlBasenames = collectVariantUrls(row.image_variants).map(
    getUrlBasename,
  );
  const variantKeys = variantUrlBasenames.map(normalizeKey);
  const numericId = String(row.id);

  const preferredKeys = sortCandidates([
    numericId,
    titleKey,
    urlBasename,
    ...variantKeys,
  ]).filter(Boolean);

  const exactMatches = indexedFiles.filter((file) =>
    preferredKeys.some((key) => file.normalizedBase === key),
  );
  if (exactMatches.length === 1) {
    return exactMatches[0].filePath;
  }
  if (exactMatches.length > 1) {
    const idMatch = exactMatches.find(
      (file) => file.normalizedBase === numericId,
    );
    if (idMatch) return idMatch.filePath;
    return exactMatches[0].filePath;
  }

  const partialMatches = indexedFiles.filter((file) =>
    preferredKeys.some(
      (key) => key.length > 0 && file.normalizedPath.includes(key),
    ),
  );

  if (partialMatches.length === 1) {
    return partialMatches[0].filePath;
  }

  const idInPath = indexedFiles.find(
    (file) =>
      file.normalizedPath.includes(` ${numericId} `) ||
      file.normalizedPath.endsWith(` ${numericId}`) ||
      file.normalizedPath.startsWith(`${numericId} `) ||
      file.normalizedBase === numericId,
  );
  if (idInPath) {
    return idInPath.filePath;
  }

  return null;
}

async function traverseLocalFiles(dir) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!supportedExtensions.has(ext)) continue;
      results.push(entryPath);
    }
  }

  await walk(dir);
  return results;
}

function formatStatus(row) {
  if (!row.image_url) return "no image_url";
  return `${row.id} | ${row.title || "<untitled>"} | ${row.image_url}`;
}

async function readLocalImage(row, indexedFiles) {
  const localFile = findLocalImageFile(row, indexedFiles);
  if (!localFile) {
    return null;
  }

  return fs.readFile(localFile);
}

async function scanBrokenArtworks() {
  const rows = await sql`
    SELECT id, title, image_url, image_variants
    FROM artworks
    ORDER BY id ASC
  `;

  return rows.filter(hasBrokenArtworkReference);
}

async function listBrokenArtworks() {
  const rows = await scanBrokenArtworks();

  if (rows.length === 0) {
    console.log("No broken artwork records found.");
    return;
  }

  console.log("Broken artwork records:");
  for (const row of rows) {
    console.log(`- ${row.id}: ${row.title || "<untitled>"}`);
    console.log(`  image_url: ${row.image_url}`);
    if (row.image_variants) {
      console.log(
        `  broken variant URLs: ${collectVariantUrls(row.image_variants).filter(isBrokenArtworkUrl).join(", ")}`,
      );
    }
  }
  console.log(`\nTotal broken artwork records: ${rows.length}`);
}

async function repairBrokenArtworks() {
  if (process.env.MEDIA_STORAGE_DRIVER?.trim().toLowerCase() !== "r2") {
    throw new Error(
      "MEDIA_STORAGE_DRIVER must be set to r2 for reuploadBrokenArtworkImagesToR2.js",
    );
  }

  let localFiles;
  try {
    localFiles = await traverseLocalFiles(localDir);
  } catch (error) {
    throw new Error(
      `Unable to scan local directory ${localDir}: ${error.message}`,
    );
  }

  if (localFiles.length === 0) {
    throw new Error(
      `No supported image files found in local directory: ${localDir}`,
    );
  }

  const indexedFiles = buildLocalFileIndex(localFiles);
  const rows = await scanBrokenArtworks();

  if (rows.length === 0) {
    console.log("No broken artwork records found.");
    return;
  }

  summary.broken = rows.length;
  console.log(
    `Found ${rows.length} broken artwork record(s). Scanning local directory: ${localDir}`,
  );

  for (const row of rows) {
    const brokenUrls = [
      row.image_url,
      ...collectVariantUrls(row.image_variants),
    ].filter(isBrokenArtworkUrl);

    const localFile = findLocalImageFile(row, indexedFiles);
    if (!localFile) {
      summary.unmatched += 1;
      summary.failed += 1;
      failedRecords.push({
        id: row.id,
        title: row.title,
        reason: `No local original image matched for broken artwork (${brokenUrls.join(", ")})`,
      });
      console.log(
        `SKIP ${row.id}: no local file match found for broken artwork`,
      );
      continue;
    }

    console.log(`PROCESS ${row.id}: matched local file ${localFile}`);

    try {
      const buffer = await fs.readFile(localFile);

      if (dryRun) {
        console.log(`[dry-run] ${row.id}: would re-upload ${localFile}`);
        console.log(
          `[dry-run] ${row.id}: would generate thumb/card/large and write image_url + image_variants`,
        );
        summary.migrated += 1;
        continue;
      }

      const variants = await uploadImageVariantsToStorage({
        supabase,
        bucketName: "artworks",
        prefix: "artworks",
        sourceBuffer: buffer,
      });

      const imageUrl = getPreferredImageVariantUrl(variants, "large");
      if (!imageUrl) {
        throw new Error("Upload pipeline completed without a large image URL");
      }

      await sql`
        UPDATE artworks
        SET
          image_url = ${imageUrl},
          image_variants = ${JSON.stringify(variants)}::jsonb
        WHERE id = ${row.id}
      `;

      console.log(
        `UPDATED ${row.id}: image_url and image_variants rewritten to R2`,
      );
      summary.migrated += 1;
    } catch (error) {
      summary.failed += 1;
      failedRecords.push({
        id: row.id,
        title: row.title,
        reason: error.message,
      });
      console.error(`FAILED ${row.id}: ${error.message}`);
    }
  }
}

async function run() {
  if (listBroken) {
    await listBrokenArtworks();
    return;
  }

  await repairBrokenArtworks();

  console.log("\nRepair summary:");
  console.log(`  broken: ${summary.broken}`);
  console.log(`  migrated: ${summary.migrated}`);
  console.log(`  unmatched: ${summary.unmatched}`);
  console.log(`  failed: ${summary.failed}`);
  console.log(`  dryRun: ${dryRun}`);

  if (failedRecords.length > 0) {
    console.log("\nFailed records:");
    for (const failure of failedRecords) {
      console.log(
        `  - ${failure.id}: ${failure.title || "<untitled>"} — ${failure.reason}`,
      );
    }
  }
}

run()
  .then(async () => {
    await sql.end({ timeout: 5 });
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end({ timeout: 5 });
    process.exit(1);
  });
