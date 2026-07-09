import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Order, CreateOrderInput } from '../types/order';

export const orderService = {
  async createOrder(data: CreateOrderInput) {
    const res = await api.post<ApiResponse<Order>>('/orders', data);
    return res.data;
  },
  async getOrders(page = 1, limit = 10, status = '', startDate = '', endDate = '') {
    const res = await api.get<ApiResponse<Order[]>>('/orders', {
      params: { page, limit, status, start_date: startDate, end_date: endDate },
    });
    return res.data;
  },
  async getOrder(id: number) {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data;
  },
  async cancelOrder(id: number) {
    const res = await api.patch(`/orders/${id}/cancel`);
    return res.data;
  },
  async getHistory(page = 1, limit = 10, startDate = '', endDate = '', cashierId = '') {
    const res = await api.get<ApiResponse<Order[]>>('/orders/history', {
      params: { page, limit, start_date: startDate, end_date: endDate, cashier_id: cashierId },
    });
    return res.data;
  },
};
