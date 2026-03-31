import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

interface Artwork {
  id: number;
  title: string;
  description?: string | null;
  image_url: string;
  category?: string | null;
  price_inr?: number | null;
  size?: string | null;
  is_sold?: boolean;
  created_at?: string | null;
}

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null | undefined>(undefined);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadArtwork = async () => {
      try {
        setError(null);

        const [artworkResponse, artworksResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/artworks/${id}`),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/artworks`),
        ]);

        const artworkData = await artworkResponse.json().catch(() => null);
        const artworksData = await artworksResponse.json().catch(() => []);

        if (!isMounted) return;

        if (!artworkResponse.ok) {
          throw new Error(artworkData?.error || "Artwork not found");
        }

        setArtwork(artworkData);
        setArtworks(Array.isArray(artworksData) ? artworksData : []);
      } catch (err) {
        if (!isMounted) return;

        setArtwork(null);
        setArtworks([]);
        setError(err instanceof Error ? err.message : "Unable to load artwork");
      }
    };

    loadArtwork();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const currentIndex = useMemo(
    () => artworks.findIndex((item) => item.id === artwork?.id),
    [artworks, artwork?.id],
  );
  const prevArtwork = currentIndex > 0 ? artworks[currentIndex - 1] : null;
  const nextArtwork =
    currentIndex >= 0 && currentIndex < artworks.length - 1 ? artworks[currentIndex + 1] : null;
  const createdYear =
    artwork?.created_at && !Number.isNaN(new Date(artwork.created_at).getTime())
      ? String(new Date(artwork.created_at).getFullYear())
      : "Current release";
  const priceLabel = artwork?.price_inr
    ? `INR ${artwork.price_inr.toLocaleString()}`
    : artwork?.is_sold
      ? "Collected"
      : "Available on inquiry";

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (artwork === undefined) {
    return (
      <Layout>
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-6 py-16 lg:px-12">
            <div className="border border-border/60 bg-card/55 p-8 text-center backdrop-blur-sm">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-primary">
                Artwork Detail
              </p>
              <h1 className="mt-4 font-display text-3xl text-foreground">Loading artwork.</h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Pulling the latest piece details from the live collection.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!artwork) {
    return (
      <Layout>
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-6 py-16 lg:px-12">
            <div className="border border-border/60 bg-card/55 p-8 text-center backdrop-blur-sm">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-primary">
                Collection Update
              </p>
              <h1 className="mt-4 font-display text-3xl text-foreground">Artwork not available.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {error || "This piece is no longer available in the live collection."}
              </p>
              <div className="mt-6">
                <Button variant="gold" asChild>
                  <Link to="/">Back to Gallery</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-6 py-12 lg:px-12">
          <Button variant="ghost" asChild className="mb-8 -ml-4">
            <Link to="/" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Gallery
            </Link>
          </Button>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-16">
            <div className="border border-border/60 bg-card/55 p-5 shadow-[0_24px_80px_hsl(0_0%_0%/0.18)] backdrop-blur-sm">
              <div className="relative overflow-hidden border border-border/50 bg-background/60">
                <div className="absolute left-5 top-5 z-10 border border-border/60 bg-background/85 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-muted-foreground backdrop-blur-sm">
                  {artwork.is_sold ? "Collected" : "Available"}
                </div>
                <img src={artwork.image_url} alt={artwork.title} className="w-full object-contain" />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-primary">
                {artwork.category || "Studio Artwork"}
              </p>

              <h1 className="mt-5 font-display text-4xl font-bold leading-[0.98] text-foreground md:text-5xl lg:text-6xl">
                {artwork.title}
              </h1>

              <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                {artwork.description ||
                  "This piece is part of the live collection and is available for direct inquiry."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border border-border/60 bg-card/45 p-5">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Price
                  </p>
                  <p className="mt-3 text-lg text-foreground">{priceLabel}</p>
                </div>
                <div className="border border-border/60 bg-card/45 p-5">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Size
                  </p>
                  <p className="mt-3 text-lg text-foreground">{artwork.size || "Available on request"}</p>
                </div>
                <div className="border border-border/60 bg-card/45 p-5">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Release Year
                  </p>
                  <p className="mt-3 text-lg text-foreground">{createdYear}</p>
                </div>
                <div className="border border-border/60 bg-card/45 p-5">
                  <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                    Inquiry
                  </p>
                  <p className="mt-3 text-lg text-foreground">
                    {artwork.is_sold ? "Ask about similar work" : "Ready for collector follow-up"}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/contact">Inquire About This Piece</Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/courses">Explore the Courses</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-border/50 pt-12">
            <div className="flex items-center justify-between gap-6">
              {prevArtwork ? (
                <Link
                  to={`/artwork/${prevArtwork.id}`}
                  className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2" />
                  <div className="text-left">
                    <p className="font-display text-xs uppercase tracking-[0.28em] text-primary">
                      Previous
                    </p>
                    <p className="mt-2 font-display text-lg text-foreground">{prevArtwork.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextArtwork && (
                <Link
                  to={`/artwork/${nextArtwork.id}`}
                  className="group flex items-center gap-3 text-right text-muted-foreground transition-colors hover:text-foreground"
                >
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.28em] text-primary">
                      Next
                    </p>
                    <p className="mt-2 font-display text-lg text-foreground">{nextArtwork.title}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArtworkDetail;
