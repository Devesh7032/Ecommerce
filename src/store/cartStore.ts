import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    sale_price: number | null;
    images: string[];
    stock_quantity: number;
    brand: string;
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotals: () => { subtotal: number; tax: number; delivery: number; total: number };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  fetchCart: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ items: [] });
      return;
    }

    set({ loading: true });
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);

    if (!error && data) {
      set({ items: data as unknown as CartItem[] });
    }
    set({ loading: false });
  },
  addItem: async (productId, quantity = 1) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const existing = get().items.find(item => item.product_id === productId);
    if (existing) {
      await get().updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity })
      .select('*, product:products(*)')
      .single();

    if (!error && data) {
      set({ items: [...get().items, data as unknown as CartItem] });
    }
  },
  removeItem: async (itemId) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      set({ items: get().items.filter(item => item.id !== itemId) });
    }
  },
  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(itemId);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select('*, product:products(*)')
      .single();

    if (!error && data) {
      set({
        items: get().items.map(item => item.id === itemId ? (data as unknown as CartItem) : item)
      });
    }
  },
  clearCart: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    set({ items: [] });
  },
  getTotals: () => {
    const items = get().items;
    const subtotal = items.reduce((acc, item) => {
      if (!item.product) return acc;
      const price = item.product.sale_price ?? item.product.price;
      return acc + price * item.quantity;
    }, 0);
    
    const tax = subtotal * 0.12; // 12% tax
    const delivery = subtotal > 200 || subtotal === 0 ? 0 : 25; // Free delivery over $200
    const total = subtotal + tax + delivery;

    return { subtotal, tax, delivery, total };
  }
}));
