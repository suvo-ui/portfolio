import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

import { HttpError } from "./http.js";

const R2_DRIVER = "r2";
const B2_DRIVER = "b2";
const CLOUDINARY_DRIVER = "cloudinary";
const DEFAULT_DRIVER = "supabase";

const s3CompatibleClients = new Map();
let cloudinaryConfigured = false;

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/g, "");
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new HttpError(500, `${name} is not configured`);
  }

  return value;
}

export function getMediaStorageDriver() {
  return (
    process.env.MEDIA_STORAGE_DRIVER?.trim().toLowerCase() || DEFAULT_DRIVER
  );
}

export function isS3CompatibleMediaStorageEnabled() {
  return [R2_DRIVER, B2_DRIVER].includes(getMediaStorageDriver());
}

export function isExternalMediaStorageEnabled() {
  return [R2_DRIVER, B2_DRIVER, CLOUDINARY_DRIVER].includes(
    getMediaStorageDriver(),
  );
}

export function isCloudinaryMediaStorageEnabled() {
  return getMediaStorageDriver() === CLOUDINARY_DRIVER;
}

function parseB2Region(endpoint) {
  try {
    const { hostname } = new URL(endpoint);
    const match = hostname.match(/^s3[.-]([a-z0-9-]+)\.backblazeb2\.com$/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function getS3CompatibleConfig(driver = getMediaStorageDriver()) {
  if (driver === B2_DRIVER) {
    const endpoint = trimTrailingSlash(requireEnv("B2_S3_ENDPOINT"));
    const region = process.env.B2_REGION?.trim() || parseB2Region(endpoint);

    if (!region) {
      throw new HttpError(500, "B2_REGION is not configured");
    }

    return {
      driver: B2_DRIVER,
      endpoint,
      region,
      accessKeyId:
        process.env.B2_APPLICATION_KEY_ID?.trim() || requireEnv("B2_KEY_ID"),
      secretAccessKey: requireEnv("B2_APPLICATION_KEY"),
      bucketName: requireEnv("B2_BUCKET_NAME"),
      publicBaseUrl: trimTrailingSlash(requireEnv("B2_PUBLIC_BASE_URL")),
    };
  }

  const accountId = requireEnv("R2_ACCOUNT_ID");
  const publicBaseUrl = trimTrailingSlash(requireEnv("R2_PUBLIC_BASE_URL"));

  return {
    driver: R2_DRIVER,
    accountId,
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: requireEnv("R2_BUCKET_NAME"),
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    publicBaseUrl,
  };
}

function getS3CompatibleClient(driver = getMediaStorageDriver()) {
  if (!s3CompatibleClients.has(driver)) {
    const config = getS3CompatibleConfig(driver);
    s3CompatibleClients.set(
      driver,
      new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
    );
  }

  return s3CompatibleClients.get(driver);
}

function configureCloudinary() {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    cloudinaryConfigured = true;
  }
}

export function buildProviderObjectKey(bucketName, objectPath) {
  const bucketPrefix = trimSlashes(bucketName);
  const normalizedObjectPath = trimSlashes(objectPath);

  return bucketPrefix
    ? `${bucketPrefix}/${normalizedObjectPath}`
    : normalizedObjectPath;
}

export function getConfiguredPublicUrlForKey(objectKey) {
  if (isCloudinaryMediaStorageEnabled()) {
    return null;
  }

  const { publicBaseUrl } = getS3CompatibleConfig();
  const normalizedKey = trimSlashes(objectKey)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${publicBaseUrl}/${normalizedKey}`;
}

function getCloudinaryResourceType(contentType) {
  if (contentType?.startsWith("video/")) return "video";
  if (contentType?.startsWith("image/")) return "image";
  return "raw";
}

function stripFileExtension(value) {
  return String(value || "").replace(/\.[^/.]+$/, "");
}

function uploadBufferToCloudinary({ objectKey, buffer, contentType }) {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadMethod =
      contentType?.startsWith("video/") && buffer.length > 9_500_000
        ? cloudinary.uploader.upload_chunked_stream
        : cloudinary.uploader.upload_stream;
    const stream = uploadMethod.call(
      cloudinary.uploader,
      {
        public_id: stripFileExtension(objectKey),
        resource_type: getCloudinaryResourceType(contentType),
        chunk_size: 6_000_000,
        overwrite: true,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (result?.done === false) {
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

function deleteCloudinaryObject({ objectKey, resourceType }) {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      stripFileExtension(objectKey),
      {
        resource_type: resourceType || "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );
  });
}

export function extractCloudinaryPublicObjectPath(publicUrl, bucketName) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  if (!cloudName) {
    return null;
  }

  try {
    const url = new URL(publicUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    if (url.hostname !== "res.cloudinary.com" || uploadIndex === -1) {
      return null;
    }

    if (segments[0] !== cloudName) {
      return null;
    }

    const publicIdSegments = segments.slice(uploadIndex + 1);

    while (publicIdSegments[0]?.includes("_")) {
      publicIdSegments.shift();
    }

    if (/^v\d+$/.test(publicIdSegments[0] || "")) {
      publicIdSegments.shift();
    }

    const publicId = stripFileExtension(publicIdSegments.join("/"));
    const bucketPrefix = trimSlashes(bucketName);
    const expectedPrefix = bucketPrefix ? `${bucketPrefix}/` : "";

    if (expectedPrefix && !publicId.startsWith(expectedPrefix)) {
      return null;
    }

    return expectedPrefix
      ? publicId.slice(expectedPrefix.length) || null
      : publicId || null;
  } catch {
    return null;
  }
}

function extractConfiguredPublicObjectInfo(publicUrl, bucketName) {
  const candidates = [
    {
      driver: B2_DRIVER,
      publicBaseUrl: process.env.B2_PUBLIC_BASE_URL?.trim(),
    },
    {
      driver: R2_DRIVER,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.trim(),
    },
  ].filter((candidate) => candidate.publicBaseUrl);

  try {
    for (const candidate of candidates) {
      const url = new URL(publicUrl);
      const baseUrl = new URL(candidate.publicBaseUrl);

      if (url.origin !== baseUrl.origin) {
        continue;
      }

      const basePath = trimSlashes(baseUrl.pathname);
      const fullPath = decodeURIComponent(trimSlashes(url.pathname));
      const relativePath =
        basePath && fullPath.startsWith(`${basePath}/`)
          ? fullPath.slice(basePath.length + 1)
          : basePath
            ? null
            : fullPath;

      if (!relativePath) {
        continue;
      }

      const bucketPrefix = trimSlashes(bucketName);
      const expectedPrefix = bucketPrefix ? `${bucketPrefix}/` : "";

      let objectPath = null;

      if (expectedPrefix) {
        if (relativePath.startsWith(expectedPrefix)) {
          objectPath = relativePath.slice(expectedPrefix.length);
        } else if (basePath.endsWith(expectedPrefix.slice(0, -1))) {
          objectPath = relativePath;
        }
      } else {
        objectPath = relativePath;
      }

      if (objectPath) {
        return {
          driver: candidate.driver,
          objectPath,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function extractConfiguredPublicObjectPath(publicUrl, bucketName) {
  return (
    extractConfiguredPublicObjectInfo(publicUrl, bucketName)?.objectPath || null
  );
}

export function extractSupabasePublicObjectPath(publicUrl, bucketName) {
  try {
    const url = new URL(publicUrl);
    const configuredSupabaseUrl = process.env.SUPABASE_URL?.trim();

    if (configuredSupabaseUrl) {
      const supabaseUrl = new URL(configuredSupabaseUrl);
      if (url.host !== supabaseUrl.host) {
        return null;
      }
    }

    const bucketSegment = encodeURIComponent(bucketName);
    const prefix = `/storage/v1/object/public/${bucketSegment}/`;

    if (!url.pathname.startsWith(prefix)) {
      return null;
    }

    const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
    return objectPath || null;
  } catch {
    return null;
  }
}

export async function uploadPublicMediaObject({
  supabase,
  bucketName,
  objectPath,
  body,
  contentType,
  cacheControl,
  upsert = false,
}) {
  if (!body) {
    throw new HttpError(500, "Media upload body is required");
  }

  const isBuffer = Buffer.isBuffer(body);
  const objectKey = buildProviderObjectKey(bucketName, objectPath);

  if (isCloudinaryMediaStorageEnabled()) {
    if (!isBuffer) {
      throw new HttpError(500, "Cloudinary upload requires a buffer payload");
    }

    const result = await uploadBufferToCloudinary({
      objectKey,
      buffer: body,
      contentType,
    });

    if (!result?.secure_url) {
      throw new HttpError(502, "Cloudinary upload failed");
    }

    return {
      driver: CLOUDINARY_DRIVER,
      objectPath,
      objectKey: result.public_id || stripFileExtension(objectKey),
      publicUrl: result.secure_url,
    };
  }

  if (isS3CompatibleMediaStorageEnabled()) {
    const config = getS3CompatibleConfig();

    await getS3CompatibleClient().send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl
          ? `public, max-age=${cacheControl}`
          : undefined,
      }),
    );

    return {
      driver: config.driver,
      objectPath,
      objectKey,
      publicUrl: getConfiguredPublicUrlForKey(objectKey),
    };
  }

  if (!supabase) {
    throw new HttpError(500, "Supabase storage client is not configured");
  }

  const uploadBody = isBuffer ? body : await streamToBuffer(body);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, uploadBody, {
      contentType,
      cacheControl,
      upsert,
    });

  if (error) {
    throw new HttpError(502, error.message || "Media upload failed");
  }

  return {
    driver: DEFAULT_DRIVER,
    objectPath,
    objectKey: objectPath,
    publicUrl: supabase.storage.from(bucketName).getPublicUrl(objectPath).data
      .publicUrl,
  };
}

export async function deletePublicMediaObject({
  supabase,
  bucketName,
  publicUrl,
  resourceType = "image",
}) {
  if (!publicUrl) {
    return { deleted: false, reason: "empty_url" };
  }

  const configuredObjectInfo = extractConfiguredPublicObjectInfo(
    publicUrl,
    bucketName,
  );

  if (configuredObjectInfo) {
    const config = getS3CompatibleConfig(configuredObjectInfo.driver);
    const objectKey = buildProviderObjectKey(
      bucketName,
      configuredObjectInfo.objectPath,
    );

    await getS3CompatibleClient(config.driver).send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
      }),
    );

    return {
      deleted: true,
      driver: config.driver,
      objectPath: configuredObjectInfo.objectPath,
      objectKey,
    };
  }

  const cloudinaryObjectPath = extractCloudinaryPublicObjectPath(
    publicUrl,
    bucketName,
  );

  if (cloudinaryObjectPath) {
    const objectKey = buildProviderObjectKey(bucketName, cloudinaryObjectPath);
    await deleteCloudinaryObject({ objectKey, resourceType });

    return {
      deleted: true,
      driver: CLOUDINARY_DRIVER,
      objectPath: cloudinaryObjectPath,
      objectKey,
    };
  }

  if (supabase) {
    const supabaseObjectPath = extractSupabasePublicObjectPath(
      publicUrl,
      bucketName,
    );

    if (supabaseObjectPath) {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([supabaseObjectPath]);

      if (error) {
        throw new HttpError(error.statusCode || 502, error.message);
      }

      return {
        deleted: true,
        driver: DEFAULT_DRIVER,
        objectPath: supabaseObjectPath,
        objectKey: supabaseObjectPath,
      };
    }
  }

  return { deleted: false, reason: "unrecognized_url" };
}

export function getSupabasePublicUrl(supabase, bucketName, objectPath) {
  return supabase.storage.from(bucketName).getPublicUrl(objectPath).data
    .publicUrl;
}

function isReadableStream(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.pipe === "function" &&
    typeof value.readable !== "undefined"
  );
}

async function streamToBuffer(stream) {
  if (!isReadableStream(stream)) {
    throw new HttpError(500, "Expected a readable stream for upload");
  }

  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
