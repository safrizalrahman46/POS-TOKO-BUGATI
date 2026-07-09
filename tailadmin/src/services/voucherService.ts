import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Voucher, AutoDiscount } from '../types/voucher';

export const voucherService = {
  async getVouchers(page = 1, limit = 100) {
    const res = await api.get<ApiResponse<Voucher[]>>('/vouchers', { params: { page, limit } });
    return res.data;
  },
  async createVoucher(data: Partial<Voucher>) {
    const res = await api.post('/vouchers', data);
    return res.data;
  },
  async updateVoucher(id: number, data: Partial<Voucher>) {
    const res = await api.put(`/vouchers/${id}`, data);
    return res.data;
  },
  async deleteVoucher(id: number) {
    const res = await api.delete(`/vouchers/${id}`);
    return res.data;
  },
  async validateVoucher(code: string, subtotal: number) {
    const res = await api.post('/vouchers/validate', { code, subtotal });
    return res.data;
  },

  async getAutoDiscounts(page = 1, limit = 100) {
    const res = await api.get<ApiResponse<AutoDiscount[]>>('/auto-discounts', { params: { page, limit } });
    return res.data;
  },
  async createAutoDiscount(data: Partial<AutoDiscount>) {
    const res = await api.post('/auto-discounts', data);
    return res.data;
  },
  async updateAutoDiscount(id: number, data: Partial<AutoDiscount>) {
    const res = await api.put(`/auto-discounts/${id}`, data);
    return res.data;
  },
  async deleteAutoDiscount(id: number) {
    const res = await api.delete(`/auto-discounts/${id}`);
    return res.data;
  },
};
