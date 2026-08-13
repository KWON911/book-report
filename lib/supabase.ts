import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize with default values to allow build-time module loading
// At runtime, these will be set from environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabaseClient: SupabaseClient = createClient(url, key);
