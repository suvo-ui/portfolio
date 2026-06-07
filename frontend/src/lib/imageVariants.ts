export interface ImageVariantMetadata {
  url: string;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

export type ImageVariantValue = string | ImageVariantMetadata | null;

export interface ImageVariants {
  thumb?: ImageVariantValue;
  card?: ImageVariantValue;
  large?: ImageVariantValue;
}

export type ImageVariantKey = keyof ImageVariants;

const FALLBACK_IMAGE_VARIANT_WIDTHS: Record<ImageVariantKey, number> = {
  thumb: 360,
  card: 900,
  large: 1800,
};

export function getImageVariantUrl(value?: ImageVariantValue) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.url || null;
}

function getImageVariantWidth(key: ImageVariantKey, value?: ImageVariantValue) {
  if (value && typeof value === "object") {
    const width = Number(value.width);
    if (Number.isFinite(width) && width > 0) {
      return Math.round(width);
    }
  }

  return FALLBACK_IMAGE_VARIANT_WIDTHS[key];
}

export function selectImageVariant(
  fallbackSrc: string,
  variants?: ImageVariants | null,
  preferred: ImageVariantKey = "large",
) {
  return getImageVariantUrl(variants?.[preferred]) || fallbackSrc;
}

export function buildImageSrcSet(variants?: ImageVariants | null) {
  if (!variants) return undefined;

  const entries = (
    Object.keys(FALLBACK_IMAGE_VARIANT_WIDTHS) as ImageVariantKey[]
  )
    .map((key) => {
      const src = getImageVariantUrl(variants[key]);
      return src
        ? `${src} ${getImageVariantWidth(key, variants[key])}w`
        : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return undefined;

  return entries.join(", ");
}
