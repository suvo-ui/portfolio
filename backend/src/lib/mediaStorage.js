import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

import { HttpError } from "./http.js";

const R2_DRIVER = "r2";
const B2_DRIVER = "b2";
const CLOUDINARY_DRIVER = "cloudinary";
const DEFAULT_DRIVER = "supabase";

let s3CompatibleClient;
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

function getS3CompatibleConfig() {
  if (getMediaStorageDriver() === B2_DRIVER) {
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

function getS3CompatibleClient() {
  if (!s3CompatibleClient) {
    const config = getS3CompatibleConfig();
    s3CompatibleClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3CompatibleClient;
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

export function extractConfiguredPublicObjectPath(publicUrl, bucketName) {
  const publicBaseUrl =
    process.env.B2_PUBLIC_BASE_URL?.trim() ||
    process.env.R2_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return null;
  }

  try {
    const url = new URL(publicUrl);
    const baseUrl = new URL(publicBaseUrl);

    if (url.origin !== baseUrl.origin) {
      return null;
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
      return null;
    }

    const bucketPrefix = trimSlashes(bucketName);
    const expectedPrefix = bucketPrefix ? `${bucketPrefix}/` : "";

    if (expectedPrefix && !relativePath.startsWith(expectedPrefix)) {
      return null;
    }

    return expectedPrefix
      ? relativePath.slice(expectedPrefix.length) || null
      : relativePath;
  } catch {
    return null;
  }
}

export async function uploadPublicMediaObject({
  supabase,
  bucketName,
  objectPath,
  buffer,
  contentType,
  cacheControl,
  upsert = false,
}) {
  if (isCloudinaryMediaStorageEnabled()) {
    const objectKey = buildProviderObjectKey(bucketName, objectPath);
    const result = await uploadBufferToCloudinary({
      objectKey,
      buffer,
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
    const objectKey = buildProviderObjectKey(bucketName, objectPath);
    const config = getS3CompatibleConfig();

    await getS3CompatibleClient().send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
        Body: buffer,
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

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, buffer, {
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

export function getSupabasePublicUrl(supabase, bucketName, objectPath) {
  return supabase.storage.from(bucketName).getPublicUrl(objectPath).data
    .publicUrl;
}
