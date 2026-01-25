import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  last_sync_date: string | null;
}

export interface ShopeeCredential {
  id: string;
  user_id: string;
  account_name: string;
  is_active: boolean;
}

export interface ShopeeVenda {
  id: string;
  user_id: string;
  order_id: string;
  item_id: number | null;
  purchase_time: string | null;
  actual_amount: number | null;
  net_commission: number | null;
  total_commission: number | null;
  status: string | null;
  sub_id1: string | null;
  sub_id2: string | null;
  sub_id3: string | null;
  sub_id4: string | null;
  sub_id5: string | null;
  channel: string | null;
  shop_name: string | null;
}

export interface ShopeeClick {
  id: string;
  user_id: string;
  click_time: string | null;
  region: string | null;
  referrer: string | null;
  sub_id1: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id'> & { id?: string };
        Update: Partial<Profile>;
      };
      shopee_credentials: {
        Row: ShopeeCredential;
        Insert: Omit<ShopeeCredential, 'id'> & { id?: string };
        Update: Partial<ShopeeCredential>;
      };
      shopee_vendas: {
        Row: ShopeeVenda;
        Insert: Omit<ShopeeVenda, 'id'> & { id?: string };
        Update: Partial<ShopeeVenda>;
      };
      shopee_clicks: {
        Row: ShopeeClick;
        Insert: Omit<ShopeeClick, 'id'> & { id?: string };
        Update: Partial<ShopeeClick>;
      };
    };
  };
};
