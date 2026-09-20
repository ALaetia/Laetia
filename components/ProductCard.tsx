import Link from 'next/link';
import { brl } from '@/lib/money';

export default function ProductCard({ p }: { p: any }) {
  const soldOut = p.stock != null && p.stock <= 0;
  return (
    <Link href={`/produto/${p.slug}`} className="card">
      <div className="arch">
        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <span className="ph">✝</span>}
      </div>
      <h3>{p.name}</h3>
      <div className="price">{soldOut ? <span className="badge">Esgotado</span> : <>a partir de {brl(p.base_price)}</>}</div>
    </Link>
  );
}
