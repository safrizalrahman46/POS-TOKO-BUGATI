import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, User, ApiResponse } from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    localStorage.removeItem('token');
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data!;
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post('/auth/register', data);
  },

  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
