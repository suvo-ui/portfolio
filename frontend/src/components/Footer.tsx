import type { MouseEvent } from "react";
import { ArrowUp, ArrowUpRight, Instagram, Mail, MapPin } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
    description: "Learn more about the artist and the studio approach.",
  },
  {
    href: "/courses",
    label: "Courses",
    description: "Explore learning sessions and workshop updates.",
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
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
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
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-10 lg:pt-20">
        <div className="relative overflow-hidden border border-primary/15 bg-card/70 p-4 shadow-[0_24px_80px_hsl(0_0%_0%/0.32)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
            <div className="min-w-0">
              <p className="mobile-eyebrow text-primary">
                Closing Frame
              </p>
              <h2 className="mobile-section-title mt-4 max-w-2xl text-foreground">
                Keep the energy moving beyond the last scroll.
              </h2>
              <p className="mobile-body-copy mt-5 max-w-xl text-muted-foreground">
                Explore available work, start a commission conversation, or move
                into the learning side of the studio without the footer feeling
                like dead space.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
                <Button
                  variant="gold"
                  size="lg"
                  asChild
                  className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.22)]"
                >
                  <Link to="/#gallery" onClick={(event) => handleFooterLink(event, "/#gallery")}>
                    View Collection
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  asChild
                  className="w-full border-primary/35 bg-background/10"
                >
                  <Link to="/contact">Start a Project</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {focusAreas.map((item) => (
                <div
                  key={item.title}
                  className="border border-border/60 bg-background/50 p-4 transition-colors duration-300 hover:border-primary/40 sm:p-5"
                >
                  <p className="mobile-label text-primary">
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

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="font-display text-2xl font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-3xl"
            >
              PAPER<span className="text-primary">.</span>SLAYER
            </Link>
            <p className="mobile-body-copy mt-4 text-muted-foreground">
              Expressive contemporary work built around texture, tension, and
              motion. Created for collectors, commissions, and artists who want
              more atmosphere in the frame.
            </p>
            <div className="mt-5 inline-flex max-w-full items-center gap-3 border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>Sheoraphuli, West Bengal, India</span>
            </div>
          </div>

          <div>
            <p className="mobile-eyebrow mb-4 text-primary">
              Navigate
            </p>
            <nav className="grid gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(event) => handleFooterLink(event, link.href)}
                  className="group border border-border/40 bg-background/35 p-4 transition-colors duration-300 hover:border-primary/40"
                >
                  <span className="font-display text-sm uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-primary">
                    {link.label}
                  </span>
                  <span className="mobile-card-copy mt-2 block text-muted-foreground sm:text-sm">
                    {link.description}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="mobile-eyebrow mb-4 text-primary">
              Connect
            </p>
            <div className="grid gap-3">
              <a
                href="mailto:paperslayer99@gmail.com"
                className="group flex min-h-12 items-start gap-4 border border-border/50 bg-background/35 p-4 transition-colors duration-300 hover:border-primary/40"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
                    Email
                  </p>
                  <p className="mt-1 break-all text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    paperslayer99@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/paper_slayer99/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-12 items-start gap-4 border border-border/50 bg-background/35 p-4 transition-colors duration-300 hover:border-primary/40"
              >
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
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

          <div className="hidden lg:block">
            <p className="mobile-eyebrow mb-4 text-primary">
              Studio
            </p>
            <div className="grid gap-3">
              {focusAreas.map((item) => (
                <div key={item.title} className="border border-border/50 bg-background/35 p-4">
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
                    {item.title}
                  </p>
                  <p className="mobile-card-copy mt-2 text-muted-foreground sm:text-sm">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/50 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} Paper Slayer. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="group inline-flex min-h-10 items-center gap-2 self-start font-display text-[11px] uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:text-primary sm:self-auto"
          >
            Back to top
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
