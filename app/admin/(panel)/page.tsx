import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { brl } from '@/lib/money';

export default async function Resumo() {
  const db = supabaseAdmin();
  const count = async (q: any) => (await q).count || 0;
  const [toShip, pending, open, low] = await Promise.all([
    count(db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['paid', 'preparing'])),
    count(db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    count(db.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('last_sender_role', 'customer')),
    count(db.from('products').select('id', { count: 'exact', head: true }).not('stock', 'is', null).lte('stock', 2)),
  ]);
  const { data: recent } = await db.from('orders').select('id,number,total,status,created_at').in('status', ['paid', 'preparing', 'shipped', 'delivered']).order('created_at', { ascending: false }).limit(5);
  return (
    <>
      <h1>Resumo</h1>
      <div className="stats">
        <Link className="stat" href="/admin/pedidos?status=paid"><b>{toShip}</b>pedidos para enviar</Link>
        <Link className="stat" href="/admin/pedidos?status=pending"><b>{pending}</b>aguardando pagamento</Link>
        <Link className="stat" href="/admin/mensagens"><b>{open}</b>mensagens sem resposta</Link>
        <Link className="stat" href="/admin/produtos"><b>{low}</b>itens com estoque baixo</Link>
      </div>
      {toShip > 0 && <p><Link className="btn" href="/admin/imprimir?status=paid,preparing" target="_blank">Imprimir todos os pedidos para enviar</Link></p>}
      <h2>Últimos pedidos pagos</h2>
      <div className="table-wrap"><table><tbody>
        {(recent || []).map((o) => <tr key={o.id}><td><Link href={`/admin/pedidos/${o.id}`}>#{o.number}</Link></td><td>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td><td>{brl(o.total)}</td></tr>)}
        {!recent?.length && <tr><td className="muted">Nenhum pedido ainda.</td></tr>}
      </tbody></table></div>
    </>
  );
}
