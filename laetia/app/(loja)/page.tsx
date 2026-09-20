import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { supabaseServer } from '@/lib/supabase/server';
import { getPublicSettings } from '@/lib/settings';

export default async function Home() {
  const sb = await supabaseServer();
  const s = await getPublicSettings();
  let { data: products } = await sb.from('products').select('id,name,slug,base_price,images,stock').eq('active', true).eq('featured', true).order('featured_sort').limit(24);
  if (!products?.length) ({ data: products } = await sb.from('products').select('id,name,slug,base_price,images,stock').eq('active', true).order('created_at', { ascending: false }).limit(24));

  return (
    <div className="container">
      <section className="intro">
        <h1>{s.homeTitle}</h1>
        <p>{s.homeSubtitle}</p>
      </section>
      {products?.length ? (
        <div className="grid">{products.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="panel center" style={{ margin: '2rem 0' }}>
          <p>Ainda não há itens na vitrine.</p>
          <p className="muted small">No painel, abra Produtos, cadastre um item e marque “Mostrar na página inicial”. <Link href="/admin/produtos">Ir para produtos</Link></p>
        </div>
      )}
    </div>
  );
}
