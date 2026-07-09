import api from './api';
import type { ApiResponse } from '../types/auth';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  is_read: boolean;
  link: string;
  created_at: string;
}

export const notificationService = {
  async getNotifications(limit = 50) {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications', { params: { limit } });
    return res.data;
  },
  async markAsRead(id: number) {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  },
  async markAllAsRead() {
    const res = await api.post('/notifications/read');
    return res.data;
  },
};
