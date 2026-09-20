'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { brl } from '@/lib/money';
import { maskCEP } from '@/lib/validators';

export default function CheckoutClient({ profile: p, email }: { profile: any; email: string }) {
  const { items, subtotal, ready, clear } = useCart();
  const [opts, setOpts] = useState<any[]>([]);
  const [sel, setSel] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!ready || !items.length) { setLoading(false); return; }
    fetch('/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cep: p.postal_code, items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }) })
      .then((r) => r.json()).then((d) => { setOpts(d.options || []); setSel(d.options?.[0]?.id || ''); })
      .catch(() => setErr('Não foi possível calcular o frete.')).finally(() => setLoading(false));
  }, [ready]); // eslint-disable-line

  const ship = opts.find((o) => o.id === sel);

  async function pay() {
    setBusy(true); setErr('');
    const r = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: sel, items: items.map((i) => ({ productId: i.productId, qty: i.qty, selections: i.selections, customText: i.customText })) }),
    });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Erro ao finalizar.'); setBusy(false); return; }
    clear();
    window.location.href = d.url;
  }

  if (!ready) return <div className="container page"><p className="muted">Carregando…</p></div>;
  if (!items.length) return <div className="container page center"><h1>Sua sacola está vazia</h1><Link className="btn" href="/">Ver itens</Link></div>;

  return (
    <div className="container page">
      <h1>Finalizar compra</h1>
      <div className="two-col">
        <div className="stack">
          <section className="panel">
            <div className="row spread"><h2>Entrega</h2><Link href="/conta?next=/checkout" className="small">Alterar</Link></div>
            <p style={{ margin: 0 }}>
              {p.full_name} · CPF ***.***.***-{p.cpf_last4}<br />
              {p.street}, {p.number}{p.complement ? ` — ${p.complement}` : ''}<br />
              {p.district} · {p.city}/{p.state} · CEP {maskCEP(p.postal_code)}<br />
              <span className="muted small">{p.phone} · {email}</span>
            </p>
          </section>
          <section className="panel">
            <h2>Frete</h2>
            {loading ? <p className="muted">Calculando…</p> : opts.map((o) => (
              <label key={o.id} className="radio-card">
                <input type="radio" name="ship" checked={sel === o.id} onChange={() => setSel(o.id)} />
                <span style={{ flex: 1 }}>{o.name}{o.days ? <span className="muted small"> · {o.days} dias úteis</span> : null}</span>
                <b>{o.price === 0 ? 'Grátis' : brl(o.price)}</b>
              </label>
            ))}
          </section>
        </div>
        <aside className="panel">
          <h2>Resumo</h2>
          {items.map((i) => <div key={i.key} className="row spread small"><span>{i.qty}× {i.name}{i.customText ? ` (${i.customText})` : ''}</span><span>{brl(i.unitPrice * i.qty)}</span></div>)}
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '1rem 0' }} />
          <div className="row spread"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          <div className="row spread"><span>Frete</span><span>{ship ? (ship.price === 0 ? 'Grátis' : brl(ship.price)) : '—'}</span></div>
          <div className="row spread" style={{ fontSize: '1.15rem', margin: '.5rem 0 1rem' }}><b>Total</b><b>{brl(subtotal + (ship?.price || 0))}</b></div>
          {err && <div className="notice err" role="alert">{err}</div>}
          <button className="btn block" onClick={pay} disabled={busy || !ship}>{busy ? 'Abrindo pagamento…' : 'Pagar com Mercado Pago'}</button>
          <p className="muted small" style={{ marginTop: '.75rem' }}>Você será levado ao Mercado Pago (Pix, cartão ou boleto). Não guardamos dados de cartão.</p>
        </aside>
      </div>
    </div>
  );
}
