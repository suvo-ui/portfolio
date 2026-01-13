import urbanNights1 from "@/assets/gallery/urban-nights-1.jpg";
import urbanNights2 from "@/assets/gallery/urban-nights-2.jpg";
import goldenHorizons1 from "@/assets/gallery/golden-horizons-1.jpg";
import goldenHorizons2 from "@/assets/gallery/golden-horizons-2.jpg";
import movement1 from "@/assets/gallery/movement-1.jpg";
import movement2 from "@/assets/gallery/movement-2.jpg";
import { Artwork, GalleryCategory } from "@/types/artwork";

export const artworks: Artwork[] = [
  {
    id: "urban-glow",
    title: "Urban Glow",
    description: "A vibrant exploration of city life after dark, capturing the electric energy of rain-soaked streets and neon reflections. This piece represents the pulse of urban existence—the constant movement, the fleeting moments of beauty in chaos.",
    medium: "Oil on Canvas",
    dimensions: "48 × 48 inches",
    year: 2024,
    image: urbanNights1,
    category: "urban-nights",
    featured: true,
  },
  {
    id: "metropolitan-dusk",
    title: "Metropolitan Dusk",
    description: "The iconic skyline bathed in the warm embrace of sunset. This painting captures that magical moment when day surrenders to night, and the city transforms into a sea of lights.",
    medium: "Oil on Canvas",
    dimensions: "60 × 60 inches",
    year: 2024,
    image: urbanNights2,
    category: "urban-nights",
    featured: true,
  },
  {
    id: "eternal-sunset",
    title: "Eternal Sunset",
    description: "A meditation on the endless cycle of day and night, rendered in thick impasto strokes that seem to pulse with life. The golden light speaks to the warmth we all seek in fleeting moments.",
    medium: "Oil on Canvas",
    dimensions: "36 × 36 inches",
    year: 2023,
    image: goldenHorizons1,
    category: "golden-horizons",
    featured: true,
  },
  {
    id: "ocean-surge",
    title: "Ocean Surge",
    description: "The raw power and untamed beauty of the sea captured in a moment of dramatic intensity. Waves crash with an energy that speaks to our own inner turbulence and the peace that follows.",
    medium: "Oil on Canvas",
    dimensions: "48 × 48 inches",
    year: 2024,
    image: goldenHorizons2,
    category: "golden-horizons",
  },
  {
    id: "arabesque",
    title: "Arabesque",
    description: "A study in grace and motion, this piece captures the ephemeral beauty of dance. The figure seems to float between reality and dream, suspended in a moment of pure artistic expression.",
    medium: "Oil on Canvas",
    dimensions: "40 × 40 inches",
    year: 2023,
    image: movement1,
    category: "movement",
    featured: true,
  },
  {
    id: "inner-light",
    title: "Inner Light",
    description: "A portrait that explores the depths of human emotion through bold, expressive brushwork. The subject's gaze invites the viewer into a moment of profound connection and understanding.",
    medium: "Oil on Canvas",
    dimensions: "36 × 36 inches",
    year: 2024,
    image: movement2,
    category: "movement",
  },
];

export const categories: GalleryCategory[] = [
  {
    id: "urban-nights",
    name: "Urban Nights",
    description: "Cityscapes that capture the electric pulse of metropolitan life after dark",
    artworks: artworks.filter((a) => a.category === "urban-nights"),
  },
  {
    id: "golden-horizons",
    name: "Golden Horizons",
    description: "Seascapes and sunsets drenched in warm, amber light",
    artworks: artworks.filter((a) => a.category === "golden-horizons"),
  },
  {
    id: "movement",
    name: "Movement",
    description: "Figure studies exploring the beauty of human form in motion",
    artworks: artworks.filter((a) => a.category === "movement"),
  },
];

export const getArtworkById = (id: string): Artwork | undefined => {
  return artworks.find((a) => a.id === id);
};

export const getFeaturedArtworks = (): Artwork[] => {
  return artworks.filter((a) => a.featured);
};
