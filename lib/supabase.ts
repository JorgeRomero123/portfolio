import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export type Pedido = {
  id: string;
  telefono: string;
  archivo_url: string;
  copias: number;
  tipo: 'color' | 'bn';
  status: 'pending' | 'printing' | 'done' | 'error';
  processing: boolean;
  error: string | null;
  printed_at: string | null;
  created_at: string;
};
