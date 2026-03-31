import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase para o Projeto: njrxfvyjinvhezbkskpc
const supabaseUrl = 'https://njrxfvyjinvhezbkskpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcnhmdnlqaW52aGV6Ymtza3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzA1NDksImV4cCI6MjA5MDU0NjU0OX0.eNd3Hvfr2fDVySJL0Z4QmJJmw5mTZq9cmu15w-cTSTs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
