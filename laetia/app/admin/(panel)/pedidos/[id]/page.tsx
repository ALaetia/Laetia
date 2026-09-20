import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { safeDecrypt } from '@/lib/crypto';
import { maskCPF, maskCEP } from '@/lib/validators';
import { brl } from '@/lib/money';
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/status';
import { updateOrder, generateLabel } from '../../../actions';

export default async function PedidoAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const { id } = await params;
  const { salvo, erro } = await searchParams;
  const { data: o } = await supabaseAdmin().from('orders').select('*, order_items(*)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const s = o.shipping;
  return (
    <>
      <p><Link href="/admin/pedidos">← Pedidos</Link></p>
      <div className="row spread"><h1>Pedido #{o.number}</h1><Link className="btn" target="_blank" href={`/admin/imprimir?ids=${o.id}`}>Imprimir pedido + etiqueta</Link></div>
      {salvo && <div className="notice ok">Salvo.</div>}
      {erro && <div className="notice err">{erro}</div>}
      <div className="two-col">
        <div className="stack">
          <section className="panel">
            <h2>Itens</h2>
            {o.order_items.map((i: any) => (
              <div key={i.id} className="row spread" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--line)' }}>
                <div><b>{i.quantity}× {i.product_name}</b>
                  <ul className="opt-list">{(i.options || []).map((x: any) => <li key={x.group}>{x.group}: {x.value}</li>)}{i.custom_text && <li className="custom-name">Nome: {i.custom_text}</li>}</ul></div>
                <span>{brl(i.unit_price * i.quantity)}</span>
              </div>
            ))}
            <div className="row spread" style={{ marginTop: '.5rem' }}><span>Frete ({o.shipping_service})</span><span>{brl(o.shipping_cost)}</span></div>
            <div className="row spread"><b>Total</b><b>{brl(o.total)}</b></div>
            <p className="muted small">Pagamento: {o.payment_status} · Origem: {o.channel}{o.mp_payment_id ? ` · MP #${o.mp_payment_id}` : ''}</p>
          </section>
          <section className="panel">
            <h2>Cliente e entrega</h2>
            <p style={{ margin: 0 }}>
              <b>{s.name}</b><br />CPF {maskCPF(safeDecrypt(s.cpf_enc)) || '—'}<br />{s.phone} · {s.email}<br /><br />
              {s.street}, {s.number}{s.complement ? ` — ${s.complement}` : ''}<br />{s.district}<br />{s.city}/{s.state} · CEP {maskCEP(s.postal_code)}
            </p>
          </section>
        </div>
        <div className="stack">
          <form action={updateOrder} className="panel">
            <input type="hidden" name="id" value={o.id} />
            <h2>Andamento</h2>
            <div className="field"><label htmlFor="st">Situação</label><select id="st" name="status" defaultValue={o.status}>{STATUS_ORDER.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</select></div>
            <div className="field"><label htmlFor="tc">Código de rastreio</label><input id="tc" name="tracking_code" defaultValue={o.tracking_code || ''} /></div>
            <div className="field"><label htmlFor="nt">Anotações internas</label><textarea id="nt" name="notes" defaultValue={o.notes || ''} /></div>
            <button className="btn">Salvar</button>
          </form>
          <section className="panel">
            <h2>Etiqueta dos Correios</h2>
            {o.label_url ? <p><a className="btn" href={o.label_url} target="_blank" rel="noopener noreferrer">Abrir etiqueta oficial (PDF)</a></p>
              : <form action={generateLabel}><input type="hidden" name="id" value={o.id} /><button className="btn" disabled={!['paid', 'preparing'].includes(o.status)}>Gerar etiqueta (Melhor Envio)</button>
                <p className="muted small" style={{ marginTop: '.5rem' }}>Compra o frete com o saldo do Melhor Envio. Sem integração, use “Imprimir pedido + etiqueta” para uma etiqueta de endereçamento.</p></form>}
          </section>
        </div>
      </div>
    </>
  );
}
