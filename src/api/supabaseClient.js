import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (Carregada via .env para segurança total)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
