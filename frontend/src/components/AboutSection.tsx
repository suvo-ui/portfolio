import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import artistPortrait from "@/assets/WhatsApp Image 2026-02-10 at 9.45.24 PM.jpeg";
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  artworkCount: number;
  availableCount: number;
  curatedShelfCount: number;
}

export function AboutSection({
  artworkCount,
  availableCount,
  curatedShelfCount,
}: AboutSectionProps) {
  void artworkCount;
  void availableCount;
  void curatedShelfCount;

  const studioPrinciples = [
    {
      title: "Atmosphere First",
      copy: "Each piece starts by locking onto mood before detail ever becomes the point.",
    },
    {
      title: "Texture With Intent",
      copy: "Layers are there to carry tension, not to decorate the surface for their own sake.",
    },
    {
      title: "Made To Stay With You",
      copy: "The strongest works land fast, then keep opening up the longer you live with them.",
    },
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden py-8 sm:py-16 lg:py-20"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.1),transparent_26%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card)/0.55)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="mobile-eyebrow text-primary sm:text-sm">
              Studio Note
            </p>

            <h2 className="mobile-section-title mt-4 max-w-3xl text-foreground lg:text-6xl">
              A studio built on contrast, atmosphere, and repeat looking.
            </h2>

            <div className="mobile-body-copy mt-5 max-w-2xl space-y-4 text-muted-foreground">
              <p>
                Paper Slayer leans into bold contrast, dense texture, and the
                cinematic pull of light moving through dark surfaces. The goal
                is not just to make a strong first impression, but to create
                work that keeps revealing more once the room quiets down.
              </p>
              <p>
                That same approach carries into commissions and courses. The
                work stays expressive, the presentation stays sharp, and the
                whole experience is meant to feel grounded in one visual world.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Button
                variant="gold"
                size="lg"
                asChild
                className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.2)]"
              >
                <Link to="/contact">
                  Start a Conversation
                  <ArrowUpRight />
                </Link>
              </Button>
              <Button
                variant="hero"
                size="lg"
                asChild
                className="w-full border-primary/35 bg-background/10"
              >
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/70 p-3 shadow-[0_24px_80px_hsl(0_0%_0%/0.22)] backdrop-blur-xl">
                <div className="overflow-hidden border border-border/50 bg-background/60">
                  <img
                    src={artistPortrait}
                    alt="Paper Slayer studio portrait"
                    className="aspect-[4/5] w-full object-cover object-top"
                  />
                </div>
                <p className="mobile-label mt-4 text-primary">
                  Studio Portrait
                </p>
                <p className="mobile-card-copy mt-2 text-muted-foreground">
                  Kept visually calm so the section still reads as story first,
                  portrait second.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="app-surface p-5 sm:p-8">
            <p className="mobile-eyebrow text-primary">
              Working Principle
            </p>
            <blockquote className="mobile-pull-quote mt-5 text-foreground">
              "The image should hit immediately, then linger longer than the
              first glance."
            </blockquote>
            <p className="mobile-body-copy mt-5 max-w-xl text-muted-foreground">
              That balance between impact and staying power guides the
              composition, the palette, and the pacing of the entire collection.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {studioPrinciples.map((item) => (
              <div
                key={item.title}
                className="app-surface border-border/60 bg-background/45 p-4 sm:p-5"
              >
                <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground sm:tracking-[0.22em]">
                  {item.title}
                </p>
                <p className="mobile-card-copy mt-3 text-muted-foreground sm:text-sm">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
