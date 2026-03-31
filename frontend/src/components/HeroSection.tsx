import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import heroImage from "@/assets/Cough Syrup  (1).jpeg";

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
  const scrollToGallery = () => {
    const gallery = document.getElementById("gallery");
    gallery?.scrollIntoView({ behavior: "smooth" });
  };

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
    <section className="relative isolate flex min-h-screen items-end overflow-hidden bg-background">
      <div className="absolute inset-0">
        <motion.img
          src={heroImage}
          alt="Featured Paper Slayer artwork"
          className="h-full w-full object-cover object-[58%_center]"
          initial={{ scale: 1.05, filter: "brightness(0.72) saturate(1.02) contrast(1.02)" }}
          animate={{ scale: 1.01, filter: "brightness(0.86) saturate(1.08) contrast(1.06)" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(96deg,hsl(var(--background)/0.9)_0%,hsl(var(--background)/0.68)_24%,hsl(var(--background)/0.26)_54%,hsl(var(--background)/0.34)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_18%,hsl(var(--cream)/0.2),transparent_18%),linear-gradient(to_top,hsl(var(--background)/0.7)_0%,transparent_28%)]" />
      </div>

      <div className="relative container mx-auto px-6 pb-20 pt-28 lg:px-12 lg:pb-24 lg:pt-36">
        <motion.div
          className="max-w-[40rem]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center gap-3 border border-primary/25 bg-background/12 px-4 py-2 backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.9)]" />
            <span className="font-display text-[11px] uppercase tracking-[0.38em] text-primary">
              Paper Slayer Studio
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="max-w-[34rem] text-5xl font-bold leading-[0.94] text-foreground sm:text-6xl lg:text-7xl"
          >
            Paintings built with
            <span className="block text-gradient">texture, afterglow,</span>
            <span className="mt-3 block text-foreground/82">and a sharper sense of impact.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-8 max-w-[31rem] text-base leading-relaxed text-foreground/72 sm:text-lg"
          >
            Paper Slayer explores expressive work through contrast, motion, and atmosphere.
            Originals, commissions, and courses all sit inside the same studio world, now with a
            homepage that feels more curated and alive.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Button
              variant="gold"
              size="xl"
              onClick={scrollToGallery}
              className="group shadow-[0_20px_60px_hsl(var(--primary)/0.22)]"
            >
              View Collection
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="hero"
              size="xl"
              asChild
              className="border-primary/30 bg-background/10 backdrop-blur-md"
            >
              <Link to="/contact">Commission Work</Link>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[10rem] border border-border/45 bg-background/16 px-4 py-3 backdrop-blur-md"
              >
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-foreground/62">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7 }}
          className="mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <button
            onClick={scrollToGallery}
            className="group inline-flex items-center gap-3 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="font-display text-xs uppercase tracking-[0.35em]">Scroll to collection</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background/40 backdrop-blur-md">
              <ArrowDown className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-1" />
            </span>
          </button>

          <div className="max-w-xs border border-border/40 bg-background/12 px-4 py-4 backdrop-blur-md">
            <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
              Studio Base
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/68">
              West Bengal, India. Original works, commissions, and a quieter hero so the painting
              can carry more of the first impression.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
