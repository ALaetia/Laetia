import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import ProductForm from './ProductForm';
import { deleteProduct } from '../../../actions';

export default async function EditarProduto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const { id } = await params;
  const { salvo, erro } = await searchParams;
  const db = supabaseAdmin();
  const { data: categories } = await db.from('categories').select('id,name').order('sort');
  let product: any = null;
  if (id !== 'novo') {
    const { data } = await db.from('products').select('*, option_groups(*, option_values(*))').eq('id', id).maybeSingle();
    if (!data) notFound();
    product = data;
  }
  return (
    <>
      <p><Link href="/admin/produtos">← Produtos</Link></p>
      <h1>{product ? product.name : 'Novo produto'}</h1>
      {salvo && <div className="notice ok">Alterações salvas.</div>}
      {erro && <div className="notice err">{erro}</div>}
      <ProductForm product={product} categories={categories || []} />
      {product && (
        <form action={deleteProduct} style={{ marginTop: '2rem' }}>
          <input type="hidden" name="id" value={product.id} />
          <button className="btn danger sm">Excluir produto</button>
        </form>
      )}
    </>
  );
}
