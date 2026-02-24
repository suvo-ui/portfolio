import { cn } from "@/lib/utils";

export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  price_inr?: number;
  is_sold?: boolean;
}

interface ArtworkCardProps {
  artwork: Artwork;
  priority?: boolean;
  onOpen?: (artwork: Artwork) => void;
}

export function ArtworkCard({
  artwork,
  priority = false,
  onOpen,
}: ArtworkCardProps) {
  return (
    <div onClick={() => onOpen?.(artwork)} className="group cursor-pointer">
      {/* Fixed Aspect Ratio (no background color) */}
      <div className="w-full aspect-[4/5] flex items-center justify-center">
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "max-h-[85%] max-w-[85%] object-contain",
            "transition duration-500 ease-out",
            "group-hover:scale-[1.02]",
          )}
        />
      </div>

      {/* Text Info */}
      <div className="mt-6 text-center space-y-1">
        <h3 className="text-sm tracking-[0.2em] uppercase text-white">
          {artwork.title}
        </h3>

        {artwork.price_inr && (
          <p className="text-xs text-zinc-400 tracking-wide">
            ₹{artwork.price_inr.toLocaleString()}
          </p>
        )}

        {artwork.is_sold && (
          <p className="text-xs text-red-500 tracking-wider">Sold</p>
        )}
      </div>
    </div>
  );
}
