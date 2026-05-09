export interface Print {
  id: number;
  title: string;
  image_url: string;
  description?: string;
  price_inr?: number;
  is_sold?: boolean | string | number | null;
  for_sale?: boolean;
  size?: string;
  category?: string;
  category_id?: number;
}
