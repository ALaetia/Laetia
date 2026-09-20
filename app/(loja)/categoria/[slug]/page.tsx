import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { supabaseServer } from '@/lib/supabase/server';

export default async function Categoria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await supabaseServer();
  const { data: cat } = await sb.from('categories').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (!cat) notFound();
  const { data: products } = await sb.from('products').select('id,name,slug,base_price,images,stock').eq('category_id', cat.id).eq('active', true).order('created_at', { ascending: false });
  return (
    <div className="container page">
      <h1>{cat.name}</h1>
      {cat.description && <p className="muted">{cat.description}</p>}
      {products?.length ? <div className="grid" style={{ marginTop: '1.5rem' }}>{products.map((p: any) => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="muted">Nenhum item nesta categoria ainda.</p>}
    </div>
  );
}
