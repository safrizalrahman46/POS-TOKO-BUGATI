import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Promo } from '../types/promo';

export const promoService = {
  async getPromos(page = 1, limit = 100) {
    const res = await api.get<ApiResponse<Promo[]>>('/promos', { params: { page, limit } });
    return res.data;
  },
  async getActivePromos() {
    const res = await api.get<ApiResponse<Promo[]>>('/promos/active');
    return res.data;
  },
  async createPromo(data: Partial<Promo>) {
    const res = await api.post('/promos', data);
    return res.data;
  },
  async updatePromo(id: number, data: Partial<Promo>) {
    const res = await api.put(`/promos/${id}`, data);
    return res.data;
  },
  async deletePromo(id: number) {
    const res = await api.delete(`/promos/${id}`);
    return res.data;
  },
};
