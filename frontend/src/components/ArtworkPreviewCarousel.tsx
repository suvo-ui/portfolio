import { useEffect, useState, type FocusEvent } from "react";

import {
  ArtworkCard,
  type Artwork as ArtworkCardArtwork,
} from "@/components/ArtworkCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface ArtworkPreviewCarouselProps<T extends ArtworkCardArtwork> {
  items: T[];
  itemType?: "artwork" | "print";
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onOpen?: (artwork: T) => void;
  onEdit?: (artwork: T) => void;
  autoPlayMs?: number;
}

export function ArtworkPreviewCarousel<T extends ArtworkCardArtwork>({
  items,
  itemType = "artwork",
  isAdmin = false,
  onDelete,
  onOpen,
  onEdit,
  autoPlayMs = 3600,
}: ArtworkPreviewCarouselProps<T>) {
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api || isPaused || items.length < 2) return;

    const intervalId = window.setInterval(() => {
      api.scrollNext();
    }, autoPlayMs);

    return () => window.clearInterval(intervalId);
  }, [api, autoPlayMs, isPaused, items.length]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (!event.currentTarget.contains(nextFocusedElement)) {
      setIsPaused(false);
    }
  };

  return (
    <div
      className="relative mt-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={handleBlur}
    >
      <Carousel
        className="w-full"
        setApi={setApi}
        opts={{
          align: "start",
          loop: items.length > 1,
        }}
      >
        <CarouselContent>
          {items.map((artwork, index) => (
            <CarouselItem
              key={artwork.id}
              className="basis-full pl-0 sm:basis-1/2 sm:pl-4 md:basis-1/3 lg:basis-1/4"
            >
              <ArtworkCard
                artwork={artwork}
                itemType={itemType}
                priority={index < 2}
                isAdmin={isAdmin}
                onDelete={(id) => onDelete?.(id)}
                onOpen={
                  onOpen ? (selectedArtwork) => onOpen(selectedArtwork as T) : undefined
                }
                onEdit={
                  onEdit ? (selectedArtwork) => onEdit(selectedArtwork as T) : undefined
                }
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {items.length > 1 && (
          <>
            <CarouselPrevious className="left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 border-border/60 bg-background/86 backdrop-blur-md hover:bg-background md:inline-flex lg:-left-5" />
            <CarouselNext className="right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 border-border/60 bg-background/86 backdrop-blur-md hover:bg-background md:inline-flex lg:-right-5" />
          </>
        )}
      </Carousel>
    </div>
  );
}
