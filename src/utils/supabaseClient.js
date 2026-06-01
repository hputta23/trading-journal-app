import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdqzzrnvgxueqaeqjjzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcXp6cm52Z3h1ZXFhZXFqanpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDU1NTEsImV4cCI6MjA5NTkyMTU1MX0._Zpem2x1GgBQfHZe1cVtBCK-6xqNI6DIpdWxxKNPYnM';

export const supabase = createClient(supabaseUrl, supabaseKey);
