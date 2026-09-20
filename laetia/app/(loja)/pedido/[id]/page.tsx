import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { brl } from '@/lib/money';
import { STATUS_LABEL } from '@/lib/status';

export default async function Pedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ retorno?: string }> }) {
  const { id } = await params;
  const { retorno } = await searchParams;
  await requireUser('/pedido/' + id);
  const sb = await supabaseServer();
  const { data: o } = await sb.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle();
  if (!o) notFound();
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      {retorno === 'sucesso' && <div className="notice ok">Pagamento recebido! Assim que for confirmado, iniciamos o preparo do seu pedido.</div>}
      {retorno === 'pendente' && <div className="notice">Pagamento pendente. Assim que for confirmado, avisaremos aqui.</div>}
      {retorno === 'falha' && <div className="notice err">O pagamento não foi concluído. Você pode tentar novamente abaixo.</div>}
      <div className="row spread"><h1>Pedido #{o.number}</h1><span className="badge blue">{STATUS_LABEL[o.status]}</span></div>
      <div className="panel">
        {o.order_items.map((i: any) => (
          <div key={i.id} className="row spread" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--line)' }}>
            <div><b>{i.quantity}× {i.product_name}</b>
              <ul className="opt-list">{(i.options || []).map((x: any) => <li key={x.group}>{x.group}: {x.value}</li>)}{i.custom_text && <li className="custom-name">Nome: {i.custom_text}</li>}</ul></div>
            <span>{brl(i.unit_price * i.quantity)}</span>
          </div>
        ))}
        <div className="row spread" style={{ marginTop: '.75rem' }}><span>Frete ({o.shipping_service})</span><span>{brl(o.shipping_cost)}</span></div>
        <div className="row spread"><b>Total</b><b>{brl(o.total)}</b></div>
      </div>
      {o.tracking_code && <div className="notice ok" style={{ marginTop: '1rem' }}>Código de rastreio: <b>{o.tracking_code}</b> — <a href={`https://rastreamento.correios.com.br/app/index.php?objeto=${o.tracking_code}`} target="_blank" rel="noopener noreferrer">rastrear nos Correios</a></div>}
      {o.status === 'pending' && o.mp_init_point && <p style={{ marginTop: '1rem' }}><a className="btn" href={o.mp_init_point}>Pagar agora</a></p>}
      <p className="muted small" style={{ marginTop: '1rem' }}>Dúvidas? <Link href="/suporte">Fale com o suporte</Link>.</p>
    </div>
  );
}
