export interface ImageVariants {
  thumb?: string | null;
  card?: string | null;
  large?: string | null;
}

export type ImageVariantKey = keyof ImageVariants;

const IMAGE_VARIANT_WIDTHS: Record<ImageVariantKey, number> = {
  thumb: 360,
  card: 900,
  large: 1800,
};

export function selectImageVariant(
  fallbackSrc: string,
  variants?: ImageVariants | null,
  preferred: ImageVariantKey = "large",
) {
  return variants?.[preferred] || fallbackSrc;
}

export function buildImageSrcSet(variants?: ImageVariants | null) {
  if (!variants) return undefined;

  const entries = (Object.keys(IMAGE_VARIANT_WIDTHS) as ImageVariantKey[])
    .map((key) => {
      const src = variants[key];
      return src ? `${src} ${IMAGE_VARIANT_WIDTHS[key]}w` : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return undefined;

  return entries.join(", ");
}
