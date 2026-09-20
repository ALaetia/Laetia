import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Ignora RLS. Usar SOMENTE no servidor, depois de checar quem está pedindo. */
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
