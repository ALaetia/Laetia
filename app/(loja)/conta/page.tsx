import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';
import SignOut from './SignOut';

export const metadata = { title: 'Minha conta' };

export default async function Conta({ searchParams }: { searchParams: Promise<{ next?: string; completar?: string }> }) {
  const { next = '', completar } = await searchParams;
  const user = await requireUser('/conta');
  const sb = await supabaseServer();
  const { data: p } = await sb.from('profiles').select('role,full_name,phone,cpf_last4,postal_code,street,number,complement,district,city,state,consent_at').eq('id', user.id).single();
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <div className="row spread"><h1>Minha conta</h1><SignOut /></div>
      <p className="muted">{user.email}</p>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <Link className="btn ghost sm" href="/pedidos">Meus pedidos</Link>
        <Link className="btn ghost sm" href="/suporte">Suporte</Link>
        {p?.role === 'admin' && <Link className="btn sm" href="/admin">Painel da loja</Link>}
      </div>
      {completar && <div className="notice">Para comprar, precisamos dos seus dados de entrega.</div>}
      <ProfileForm profile={p} next={next.startsWith('/') && !next.startsWith('//') ? next : ''} />
    </div>
  );
}
