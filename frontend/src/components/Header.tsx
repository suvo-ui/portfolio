import { useEffect, useState, type MouseEvent } from "react";
import { Instagram, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { CartIcon } from "@/components/CartIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#gallery", label: "Gallery" },
  { href: "/#about", label: "About" },
  { href: "/courses#courses", label: "Courses" },
  { href: "/courses#workshops", label: "Workshops" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [blinkCourses, setBlinkCourses] = useState(false);
  const [blinkWorkshops, setBlinkWorkshops] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const courseBlink = localStorage.getItem("courses-link-blink");
    const workshopBlink = localStorage.getItem("workshops-link-blink");

    if (courseBlink === "true") {
      setBlinkCourses(true);
      localStorage.removeItem("courses-link-blink");
      setTimeout(() => setBlinkCourses(false), 4000);
    }

    if (workshopBlink === "true") {
      setBlinkWorkshops(true);
      localStorage.removeItem("workshops-link-blink");
      setTimeout(() => setBlinkWorkshops(false), 4000);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const hashIndex = href.indexOf("#");

    if (hashIndex === -1) return;

    event.preventDefault();

    const path = href.substring(0, hashIndex) || "/";
    const targetId = href.substring(hashIndex + 1);

    if (location.pathname === path) {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate(href);
  };

  const isActiveLink = (href: string) =>
    location.pathname === href ||
    (href.startsWith("/#") &&
      location.pathname === "/" &&
      location.hash === href.substring(1));

  const isHighlightedLink = (href: string) =>
    href === "/courses#courses" || href === "/courses#workshops";

  const shouldBlink = (href: string) =>
    href === "/courses#courses"
      ? blinkCourses
      : href === "/courses#workshops"
        ? blinkWorkshops
        : false;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "border-border/50 bg-background/94 backdrop-blur-xl"
          : "border-transparent bg-background/30 backdrop-blur-md",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2 sm:min-h-[4.5rem]">
          <Link
            to="/"
            className="min-w-0 shrink truncate font-display text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-xl lg:text-2xl"
          >
            PAPER<span className="text-primary">.</span>SLAYER
          </Link>

          <div className="flex min-w-0 items-center gap-2 lg:gap-4">
            <nav className="hidden min-w-0 items-center gap-4 font-bold lg:flex xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className={cn(
                    "link-underline inline-flex items-center whitespace-nowrap py-2 font-display text-[11px] uppercase tracking-[0.26em] text-foreground/85 transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:text-primary xl:text-xs",
                    isActiveLink(link.href)
                      ? "text-primary after:w-full"
                      : "",
                    isHighlightedLink(link.href) &&
                      "rounded-sm border border-yellow-300/60 bg-yellow-500/20 px-2 py-2 text-yellow-100 shadow-lg shadow-yellow-500/30",
                    shouldBlink(link.href) &&
                      "animate-[pulse_1.2s_ease-in-out_infinite]",
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <a
                href="https://www.instagram.com/paper_slayer99/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center border border-border/60 bg-background/30 text-foreground/80 transition-[color,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                aria-label="Visit Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </nav>

            <CartIcon />

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 lg:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/40 bg-background/98 transition-[max-height,opacity] duration-300 lg:hidden",
          isMenuOpen ? "max-h-[75vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="mx-auto grid w-full max-w-7xl gap-2 px-4 py-4 font-bold sm:px-6 lg:px-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
              className={cn(
                "flex min-h-12 items-center justify-between border border-border/50 bg-card/45 px-4 py-3 font-display text-sm uppercase tracking-[0.24em] text-foreground/85 transition-[color,transform,border-color,background-color] duration-300 ease-out hover:translate-x-1 hover:border-primary/35 hover:bg-primary/5 hover:text-primary",
                isActiveLink(link.href)
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "",
                isHighlightedLink(link.href) &&
                  "border-yellow-300/60 bg-yellow-500/20 text-yellow-100 shadow-lg shadow-yellow-500/20",
                shouldBlink(link.href) &&
                  "animate-[pulse_1.2s_ease-in-out_infinite]",
              )}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          <a
            href="https://www.instagram.com/paper_slayer99/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-12 items-center justify-between border border-border/50 bg-card/45 px-4 py-3 font-display text-sm uppercase tracking-[0.24em] text-foreground/85 transition-[color,transform,border-color,background-color] duration-300 ease-out hover:translate-x-1 hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
          >
            <span>Instagram</span>
            <Instagram className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
