import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getArtworkById, artworks } from "@/data/artworks";

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const artwork = id ? getArtworkById(id) : undefined;

  if (!artwork) {
    return <Navigate to="/" replace />;
  }

  // Get adjacent artworks for navigation
  const currentIndex = artworks.findIndex((a) => a.id === artwork.id);
  const prevArtwork = currentIndex > 0 ? artworks[currentIndex - 1] : null;
  const nextArtwork = currentIndex < artworks.length - 1 ? artworks[currentIndex + 1] : null;

  return (
    <Layout>
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 py-12">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8 -ml-4">
            <Link to="/" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Gallery
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Artwork Image */}
            <div className="animate-fade-in">
              <div className="relative overflow-hidden bg-card shadow-image">
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Artwork Details */}
            <div className="flex flex-col justify-center animate-fade-in" style={{ animationDelay: "200ms" }}>
              <p className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-4">
                {artwork.category.replace("-", " ")}
              </p>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {artwork.title}
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {artwork.description}
              </p>

              {/* Artwork Specifications */}
              <div className="grid grid-cols-2 gap-6 py-8 border-y border-border/50">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
                    Medium
                  </p>
                  <p className="text-foreground">{artwork.medium}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
                    Dimensions
                  </p>
                  <p className="text-foreground">{artwork.dimensions}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
                    Year
                  </p>
                  <p className="text-foreground">{artwork.year}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
                    Availability
                  </p>
                  <p className="text-primary font-medium">Available</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/contact">Inquire About This Piece</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-20 pt-12 border-t border-border/50">
            <div className="flex justify-between items-center">
              {prevArtwork ? (
                <Link
                  to={`/artwork/${prevArtwork.id}`}
                  className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2" />
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-widest mb-1 font-display">Previous</p>
                    <p className="font-display font-semibold">{prevArtwork.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              
              {nextArtwork && (
                <Link
                  to={`/artwork/${nextArtwork.id}`}
                  className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest mb-1 font-display">Next</p>
                    <p className="font-display font-semibold">{nextArtwork.title}</p>
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
