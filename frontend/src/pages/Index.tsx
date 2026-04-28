import { useEffect, useState } from "react";

import { AboutSection } from "@/components/AboutSection";
import { GallerySection } from "@/components/GallerySection";
import { HeroSection } from "@/components/HeroSection";
import { Layout } from "@/components/Layout";
import ArtworkModal from "@/components/ArtworkModal";
import type { Artwork } from "@/components/ArtworkCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";

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

const EmptyCollectionState = ({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description: string;
  eyebrow: string;
}) => (
  <section className="py-8 sm:py-10 lg:py-12">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[1.75rem] border border-border/60 bg-card/55 p-8 text-center backdrop-blur-sm sm:p-10">
        <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
          {title}
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </div>
  </section>
);

const Index = () => {
  const { isAdmin } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const response = await fetch(apiUrl("/api/artworks"));
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
      const response = await fetch(apiUrl(`/api/admin/artworks/${id}`), {
        method: "DELETE",
        credentials: "include",
      });

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

  const handleSaveArtwork = (updatedArtwork: Artwork) => {
    setArtworks((prev) =>
      prev.map((artwork) =>
        artwork.id === updatedArtwork.id ? updatedArtwork : artwork,
      ),
    );
    setSelectedArtwork(updatedArtwork);
  };

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

  const curatedSections: CuratedSection[] = Object.entries(artworksByCategory)
    .filter(([categoryName]) => categoryDetails[categoryName])
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
        initialCount: 4,
      };
    })
    .filter((section) => section.artworks.length > 0);

  const availableArtworks = artworks.filter((art) => !art.is_sold);
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
        initialCount: 4,
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
        artworks={artworks}
      />

      <div
        id="gallery"
        className="relative overflow-hidden bg-background pb-10 sm:pb-14"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_30%)]" />

        <div className="relative">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 md:pt-8 lg:px-8">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <section className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
                {collectionSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="app-surface border-border/60 bg-card/50 p-5"
                  >
                    <p className="font-display text-4xl font-bold text-foreground">
                      {signal.value}
                    </p>
                    <p className="mt-3 font-display text-[11px] uppercase tracking-[0.32em] text-primary">
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

          <Tabs defaultValue="gallery" className="w-full">
            <section className="pb-4 pt-2 sm:pt-4">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="app-surface relative p-5 sm:p-6 lg:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_30%)]" />

                  <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="min-w-0">
                      <p className="font-display text-[11px] uppercase tracking-[0.35em] text-primary">
                        Curated Collection
                      </p>
                      <h2 className="mt-4 font-display text-3xl font-bold leading-[1.02] text-foreground sm:text-4xl md:text-5xl">
                        A cleaner first page, arranged like a series of shelves.
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Switch between originals and print-ready pieces without
                        the homepage losing its rhythm or visual balance.
                      </p>
                    </div>

                    <TabsList className="grid h-auto w-full grid-cols-2 border border-white/10 bg-black/30 p-1 sm:max-w-md">
                      <TabsTrigger
                        value="gallery"
                        className="min-h-10 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                      >
                        Gallery
                      </TabsTrigger>
                      <TabsTrigger
                        value="print"
                        className="min-h-10 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                      >
                        Print
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
              </div>
            </section>

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
                    onEditArtwork={(art) => setSelectedArtwork(art)}
                  />
                ))
              ) : (
                <EmptyCollectionState
                  eyebrow="Collection Update"
                  title="New work is being arranged right now."
                  description="The collection shell is ready, and pieces will appear here as soon as they are available from the backend."
                />
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
                    onEditArtwork={(art) => setSelectedArtwork(art)}
                  />
                ))
              ) : (
                <EmptyCollectionState
                  eyebrow="Print Collection"
                  title="No prints available yet."
                  description="Check back soon for available print editions of the current artworks."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <AboutSection
        artworkCount={artworks.length}
        availableCount={availableArtworks.length}
        curatedShelfCount={curatedSections.length}
      />

      <ArtworkModal
        artwork={selectedArtwork}
        isAdmin={isAdmin}
        onClose={() => setSelectedArtwork(null)}
        onSave={handleSaveArtwork}
      />
    </Layout>
  );
};

export default Index;
