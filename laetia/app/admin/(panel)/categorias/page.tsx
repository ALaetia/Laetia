import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveCategory, deleteCategory } from '../../actions';

export default async function Categorias() {
  const { data: cats } = await supabaseAdmin().from('categories').select('*').order('sort');
  return (
    <>
      <h1>Categorias</h1>
      <p className="muted">As categorias ativas aparecem no menu da loja.</p>
      <form action={saveCategory} className="panel row" style={{ marginBottom: '1.5rem' }}>
        <input className="inp" style={{ maxWidth: 280 }} name="name" placeholder="Nome da nova categoria (ex.: Medalhas)" required />
        <button className="btn">Adicionar categoria</button>
      </form>
      <div className="stack">
        {(cats || []).map((c) => (
          <div key={c.id} className="panel">
            <form action={saveCategory} className="row">
              <input type="hidden" name="id" value={c.id} />
              <input className="inp" style={{ maxWidth: 240 }} name="name" defaultValue={c.name} aria-label="Nome" required />
              <input className="inp" style={{ maxWidth: 260 }} name="description" defaultValue={c.description || ''} placeholder="Descrição (opcional)" aria-label="Descrição" />
              <input className="inp" style={{ width: 70 }} name="sort" type="number" defaultValue={c.sort} aria-label="Ordem" title="Ordem no menu" />
              <label className="check"><input type="checkbox" name="active" defaultChecked={c.active} /> Ativa</label>
              <button className="btn sm">Salvar</button>
            </form>
            <form action={deleteCategory} style={{ marginTop: '.5rem' }}><input type="hidden" name="id" value={c.id} /><button className="btn danger sm">Excluir</button> <span className="muted small">Os produtos ficam sem categoria.</span></form>
          </div>
        ))}
      </div>
    </>
  );
}
