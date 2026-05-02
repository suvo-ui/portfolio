import { type MouseEvent } from "react";
import { ArrowUpRight, Edit3, ShoppingCart, Trash2 } from "lucide-react";

import LazyImage from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  price_inr?: number;
  is_sold?: boolean;
  available_for_print?: boolean;
  for_sale?: boolean;
}

interface ArtworkCardProps {
  artwork: Artwork;
  priority?: boolean;
  isAdmin?: boolean;
  featured?: boolean;
  onOpen?: (artwork: Artwork) => void;
  onEdit?: (artwork: Artwork) => void;
  onDelete?: (id: number) => void;
}

export function ArtworkCard({
  artwork,
  priority = false,
  isAdmin = false,
  featured = false,
  onOpen,
  onEdit,
  onDelete,
}: ArtworkCardProps) {
  const { addItem } = useCart();

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();

    if (confirm(`Delete "${artwork.title}"?`)) {
      onDelete?.(artwork.id);
    }
  };

  const handleAddToCart = (event: MouseEvent) => {
    event.stopPropagation();

    if (!artwork.price_inr || artwork.is_sold) return;

    addItem({
      id: `artwork-${artwork.id}`,
      type: "artwork",
      title: artwork.title,
      price: artwork.price_inr,
      image_url: artwork.image_url,
    });
  };

  // const availabilityLabel = artwork.is_sold ? "Collected" : "Available";
  const priceLabel =
    artwork.price_inr !== null && artwork.price_inr !== undefined
      ? `INR ${artwork.price_inr.toLocaleString()}`
      : artwork.is_sold
        ? "Collected"
        : "Available on inquiry";

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_24px_80px_hsl(0_0%_0%/0.22)]",
        featured && "lg:col-span-2",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {isAdmin && (
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(artwork);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/60 bg-primary/15 text-primary transition-colors hover:bg-primary/25"
            title="Edit artwork"
            type="button"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-500/60 bg-red-500/15 text-red-300 transition-colors hover:bg-red-500/25"
            title="Delete artwork"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-col">
        <div
          className={cn(
            "relative aspect-[4/5] cursor-pointer overflow-hidden border-b border-border/50 bg-background/70",
            featured && "lg:aspect-[5/4]",
          )}
          onClick={() => onOpen?.(artwork)}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_48%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
          {artwork.is_sold && (
            <div className="mt-2 text-center">
              <span className="inline-block text-sm font-semibold tracking-wider text-red-500 animate-pulse">
                SOLD OUT
              </span>
            </div>
          )}
          <LazyImage
            src={artwork.image_url}
            alt={artwork.title}
            className={cn(
              "h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]",
              artwork.is_sold && "opacity-70",
              priority && "will-change-transform",
            )}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 sm:gap-4 sm:p-5">
          <div className="min-w-0">
            <p className="mobile-eyebrow text-primary/80">
              {featured ? "Lead Piece" : "Collection Piece"}
            </p>
            <h3
              className={cn(
                "mt-3 break-words font-display font-bold leading-tight text-foreground",
                featured ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl",
              )}
            >
              {artwork.title}
            </h3>
            {artwork.price_inr !== null && artwork.price_inr !== undefined && (
              <p className="mt-3 text-sm text-muted-foreground">{priceLabel}</p>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            {artwork.price_inr && !artwork.is_sold && (
              <Button
                type="button"
                size="default"
                className="h-11 w-full px-4 text-[10px] uppercase tracking-[0.18em]"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            )}

            <button
              type="button"
              onClick={() => onOpen?.(artwork)}
              className={cn(
                "inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border/60 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors",
                !(artwork.price_inr && !artwork.is_sold) && "col-span-2",
              )}
            >
              View Details
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
