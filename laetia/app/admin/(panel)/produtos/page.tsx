import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { brl } from '@/lib/money';

export default async function Produtos() {
  const { data: products } = await supabaseAdmin().from('products').select('id,name,base_price,images,active,featured,stock,categories(name)').order('created_at', { ascending: false });
  return (
    <>
      <div className="row spread"><h1>Produtos</h1><Link className="btn" href="/admin/produtos/novo">Novo produto</Link></div>
      <div className="table-wrap"><table>
        <thead><tr><th></th><th>Nome</th><th>Categoria</th><th>Preço base</th><th>Estoque</th><th>Situação</th></tr></thead>
        <tbody>
          {(products || []).map((p: any) => (
            <tr key={p.id}>
              <td style={{ width: 56 }}>{p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />}</td>
              <td><Link href={`/admin/produtos/${p.id}`}>{p.name}</Link></td>
              <td>{p.categories?.name || '—'}</td>
              <td>{brl(p.base_price)}</td>
              <td>{p.stock ?? 'sem controle'}</td>
              <td>{p.active ? <span className="badge ok">Ativo</span> : <span className="badge">Oculto</span>} {p.featured && <span className="badge blue">Na página inicial</span>}</td>
            </tr>
          ))}
          {!products?.length && <tr><td colSpan={6} className="muted">Nenhum produto. Clique em “Novo produto”.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
