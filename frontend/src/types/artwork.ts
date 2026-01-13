export interface Artwork {
  id: string;
  title: string;
  description: string;
  medium: string;
  dimensions: string;
  year: number;
  image: string;
  category: string;
  featured?: boolean;
}

export interface GalleryCategory {
  id: string;
  name: string;
  description: string;
  artworks: Artwork[];
}
