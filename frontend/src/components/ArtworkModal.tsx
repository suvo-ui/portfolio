import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { apiUrl } from "@/lib/api";

interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr?: number;
  size?: string;
  is_sold?: boolean;
  for_sale?: boolean;
  available_for_print?: boolean;
}

interface Props {
  artwork: Artwork | null;
  isAdmin?: boolean;
  onClose: () => void;
  onSave?: (artwork: Artwork) => void;
}

export default function ArtworkModal({
  artwork,
  onClose,
  isAdmin = false,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_inr: "",
    size: "",
    image_url: "",
    for_sale: false,
    available_for_print: false,
  });

  useEffect(() => {
    if (!artwork) return;

    setIsEditing(false);
    setFormData({
      title: artwork.title,
      description: artwork.description ?? "",
      price_inr: artwork.price_inr?.toString() ?? "",
      size: artwork.size ?? "",
      image_url: artwork.image_url,
      for_sale: artwork.for_sale ?? false,
      available_for_print: artwork.available_for_print ?? false,
    });
  }, [artwork]);

  if (!artwork) return null;

  const { addItem, setCartOpen } = useCart();

  const usd = artwork.price_inr ? (artwork.price_inr / 83).toFixed(0) : null;

  const whatsappMessage = encodeURIComponent(
    artwork.for_sale && artwork.price_inr
      ? `Hello, I'm interested in "${artwork.title}" priced at INR ${artwork.price_inr}.`
      : `Hello, I'm interested in "${artwork.title}".`,
  );

  const whatsappLink = `https://wa.me/8100135695?text=${whatsappMessage}`;

  const canAddToCart = Boolean(artwork.price_inr && !artwork.is_sold);

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    addItem({
      id: `artwork-${artwork.id}`,
      type: "artwork",
      title: artwork.title,
      price: artwork.price_inr,
      image_url: artwork.image_url,
    });

    setCartOpen(true);
    onClose();
  };

  const handleSaveArtwork = async () => {
    if (!artwork) return;
    if (formData.for_sale && formData.price_inr.trim() === "") {
      alert("Price is required when artwork is for sale.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        price_inr: formData.price_inr ? Number(formData.price_inr) : null,
        size: formData.size || null,
        for_sale: formData.for_sale,
        available_for_print: formData.available_for_print,
      };

      const response = await fetch(
        apiUrl(`/api/admin/artworks/${artwork.id}`),
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save artwork details.");
      }

      onSave?.(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save artwork:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save artwork details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (
    field: keyof typeof formData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
                  Artwork Detail
                </p>
                <h2 className="mt-4 break-words font-display text-3xl font-bold text-white sm:text-4xl">
                  {artwork.title}
                </h2>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/15"
                    >
                      Edit Artwork
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveArtwork}
                        disabled={isSaving}
                        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-black transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-4 sm:p-6">
                <div className="grid gap-4">
                  <label className="space-y-2 text-sm text-white/80">
                    <span>Title</span>
                    <input
                      value={formData.title}
                      onChange={(event) =>
                        updateFormField("title", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-white/80">
                    <span>Image URL</span>
                    <input
                      value={formData.image_url}
                      onChange={(event) =>
                        updateFormField("image_url", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-white/80">
                      <span>Price (INR)</span>
                      <input
                        type="number"
                        value={formData.price_inr}
                        onChange={(event) =>
                          updateFormField("price_inr", event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-white/80">
                      <span>Size</span>
                      <input
                        value={formData.size}
                        onChange={(event) =>
                          updateFormField("size", event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                      />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-white/80">
                    <span>Description</span>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(event) =>
                        updateFormField("description", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={formData.for_sale}
                        onChange={(event) =>
                          updateFormField("for_sale", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-white/20 bg-black"
                      />
                      For sale
                    </label>
                    <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={formData.available_for_print}
                        onChange={(event) =>
                          updateFormField(
                            "available_for_print",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-white/20 bg-black"
                      />
                      Available for print
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                      {usd && (
                        <p className="mt-1 text-sm text-zinc-400">${usd} USD</p>
                      )}
                    </div>
                  )}

                  {artwork.size && (
                    <div className="border border-white/10 bg-zinc-950/60 p-4">
                      <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                        Size
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {artwork.size}
                      </p>
                    </div>
                  )}
                </div>

                {!artwork.for_sale && !artwork.is_sold && (
                  <p className="mt-4 text-sm text-zinc-400">
                    Available on inquiry.
                  </p>
                )}
              </>
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
              onClick={canAddToCart ? handleAddToCart : onClose}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-zinc-700 px-5 py-3 text-white transition hover:bg-zinc-600"
            >
              {canAddToCart ? "Add to Cart" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
