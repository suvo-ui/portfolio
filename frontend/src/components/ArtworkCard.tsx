import { cn } from "@/lib/utils";
import LazyImage from "@/components/LazyImage";
import { ArrowUpRight, Trash2 } from "lucide-react";

export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  price_inr?: number;
  is_sold?: boolean;
  available_for_print?: boolean;
}

interface ArtworkCardProps {
  artwork: Artwork;
  priority?: boolean;
  isAdmin?: boolean;
  featured?: boolean;
  onOpen?: (artwork: Artwork) => void;
  onDelete?: (id: number) => void;
}

export function ArtworkCard({
  artwork,
  priority = false,
  isAdmin = false,
  featured = false,
  onOpen,
  onDelete,
}: ArtworkCardProps) {
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Delete "${artwork.title}"?`)) {
      onDelete?.(artwork.id);
    }
  };

  const availabilityLabel = artwork.is_sold ? "Collected" : "Available";
  const priceLabel = artwork.price_inr
    ? `INR ${artwork.price_inr.toLocaleString()}`
    : artwork.is_sold
      ? "Collected"
      : "Available on inquiry";

  return (
    <article
      className={cn(
        "group relative overflow-hidden border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] p-4 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_30px_80px_hsl(0_0%_0%/0.28)] sm:p-5",
        featured && "h-full sm:p-6",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute right-4 top-4 z-20 rounded-full border border-red-500/60 bg-red-500/15 p-2 text-red-300 transition-colors hover:bg-red-500/25"
          title="Delete artwork"
        >
          <Trash2 size={16} />
        </button>
      )}

      <div onClick={() => onOpen?.(artwork)} className="cursor-pointer">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden border border-border/50 bg-background/70 p-5",
            featured ? "aspect-[5/4] sm:p-7" : "aspect-[4/5]",
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_48%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-4 top-4 border border-border/60 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground backdrop-blur-sm">
            {availabilityLabel}
          </div>
          <LazyImage
            src={artwork.image_url}
            alt={artwork.title}
            className={cn(
              "relative z-10 max-h-[86%] max-w-[86%] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]",
              featured && "max-h-[88%] max-w-[88%]",
              priority && "will-change-transform",
            )}
          />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary/80">
              {featured ? "Lead Piece" : "Collection Piece"}
            </p>
            <h3
              className={cn(
                "mt-3 font-display text-foreground",
                featured ? "text-3xl leading-none" : "text-2xl leading-none",
              )}
            >
              {artwork.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">{priceLabel}</p>
          </div>

          <span className="inline-flex items-center gap-2 border border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-300 group-hover:border-primary/40 group-hover:text-primary">
            View
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
