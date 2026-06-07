import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import {
  createOptimizedImageVariants,
  uploadImageVariantsToStorage,
} from "./storage.js";
import {
  collectStoredImageUrls,
  getImageVariantUrl,
} from "./imageVariants.js";
import { rowsReferenceMediaUrl } from "./mediaCleanup.js";

async function createSampleImage(width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#7a4f32",
    },
  })
    .jpeg({ quality: 92 })
    .toBuffer();
}

test("createOptimizedImageVariants stores actual portrait metadata", async () => {
  const variants = await createOptimizedImageVariants(
    await createSampleImage(2400, 3600),
  );

  assert.equal(variants.large.width, 1800);
  assert.equal(variants.large.height, 2700);
  assert.equal(variants.card.width, 900);
  assert.equal(variants.card.height, 1350);
  assert.equal(variants.thumb.width, 360);
  assert.equal(variants.thumb.height, 540);
  assert.ok(variants.large.bytes > 0);
});

test("createOptimizedImageVariants stores actual landscape metadata", async () => {
  const variants = await createOptimizedImageVariants(
    await createSampleImage(3600, 2400),
  );

  assert.equal(variants.large.width, 1800);
  assert.equal(variants.large.height, 1200);
  assert.equal(variants.card.width, 900);
  assert.equal(variants.card.height, 600);
  assert.equal(variants.thumb.width, 360);
  assert.equal(variants.thumb.height, 240);
});

test("variant helpers accept old string values and new metadata objects", () => {
  const record = {
    image_url: "https://media.example.com/artworks/artworks/main.webp",
    image_variants: {
      thumb: "https://media.example.com/artworks/artworks/thumb.webp",
      card: {
        url: "https://media.example.com/artworks/artworks/card.webp",
        width: 900,
        height: 600,
        bytes: 12345,
      },
    },
  };

  assert.equal(
    getImageVariantUrl(record.image_variants.card),
    "https://media.example.com/artworks/artworks/card.webp",
  );
  assert.deepEqual(collectStoredImageUrls(record), [
    "https://media.example.com/artworks/artworks/main.webp",
    "https://media.example.com/artworks/artworks/thumb.webp",
    "https://media.example.com/artworks/artworks/card.webp",
  ]);
});

test("rowsReferenceMediaUrl detects primary image, variants, and videos", () => {
  const rows = [
    {
      image_url: "https://media.example.com/artworks/a.webp",
      image_variants: {
        large: {
          url: "https://media.example.com/artworks/a-large.webp",
          width: 1800,
          height: 1200,
          bytes: 9000,
        },
      },
    },
    {
      video_url: "https://media.example.com/workshop-videos/intro.mp4",
    },
  ];

  assert.equal(
    rowsReferenceMediaUrl(
      rows,
      "https://media.example.com/artworks/a-large.webp",
    ),
    true,
  );
  assert.equal(
    rowsReferenceMediaUrl(
      rows,
      "https://media.example.com/workshop-videos/intro.mp4",
    ),
    true,
  );
  assert.equal(
    rowsReferenceMediaUrl(rows, "https://example.com/missing.webp"),
    false,
  );
});

test("uploadImageVariantsToStorage rolls back successful siblings on failure", async () => {
  const sourceBuffer = await createSampleImage(1200, 800);
  const deleted = [];

  await assert.rejects(
    uploadImageVariantsToStorage({
      bucketName: "artworks",
      prefix: "artworks",
      sourceBuffer,
      uploadObject: async ({ objectPath }) => {
        if (objectPath.includes("-card.")) {
          throw new Error("simulated upload failure");
        }

        return {
          publicUrl: `https://media.example.com/artworks/${objectPath}`,
        };
      },
      deleteObject: async ({ publicUrl }) => {
        deleted.push(publicUrl);
        return { deleted: true };
      },
    }),
    /simulated upload failure/,
  );

  assert.ok(deleted.length >= 1);
});
