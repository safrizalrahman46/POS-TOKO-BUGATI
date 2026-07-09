import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Customer, CustomerInput } from '../types/customer';

export const customerService = {
  async getCustomers(page = 1, limit = 20, search = '') {
    const res = await api.get<ApiResponse<Customer[]>>('/customers', {
      params: { page, limit, search },
    });
    return res.data;
  },

  async getCustomer(id: number) {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data;
  },

  async searchCustomers(query: string) {
    const res = await api.get<ApiResponse<Customer[]>>('/customers/search', { params: { q: query } });
    return res.data;
  },

  async createCustomer(data: CustomerInput) {
    const res = await api.post('/customers', data);
    return res.data;
  },

  async updateCustomer(id: number, data: Partial<CustomerInput>) {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },

  async deleteCustomer(id: number) {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
};
