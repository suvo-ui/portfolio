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
          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
            {/* LEFT LABEL */}
            <div className="hidden w-28 lg:block">
              <p className="font-display text-7xl text-primary/18">01</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
              <p className="mt-4 font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                Print Collection
              </p>
            </div>

            {/* MAIN */}
            <div className="min-w-0">
              {/* HEADER */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <h2 className="mobile-section-title mt-4 text-foreground">
                    Prints
                  </h2>

                  <p className="mobile-body-copy mt-4 text-muted-foreground">
                    High-quality prints available for purchase.
                  </p>
                </div>

                {hasOverflow && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowPrintsModal(true)}
                  >
                    See More
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* CONTENT */}
              {hasOverflow ? (
                <ArtworkPreviewCarousel
                  items={prints}
                  itemType="print"
                  isAdmin={isAdmin}
                  onDelete={onDeletePrint}
                  onOpen={onOpenPrint}
                  onEdit={onEditPrint}
                />
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {visiblePrints.map((print, index) => (
                    <ArtworkCard
                      key={print.id}
                      artwork={print}
                      itemType="print"
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

      {/* SEE MORE MODAL */}
      <Dialog open={showPrintsModal} onOpenChange={setShowPrintsModal}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>All Prints</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {prints.map((print) => (
              <ArtworkCard
                key={print.id}
                artwork={print}
                itemType="print"
                isAdmin={isAdmin}
                onDelete={(id) => onDeletePrint?.(id)}
                // 🔥 CRITICAL FIX: close dialog first
                onOpen={(item) => {
                  setShowPrintsModal(false);
                  setTimeout(() => onOpenPrint?.(item), 50);
                }}
                onEdit={(item) => {
                  setShowPrintsModal(false);
                  setTimeout(() => onEditPrint?.(item), 50);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
