import { cn } from "@/lib/utils";

export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  price_inr?: number; // ⭐ price support
}

interface ArtworkCardProps {
  artwork: Artwork;
  priority?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onOpen?: (artwork: Artwork) => void; // ⭐ modal open
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
        { method: "DELETE", credentials: "include" }
      );

      onDelete?.(artwork.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete artwork");
    }
  };

  return (
    <div
      onClick={() => onOpen?.(artwork)} // ⭐ open modal instead of routing
      className="group relative block cursor-pointer rounded-xl bg-zinc-900 overflow-hidden transition hover:scale-[1.02]"
    >
      {/* ===== FIXED FRAME (same size for all artworks) ===== */}
      <div className="h-64 bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-center">
        <img
          src={artwork.image_url}
          alt={artwork.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "max-h-full max-w-full object-contain transition-transform duration-500",
            "group-hover:scale-105"
          )}
        />
      </div>

      {/* ===== Hover Overlay ===== */}
      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* ===== Text on Hover ===== */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="text-white text-lg font-medium">{artwork.title}</h3>

        {artwork.description && (
          <p className="text-zinc-300 text-sm line-clamp-2">
            {artwork.description}
          </p>
        )}

        {/* ⭐ PRICE DISPLAY */}
        {artwork.price_inr && (
          <p className="mt-2 text-white font-semibold">
            ₹{artwork.price_inr.toLocaleString()}
            <span className="text-zinc-400 ml-2 text-sm">
              (${(artwork.price_inr / 83).toFixed(0)})
            </span>
          </p>
        )}
      </div>

      {/* ===== Delete Button (Admin Only) ===== */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
        >
          Delete
        </button>
      )}
    </div>
  );
}
