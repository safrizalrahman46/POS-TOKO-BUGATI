import api from './api';
import type { ApiResponse } from '../types/auth';

export interface DashboardStats {
  today_revenue: number;
  today_orders: number;
  total_products: number;
  low_stock_products: number;
  today_transactions: number;
}

export interface DailySale {
  date: string;
  total: number;
  order_count: number;
}

export interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export const dashboardService = {
  async getStats() {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data;
  },
  async getReports(params: { start_date?: string; end_date?: string; payment_method?: string; cashier_id?: string }) {
    const res = await api.get('/dashboard/reports', { params });
    return res.data;
  },
  async exportExcel(params: { start_date?: string; end_date?: string }) {
    const res = await api.get('/dashboard/reports/export-excel', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
  async exportPdf(params: { start_date?: string; end_date?: string }) {
    const res = await api.get('/dashboard/reports/export-pdf', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
