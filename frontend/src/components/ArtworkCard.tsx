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
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onOpen?: (artwork: Artwork) => void;
}

export function ArtworkCard({
  artwork,
  priority = false,
  isAdmin = false,
  onDelete,
  onOpen,
}: ArtworkCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this artwork?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${artwork.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      onDelete?.(artwork.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete artwork");
    }
  };

  return (
    <div
      onClick={() => onOpen?.(artwork)}
      className="group relative cursor-pointer overflow-hidden bg-black"
    >
      {/* ===== FIXED PROFESSIONAL FRAME (no negative space) ===== */}
      <div className="w-full aspect-[4/5] overflow-hidden">
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "w-full h-full object-cover",
            "transition-transform duration-700 ease-out",
            "group-hover:scale-105"
          )}
        />
      </div>

      {/* ===== GRADIENT OVERLAY ===== */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* ===== SALE BADGE ===== */}
      <div className="pointer-events-none absolute top-4 left-4 opacity-0 transition duration-500 group-hover:opacity-100">
        {artwork.is_sold ? (
          <span className="bg-red-600/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
            Sold
          </span>
        ) : (
          <span className="bg-emerald-600/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
            Available
          </span>
        )}
      </div>

      {/* ===== TEXT INFO ===== */}
      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="text-white text-lg font-semibold tracking-tight">
          {artwork.title}
        </h3>

        {artwork.description && (
          <p className="text-zinc-300 text-sm mt-1 line-clamp-2">
            {artwork.description}
          </p>
        )}

        {artwork.price_inr && (
          <p className="mt-2 text-white font-medium">
            ₹{artwork.price_inr.toLocaleString()}
            <span className="text-zinc-400 ml-2 text-sm">
              (${(artwork.price_inr / 83).toFixed(0)})
            </span>
          </p>
        )}
      </div>

      {/* ===== ADMIN DELETE ===== */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full opacity-0 transition group-hover:opacity-100"
        >
          Delete
        </button>
      )}
    </div>
  );
}
