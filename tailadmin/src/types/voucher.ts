export interface Voucher {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface AutoDiscount {
  id: number;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  min_purchase: number;
  min_items: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}
