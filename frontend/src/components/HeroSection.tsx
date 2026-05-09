import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import LazyImage from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { fetchHeroCarouselImages, type HeroCarouselImage } from "@/lib/api";

interface HeroSectionProps {
  totalWorks: number;
  availableWorks: number;
  curatedShelfCount: number;
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
}: HeroSectionProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [carouselImages, setCarouselImages] = useState<HeroCarouselImage[]>([]);

  const scrollToGallery = () => {
    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fetch hero carousel images
  useEffect(() => {
    fetchHeroCarouselImages()
      .then(setCarouselImages)
      .catch((error) => {
        console.error("Failed to fetch hero carousel images:", error);
      });
  }, []);

  const hasImages = carouselImages.length > 0;

  // Auto-play carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

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
    <>
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden sm:min-h-[84svh] md:min-h-[92svh] lg:min-h-screen">
        <div className="absolute inset-0">
          {hasImages ? (
            <Carousel
              className="h-full w-full"
              setApi={setApi}
              opts={{ loop: true }}
            >
              <CarouselContent className="h-full">
                {carouselImages.map((image, index) => (
                  <CarouselItem key={image.id} className="h-full basis-full">
                    <motion.div
                      className="h-full w-full"
                      initial={{ scale: 1.05, opacity: 0 }}
                      animate={{ scale: 1.01, opacity: 1 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <LazyImage
                        src={image.image_url}
                        alt={image.title}
                        priority={index === 0}
                        sizes="100vw"
                        className="h-full w-full object-contain object-center bg-black"
                      />
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {carouselImages.length > 1 && (
                <>
                  <CarouselPrevious className="hidden border-white/40 bg-transparent hover:border-white hover:bg-black/15 md:inline-flex" />
                  <CarouselNext className="hidden border-white/40 bg-transparent hover:border-white hover:bg-black/15 md:inline-flex" />
                </>
              )}
            </Carousel>
          ) : (
            <motion.img
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_38%,hsl(var(--background)/0.62)_100%)] md:bg-[linear-gradient(180deg,transparent_0%,transparent_42%,hsl(var(--background)/0.46)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(96deg,hsl(var(--background)/0.26)_0%,transparent_38%,transparent_100%)] md:bg-[linear-gradient(96deg,hsl(var(--background)/0.22)_0%,transparent_34%,transparent_100%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-7 pt-14 sm:px-6 sm:pb-10 sm:pt-20 md:pb-16 md:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
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
                <span className="mobile-eyebrow text-primary drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
                  Paper Slayer Studio
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="mobile-hero-title mt-5 max-w-4xl text-foreground drop-shadow-[0_12px_38px_rgba(0,0,0,0.55)]"
              >
                Paintings built with
                <span className="block text-gradient">texture, afterglow,</span>
                <span className="mt-2 block text-foreground/88">
                  and sharper impact.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mobile-intro-copy mt-5 max-w-xl text-foreground/88 drop-shadow-[0_8px_26px_rgba(0,0,0,0.52)] md:max-w-2xl"
              >
                <span className="md:hidden">
                  Expressive originals, commissions, and courses held in one
                  studio world, with the artwork leading the experience.
                </span>
                <span className="hidden md:inline">
                  Paper Slayer explores expressive work through contrast,
                  motion, and atmosphere. Originals, commissions, and courses
                  sit inside the same studio world without the homepage feeling
                  crowded.
                </span>
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Button
                  variant="gold"
                  size="xl"
                  onClick={scrollToGallery}
                  className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.22)] md:w-auto"
                >
                  View Collection
                  <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  asChild
                  className="hidden w-full border-white/40 bg-transparent text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:border-white hover:bg-black/15 hover:text-foreground md:inline-flex md:w-auto"
                >
                  <Link to="/contact">Commission Work</Link>
                </Button>
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={scrollToGallery}
                className="mt-12 hidden min-h-12 items-center gap-3 text-left text-foreground/78 transition-colors hover:text-primary md:inline-flex"
              >
                <span className="mobile-eyebrow">Scroll to collection</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
                  <ArrowDown className="h-5 w-5" />
                </span>
              </motion.button>

              <motion.p
                variants={itemVariants}
                className="mobile-label mt-6 hidden text-foreground/70 drop-shadow-[0_4px_16px_rgba(0,0,0,0.42)] md:block"
              >
                West Bengal, India
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background md:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.1),transparent_34%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
          <div className="app-surface -mt-4 p-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full border-white/15 bg-background/40 text-foreground hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
              >
                <Link to="/contact">Commission Work</Link>
              </Button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.25rem] border border-border/60 bg-background/35 p-4"
                  >
                    <p className="font-display text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="mobile-label mt-2 text-primary/85">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollToGallery}
                className="inline-flex min-h-12 items-center justify-between gap-3 border border-border/60 bg-background/30 px-4 py-3 text-left text-foreground/78 transition-colors hover:text-primary"
              >
                <span className="mobile-eyebrow">Scroll to collection</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                  <ArrowDown className="h-5 w-5" />
                </span>
              </button>

              <p className="mobile-label text-foreground/62">
                West Bengal, India
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
