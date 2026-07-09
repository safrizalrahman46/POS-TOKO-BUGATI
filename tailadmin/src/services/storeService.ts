import api from './api';
import type { ApiResponse } from '../types/auth';
import type { StoreSettings, StoreSettingsInput } from '../types/store';

export const storeService = {
  async getSettings() {
    const res = await api.get<ApiResponse<StoreSettings>>('/store/settings');
    return res.data;
  },

  async updateSettings(data: StoreSettingsInput) {
    const res = await api.put('/store/settings', data);
    return res.data;
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post('/store/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getDefaultSettings(): Promise<StoreSettings> {
    return {
      id: 0,
      store_name: 'TOKO BUGATI',
      store_address: 'Jl. Contoh No. 123, Kota',
      store_phone: '0812-3456-7890',
      store_email: '',
      store_website: '',
      receipt_header: 'Terima kasih atas kunjungan Anda',
      receipt_footer: 'Barang yang sudah dibeli tidak dapat ditukar/kembali',
      receipt_show_logo: true,
      receipt_show_customer: true,
      receipt_size: '80mm',
      receipt_footer_type: 'text',
      receipt_footer_image: '',
      logo: '',
      tax_label: 'PPN 11%',
      tax_rate: 11,
      currency: 'Rp',
      updated_at: new Date().toISOString(),
    };
  },
};
