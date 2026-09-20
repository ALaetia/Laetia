import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { brl } from '@/lib/money';
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/status';

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  let q = supabaseAdmin().from('orders').select('id,number,status,total,created_at,channel,shipping,tracking_code').order('created_at', { ascending: false }).limit(200);
  if (status && STATUS_ORDER.includes(status)) q = q.eq('status', status);
  const { data: orders } = await q;
  return (
    <>
      <div className="row spread">
        <h1>Pedidos</h1>
        <Link className="btn" href={`/admin/imprimir?status=${status || 'paid,preparing'}`} target="_blank">Imprimir {status ? STATUS_LABEL[status]?.toLowerCase() : 'pagos e em preparo'}</Link>
      </div>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <Link className={'btn sm ' + (status ? 'ghost' : '')} href="/admin/pedidos">Todos</Link>
        {STATUS_ORDER.map((s) => <Link key={s} className={'btn sm ' + (status === s ? '' : 'ghost')} href={`/admin/pedidos?status=${s}`}>{STATUS_LABEL[s]}</Link>)}
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Origem</th><th>Total</th><th>Situação</th></tr></thead>
        <tbody>
          {(orders || []).map((o: any) => (
            <tr key={o.id}>
              <td><Link href={`/admin/pedidos/${o.id}`}>#{o.number}</Link></td>
              <td>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
              <td>{o.shipping?.name}</td><td>{o.channel}</td><td>{brl(o.total)}</td>
              <td><span className={'badge ' + (o.status === 'pending' || o.status === 'cancelled' ? '' : 'ok')}>{STATUS_LABEL[o.status]}</span></td>
            </tr>
          ))}
          {!orders?.length && <tr><td colSpan={6} className="muted">Nenhum pedido.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
