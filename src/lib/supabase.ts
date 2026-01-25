// Re-export the supabase client from the integrations folder
export { supabase } from '@/integrations/supabase/client';

// Re-export types from the generated types file
export type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Convenience type aliases for common tables
export type Profile = Tables<'profiles'>;
export type ShopeeVenda = Tables<'shopee_vendas'>;
export type ShopeeClick = Tables<'shopee_clicks'>;
export type ShopeeCredential = Tables<'shopee_credentials'>;
export type InvestmentManual = Tables<'investments_manual'>;

// Type for inserting/updating
import type { Tables } from '@/integrations/supabase/types';
