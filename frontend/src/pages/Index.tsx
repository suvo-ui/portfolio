import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AboutSection } from "@/components/AboutSection";
import { GallerySection } from "@/components/GallerySection";
import { HeroSection } from "@/components/HeroSection";
import { Layout } from "@/components/Layout";
import ArtworkModal from "@/components/ArtworkModal";
import type { Artwork } from "@/components/ArtworkCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useTabSelection } from "@/context/TabSelectionContext";
import { apiUrl } from "@/lib/api";
import type { Print } from "@/types/print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArtworkCard } from "@/components/ArtworkCard";

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
  "Best Works": {
    eyebrow: "Studio Favorites",
    description:
      "A refined selection of the strongest works, chosen for their visual authority and collector appeal.",
  },
  "Recently Sold": {
    eyebrow: "Fresh Moves",
    description:
      "The most recent collector acquisitions, showcasing the works that just left the studio.",
  },
};

const sortByNewest = (items: Artwork[]) =>
  [...items].sort((a, b) => b.id - a.id);

const sortByPrice = (items: Artwork[]) =>
  [...items].sort((a, b) => (b.price_inr ?? 0) - (a.price_inr ?? 0));

const getPrintSectionDetails = (categoryName: string) => {
  const galleryDetails = categoryDetails[categoryName];

  if (galleryDetails) {
    return {
      eyebrow: galleryDetails.eyebrow,
      description: galleryDetails.description.replace(/work/g, "prints"),
    };
  }

  if (categoryName === "Uncategorized") {
    return {
      eyebrow: "Print Editions",
      description:
        "Available print editions gathered from the studio collection.",
    };
  }

  return {
    eyebrow: "Print Editions",
    description: `Available print editions from the ${categoryName} collection.`,
  };
};

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
      <div className="rounded-[1.75rem] border border-border/60 bg-card/55 p-6 text-center backdrop-blur-sm sm:p-10">
        <p className="mobile-eyebrow text-primary">{eyebrow}</p>
        <h3 className="mobile-section-title mt-4 text-foreground">{title}</h3>
        <p className="mobile-body-copy mx-auto mt-4 max-w-2xl text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  </section>
);

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectedTab, setSelectedTab } = useTabSelection();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [prints, setPrints] = useState<Print[]>([]);
  const [selectedItem, setSelectedItem] = useState<Artwork | Print | null>(
    null,
  );
  const [selectedItemType, setSelectedItemType] = useState<
    "artwork" | "print" | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState<(Artwork | Print)[]>([]);
  const [galleryModalTitle, setGalleryModalTitle] = useState("Gallery");
  const [galleryModalItemType, setGalleryModalItemType] = useState<
    "artwork" | "print"
  >("artwork");

  useEffect(() => {
    const state = location.state as
      | { tab?: "gallery" | "print"; scrollTo?: string }
      | undefined;

    if (state?.tab) {
      setSelectedTab(state.tab);
    }

    if (state?.scrollTo) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(state.scrollTo!);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location.state, location.pathname, navigate, setSelectedTab]);

  const loadCollectionData = useCallback(async () => {
    try {
      const [artworksResponse, printsResponse] = await Promise.all([
        fetch(apiUrl("/api/artworks")),
        fetch(apiUrl("/api/prints")),
      ]);

      const artworksData = await artworksResponse.json().catch(() => []);
      const printsData = await printsResponse.json().catch(() => []);

      if (!artworksResponse.ok) {
        throw new Error("Failed to load artworks");
      }

      if (!printsResponse.ok) {
        throw new Error("Failed to load prints");
      }

      setArtworks(Array.isArray(artworksData) ? artworksData : []);
      setPrints(Array.isArray(printsData) ? printsData : []);
    } catch (error) {
      console.error("Failed to load collection data:", error);
    }
  }, []);

  useEffect(() => {
    loadCollectionData();
  }, [loadCollectionData]);

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

  const handleDeletePrint = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`/api/admin/prints/${id}`), {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete print");
      }

      setPrints((prev) => prev.filter((print) => print.id !== id));
    } catch (error) {
      console.error("Failed to delete print:", error);
      alert(error instanceof Error ? error.message : "Failed to delete print");
    }
  };

  const handleSaveArtwork = (updatedArtwork: Artwork) => {
    setArtworks((prev) =>
      prev.map((artwork) =>
        artwork.id === updatedArtwork.id
          ? {
              ...artwork,
              ...updatedArtwork,
              category: updatedArtwork.category ?? artwork.category,
            }
          : artwork,
      ),
    );
    setSelectedItem((prev) =>
      prev && prev.id === updatedArtwork.id
        ? { ...prev, ...updatedArtwork }
        : prev,
    );
  };

  const handleSavePrint = async (updatedPrint: Print) => {
    await loadCollectionData();
    setPrints((prev) =>
      prev.map((print) =>
        print.id === updatedPrint.id
          ? {
              ...print,
              ...updatedPrint,
              category: updatedPrint.category ?? print.category,
            }
          : print,
      ),
    );
    setSelectedItem((prev) =>
      prev && prev.id === updatedPrint.id ? { ...prev, ...updatedPrint } : prev,
    );
  };

  const handleOpenArtwork = (artwork: Artwork) => {
    setSelectedItemType("artwork");
    setSelectedItem(artwork);
    setIsEditing(false); // 🔴 IMPORTANT
  };

  const handleOpenPrint = (print: Print) => {
    setSelectedItemType("print");
    setSelectedItem(print);
    setIsEditing(false);
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

  const printsByCategory = prints.reduce(
    (acc, print) => {
      const category = print.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(print);
      return acc;
    },
    {} as Record<string, Print[]>,
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

  const printSections = Object.entries(printsByCategory)
    .map(([categoryName, categoryPrints]) => {
      const details = getPrintSectionDetails(categoryName);

      return {
        id: `prints-${categoryName.toLowerCase().replace(/\s+/g, "-")}`,
        eyebrow: details.eyebrow,
        name: categoryName === "Uncategorized" ? "Prints" : categoryName,
        description: details.description,
        artworks:
          categoryName === "Fresh Arrivals"
            ? sortByNewest(categoryPrints)
            : sortByPrice(categoryPrints),
        initialCount: 4,
      };
    })
    .filter((section) => section.artworks.length > 0);
  const availableArtworks = artworks.filter((art) => !art.is_sold);

  return (
    <Layout>
      <HeroSection
        totalWorks={artworks.length}
        availableWorks={availableArtworks.length}
        curatedShelfCount={curatedSections.length}
      />

      <div
        id="gallery"
        className="relative overflow-hidden bg-background pb-8 sm:pb-14"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_30%)]" />

        <div className="relative">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 md:pt-8 lg:px-8">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <Tabs
            value={selectedTab}
            onValueChange={(value) =>
              setSelectedTab(value as "gallery" | "print")
            }
            className="w-full"
          >
            <section className="pb-4 pt-2 sm:pt-4">
              <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="app-surface relative p-3 sm:p-5">
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-full border border-white/10 bg-black/30 p-1">
                    <TabsTrigger
                      value="gallery"
                      className="min-h-10 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    >
                      Gallery
                    </TabsTrigger>
                    <TabsTrigger
                      value="print"
                      className="min-h-10 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    >
                      Print
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </section>

            <TabsContent value="gallery" className="w-full">
              {curatedSections.length > 0 ? (
                curatedSections.map((section, index) => (
                  <GallerySection
                    key={section.id}
                    itemType="artwork"
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
                    onOpenArtwork={handleOpenArtwork}
                    onEditArtwork={(artwork) => {
                      setSelectedItemType("artwork");
                      setSelectedItem(artwork);
                      setIsEditing(true);
                    }}
                    onSeeMore={(artworks) => {
                      setGalleryItems(artworks);
                      setGalleryModalTitle(section.name);
                      setGalleryModalItemType("artwork");
                      setShowGalleryModal(true);
                    }}
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

            <TabsContent id="prints" value="print" className="w-full">
              {printSections.length > 0 ? (
                printSections.map((section, index) => (
                  <GallerySection
                    key={section.id}
                    itemType="print"
                    category={{
                      name: section.name,
                      artworks: section.artworks,
                      eyebrow: section.eyebrow,
                      description: section.description,
                    }}
                    initialCount={section.initialCount}
                    isAdmin={isAdmin}
                    sectionIndex={index}
                    onDeleteArtwork={handleDeletePrint}
                    onOpenArtwork={(print) => handleOpenPrint(print as Print)}
                    onEditArtwork={(print) => {
                      setSelectedItemType("print");
                      setSelectedItem(print as Print);
                      setIsEditing(true);
                    }}
                    onSeeMore={(prints) => {
                      setGalleryItems(prints as Print[]);
                      setGalleryModalTitle(section.name);
                      setGalleryModalItemType("print");
                      setShowGalleryModal(true);
                    }}
                  />
                ))
              ) : (
                <EmptyCollectionState
                  eyebrow="Print Collection"
                  title="No prints available yet."
                  description="Check back soon for newly uploaded print editions from the studio."
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

      <Dialog open={showGalleryModal} onOpenChange={setShowGalleryModal}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{galleryModalTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryItems.map((item) => (
              <ArtworkCard
                key={item.id}
                artwork={item}
                itemType={galleryModalItemType}
                isAdmin={isAdmin}
                onDelete={(id) =>
                  galleryModalItemType === "print"
                    ? handleDeletePrint(id)
                    : handleDeleteArtwork(id)
                }
                onOpen={(selectedItem) => {
                  setShowGalleryModal(false);
                  if (galleryModalItemType === "print") {
                    handleOpenPrint(selectedItem as Print);
                  } else {
                    handleOpenArtwork(selectedItem);
                  }
                }}
                onEdit={(selectedItem) => {
                  setShowGalleryModal(false);
                  setSelectedItemType(galleryModalItemType);
                  setSelectedItem(selectedItem);
                  setIsEditing(true);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ArtworkModal
        artwork={selectedItem}
        itemType={selectedItemType ?? "artwork"}
        isAdmin={isEditing}
        onClose={() => {
          setSelectedItem(null);
          setSelectedItemType(null);
          setIsEditing(false);
        }}
        onSave={(updatedItem) => {
          if (selectedItemType === "print") {
            handleSavePrint(updatedItem as Print);
          } else {
            handleSaveArtwork(updatedItem);
          }
        }}
      />
    </Layout>
  );
};

export default Index;
