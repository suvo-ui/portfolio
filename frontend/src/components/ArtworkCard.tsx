import { Link } from "react-router-dom";
import { Artwork } from "@/types/artwork";
import { cn } from "@/lib/utils";

interface ArtworkCardProps {
  artwork: Artwork;
  className?: string;
  priority?: boolean;
}

export function ArtworkCard({ artwork, className, priority }: ArtworkCardProps) {
  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className={cn(
        "group block relative overflow-hidden hover-lift",
        className
      )}
    >
      <div className="image-reveal aspect-square bg-card">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="w-full h-full object-cover"
          loading={priority ? "eager" : "lazy"}
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content on hover */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <h3 className="font-display text-xl font-semibold text-foreground mb-1">
            {artwork.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {artwork.medium} · {artwork.year}
          </p>
        </div>
      </div>
    </Link>
  );
}
