import { createClient } from '@supabase/supabase-js';
import { hostingerClient } from './apiClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || '';
const useNodeBackend = import.meta.env.VITE_USE_NODE_BACKEND !== 'false';

// Default Supabase client instance
const nativeSupabase = createClient(
    supabaseUrl || 'https://missing-url.supabase.co', 
    supabaseAnonKey || 'missing-key'
);

// If VITE_USE_NODE_BACKEND is true (or running on autokundali.com), use the Hostinger Node.js + MySQL backend
export const supabase: any = useNodeBackend ? hostingerClient : nativeSupabase;

