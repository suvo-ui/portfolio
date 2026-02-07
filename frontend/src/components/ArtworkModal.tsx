interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr?: number;
  is_sold?: boolean;
}

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

export default function ArtworkModal({ artwork, onClose }: Props) {
  if (!artwork) return null;

  const usd = artwork.price_inr
    ? (artwork.price_inr / 83).toFixed(0)
    : null;

  const whatsappMessage = encodeURIComponent(
    `Hello, I'm interested in "${artwork.title}" priced at ₹${artwork.price_inr}.`
  );

  const whatsappLink = `https://wa.me/8100135695?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative">
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full max-h-[70vh] object-contain bg-black"
          />

          {/* SOLD BADGE */}
          {artwork.is_sold && (
            <span className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm">
              Sold
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{artwork.title}</h2>

          {artwork.description && (
            <p className="text-zinc-400 mb-4">{artwork.description}</p>
          )}

          {/* Price */}
          {artwork.price_inr && (
            <div className="text-lg font-semibold mb-4">
              ₹{artwork.price_inr.toLocaleString()}
              {usd && (
                <span className="text-zinc-400 ml-3">
                  (${usd} USD)
                </span>
              )}
            </div>
          )}

          {/* BUY BUTTON */}
          {!artwork.is_sold && (
            <a
              href={whatsappLink}
              target="_blank"
              className="inline-block bg-emerald-500 text-black px-5 py-2 rounded-lg font-medium hover:bg-emerald-400 transition"
            >
              Buy on WhatsApp
            </a>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-3 px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
