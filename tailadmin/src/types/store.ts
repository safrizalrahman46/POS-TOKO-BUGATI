export interface StoreSettings {
  id: number;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_website: string;
  receipt_header: string;
  receipt_footer: string;
  receipt_show_logo: boolean;
  receipt_show_customer: boolean;
  receipt_size: '80mm' | '58mm';
  receipt_footer_type: 'text' | 'image';
  receipt_footer_image: string;
  logo: string;
  tax_label: string;
  tax_rate: number;
  currency: string;
  updated_at: string;
}

export interface StoreSettingsInput {
  store_name: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_website?: string;
  receipt_header?: string;
  receipt_footer?: string;
  receipt_show_logo?: boolean;
  receipt_show_customer?: boolean;
  receipt_size?: '80mm' | '58mm';
  receipt_footer_type?: 'text' | 'image';
  receipt_footer_image?: string;
  logo?: string;
  tax_label?: string;
  tax_rate?: number;
  currency?: string;
}
