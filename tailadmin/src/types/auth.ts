export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'kasir';
  permissions?: string;
  photo?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  permissions?: string;
  photo?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
}
