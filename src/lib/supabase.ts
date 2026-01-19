/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for the Matrix app.
 * 
 * Usage:
 * import { supabase } from '@/src/lib/supabase';
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[MatrixFlix] Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
}

/**
 * Supabase client instance
 * Type-safe client using generated database types
 */
export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            // Disable auth persistence for this read-only app
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

export default supabase;
