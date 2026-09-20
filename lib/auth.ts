import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export async function getUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function requireUser(next = '/') {
  const user = await getUser();
  if (!user) redirect('/entrar?next=' + encodeURIComponent(next));
  return user;
}

export async function requireAdmin() {
  const user = await requireUser('/admin');
  const { data } = await supabaseAdmin().from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') redirect('/');
  return user;
}
