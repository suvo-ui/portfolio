import { randomUUID } from "crypto";
import sharp from "sharp";

import { HttpError } from "./http.js";
import {
  deletePublicMediaObject,
  extractCloudinaryPublicObjectPath,
  extractConfiguredPublicObjectPath,
  extractSupabasePublicObjectPath,
  uploadPublicMediaObject,
} from "./mediaStorage.js";

export {
  extractCloudinaryPublicObjectPath,
  extractConfiguredPublicObjectPath,
  extractSupabasePublicObjectPath,
};

export const IMAGE_VARIANT_DEFINITIONS = [
  {
    key: "thumb",
    width: 360,
    quality: 72,
  },
  {
    key: "card",
    width: 900,
    quality: 78,
  },
  {
    key: "large",
    width: 1800,
    quality: 84,
  },
];

export const IMAGE_VARIANT_KEYS = IMAGE_VARIANT_DEFINITIONS.map(
  (variant) => variant.key,
);

const SUPPORTED_IMAGE_TYPES = [
  {
    extension: "jpg",
    contentType: "image/jpeg",
    mimeTypes: new Set([
      "image/jpeg",
      "image/pjpeg",
      "image/jpg",
      "image/jfif",
    ]),
    matches(buffer) {
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    },
  },
  {
    extension: "png",
    contentType: "image/png",
    mimeTypes: new Set(["image/png", "image/x-png"]),
    matches(buffer) {
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    },
  },
  {
    extension: "gif",
    contentType: "image/gif",
    mimeTypes: new Set(["image/gif"]),
    matches(buffer) {
      const signature = buffer.toString("ascii", 0, 6);
      return signature === "GIF87a" || signature === "GIF89a";
    },
  },
  {
    extension: "webp",
    contentType: "image/webp",
    mimeTypes: new Set(["image/webp", "image/x-webp"]),
    matches(buffer) {
      return (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    },
  },
];

const SUPPORTED_VIDEO_TYPES = [
  {
    extension: "mp4",
    contentType: "video/mp4",
    mimeTypes: new Set(["video/mp4", "video/quicktime"]),
    matches(buffer) {
      if (buffer.length < 12 || buffer.toString("ascii", 4, 8) !== "ftyp") {
        return false;
      }

      const majorBrand = buffer.toString("ascii", 8, 12);
      return new Set([
        "isom",
        "iso2",
        "avc1",
        "mp41",
        "mp42",
        "M4V ",
        "MSNV",
        "qt  ",
      ]).has(majorBrand);
    },
  },
  {
    extension: "webm",
    contentType: "video/webm",
    mimeTypes: new Set(["video/webm"]),
    matches(buffer) {
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );
    },
  },
];

export function detectUploadedFileType(file, kind) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new HttpError(400, `No ${kind} file uploaded`);
  }

  const supportedTypes =
    kind === "image" ? SUPPORTED_IMAGE_TYPES : SUPPORTED_VIDEO_TYPES;
  const detectedType = supportedTypes.find((type) => type.matches(file.buffer));

  if (!detectedType) {
    throw new HttpError(400, `Unsupported ${kind} file type`);
  }

  return detectedType;
}

export function buildStorageObjectPath(prefix, extension) {
  const normalizedPrefix = String(prefix || "").replace(/^\/+|\/+$/g, "");
  const filename = `${randomUUID()}.${extension}`;

  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

function buildStorageVariantObjectPath(prefix, variantKey) {
  const normalizedPrefix = String(prefix || "").replace(/^\/+|\/+$/g, "");
  const filename = `${randomUUID()}-${variantKey}.webp`;

  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename;
}

export function withTimeout(promise, timeoutMs, label) {
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

export async function createOptimizedImageVariants(buffer) {
  try {
    const image = sharp(buffer, {
      limitInputPixels: 40_000_000,
    }).rotate();

    const entries = await Promise.all(
      IMAGE_VARIANT_DEFINITIONS.map(async (variant) => {
        const { data, info } = await image
          .clone()
          .resize({
            width: variant.width,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({
            quality: variant.quality,
            effort: 5,
          })
          .toBuffer({ resolveWithObject: true });

        return [
          variant.key,
          {
            buffer: data,
            width: info.width,
            height: info.height,
            bytes: data.length,
          },
        ];
      }),
    );

    return Object.fromEntries(entries);
  } catch {
    throw new HttpError(400, "Unable to optimize uploaded image");
  }
}

export async function uploadImageVariantsToStorage({
  supabase,
  bucketName,
  prefix,
  sourceBuffer,
  cacheControl = "31536000",
  timeoutMs = 30_000,
  uploadObject = uploadPublicMediaObject,
  deleteObject = deletePublicMediaObject,
}) {
  const variantOutputs = await createOptimizedImageVariants(sourceBuffer);
  const uploads = await Promise.allSettled(
    Object.entries(variantOutputs).map(async ([variantKey, variant]) => {
      const objectPath = buildStorageVariantObjectPath(prefix, variantKey);
      const uploaded = await withTimeout(
        uploadObject({
          supabase,
          bucketName,
          objectPath,
          body: variant.buffer,
          contentType: "image/webp",
          cacheControl,
          upsert: false,
        }),
        timeoutMs,
        `Media ${variantKey} image upload`,
      );

      return {
        key: variantKey,
        value: {
          url: uploaded.publicUrl,
          width: variant.width,
          height: variant.height,
          bytes: variant.bytes,
        },
      };
    }),
  );

  const failedUpload = uploads.find((result) => result.status === "rejected");

  if (failedUpload) {
    await Promise.allSettled(
      uploads
        .filter((result) => result.status === "fulfilled")
        .map((result) =>
          deleteObject({
            supabase,
            bucketName,
            publicUrl: result.value.value.url,
            resourceType: "image",
          }),
        ),
    );

    throw failedUpload.reason;
  }

  const variants = {};

  for (const result of uploads) {
    variants[result.value.key] = result.value.value;
  }

  return variants;
}

export function extractPublicObjectPath(publicUrl, bucketName) {
  return (
    extractCloudinaryPublicObjectPath(publicUrl, bucketName) ||
    extractConfiguredPublicObjectPath(publicUrl, bucketName) ||
    extractSupabasePublicObjectPath(publicUrl, bucketName)
  );
}
