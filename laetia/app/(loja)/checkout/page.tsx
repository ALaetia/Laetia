import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { profileComplete } from '@/lib/validators';
import CheckoutClient from './CheckoutClient';

export default async function Checkout() {
  const user = await requireUser('/checkout');
  const sb = await supabaseServer();
  const { data: p } = await sb.from('profiles').select('full_name,phone,cpf_last4,postal_code,street,number,complement,district,city,state').eq('id', user.id).single();
  // cpf_enc não é legível pelo navegador; usamos cpf_last4 como indício de cadastro completo
  if (!profileComplete({ ...p, cpf_enc: p?.cpf_last4 })) redirect('/conta?next=/checkout&completar=1');
  return <CheckoutClient profile={p} email={user.email!} />;
}
