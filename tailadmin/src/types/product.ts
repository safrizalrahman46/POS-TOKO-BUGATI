export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariantInput {
  name: string;
  barcode?: string;
  price: number;
  stock?: number;
  min_stock?: number;
}

export interface Product {
  id: number;
  category_id: number;
  barcode: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  image: string;
  is_active: boolean;
  has_variants: boolean;
  created_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductInput {
  category_id: number;
  barcode?: string;
  name: string;
  price: number;
  cost_price?: number;
  stock?: number;
  min_stock?: number;
  image?: string;
  is_active?: boolean;
}
