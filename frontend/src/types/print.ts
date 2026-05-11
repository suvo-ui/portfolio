import type { ImageVariants } from "@/lib/imageVariants";

export interface Print {
  id: number;
  title: string;
  image_url: string;
  image_variants?: ImageVariants | null;
  description?: string;
  price_inr?: number;
  is_sold?: boolean | string | number | null;
  for_sale?: boolean;
  size?: string;
  category?: string;
  category_id?: number;
}
