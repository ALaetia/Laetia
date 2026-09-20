import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPrivateSettings } from '@/lib/settings';
import { safeDecrypt } from '@/lib/crypto';
import { maskCPF, maskCEP } from '@/lib/validators';
import { brl } from '@/lib/money';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Imprimir pedidos', robots: { index: false } };

export default async function Imprimir({ searchParams }: { searchParams: Promise<{ ids?: string; status?: string }> }) {
  await requireAdmin();
  const { ids, status } = await searchParams;
  const db = supabaseAdmin();
  let q = db.from('orders').select('*, order_items(*)').order('number');
  if (ids) q = q.in('id', ids.split(',').slice(0, 100));
  else q = q.in('status', (status || 'paid,preparing').split(',').slice(0, 6));
  const [{ data: orders }, { sender }] = await Promise.all([q, getPrivateSettings()]);

  return (
    <div className="print-page">
      <div className="print-bar no-print">
        <PrintButton />
        <span>{orders?.length || 0} pedido(s). Cada um gera 1 folha A4 (conferência) + 1 etiqueta 10×15 cm. Na impressão, escolha “Tamanho real” e sem margens extras.</span>
      </div>
      {(orders || []).map((o: any) => {
        const s = o.shipping;
        return (
          <div key={o.id}>
            <section className="sheet">
              <h1 style={{ fontFamily: 'Georgia, serif' }}>Pedido #{o.number}</h1>
              <p>{new Date(o.created_at).toLocaleString('pt-BR')} · {o.channel}</p>
              <table>
                <thead><tr><th>Qtd</th><th>Item e escolhas</th><th>Valor</th></tr></thead>
                <tbody>
                  {o.order_items.map((i: any) => (
                    <tr key={i.id}>
                      <td>{i.quantity}</td>
                      <td><b>{i.product_name}</b>
                        <ul className="opt-list" style={{ color: '#000' }}>
                          {(i.options || []).map((x: any) => <li key={x.group}>{x.group}: <b>{x.value}</b></li>)}
                          {i.custom_text && <li style={{ fontSize: '1.15rem' }}>NOME: <b>{i.custom_text}</b></li>}
                        </ul></td>
                      <td>{brl(i.unit_price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: '1rem' }}>Frete ({o.shipping_service}): {brl(o.shipping_cost)} · <b>Total: {brl(o.total)}</b></p>
              <p><b>{s.name}</b> · CPF {maskCPF(safeDecrypt(s.cpf_enc))} · {s.phone}<br />{s.street}, {s.number}{s.complement ? ` — ${s.complement}` : ''} · {s.district} · {s.city}/{s.state} · {maskCEP(s.postal_code)}</p>
              {o.notes && <p>Obs.: {o.notes}</p>}
              <p className="small">Conferido por: ____________________</p>
            </section>
            <section className="label">
              <div className="to">
                <b>DESTINATÁRIO</b>
                <p style={{ fontSize: '14pt', margin: '3mm 0' }}><b>{s.name}</b><br />{s.street}, {s.number}{s.complement ? ` — ${s.complement}` : ''}<br />{s.district}<br />{s.city}/{s.state}</p>
                <div className="cep">CEP {maskCEP(s.postal_code)}</div>
                <p className="small" style={{ marginTop: '4mm' }}>Tel.: {s.phone}</p>
              </div>
              <div className="from">
                <b>REMETENTE</b><br />{sender.name || '(preencha em Configurações)'}<br />
                {sender.street}{sender.number ? `, ${sender.number}` : ''}{sender.complement ? ` — ${sender.complement}` : ''} · {sender.district}<br />
                {sender.city}/{sender.state} · CEP {maskCEP(sender.postal_code || '')}
              </div>
              <p className="small" style={{ margin: '2mm 0 0' }}>Pedido #{o.number}{o.tracking_code ? ` · Rastreio ${o.tracking_code}` : ''}{o.label_url ? ' · (existe etiqueta oficial no pedido)' : ''}</p>
            </section>
          </div>
        );
      })}
      {!orders?.length && <p style={{ padding: '2rem' }}>Nenhum pedido para imprimir.</p>}
    </div>
  );
}
