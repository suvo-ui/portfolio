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
}

interface GalleryCategory {
  name: string;
  artworks: Artwork[];
}

interface GallerySectionProps {
  category: GalleryCategory;
  initialCount?: number;
  isAdmin?: boolean;
  onDeleteArtwork?: (id: number) => void;
}

export function GallerySection({
  category,
  initialCount = 2,
  isAdmin = false,
  onDeleteArtwork,
}: GallerySectionProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedArtworks = expanded
    ? category.artworks
    : category.artworks.slice(0, initialCount);

  if (!category.artworks || category.artworks.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              {category.name}
            </h2>
          </div>

          {category.artworks.length > initialCount && (
            <Button
              variant="outline"
              className="self-start md:self-auto group"
              onClick={() => setExpanded(!expanded)}>
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

        {/* Artwork Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedArtworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className={cn(
                "opacity-0 animate-fade-in",
                `[animation-delay:${index * 100}ms]`,
              )}
              style={{ animationDelay: `${index * 100}ms` }}>
              <ArtworkCard
                artwork={artwork}
                priority={index < 2}
                isAdmin={isAdmin}
                onDelete={(id) => {
                  if (onDeleteArtwork) onDeleteArtwork(id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
