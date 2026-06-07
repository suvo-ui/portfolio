import { IMAGE_VARIANT_KEYS } from "./storage.js";

export function getImageVariantUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.url === "string") {
    return value.url;
  }

  return null;
}

export function getImageVariantMetadata(value) {
  const url = getImageVariantUrl(value);

  if (!url) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return { url };
  }

  const width = Number(value.width);
  const height = Number(value.height);
  const bytes = Number(value.bytes);

  return {
    url,
    ...(Number.isFinite(width) && width > 0 ? { width } : {}),
    ...(Number.isFinite(height) && height > 0 ? { height } : {}),
    ...(Number.isFinite(bytes) && bytes > 0 ? { bytes } : {}),
  };
}

export function collectImageVariantUrls(variants) {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return [];
  }

  return IMAGE_VARIANT_KEYS.map((key) => getImageVariantUrl(variants[key]))
    .filter(Boolean);
}

export function collectStoredImageUrls(record) {
  const urls = new Set();

  if (record?.image_url) {
    urls.add(record.image_url);
  }

  for (const url of collectImageVariantUrls(record?.image_variants)) {
    urls.add(url);
  }

  return [...urls];
}

export function getPreferredImageVariantUrl(variants, preferred = "large") {
  return (
    getImageVariantUrl(variants?.[preferred]) ||
    getImageVariantUrl(variants?.large) ||
    getImageVariantUrl(variants?.card) ||
    getImageVariantUrl(variants?.thumb) ||
    null
  );
}

export function hasCompleteImageVariantMetadata(variants) {
  if (!variants || typeof variants !== "object" || Array.isArray(variants)) {
    return false;
  }

  return IMAGE_VARIANT_KEYS.every((key) => {
    const metadata = getImageVariantMetadata(variants[key]);
    return (
      Boolean(metadata?.url) &&
      Number.isFinite(metadata.width) &&
      Number.isFinite(metadata.height) &&
      Number.isFinite(metadata.bytes)
    );
  });
}
