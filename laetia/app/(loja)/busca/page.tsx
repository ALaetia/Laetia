import ProductCard from '@/components/ProductCard';
import { supabaseServer } from '@/lib/supabase/server';

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const term = q.replace(/[%,()]/g, ' ').trim().slice(0, 60);
  const sb = await supabaseServer();
  const { data: products } = term
    ? await sb.from('products').select('id,name,slug,base_price,images,stock').eq('active', true).ilike('name', `%${term}%`).limit(48)
    : { data: [] as any[] };
  return (
    <div className="container page">
      <h1>{term ? `Resultados para “${term}”` : 'Buscar'}</h1>
      {products?.length ? <div className="grid" style={{ marginTop: '1.5rem' }}>{products.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="muted">{term ? 'Nada encontrado. Tente outra palavra.' : 'Digite o que procura no campo acima.'}</p>}
    </div>
  );
}
