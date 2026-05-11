import { useEffect, useRef, useState } from "react";

import {
  buildImageSrcSet,
  selectImageVariant,
  type ImageVariantKey,
  type ImageVariants,
} from "@/lib/imageVariants";
import { cn } from "@/lib/utils";

const preconnectedHosts = new Set<string>();

function preconnectImageHost(src: string) {
  if (typeof document === "undefined") return;

  try {
    const { origin } = new URL(src);
    if (preconnectedHosts.has(origin)) return;

    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    preconnectedHosts.add(origin);
  } catch {
    // Non-URL image sources still render normally.
  }
}

interface Props {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  imageVariants?: ImageVariants | null;
  variant?: ImageVariantKey;
  responsive?: boolean;
  sizes?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
  fetchPriority?: "high" | "low" | "auto";
}

export default function LazyImage({
  src,
  alt,
  className,
  priority = false,
  imageVariants,
  variant = "large",
  responsive = true,
  sizes,
  loading,
  decoding = "async",
  fetchPriority,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = selectImageVariant(src, imageVariants, variant);
  const resolvedSrcSet = responsive
    ? buildImageSrcSet(imageVariants)
    : undefined;

  useEffect(() => {
    if (resolvedSrc) {
      preconnectImageHost(resolvedSrc);
    }
  }, [resolvedSrc]);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setShouldLoad(priority);
  }, [priority, resolvedSrc]);

  useEffect(() => {
    if (priority || shouldLoad) return;

    const image = imgRef.current;
    if (!image) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(image);

    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  const resolvedFetchPriority = fetchPriority ?? (priority ? "high" : "auto");

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[linear-gradient(110deg,hsl(var(--muted)/0.35)_8%,hsl(var(--muted)/0.65)_18%,hsl(var(--muted)/0.35)_33%)] bg-[length:200%_100%] animate-[shimmer_1.35s_linear_infinite]" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 px-4 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Image unavailable
        </div>
      )}

      <img
        ref={imgRef}
        src={shouldLoad ? resolvedSrc : undefined}
        srcSet={shouldLoad ? resolvedSrcSet : undefined}
        alt={alt}
        sizes={sizes}
        loading={resolvedLoading}
        decoding={decoding}
        fetchPriority={resolvedFetchPriority}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "transition-[opacity,transform,filter] duration-700 ease-out",
          isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
          className,
        )}
      />
    </div>
  );
}
