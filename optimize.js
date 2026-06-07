#!/usr/bin/env node
import path from "path";
import fs from "fs-extra";
import sharp from "sharp";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_WIDTH = 1200;
const MAX_OUTPUT_BYTES = 400 * 1024; // 400KB
const DEFAULT_QUALITY = 75;
const QUALITY_STEP = 5;
const MIN_QUALITY = 50;
const TARGET_QUALITY_FLOOR = 65;
const CONCURRENCY = 4;

const [inputDirArg, outputDirArg] = process.argv.slice(2);

if (!inputDirArg || !outputDirArg) {
  console.error("\nUsage: node optimize.js <input-folder> <output-folder>\n");
  process.exit(1);
}

const inputDir = path.resolve(process.cwd(), inputDirArg);
const outputDir = path.resolve(process.cwd(), outputDirArg);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getReductionPercent(originalBytes, optimizedBytes) {
  if (originalBytes === 0) return "0.0";
  return (((originalBytes - optimizedBytes) / originalBytes) * 100).toFixed(1);
}

async function collectImageFiles(directory) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectImageFiles(fullPath)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function optimizeFile(sourcePath, destPath) {
  const originalStats = await fs.stat(sourcePath);
  const originalSize = originalStats.size;
  const relativePath = path.relative(inputDir, sourcePath);
  const outputFile = path.format({
    dir: path.dirname(destPath),
    name: path.parse(sourcePath).name,
    ext: ".webp",
  });

  await fs.ensureDir(path.dirname(outputFile));

  let bestBuffer = null;
  let bestQuality = DEFAULT_QUALITY;
  let finalSize = 0;
  let lastError = null;

  for (
    let quality = DEFAULT_QUALITY;
    quality >= MIN_QUALITY;
    quality -= QUALITY_STEP
  ) {
    try {
      const buffer = await sharp(sourcePath)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 6,
        })
        .toBuffer();

      if (!bestBuffer || buffer.length < bestBuffer.length) {
        bestBuffer = buffer;
        bestQuality = quality;
        finalSize = buffer.length;
      }

      if (
        buffer.length <= MAX_OUTPUT_BYTES &&
        quality <= TARGET_QUALITY_FLOOR
      ) {
        break;
      }

      if (buffer.length <= MAX_OUTPUT_BYTES && quality === DEFAULT_QUALITY) {
        break;
      }
    } catch (error) {
      lastError = error;
      break;
    }
  }

  if (!bestBuffer) {
    throw lastError || new Error("Failed to create optimized buffer");
  }

  if (bestBuffer.length >= originalSize) {
    return {
      skipped: true,
      originalSize,
      compressedSize: originalSize,
      reduction: 0,
      relativePath,
      reason: "compressed output larger than original",
    };
  }

  await fs.writeFile(outputFile, bestBuffer);

  return {
    skipped: false,
    originalSize,
    compressedSize: finalSize,
    reduction: Number(getReductionPercent(originalSize, finalSize)),
    relativePath,
    quality: bestQuality,
  };
}

async function run() {
  try {
    const inputExists = await fs.pathExists(inputDir);
    if (!inputExists) {
      throw new Error(`Input folder does not exist: ${inputDir}`);
    }

    const imageFiles = await collectImageFiles(inputDir);
    if (imageFiles.length === 0) {
      console.log("No supported image files found in the input folder.");
      return;
    }

    console.log("\nStarting image optimization...");
    console.log(`Input: ${inputDir}`);
    console.log(`Output: ${outputDir}`);
    console.log(`Found ${imageFiles.length} image(s) to process.\n`);

    await fs.ensureDir(outputDir);

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let handled = 0;

    const queue = [...imageFiles];
    const tasks = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const sourcePath = queue.shift();
        const destPath = path.join(
          outputDir,
          path.relative(inputDir, sourcePath),
        );
        const index = ++handled;

        try {
          const result = await optimizeFile(sourcePath, destPath);

          if (result.skipped) {
            skipped += 1;
            console.log(
              `(${index}/${imageFiles.length}) SKIPPED ${result.relativePath} — ${result.reason}`,
            );
          } else {
            processed += 1;
            console.log(
              `(${index}/${imageFiles.length}) OPTIMIZED ${result.relativePath} — ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.reduction}%); quality=${result.quality}`,
            );
          }
        } catch (error) {
          errors += 1;
          console.error(
            `(${index}/${imageFiles.length}) ERROR ${path.relative(inputDir, sourcePath)} — ${error.message}`,
          );
        }
      }
    });

    await Promise.all(tasks);

    console.log("\nOptimization complete.");
    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors : ${errors}`);
    console.log(`Output directory: ${outputDir}\n`);
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

run();
