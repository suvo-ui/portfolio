import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { GallerySection } from "@/components/GallerySection";
import { AboutSection } from "@/components/AboutSection";
import { categories } from "@/data/artworks";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      
      <div id="gallery" className="bg-background">
        {/* Divider */}
        <div className="container mx-auto px-6 lg:px-12">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Gallery Sections */}
        {categories.map((category) => (
          <GallerySection key={category.id} category={category} />
        ))}
      </div>

      {/* Divider */}
      <div className="container mx-auto px-6 lg:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <AboutSection />
    </Layout>
  );
};

export default Index;
