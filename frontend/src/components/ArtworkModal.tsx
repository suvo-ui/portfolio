import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LazyImage from "@/components/LazyImage";
import { useCart } from "@/context/CartContext";
import { apiUrl } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr?: number;
  size?: string;
  is_sold?: boolean | string | number | null;
  for_sale?: boolean;
  available_for_print?: boolean;
  category?: string;
  category_id?: number;
}

interface Props {
  artwork: Artwork | null;
  itemType?: "artwork" | "print";
  isAdmin?: boolean;
  onClose: () => void;
  onSave?: (artwork: Artwork) => void | Promise<void>;
}

function isTruthyBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export default function ArtworkModal({
  artwork,
  itemType = "artwork",
  onClose,
  isAdmin = false,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_inr: "",
    size: "",
    image_url: "",
    category_id: null as number | null,
    for_sale: false,
    available_for_print: false,
    is_sold: false,
  });

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(apiUrl("/api/categories"));
        if (!response.ok) throw new Error("Failed to load categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!artwork) return;

    setIsEditing(false);
    setFormData({
      title: artwork.title,
      description: artwork.description ?? "",
      price_inr: artwork.price_inr?.toString() ?? "",
      size: artwork.size ?? "",
      image_url: artwork.image_url,
      category_id:
        artwork.category_id ??
        categories.find((category) => category.name === artwork.category)?.id ??
        null,
      for_sale: artwork.for_sale ?? false,
      available_for_print: artwork.available_for_print ?? false,
      is_sold: isTruthyBoolean(artwork.is_sold),
    });
  }, [artwork, categories]);

  const { addItem, setCartOpen } = useCart();

  if (!artwork) return null;

  const usd = artwork.price_inr ? (artwork.price_inr / 83).toFixed(0) : null;

  const effectivePrice = isEditing
    ? formData.price_inr
      ? Number(formData.price_inr)
      : null
    : (artwork.price_inr ?? null);

  const whatsappMessage = encodeURIComponent(
    effectivePrice
      ? `Hello, I'm interested in "${artwork.title}" priced at INR ${effectivePrice}.`
      : `Hello, I'm interested in "${artwork.title}".`,
  );

  const whatsappLink = `https://wa.me/9073357775?text=${whatsappMessage}`;

  const isSold = isTruthyBoolean(artwork.is_sold);
  const canAddToCart = Boolean(effectivePrice && !isSold);
  const canBuy = Boolean(effectivePrice && !isSold);

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    addItem({
      id: `${itemType}-${artwork.id}`,
      type: itemType,
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
      alert(`Price is required when ${itemType} is for sale.`);
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
        category_id: formData.category_id ?? undefined,
        for_sale: formData.for_sale,
        available_for_print: formData.available_for_print,
        is_sold: formData.is_sold,
      };

      const response = await fetch(
        apiUrl(`/api/admin/${itemType}s/${artwork.id}`),
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            itemType === "print"
              ? {
                  title: payload.title,
                  description: payload.description,
                  image_url: payload.image_url,
                  price_inr: payload.price_inr,
                  size: payload.size,
                  category_id: payload.category_id,
                  is_sold: payload.is_sold,
                  for_sale: payload.for_sale,
                }
              : payload,
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Failed to save ${itemType} details.`);
      }

      await onSave?.({
        ...artwork,
        ...data,
        is_sold: formData.is_sold,
        for_sale: formData.for_sale,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(`Failed to save ${itemType}:`, error);
      alert(
        error instanceof Error
          ? error.message
          : `Unable to save ${itemType} details.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormField = (
    field: keyof typeof formData,
    value: string | boolean | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 py-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative
    mx-auto
    grid
    w-full
    max-w-6xl
    overflow-y-auto
    rounded-2xl
    border
    border-white/10
    bg-zinc-900
    shadow-2xl

    max-h-[100dvh]

    lg:max-h-[92vh]
    lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-black/55 px-3 text-sm text-white transition hover:bg-black/70 sm:right-4 sm:top-4 sm:px-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Close
        </motion.button>

        <div className="relative flex items-center justify-center bg-black p-3 sm:p-6 lg:p-8">
          <motion.div
            className="w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              boxShadow: [
                "0 0 0 rgba(255, 255, 255, 0)",
                "0 0 20px rgba(255, 255, 255, 0.1)",
                "0 0 0 rgba(255, 255, 255, 0)",
              ],
            }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              boxShadow: {
                duration: 3,
                repeat: 0,
                ease: "easeInOut",
              },
            }}
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <LazyImage
              src={artwork.image_url}
              alt={artwork.title}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="aspect-[4/5] w-full cursor-pointer object-cover lg:aspect-auto lg:max-h-[78vh] lg:object-contain"
            />
          </motion.div>

          {isSold && (
            <motion.span
              className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1 text-sm text-white sm:left-6 sm:top-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Collected
            </motion.span>
          )}
        </div>

        <div className="flex min-h-0 flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mobile-eyebrow text-primary">
                  {itemType === "print" ? "Print Detail" : "Artwork Detail"}
                </p>
                <h2 className="mt-3 break-words font-display text-2xl font-bold text-white sm:mt-4 sm:text-4xl">
                  {artwork.title}
                </h2>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/15 sm:min-h-12 sm:px-5"
                    >
                      {itemType === "print" ? "Edit Print" : "Edit Artwork"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveArtwork}
                        disabled={isSaving}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-black transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:px-5"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 sm:min-h-12 sm:px-5"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-4 sm:mt-6 sm:p-6">
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-white/80">
                      <span>Category</span>
                      <select
                        value={formData.category_id ?? ""}
                        onChange={(event) =>
                          updateFormField(
                            "category_id",
                            Number(event.target.value) || null,
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary/60"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={formData.for_sale}
                        onChange={(event) => {
                          const checked = event.target.checked;

                          updateFormField("for_sale", checked);

                          // 🔥 FIX: enforce mutual exclusivity
                          if (checked) {
                            updateFormField("is_sold", false);
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-black"
                      />
                      For sale
                    </label>

                    <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={formData.is_sold}
                        onChange={(event) => {
                          const checked = event.target.checked;

                          updateFormField("is_sold", checked);
                          // 🔥 enforce logic
                          if (checked) updateFormField("for_sale", false);
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-black"
                      />
                      Sold Out
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
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
                  <p className="mobile-body-copy mt-4 text-zinc-400 sm:text-base">
                    {artwork.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2">
                  {artwork.price_inr !== null &&
                    artwork.price_inr !== undefined && (
                      <div className="border border-white/10 bg-zinc-950/60 p-3.5 sm:p-4">
                        <p className="mobile-label text-primary">Price</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          INR {artwork.price_inr.toLocaleString()}
                        </p>
                        {usd && (
                          <p className="mt-1 text-sm text-zinc-400">
                            ${usd} USD
                          </p>
                        )}
                      </div>
                    )}

                  {artwork.size && (
                    <div className="border border-white/10 bg-zinc-950/60 p-3.5 sm:p-4">
                      <p className="mobile-label text-primary">Size</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {artwork.size}
                      </p>
                    </div>
                  )}
                </div>

                {!artwork.for_sale && !isSold && (
                  <p className="mt-4 text-sm text-zinc-400">
                    Available on inquiry.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-white/10 bg-zinc-900/96 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* WhatsApp */}
              {canBuy && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="
          inline-flex min-h-12 w-full items-center justify-center
          rounded-xl
          border border-emerald-400/30
          bg-gradient-to-b from-emerald-400 to-emerald-500
          px-5 py-3
          font-semibold
          text-black
          shadow-[0_10px_40px_rgba(16,185,129,0.25)]
          transition-all duration-300
          hover:scale-[1.02]
          hover:from-emerald-300
          hover:to-emerald-400
          hover:shadow-[0_14px_50px_rgba(16,185,129,0.35)]
          active:scale-[0.98]
        "
                >
                  Buy on WhatsApp
                </a>
              )}

              {/* Buy via Email */}
              {canBuy && (
                <button
                  onClick={() => {
                    window.location.href = `/contact?type=purchase&artwork=${encodeURIComponent(
                      artwork.title,
                    )}`;
                  }}
                  className="
          inline-flex min-h-12 w-full items-center justify-center
          rounded-xl
          border border-primary/30
          bg-black/40
          px-5 py-3
          font-medium
          text-primary
          backdrop-blur-xl
          shadow-[0_10px_35px_rgba(255,180,0,0.08)]
          transition-all duration-300
          hover:scale-[1.02]
          hover:border-primary/60
          hover:bg-primary/10
          hover:shadow-[0_14px_50px_rgba(255,180,0,0.12)]
          active:scale-[0.98]
        "
                >
                  Buy via Email
                </button>
              )}

              {/* Add to Cart */}
              <button
                onClick={canAddToCart ? handleAddToCart : onClose}
                className="
        inline-flex min-h-12 w-full items-center justify-center
        rounded-xl
        border border-white/10
        bg-[linear-gradient(180deg,#18181b_0%,#09090b_100%)]
        px-5 py-3
        font-medium
        text-white
        shadow-[0_12px_40px_rgba(0,0,0,0.45)]
        transition-all duration-300
        hover:scale-[1.02]
        hover:border-primary/30
        hover:bg-primary/5
        hover:text-primary
        active:scale-[0.98]
      "
              >
                {canAddToCart ? "Add to Cart" : "Close"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
