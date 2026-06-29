import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: 'customer' | 'admin';
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  initialize: async () => {
    if (get().initialized) return;

    set({ loading: true });

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    let profile: Profile | null = null;

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        profile = data as Profile;
      }
    }

    set({ user, profile, loading: false, initialized: true });

    // Listen for auth events
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      let currentProfile: Profile | null = null;

      if (currentUser) {
        // Fetch profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
        
        if (!error && data) {
          currentProfile = data as Profile;
        } else if (error) {
          console.error("Error fetching profile on auth change:", error);
        }
      }

      set({ user: currentUser, profile: currentProfile, loading: false });
    });
  },
  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  }
}));
