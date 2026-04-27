interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr?: number;
  size?: string;
  is_sold?: boolean;
  for_sale?: boolean;
}

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

export default function ArtworkModal({ artwork, onClose }: Props) {
  if (!artwork) return null;

  const usd = artwork.price_inr ? (artwork.price_inr / 83).toFixed(0) : null;

  const whatsappMessage = encodeURIComponent(
    artwork.for_sale && artwork.price_inr
      ? `Hello, I'm interested in "${artwork.title}" priced at INR ${artwork.price_inr}.`
      : `Hello, I'm interested in "${artwork.title}".`,
  );

  const whatsappLink = `https://wa.me/8100135695?text=${whatsappMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 bg-black/45 px-4 text-sm text-white transition hover:bg-black/65"
        >
          Close
        </button>

        <div className="relative flex items-center justify-center bg-black p-4 sm:p-6 lg:p-8">
          <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:max-h-[78vh] lg:object-contain"
            />
          </div>

          {artwork.is_sold && (
            <span className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1 text-sm text-white sm:left-6 sm:top-6">
              Collected
            </span>
          )}
        </div>

        <div className="flex flex-col justify-between p-5 sm:p-6 lg:p-8">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
              Artwork Detail
            </p>
            <h2 className="mt-4 break-words font-display text-3xl font-bold text-white sm:text-4xl">
              {artwork.title}
            </h2>

            {artwork.description && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {artwork.description}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {artwork.price_inr && artwork.for_sale && (
                <div className="border border-white/10 bg-zinc-950/60 p-4">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Price
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    INR {artwork.price_inr.toLocaleString()}
                  </p>
                  {usd && <p className="mt-1 text-sm text-zinc-400">${usd} USD</p>}
                </div>
              )}

              {artwork.size && (
                <div className="border border-white/10 bg-zinc-950/60 p-4">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Size
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">{artwork.size}</p>
                </div>
              )}
            </div>

            {!artwork.for_sale && !artwork.is_sold && (
              <p className="mt-4 text-sm text-zinc-400">Available on inquiry.</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!artwork.is_sold && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 font-medium text-black transition hover:bg-emerald-400"
              >
                Buy on WhatsApp
              </a>
            )}

            <button
              onClick={onClose}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-zinc-700 px-5 py-3 text-white transition hover:bg-zinc-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
