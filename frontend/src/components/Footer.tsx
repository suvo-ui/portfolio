import { Link, useLocation, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { ArrowUp, ArrowUpRight, Instagram, Mail, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

const footerLinks = [
  {
    href: "/#gallery",
    label: "Gallery",
    description: "Browse the latest collection and featured works.",
  },
  {
    href: "/#about",
    label: "About",
    description: "Learn more about the artist and the process.",
  },
  {
    href: "/courses",
    label: "Courses",
    description: "Explore workshops, learning sessions, and updates.",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Start a conversation about commissions or inquiries.",
  },
];

const focusAreas = [
  {
    title: "Original Works",
    copy: "Curated paintings for collectors looking for bold, emotional presence.",
  },
  {
    title: "Commissions",
    copy: "Custom pieces shaped around mood, scale, and the space they live in.",
  },
  {
    title: "Learning",
    copy: "Courses and workshops for artists building a stronger visual voice.",
  },
];

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFooterLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/#")) return;

    event.preventDefault();
    const targetId = href.substring(2);

    if (location.pathname === "/") {
      scrollToSection(targetId);
      return;
    }

    navigate("/");
    window.setTimeout(() => scrollToSection(targetId), 120);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_82%_12%,hsl(var(--accent)/0.08),transparent_24%),linear-gradient(180deg,transparent_0%,hsl(var(--background)/0.72)_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(hsl(var(--foreground)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.12)_1px,transparent_1px)] [background-size:110px_110px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div className="absolute left-[-5rem] top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-6rem] h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-6 pb-8 pt-14 lg:px-12 lg:pb-10 lg:pt-20">
        <div className="relative overflow-hidden border border-primary/15 bg-card/70 p-8 shadow-[0_24px_80px_hsl(0_0%_0%/0.32)] backdrop-blur-xl md:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-5 font-display text-xs uppercase tracking-[0.38em] text-primary">
                Closing Frame
              </p>
              <h2 className="max-w-xl font-display text-4xl font-bold leading-[0.95] text-foreground md:text-5xl lg:text-6xl">
                Keep the energy moving beyond the last scroll.
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Explore available work, start a commission conversation, or dive into the
                learning side of the studio. The footer should feel like a real next step, not a
                dead end.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="gold" size="lg" asChild className="shadow-[0_20px_60px_hsl(var(--primary)/0.22)]">
                  <Link to="/#gallery" onClick={(event) => handleFooterLink(event, "/#gallery")}>
                    View Collection
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button variant="hero" size="lg" asChild className="border-primary/35 bg-background/10">
                  <Link to="/contact">Start a Project</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {focusAreas.map((item) => (
                <div
                  key={item.title}
                  className="border border-border/60 bg-background/50 p-5 transition-colors duration-300 hover:border-primary/40"
                >
                  <p className="font-display text-xs uppercase tracking-[0.28em] text-primary">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(280px,0.9fr)]">
          <div className="max-w-md">
            <Link
              to="/"
              className="font-display text-3xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              PAPER<span className="text-primary">.</span>SLAYER
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Expressive contemporary work built around texture, tension, and motion. Created for
              collectors, commissions, and artists who want more atmosphere in the frame.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Sheoraphuli, West Bengal, India</span>
            </div>
          </div>

          <div>
            <p className="mb-5 font-display text-xs uppercase tracking-[0.32em] text-primary">
              Navigate
            </p>
            <nav className="space-y-4">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(event) => handleFooterLink(event, link.href)}
                  className="group block border-b border-border/40 pb-4 transition-colors duration-300 hover:border-primary/40"
                >
                  <span className="font-display text-lg uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-primary">
                    {link.label}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {link.description}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-5 font-display text-xs uppercase tracking-[0.32em] text-primary">
              Connect
            </p>
            <div className="space-y-4">
              <a
                href="mailto:paperslayer99@gmail.com"
                className="group flex items-start gap-4 border border-border/50 bg-background/35 p-4 transition-colors duration-300 hover:border-primary/40"
              >
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    paperslayer99@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/paper_slayer99/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 border border-border/50 bg-background/35 p-4 transition-colors duration-300 hover:border-primary/40"
              >
                <Instagram className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
                    Instagram
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    @paper_slayer99
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/50 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Copyright {new Date().getFullYear()} Paper Slayer. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 self-start font-display text-xs uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:text-primary md:self-auto"
          >
            Back to top
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
