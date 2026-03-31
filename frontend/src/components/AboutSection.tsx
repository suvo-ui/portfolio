import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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
  const studioStats = [
    {
      value: String(artworkCount).padStart(2, "0"),
      label: "Works in rotation",
    },
    {
      value: String(availableCount).padStart(2, "0"),
      label: "Open for inquiry",
    },
    {
      value: String(curatedShelfCount).padStart(2, "0"),
      label: "Curated shelves",
    },
    {
      value: "WB",
      label: "Studio base",
    },
  ];

  const studioPrinciples = [
    {
      title: "Atmosphere First",
      copy: "Each piece starts by locking onto mood before detail ever becomes the point.",
    },
    {
      title: "Texture With Intent",
      copy: "Layers are there to carry tension, not to decorate the surface for its own sake.",
    },
    {
      title: "Made To Stay With You",
      copy: "The strongest works land fast, then keep opening up the longer you live with them.",
    },
  ];

  return (
    <section id="about" className="relative overflow-hidden py-20 md:py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.1),transparent_26%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card)/0.55)_100%)]" />
      </div>

      <div className="relative container mx-auto px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(240px,0.64fr)_minmax(0,1.36fr)] lg:items-center">
          <div className="relative mx-auto w-full max-w-[290px] lg:mx-0">
            <div className="absolute -inset-4 bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden border border-border/60 bg-card/70 p-3 shadow-[0_20px_56px_hsl(0_0%_0%/0.26)] backdrop-blur-sm">
              <div className="overflow-hidden border border-border/50 bg-background/60">
                <img
                  src={artistPortrait}
                  alt="Paper Slayer studio portrait"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
              </div>
              <p className="mt-4 font-display text-[11px] uppercase tracking-[0.3em] text-primary">
                Studio Portrait
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Kept to the side so the section still reads like story first, portrait second.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-6 font-display text-sm uppercase tracking-[0.32em] text-primary">
              Studio Note
            </p>

            <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] text-foreground md:text-5xl lg:text-6xl">
              A studio built on contrast, atmosphere, and repeat looking.
            </h2>

            <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Paper Slayer leans into bold contrast, dense texture, and the cinematic pull of
                light moving through dark surfaces. The goal is not just to make a striking first
                impression, but to create work that keeps revealing more once the room quiets down.
              </p>
              <p>
                That same approach carries into commissions and courses. The work stays expressive,
                the presentation stays sharp, and the whole experience is meant to feel grounded in
                one visual world instead of disconnected pages.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="gold" size="lg" asChild className="shadow-[0_20px_60px_hsl(var(--primary)/0.2)]">
                <Link to="/contact">
                  Start a Conversation
                  <ArrowUpRight />
                </Link>
              </Button>
              <Button variant="hero" size="lg" asChild className="border-primary/35 bg-background/10">
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-border/50 bg-border/40 md:grid-cols-4">
              {studioStats.map((stat) => (
                <div key={stat.label} className="bg-background/75 p-4">
                  <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="border border-border/60 bg-card/55 p-8 backdrop-blur-sm">
            <p className="font-display text-xs uppercase tracking-[0.34em] text-primary">
              Working Principle
            </p>
            <blockquote className="mt-6 font-display text-3xl leading-tight text-foreground md:text-4xl">
              "The image should hit immediately, then linger longer than the first glance."
            </blockquote>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              That balance between impact and staying power guides the composition, the palette,
              and the pacing of the entire collection.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {studioPrinciples.map((item) => (
              <div
                key={item.title}
                className="border border-border/60 bg-background/45 p-5 backdrop-blur-sm"
              >
                <p className="font-display text-sm uppercase tracking-[0.22em] text-foreground">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
