import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Category, Product, ProductInput, ProductVariant, VariantInput } from '../types/product';

export const productService = {
  async getCategories(page = 1, limit = 100, search = '') {
    const res = await api.get<ApiResponse<Category[]>>('/categories', { params: { page, limit, search } });
    return res.data;
  },
  async createCategory(data: { name: string; description?: string }) {
    const res = await api.post('/categories', data);
    return res.data;
  },
  async updateCategory(id: number, data: { name: string; description?: string }) {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },
  async deleteCategory(id: number) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },

  async getProducts(page = 1, limit = 20, search = '', categoryId = '') {
    const res = await api.get<ApiResponse<Product[]>>('/products', {
      params: { page, limit, search, category_id: categoryId },
    });
    return res.data;
  },
  async searchProducts(query: string) {
    const res = await api.get<ApiResponse<Product[]>>('/products/search', { params: { q: query } });
    return res.data;
  },
  async getByBarcode(barcode: string) {
    const res = await api.get<ApiResponse<Product>>('/products/barcode', { params: { barcode } });
    return res.data;
  },
  async getProduct(id: number) {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data;
  },
  async createProduct(data: ProductInput) {
    const res = await api.post('/products', data);
    return res.data;
  },
  async updateProduct(id: number, data: Partial<ProductInput>) {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },
  async deleteProduct(id: number) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
  async updateStock(id: number, quantity: number) {
    const res = await api.patch(`/products/${id}/stock`, { quantity });
    return res.data;
  },

  async getVariants(productId: number) {
    const res = await api.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`);
    return res.data;
  },
  async createVariant(productId: number, data: VariantInput) {
    const res = await api.post(`/products/${productId}/variants`, data);
    return res.data;
  },
  async updateVariant(productId: number, variantId: number, data: Partial<VariantInput & { is_active?: boolean }>) {
    const res = await api.put(`/products/${productId}/variants/${variantId}`, data);
    return res.data;
  },
  async deleteVariant(productId: number, variantId: number) {
    const res = await api.delete(`/products/${productId}/variants/${variantId}`);
    return res.data;
  },
};
