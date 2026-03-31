import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import { useAuth } from "@/context/AuthContext";
import ArtworkModal from "@/components/ArtworkModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Artwork } from "@/components/ArtworkCard";

interface CuratedSection {
  id: string;
  eyebrow: string;
  name: string;
  description: string;
  artworks: Artwork[];
  initialCount?: number;
}

const categoryDetails: Record<
  string,
  { eyebrow: string; description: string }
> = {
  Bestsellers: {
    eyebrow: "Collector Favorites",
    description:
      "The works that drew the fastest collector response and still define the strongest pull in the collection.",
  },
  "Fresh Arrivals": {
    eyebrow: "Just Added",
    description:
      "Recently added work for collectors keeping an eye on what has just entered the rotation.",
  },
  "Available Now": {
    eyebrow: "Open For Inquiry",
    description:
      "Pieces currently ready for acquisition, conversation, and private collector follow-up.",
  },
  "Statement Pieces": {
    eyebrow: "Featured Selection",
    description:
      "High-impact works with the strongest visual pull and a more elevated collector presence.",
  },
};

const sortByNewest = (items: Artwork[]) =>
  [...items].sort((a, b) => b.id - a.id);

const sortByPrice = (items: Artwork[]) =>
  [...items].sort((a, b) => (b.price_inr ?? 0) - (a.price_inr ?? 0));

const Index = () => {
  const { isAdmin } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/artworks`,
        );
        const data = await response.json();
        setArtworks(data);
      } catch (error) {
        console.error("Failed to load artworks:", error);
      }
    };

    loadArtworks();
  }, []);

  const handleDeleteArtwork = async (id: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete artwork");
      }

      setArtworks((prev) => prev.filter((art) => art.id !== id));
    } catch (error) {
      console.error("Failed to delete artwork:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete artwork",
      );
    }
  };

  // Group artworks by category
  const artworksByCategory = artworks.reduce(
    (acc, artwork) => {
      const category = artwork.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(artwork);
      return acc;
    },
    {} as Record<string, Artwork[]>,
  );

  // Create curated sections based on categories
  const curatedSections: CuratedSection[] = Object.entries(artworksByCategory)
    .filter(([categoryName]) => categoryDetails[categoryName]) // Only include defined categories
    .map(([categoryName, categoryArtworks]) => {
      const details = categoryDetails[categoryName];
      return {
        id: categoryName.toLowerCase().replace(/\s+/g, "-"),
        eyebrow: details.eyebrow,
        name: categoryName,
        description: details.description,
        artworks:
          categoryName === "Fresh Arrivals"
            ? sortByNewest(categoryArtworks)
            : sortByPrice(categoryArtworks),
        initialCount: 3,
      };
    })
    .filter((section) => section.artworks.length > 0);

  const availableArtworks = artworks.filter((art) => !art.is_sold);

  // Create print artworks filter and sections
  const printArtworks = artworks.filter((art) => art.available_for_print);

  const printArtworksByCategory = printArtworks.reduce(
    (acc, artwork) => {
      const category = artwork.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(artwork);
      return acc;
    },
    {} as Record<string, Artwork[]>,
  );

  const printCuratedSections: CuratedSection[] = Object.entries(
    printArtworksByCategory,
  )
    .filter(([categoryName]) => categoryDetails[categoryName])
    .map(([categoryName, categoryArtworks]) => {
      const details = categoryDetails[categoryName];
      return {
        id: `print-${categoryName.toLowerCase().replace(/\s+/g, "-")}`,
        eyebrow: details.eyebrow,
        name: categoryName,
        description: details.description,
        artworks:
          categoryName === "Fresh Arrivals"
            ? sortByNewest(categoryArtworks)
            : sortByPrice(categoryArtworks),
        initialCount: 3,
      };
    })
    .filter((section) => section.artworks.length > 0);

  const collectionSignals = [
    {
      value: String(artworks.length).padStart(2, "0"),
      label: "Works in rotation",
      copy: "A living collection shaped by new additions, collector placements, and studio edits.",
    },
    {
      value: String(availableArtworks.length).padStart(2, "0"),
      label: "Open for inquiry",
      copy: "Pieces currently available for collectors, commissions, and more focused conversations.",
    },
    {
      value: String(curatedSections.length).padStart(2, "0"),
      label: "Curated shelves",
      copy: "Different ways into the work depending on mood, pace, and how you want to browse.",
    },
  ];

  return (
    <Layout>
      <HeroSection
        totalWorks={artworks.length}
        availableWorks={availableArtworks.length}
        curatedShelfCount={curatedSections.length}
      />

      <div
        id="gallery"
        className="relative overflow-hidden bg-background pb-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_30%)]" />

        <div className="relative">
          <div className="container mx-auto px-6 pt-4 lg:px-12 md:pt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <section className="pt-12 md:pt-16">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="grid gap-4 md:grid-cols-3">
                {collectionSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="border border-border/60 bg-card/50 p-5 backdrop-blur-sm"
                  >
                    <p className="font-display text-4xl font-bold text-foreground">
                      {signal.value}
                    </p>
                    <p className="mt-3 font-display text-xs uppercase tracking-[0.32em] text-primary">
                      {signal.label}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {signal.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-4 pt-14 md:pt-20">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-end">
                <div className="max-w-4xl">
                  <p className="mb-4 font-display text-xs uppercase tracking-[0.35em] text-primary">
                    Curated Collection
                  </p>
                  <h2 className="font-display text-4xl font-bold leading-[1.02] text-foreground md:text-5xl lg:text-6xl">
                    A stronger first page, arranged like a series of shelves.
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  The homepage now moves from a studio-led introduction into
                  curated groups of work, so it feels easier to browse, more
                  premium at a glance, and still fully aligned with the visual
                  language already in place.
                </p>
              </div>
            </div>
          </section>

          <Tabs defaultValue="gallery" className="w-full">
            <div className="container mx-auto px-6 lg:px-12 pb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-black/30 border border-white/10">
                <TabsTrigger
                  value="gallery"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="print"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  Print
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="gallery" className="w-full">
              {curatedSections.length > 0 ? (
                curatedSections.map((section, index) => (
                  <GallerySection
                    key={section.id}
                    category={{
                      name: section.name,
                      artworks: section.artworks,
                      eyebrow: section.eyebrow,
                      description: section.description,
                    }}
                    initialCount={section.initialCount}
                    isAdmin={isAdmin}
                    sectionIndex={index}
                    onDeleteArtwork={handleDeleteArtwork}
                    onOpenArtwork={(art) => setSelectedArtwork(art)}
                  />
                ))
              ) : (
                <section className="py-8 md:py-10">
                  <div className="container mx-auto px-6 lg:px-12">
                    <div className="rounded-[2rem] border border-border/60 bg-card/55 p-8 text-center backdrop-blur-sm">
                      <p className="font-display text-xs uppercase tracking-[0.34em] text-primary">
                        Collection Update
                      </p>
                      <h3 className="mt-4 font-display text-3xl text-foreground">
                        New work is being arranged right now.
                      </h3>
                      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                        The homepage layout is ready, and the collection will
                        appear here as soon as pieces are available from the
                        backend.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </TabsContent>

            <TabsContent value="print" className="w-full">
              {printCuratedSections.length > 0 ? (
                printCuratedSections.map((section, index) => (
                  <GallerySection
                    key={section.id}
                    category={{
                      name: section.name,
                      artworks: section.artworks,
                      eyebrow: section.eyebrow,
                      description: section.description,
                    }}
                    initialCount={section.initialCount}
                    isAdmin={isAdmin}
                    sectionIndex={index}
                    onDeleteArtwork={handleDeleteArtwork}
                    onOpenArtwork={(art) => setSelectedArtwork(art)}
                  />
                ))
              ) : (
                <section className="py-8 md:py-10">
                  <div className="container mx-auto px-6 lg:px-12">
                    <div className="rounded-[2rem] border border-border/60 bg-card/55 p-8 text-center backdrop-blur-sm">
                      <p className="font-display text-xs uppercase tracking-[0.34em] text-primary">
                        Print Collection
                      </p>
                      <h3 className="mt-4 font-display text-3xl text-foreground">
                        No prints available yet.
                      </h3>
                      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                        Check back soon for available print editions of our
                        artworks.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <AboutSection
        artworkCount={artworks.length}
        availableCount={availableArtworks.length}
        curatedShelfCount={curatedSections.length}
      />

      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </Layout>
  );
};

export default Index;
