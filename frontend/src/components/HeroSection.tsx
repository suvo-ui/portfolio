import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import heroImage from "@/assets/Cough Syrup  (1).jpeg";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Artwork } from "@/components/ArtworkCard";

interface HeroSectionProps {
  totalWorks: number;
  availableWorks: number;
  curatedShelfCount: number;
  artworks?: Artwork[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.16,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HeroSection({
  totalWorks,
  availableWorks,
  curatedShelfCount,
  artworks = [],
}: HeroSectionProps) {
  const [api, setApi] = useState<CarouselApi>();

  const scrollToGallery = () => {
    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Use first 3 artworks, or fallback to the static image if none available
  const carouselArtworks = artworks.slice(0, 3);
  const hasArtworks = carouselArtworks.length > 0;

  // Auto-play carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Change artwork every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  const heroStats = [
    {
      value: String(totalWorks).padStart(2, "0"),
      label: "Works in rotation",
    },
    {
      value: String(availableWorks).padStart(2, "0"),
      label: "Open for inquiry",
    },
    {
      value: String(curatedShelfCount).padStart(2, "0"),
      label: "Curated shelves",
    },
  ];

  return (
    <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden sm:min-h-screen">
      <div className="absolute inset-0">
        {hasArtworks ? (
          <Carousel className="h-full w-full" setApi={setApi}>
            <CarouselContent className="h-full">
              {carouselArtworks.map((artwork) => (
                <CarouselItem key={artwork.id} className="h-full basis-full">
                  <motion.div
                    className="h-full w-full"
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1.01, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="h-full w-full object-cover object-center"
                    />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {carouselArtworks.length > 1 && (
              <>
                <CarouselPrevious className="border-white/40 bg-transparent hover:border-white hover:bg-black/15" />
                <CarouselNext className="border-white/40 bg-transparent hover:border-white hover:bg-black/15" />
              </>
            )}
          </Carousel>
        ) : (
          <motion.img
            src={heroImage}
            alt="Featured Paper Slayer artwork"
            className="h-full w-full object-cover object-[62%_center] sm:object-[58%_center]"
            initial={{
              scale: 1.05,
              filter: "brightness(0.88) saturate(1.04) contrast(1.02)",
            }}
            animate={{
              scale: 1.01,
              filter: "brightness(0.98) saturate(1.08) contrast(1.04)",
            }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_42%,hsl(var(--background)/0.46)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(96deg,hsl(var(--background)/0.22)_0%,transparent_34%,transparent_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="max-w-3xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3"
            >
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.9)]" />
              <span className="font-display text-[11px] uppercase tracking-[0.38em] text-primary drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
                Paper Slayer Studio
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.94] text-foreground drop-shadow-[0_12px_38px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Paintings built with
              <span className="block text-gradient">texture, afterglow,</span>
              <span className="mt-2 block text-foreground/88">
                and sharper impact.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/88 drop-shadow-[0_8px_26px_rgba(0,0,0,0.52)] sm:text-base md:text-lg"
            >
              Paper Slayer explores expressive work through contrast, motion,
              and atmosphere. Originals, commissions, and courses sit inside the
              same studio world without the homepage feeling crowded.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
            >
              {heroStats.map((stat) => (
                <div key={stat.label} className="border-l border-white/30 pl-4">
                  <p className="font-display text-2xl font-bold text-foreground drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-foreground/78 drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Button
                variant="gold"
                size="xl"
                onClick={scrollToGallery}
                className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.22)] sm:w-auto"
              >
                View Collection
                <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                asChild
                className="w-full border-white/40 bg-transparent text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:border-white hover:bg-black/15 hover:text-foreground sm:w-auto"
              >
                <Link to="/contact">Commission Work</Link>
              </Button>
            </motion.div>

            <motion.button
              variants={itemVariants}
              onClick={scrollToGallery}
              className="mt-12 inline-flex min-h-12 items-center gap-3 text-left text-foreground/78 transition-colors hover:text-primary"
            >
              <span className="font-display text-[11px] uppercase tracking-[0.35em]">
                Scroll to collection
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
                <ArrowDown className="h-5 w-5" />
              </span>
            </motion.button>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-sm uppercase tracking-[0.28em] text-foreground/70 drop-shadow-[0_4px_16px_rgba(0,0,0,0.42)]"
            >
              West Bengal, India
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
