import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 Missing Supabase environment variables! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Netlify dashboard.');
}

// Use placeholders to prevent createClient from throwing a fatal error and crashing the whole React app
export const supabase = createClient(
    supabaseUrl || 'https://missing-url.supabase.co', 
    supabaseAnonKey || 'missing-key'
);
