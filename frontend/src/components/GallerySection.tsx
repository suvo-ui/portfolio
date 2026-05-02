import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { ArtworkPreviewCarousel } from "@/components/ArtworkPreviewCarousel";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Button } from "@/components/ui/button";
/* import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; */

interface Artwork {
  id: number;
  title: string;
  image_url: string;
  description?: string;
  price_inr?: number;
  is_sold?: boolean;
  for_sale?: boolean;
}

interface GalleryCategory {
  name: string;
  artworks: Artwork[];
  eyebrow?: string;
  description?: string;
}

interface GallerySectionProps {
  category: GalleryCategory;
  initialCount?: number;
  isAdmin?: boolean;
  sectionIndex?: number;
  onDeleteArtwork?: (id: number) => void;
  onOpenArtwork?: (artwork: Artwork) => void;
  onEditArtwork?: (artwork: Artwork) => void;
  onSeeMore?: (artworks: Artwork[]) => void;
}

export function GallerySection({
  category,
  initialCount = 4,
  isAdmin = false,
  onDeleteArtwork,
  onOpenArtwork,
  onEditArtwork,
  onSeeMore,
}: GallerySectionProps) {
  // const [showGalleryModal, setShowGalleryModal] = useState(false);

  const visibleArtworks = useMemo(
    () => category.artworks.slice(0, initialCount),
    [category.artworks, initialCount],
  );
  const hasOverflow = category.artworks.length > visibleArtworks.length;

  if (!category.artworks || category.artworks.length === 0) return null;

  // const sectionNumber = String(sectionIndex + 1).padStart(2, "0");

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/55 p-4 shadow-[0_24px_80px_hsl(0_0%_0%/0.2)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_28%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
            <div className="hidden w-28 lg:block">
              {/* <p className="font-display text-7xl leading-none text-primary/18 xl:text-8xl">
                {sectionNumber}
              </p> */}
              <div className="mt-4 h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
              {category.eyebrow && (
                <p className="mt-4 font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                  {category.eyebrow}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 lg:hidden">
                    {/* <span className="mobile-eyebrow text-primary">
                      {sectionNumber}
                    </span> */}
                    {category.eyebrow && (
                      <span className="mobile-label text-primary">
                        {category.eyebrow}
                      </span>
                    )}
                  </div>

                  <h2 className="mobile-section-title mt-4 text-foreground">
                    {category.name}
                  </h2>

                  {category.description && (
                    <p className="mobile-body-copy mt-4 max-w-2xl text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>

                {hasOverflow && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full lg:w-auto"
                    onClick={() => onSeeMore?.(category.artworks)}
                  >
                    See More
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {hasOverflow ? (
                <ArtworkPreviewCarousel
                  items={category.artworks}
                  isAdmin={isAdmin}
                  onDelete={onDeleteArtwork}
                  onOpen={onOpenArtwork}
                  onEdit={onEditArtwork}
                />
              ) : (
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {visibleArtworks.map((artwork, index) => (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={artwork}
                      priority={index < 2}
                      isAdmin={isAdmin}
                      onDelete={(id) => onDeleteArtwork?.(id)}
                      onOpen={onOpenArtwork}
                      onEdit={onEditArtwork}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <Dialog open={showGalleryModal} onOpenChange={setShowGalleryModal}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{category.name}</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {category.artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                isAdmin={isAdmin}
                onDelete={(id) => onDeleteArtwork?.(id)}
                onOpen={onOpenArtwork}
                onEdit={(artwork) => {
                  setShowGalleryModal(false);
                  setTimeout(() => {
                    onEditArtwork?.(artwork);
                  }, 50);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog> */}
    </section>
  );
}
