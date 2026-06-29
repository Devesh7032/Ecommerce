import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useCartStore } from './cartStore';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
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

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  moveToCart: (itemId: string, productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  fetchWishlist: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ items: [] });
      return;
    }

    set({ loading: true });
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', user.id);

    if (!error && data) {
      set({ items: data as unknown as WishlistItem[] });
    }
    set({ loading: false });
  },
  addItem: async (productId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const exists = get().items.some(item => item.product_id === productId);
    if (exists) return;

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id: productId })
      .select('*, product:products(*)')
      .single();

    if (!error && data) {
      set({ items: [...get().items, data as unknown as WishlistItem] });
    }
  },
  removeItem: async (itemId) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId);

    if (!error) {
      set({ items: get().items.filter(item => item.id !== itemId) });
    }
  },
  moveToCart: async (itemId, productId) => {
    const cartStore = useCartStore.getState();
    await cartStore.addItem(productId, 1);
    await get().removeItem(itemId);
  }
}));
