interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr?: number;
  size?: string;        // ⭐ NEW
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

  console.log(artwork.size);

  const whatsappLink = `https://wa.me/8100135695?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== IMAGE SIDE ===== */}
        <div className="bg-black flex items-center justify-center p-6">
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="max-h-[80vh] object-contain"
          />

          {/* SOLD BADGE */}
          {artwork.is_sold && (
            <span className="absolute top-6 left-6 bg-red-600 text-white px-3 py-1 rounded-lg text-sm">
              Sold
            </span>
          )}
        </div>

        {/* ===== DETAILS SIDE ===== */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-3">{artwork.title}</h2>

            {artwork.description && (
              <p className="text-zinc-400 mb-6">{artwork.description}</p>
            )}

            {/* PRICE */}
            {artwork.price_inr && (
              <div className="text-xl font-semibold mb-3">
                ₹{artwork.price_inr.toLocaleString()}
                {usd && (
                  <span className="text-zinc-400 ml-3 text-base">
                    (${usd} USD)
                  </span>
                )}
              </div>
            )}

            {/* ⭐ SIZE DISPLAY */}
            {artwork.size && (
              <div className="text-sm text-zinc-400 mb-6">
                Size: {artwork.size}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            {!artwork.is_sold && (
              <a
                href={whatsappLink}
                target="_blank"
                className="bg-emerald-500 text-black px-5 py-2 rounded-lg font-medium hover:bg-emerald-400 transition"
              >
                Buy on WhatsApp
              </a>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
