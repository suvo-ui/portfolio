import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { ArtworkCard } from "./ArtworkCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Artwork {
  id: number;
  title: string;
  image_url: string;
  description?: string;
  price_inr?: number;
  is_sold?: boolean;
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
}

export function GallerySection({
  category,
  initialCount = 3,
  isAdmin = false,
  sectionIndex = 0,
  onDeleteArtwork,
  onOpenArtwork,
}: GallerySectionProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedArtworks = expanded
    ? category.artworks
    : category.artworks.slice(0, initialCount);

  if (!category.artworks || category.artworks.length === 0) return null;

  const sectionNumber = String(sectionIndex + 1).padStart(2, "0");
  const useEditorialLayout = !expanded && displayedArtworks.length >= 3;
  const leadArtwork = useEditorialLayout ? displayedArtworks[0] : null;
  const supportingArtworks = useEditorialLayout ? displayedArtworks.slice(1, 3) : displayedArtworks;

  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/60 p-6 shadow-[0_24px_80px_hsl(0_0%_0%/0.2)] backdrop-blur-sm md:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_28%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[160px_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <p className="font-display text-7xl leading-none text-primary/18 md:text-8xl">
                {sectionNumber}
              </p>
              <div className="h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
              {category.eyebrow && (
                <p className="font-display text-xs uppercase tracking-[0.34em] text-primary">
                  {category.eyebrow}
                </p>
              )}
            </div>

            <div>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="font-display text-3xl font-bold leading-[1.02] text-foreground md:text-4xl lg:text-5xl">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {category.description}
                    </p>
                  )}
                </div>

                {category.artworks.length > initialCount && (
                  <Button
                    variant="outline"
                    className="group self-start md:self-auto"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Show Less" : "See More"}
                    <ArrowRight
                      className={cn(
                        "ml-2 h-4 w-4 transition-transform",
                        expanded ? "rotate-90" : "group-hover:translate-x-1",
                      )}
                    />
                  </Button>
                )}
              </div>

              <div className="mt-10">
                {useEditorialLayout && leadArtwork ? (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                    <div className="opacity-0 animate-fade-in">
                      <ArtworkCard
                        artwork={leadArtwork}
                        priority
                        featured
                        isAdmin={isAdmin}
                        onDelete={(id) => onDeleteArtwork?.(id)}
                        onOpen={onOpenArtwork}
                      />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                      {supportingArtworks.map((artwork, index) => (
                        <div
                          key={artwork.id}
                          className="opacity-0 animate-fade-in"
                          style={{ animationDelay: `${(index + 1) * 120}ms` }}
                        >
                          <ArtworkCard
                            artwork={artwork}
                            isAdmin={isAdmin}
                            onDelete={(id) => onDeleteArtwork?.(id)}
                            onOpen={onOpenArtwork}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {displayedArtworks.map((artwork, index) => (
                      <div
                        key={artwork.id}
                        className="opacity-0 animate-fade-in"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <ArtworkCard
                          artwork={artwork}
                          priority={index < 2}
                          isAdmin={isAdmin}
                          onDelete={(id) => onDeleteArtwork?.(id)}
                          onOpen={onOpenArtwork}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
