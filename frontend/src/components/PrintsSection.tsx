import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { ArtworkPreviewCarousel } from "@/components/ArtworkPreviewCarousel";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Print } from "@/types/print";

interface PrintsSectionProps {
  prints: Print[];
  initialCount?: number;
  isAdmin?: boolean;
  onDeletePrint?: (id: number) => void;
  onOpenPrint?: (print: Print) => void;
  onEditPrint?: (print: Print) => void;
}

export function PrintsSection({
  prints,
  initialCount = 4,
  isAdmin = false,
  onDeletePrint,
  onOpenPrint,
  onEditPrint,
}: PrintsSectionProps) {
  const [showPrintsModal, setShowPrintsModal] = useState(false);

  const visiblePrints = useMemo(
    () => prints.slice(0, initialCount),
    [prints, initialCount],
  );
  const hasOverflow = prints.length > visiblePrints.length;

  if (!prints || prints.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/55 p-4 shadow-[0_24px_80px_hsl(0_0%_0%/0.2)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_28%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
            <div className="hidden w-28 lg:block">
              <p className="font-display text-7xl leading-none text-primary/18 xl:text-8xl">
                01
              </p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
              <p className="mt-4 font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                Print Collection
              </p>
            </div>

            <div className="min-w-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 lg:hidden">
                    <span className="mobile-eyebrow text-primary">
                      01
                    </span>
                    <span className="mobile-label text-primary">
                      Print Collection
                    </span>
                  </div>

                  <h2 className="mobile-section-title mt-4 text-foreground">
                    Prints
                  </h2>

                  <p className="mobile-body-copy mt-4 max-w-2xl text-muted-foreground">
                    High-quality prints of selected artworks, available for
                    purchase.
                  </p>
                </div>

                {hasOverflow && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full lg:w-auto"
                    onClick={() => setShowPrintsModal(true)}
                  >
                    See More
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {hasOverflow ? (
                <ArtworkPreviewCarousel
                  items={prints}
                  isAdmin={isAdmin}
                  onDelete={onDeletePrint}
                  onOpen={onOpenPrint}
                  onEdit={onEditPrint}
                />
              ) : (
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {visiblePrints.map((print, index) => (
                    <ArtworkCard
                      key={print.id}
                      artwork={print}
                      priority={index < 2}
                      isAdmin={isAdmin}
                      onDelete={(id) => onDeletePrint?.(id)}
                      onOpen={onOpenPrint}
                      onEdit={onEditPrint}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPrintsModal} onOpenChange={setShowPrintsModal}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Prints</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {prints.map((print) => (
              <ArtworkCard
                key={print.id}
                artwork={print}
                isAdmin={isAdmin}
                onDelete={(id) => onDeletePrint?.(id)}
                onOpen={onOpenPrint}
                onEdit={onEditPrint}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
