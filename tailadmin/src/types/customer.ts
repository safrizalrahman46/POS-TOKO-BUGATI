export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  poin: number;
  total_transactions: number;
  total_spent: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}
