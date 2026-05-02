export interface Print {
  id: number;
  title: string;
  image_url: string;
  description?: string;
  price_inr?: number;
  is_sold?: boolean;
  for_sale?: boolean;
  size?: string;
  category?: string;
}
