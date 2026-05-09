import { useCallback, useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { GallerySection } from "@/components/GallerySection";
import ArtworkModal from "@/components/ArtworkModal";
import type { Print } from "@/types/print";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";

const sortByNewest = (items: Print[]) => [...items].sort((a, b) => b.id - a.id);

const sortByPrice = (items: Print[]) =>
  [...items].sort((a, b) => (b.price_inr ?? 0) - (a.price_inr ?? 0));

const getPrintSectionDetails = (categoryName: string) => {
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

export default function Prints() {
  const { isAdmin } = useAuth();

  const [prints, setPrints] = useState<Print[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrint, setSelectedPrint] = useState<Print | null>(null);

  const fetchPrints = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/prints"));
      if (!response.ok) throw new Error("Failed to fetch prints");
      const data = await response.json();
      setPrints(data);
    } catch (error) {
      console.error("Error fetching prints:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrints();
  }, [fetchPrints]);

  // 🔥 OPEN MODAL
  const handleOpenPrint = (print: Print) => {
    setSelectedPrint(print);
  };

  // 🔥 EDIT (same as open → modal handles edit mode)
  const handleEditPrint = (print: Print) => {
    setSelectedPrint(print);
  };

  // 🔥 DELETE
  const handleDeletePrint = async (id: number) => {
    if (!confirm("Are you sure you want to delete this print?")) return;

    try {
      const response = await fetch(apiUrl(`/api/admin/prints/${id}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete print");

      setPrints((prev) => prev.filter((p) => p.id !== id));
      alert("Print deleted successfully.");
    } catch (error) {
      console.error("Error deleting print:", error);
      alert("Failed to delete print.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading prints...</p>
          </div>
        </div>
      </Layout>
    );
  }

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

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="pt-16">
          {printSections.map((section, index) => (
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
              onOpenArtwork={(print) => handleOpenPrint(print as Print)}
              onEditArtwork={(print) => handleEditPrint(print as Print)}
              onDeleteArtwork={handleDeletePrint}
            />
          ))}
        </div>
      </div>

      {/* 🔥 FIXED MODAL */}
      <ArtworkModal
        artwork={selectedPrint}
        itemType="print"
        onClose={() => setSelectedPrint(null)}
        isAdmin={isAdmin}
        onSave={async (updatedPrint) => {
          await fetchPrints();
          setPrints((prev) =>
            prev.map((p) => (p.id === updatedPrint.id ? updatedPrint : p)),
          );
          setSelectedPrint(updatedPrint);
        }}
      />
    </Layout>
  );
}
