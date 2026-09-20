'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { brl } from '@/lib/money';

export default function Carrinho() {
  const { items, subtotal, setQty, remove, ready } = useCart();
  if (!ready) return <div className="container page"><p className="muted">Carregando…</p></div>;
  if (!items.length) return (
    <div className="container page center"><h1>Sua sacola está vazia</h1><p className="muted">Escolha um item na vitrine para começar.</p><Link className="btn" href="/">Ver itens</Link></div>
  );
  return (
    <div className="container page">
      <h1>Sua sacola</h1>
      <div className="two-col">
        <div>
          {items.map((i) => (
            <div key={i.key} className="line-item">
              <div className="arch">{i.image ? <img src={i.image} alt="" /> : <span className="ph">✝</span>}</div>
              <div>
                <Link href={`/produto/${i.slug}`}><b>{i.name}</b></Link>
                <ul className="opt-list">
                  {i.optionsLabel.map((o) => <li key={o.group}>{o.group}: {o.value}</li>)}
                  {i.customText && <li className="custom-name">Nome: {i.customText}</li>}
                </ul>
                <div className="row" style={{ marginTop: '.5rem' }}>
                  <div className="qty"><button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Menos">−</button><span>{i.qty}</span><button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Mais">+</button></div>
                  <button className="btn ghost sm" onClick={() => remove(i.key)}>Remover</button>
                </div>
              </div>
              <div className="price">{brl(i.unitPrice * i.qty)}</div>
            </div>
          ))}
        </div>
        <aside className="panel">
          <div className="row spread"><span>Subtotal</span><b>{brl(subtotal)}</b></div>
          <p className="muted small">O frete é calculado na próxima etapa.</p>
          <Link className="btn block" href="/checkout">Finalizar compra</Link>
        </aside>
      </div>
    </div>
  );
}
