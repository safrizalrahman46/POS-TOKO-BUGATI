import { create } from 'zustand';
import type { CartItem } from '../types/order';

interface CartItemInput {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
  variant_id?: number;
  variant_name?: string;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  voucherCode: string;
  voucherDiscount: number;
  addItem: (product: CartItemInput) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setVoucherCode: (code: string) => void;
  setVoucherDiscount: (discount: number) => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

function itemKey(productId: number, variantId?: number): string {
  return variantId ? `${productId}-${variantId}` : `${productId}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  voucherCode: '',
  voucherDiscount: 0,

  addItem: (product) => {
    const items = get().items;
    const key = itemKey(product.id, product.variant_id);
    const existing = items.find(
      (item) => itemKey(item.product_id, item.variant_id) === key
    );
    if (existing) {
      if (existing.quantity >= existing.stock) return;
      set({
        items: items.map((item) =>
          itemKey(item.product_id, item.variant_id) === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product_id: product.id,
            variant_id: product.variant_id,
            variant_name: product.variant_name,
            product_name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
            product_image: product.image || '',
          },
        ],
      });
    }
  },

  removeItem: (productId, variantId) => {
    const key = itemKey(productId, variantId);
    set({ items: get().items.filter((item) => itemKey(item.product_id, item.variant_id) !== key) });
  },

  updateQuantity: (productId, quantity, variantId) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    const key = itemKey(productId, variantId);
    set({
      items: get().items.map((item) =>
        itemKey(item.product_id, item.variant_id) === key
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      ),
    });
  },

  clearCart: () => {
    set({ items: [], customerName: '', voucherCode: '', voucherDiscount: 0 });
  },

  setCustomerName: (name) => set({ customerName: name }),
  setVoucherCode: (code) => set({ voucherCode: code }),
  setVoucherDiscount: (discount) => set({ voucherDiscount: discount }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
