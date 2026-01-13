import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-artwork.jpg";

export function HeroSection() {
  const scrollToGallery = () => {
    const gallery = document.getElementById("gallery");
    gallery?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Featured artwork"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-20">
        <div className="max-w-2xl">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-6 opacity-0 animate-fade-in">
            Contemporary Expressionist
          </p>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6 opacity-0 animate-fade-in [animation-delay:200ms]">
            Art That
            <br />
            <span className="text-gradient">Moves You</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg opacity-0 animate-fade-in [animation-delay:400ms]">
            Exploring the intersection of urban energy, natural beauty, and human emotion through bold, expressive brushwork.
          </p>
          
          <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in [animation-delay:600ms]">
            <Button variant="gold" size="lg" asChild>
              <Link to="/about">Discover More</Link>
            </Button>
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">Commission Work</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToGallery}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
      >
        <span className="font-display text-xs uppercase tracking-widest">Explore</span>
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  );
}
