import { useEffect, useState, type MouseEvent } from "react";
import { Instagram, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { CartIcon } from "@/components/CartIcon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTabSelection } from "@/context/TabSelectionContext";

const navLinks = [
  { href: "/", label: "Gallery", tab: "gallery" as const, anchor: "gallery" },
  { href: "/", label: "Prints", tab: "print" as const, anchor: "gallery" },
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
  const { selectedTab, setSelectedTab } = useTabSelection();

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
    tab?: "gallery" | "print",
    anchor?: string,
  ) => {
    setIsMenuOpen(false);

    if (tab && anchor) {
      event.preventDefault();
      setSelectedTab(tab);

      if (location.pathname !== "/") {
        navigate("/", { state: { tab, scrollTo: anchor } });
        return;
      }

      const target = document.getElementById(anchor);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

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

  const isActiveLink = (href: string, tab?: "gallery" | "print") => {
    if (tab && location.pathname === "/") {
      return selectedTab === tab && location.hash === "";
    }

    if (href.startsWith("/#")) {
      return location.pathname === "/" && location.hash === href.substring(1);
    }

    return location.pathname === href && location.hash === "";
  };

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
          ? "border-transparent bg-transparent backdrop-blur-0 sm:border-border/50 sm:bg-background/94 sm:backdrop-blur-xl"
          : "border-transparent bg-transparent backdrop-blur-0 sm:bg-background/30 sm:backdrop-blur-md",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-3 py-1.5 sm:min-h-[4.5rem] sm:py-2">
          <Link
            to="/"
            className="min-w-0 shrink truncate font-display text-base font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-xl lg:text-2xl"
          >
            PAPER<span className="text-primary">.</span>SLAYER
          </Link>

          <div className="flex min-w-0 items-center gap-2 lg:gap-4">
            <nav className="hidden min-w-0 items-center gap-4 font-bold lg:flex xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  to={link.href}
                  onClick={(event) =>
                    handleNavClick(event, link.href, link.tab, link.anchor)
                  }
                  className={cn(
                    "link-underline inline-flex items-center whitespace-nowrap py-2 font-display text-[11px] uppercase tracking-[0.26em] text-foreground/85 transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:text-primary xl:text-xs",
                    isActiveLink(link.href, link.tab)
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

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 lg:hidden"
                  aria-label={
                    isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                  }
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[88vw] max-w-sm border-border/60 bg-background/98 px-4 pb-6 pt-12 sm:px-6 lg:hidden"
              >
                <SheetHeader className="text-left">
                  <SheetTitle className="font-display text-xl tracking-tight">
                    PAPER<span className="text-primary">.</span>SLAYER
                  </SheetTitle>
                  <SheetDescription className="mobile-body-copy max-w-xs">
                    Browse the collection, learn about the studio, or jump into
                    courses without covering the artwork for long.
                  </SheetDescription>
                </SheetHeader>

                <nav className="mt-6 grid gap-2 font-bold">
                  {navLinks.map((link) => (
                    <Link
                      key={`${link.href}-${link.label}`}
                      to={link.href}
                      onClick={(event) =>
                        handleNavClick(event, link.href, link.tab, link.anchor)
                      }
                      className={cn(
                        "flex min-h-12 items-center justify-between border border-border/50 bg-card/45 px-4 py-3 font-display text-sm uppercase tracking-[0.18em] text-foreground/85 transition-[color,transform,border-color,background-color] duration-300 ease-out hover:translate-x-1 hover:border-primary/35 hover:bg-primary/5 hover:text-primary",
                        isActiveLink(link.href, link.tab)
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
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-2 flex min-h-12 items-center justify-between border border-border/50 bg-card/45 px-4 py-3 font-display text-sm uppercase tracking-[0.18em] text-foreground/85 transition-[color,transform,border-color,background-color] duration-300 ease-out hover:translate-x-1 hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>Instagram</span>
                    <Instagram className="h-5 w-5" />
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
