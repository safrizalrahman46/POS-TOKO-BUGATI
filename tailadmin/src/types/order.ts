export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  discount_type: string;
  discount_value: number;
  subtotal: number;
}

export interface Order {
  id: number;
  invoice_number: string;
  cashier_id: number;
  customer_name: string;
  status: 'pending' | 'paid' | 'cancelled';
  subtotal: number;
  discount_total: number;
  voucher_code: string;
  voucher_discount: number;
  tax_total: number;
  grand_total: number;
  payment_method: 'cash' | 'debit' | 'qris';
  payment_amount: number;
  change_amount: number;
  created_at: string;
  cashier?: { id: number; full_name: string };
  items?: OrderItem[];
}

export interface CartItem {
  product_id: number;
  variant_id?: number;
  variant_name?: string;
  product_name: string;
  price: number;
  quantity: number;
  stock: number;
  product_image?: string;
}

export interface CreateOrderInput {
  items: { product_id: number; variant_id?: number; quantity: number }[];
  voucher_code?: string;
  customer_name?: string;
  payment_method: string;
  payment_amount: number;
}
