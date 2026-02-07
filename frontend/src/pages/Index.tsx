import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import ArtworkModal from "@/components/ArtworkModal"; // ⭐ IMPORT MODAL

const Index = () => {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null); // ⭐ MODAL STATE

  // 🔐 Check if admin is logged in
  const isAdmin = !!localStorage.getItem("adminToken");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/artworks`)
      .then((res) => res.json())
      .then((data) => {
        console.log("ARTWORKS FROM API:", data);
        setArtworks(data);
      });
  }, []);

  // 🗑️ Remove artwork from UI after delete
  const handleDeleteArtwork = (id: number) => {
    setArtworks((prev) => prev.filter((art) => art.id !== id));
  };

  // 📂 Group artworks by category
  const groupedByCategory = artworks.reduce((acc: any, art: any) => {
    const categoryName = art.category || "Uncategorized";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(art);
    return acc;
  }, {});

  return (
    <Layout>
      <HeroSection />

      <div id="gallery" className="bg-background">
        {/* Divider */}
        <div className="container mx-auto px-6 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Gallery Sections from Database */}
        {Object.entries(groupedByCategory).map(
          ([categoryName, categoryArtworks]: any) => (
            <GallerySection
              key={categoryName}
              category={{
                name: categoryName,
                artworks: categoryArtworks,
              }}
              isAdmin={isAdmin}
              onDeleteArtwork={handleDeleteArtwork}
              onOpenArtwork={(art) => setSelectedArtwork(art)} // ⭐ OPEN MODAL
            />
          ),
        )}
      </div>

      {/* Divider */}
      <div className="container mx-auto px-6 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <AboutSection />

      {/* ⭐ MODAL RENDER (VERY IMPORTANT) */}
      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </Layout>
  );
};

export default Index;
