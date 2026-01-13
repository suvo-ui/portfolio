import { Link } from "react-router-dom";
import { Instagram, Mail, ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="font-display text-2xl font-bold tracking-tight text-foreground"
            >
              ELENA<span className="text-primary">.</span>VOSS
            </Link>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-xs">
              Contemporary expressionist art exploring the boundaries between light, shadow, and emotion.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-widest text-foreground mb-4">
              Navigate
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                to="/#gallery"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Gallery
              </Link>
              <Link
                to="/#about"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-widest text-foreground mb-4">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:hello@elenavoss.art"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Mail className="h-4 w-4" />
                hello@elenavoss.art
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Instagram className="h-4 w-4" />
                @elenavoss.art
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Elena Voss. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest font-display group"
          >
            Back to top
            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
