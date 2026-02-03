import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
}

interface ArtworkCardProps {
  artwork: Artwork;
  priority?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}

export function ArtworkCard({
  artwork,
  priority = false,
  isAdmin = false,
  onDelete,
}: ArtworkCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this artwork?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${artwork.id}`,
        {
          method: "DELETE",
        },
      );

      if (onDelete) onDelete(artwork.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete artwork");
    }
  };

  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className="group relative block overflow-hidden rounded-xl bg-zinc-900">
      {/* Image */}
      <img
        src={artwork.image_url}
        alt={artwork.title}
        loading={priority ? "eager" : "lazy"}
        className={cn(
          "h-full w-full object-cover transition-transform duration-500",
          "group-hover:scale-105",
        )}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="text-white text-lg font-medium">{artwork.title}</h3>
        {artwork.description && (
          <p className="text-zinc-300 text-sm line-clamp-2">
            {artwork.description}
          </p>
        )}
      </div>

      {/* DELETE BUTTON (Admin Only) */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition">
          Delete
        </button>
      )}
    </Link>
  );
}
