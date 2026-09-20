import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { brl } from '@/lib/money';
import { STATUS_LABEL } from '@/lib/status';

export const metadata = { title: 'Meus pedidos' };

export default async function Pedidos() {
  await requireUser('/pedidos');
  const sb = await supabaseServer();
  const { data: orders } = await sb.from('orders').select('id,number,status,total,created_at').order('created_at', { ascending: false });
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <h1>Meus pedidos</h1>
      {!orders?.length ? <p className="muted">Você ainda não fez pedidos.</p> : orders.map((o: any) => (
        <Link key={o.id} href={`/pedido/${o.id}`} className="panel row spread" style={{ marginBottom: '.75rem', color: 'inherit' }}>
          <span><b>Pedido #{o.number}</b><br /><span className="muted small">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span></span>
          <span><span className="badge blue">{STATUS_LABEL[o.status]}</span> <b>{brl(o.total)}</b></span>
        </Link>
      ))}
    </div>
  );
}
