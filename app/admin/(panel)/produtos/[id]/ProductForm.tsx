'use client';
import { useState } from 'react';
import { saveProduct } from '../../../actions';

type Val = { id: string; label: string; price_delta: number | string; swatch: string; active: boolean; shape: string; image_url: string };
type Grp = { id: string; name: string; role: string; required: boolean; text_enabled: boolean; text_label: string; text_price: number | string; text_max: number; values: Val[] };
const uid = () => crypto.randomUUID();

export default function ProductForm({ product: p, categories }: { product: any; categories: any[] }) {
  const [images, setImages] = useState<string[]>(p?.images || []);
  const [groups, setGroups] = useState<Grp[]>(
    (p?.option_groups || []).sort((a: any, b: any) => a.sort - b.sort).map((g: any) => ({
      id: g.id, name: g.name, role: g.role || '', required: g.required, text_enabled: g.text_enabled, text_label: g.text_label || 'Com nome', text_price: g.text_price, text_max: g.text_max,
      values: (g.option_values || []).sort((a: any, b: any) => a.sort - b.sort).map((v: any) => ({ id: v.id, label: v.label, price_delta: v.price_delta, swatch: v.swatch || '', active: v.active, shape: v.shape || '', image_url: v.image_url || '' })),
    })),
  );

  const upG = (gi: number, patch: Partial<Grp>) => setGroups(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const upV = (gi: number, vi: number, patch: Partial<Val>) => upG(gi, { values: groups[gi].values.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });
  const addGroup = (preset?: string) => setGroups([...groups, { id: uid(), name: preset || '', role: '', required: true, text_enabled: false, text_label: 'Com nome', text_price: 0, text_max: 30, values: [] }]);
  const addVal = (gi: number) => upG(gi, { values: [...groups[gi].values, { id: uid(), label: '', price_delta: 0, swatch: '', active: true, shape: '', image_url: '' }] });
  const move = (i: number) => { const a = [...images]; const [x] = a.splice(i, 1); a.unshift(x); setImages(a); };

  return (
    <form action={saveProduct} encType="multipart/form-data" className="stack">
      {p && <input type="hidden" name="id" value={p.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="groups" value={JSON.stringify(groups)} />

      <section className="panel">
        <h2>Informações</h2>
        <div className="form-grid">
          <div className="field c4"><label htmlFor="n">Nome</label><input id="n" name="name" defaultValue={p?.name} required /></div>
          <div className="field c2"><label htmlFor="pr">Preço base (R$)</label><input id="pr" name="base_price" inputMode="decimal" defaultValue={p ? String(p.base_price).replace('.', ',') : ''} required /></div>
          <div className="field c3"><label htmlFor="ct">Categoria</label><select id="ct" name="category_id" defaultValue={p?.category_id || ''}><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field c3"><label htmlFor="sh">Frase curta</label><input id="sh" name="short_description" maxLength={200} defaultValue={p?.short_description || ''} /></div>
          <div className="field c6"><label htmlFor="ds">Descrição</label><textarea id="ds" name="description" defaultValue={p?.description || ''} /></div>
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} /> Visível na loja</label>
          <label className="check"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Mostrar na página inicial</label>
          <div className="row"><label htmlFor="fs" className="small muted">Ordem na página inicial</label><input id="fs" className="inp" style={{ width: 80 }} name="featured_sort" type="number" defaultValue={p?.featured_sort || 0} /></div>
        </div>
      </section>

      <section className="panel">
        <h2>Fotos</h2>
        <p className="muted small">A primeira foto é a principal. Envie quantas quiser.</p>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          {images.map((u, i) => (
            <div key={u} className="img-tile">
              <div className="arch"><img src={u} alt="" /></div>
              <div className="tools"><button type="button" onClick={() => move(i)} disabled={i === 0}>{i === 0 ? 'Principal' : 'Tornar principal'}</button><button type="button" onClick={() => setImages(images.filter((_, k) => k !== i))}>Remover</button></div>
            </div>
          ))}
        </div>
        <div className="field" style={{ marginTop: '1rem' }}><label htmlFor="ni">Adicionar fotos (até 4 MB cada; envie poucas por vez, no máximo 5 MB no total)</label><input id="ni" type="file" name="newImages" accept="image/*" multiple /></div>
      </section>

      <section className="panel">
        <h2>Opções de escolha</h2>
        <p className="muted small">Ex.: Cor da pedra, Entremeio, Medalha, Crucifixo. Cada opção pode somar um valor ao preço. Ative “com nome” em um grupo para o cliente digitar um nome. Escolha em “Desenha:” qual parte do terço cada grupo pinta na <b>montagem visual</b> da página do produto (a cor vem do quadradinho de cor). Para medalha e crucifixo, você também pode enviar uma imagem própria em PNG transparente.</p>
        {groups.map((g, gi) => (
          <div key={g.id} className="group-box">
            <div className="row spread">
              <div className="row">
                <input className="inp" style={{ maxWidth: 240 }} placeholder="Nome do grupo (ex.: Cor da pedra)" value={g.name} onChange={(e) => upG(gi, { name: e.target.value })} />
                <select className="inp" style={{ maxWidth: 230 }} value={g.role} onChange={(e) => upG(gi, { role: e.target.value })} aria-label="Parte do terço na montagem visual" title="Parte do terço que este grupo desenha na montagem visual">
                  <option value="">Sem desenho na montagem</option>
                  <option value="stone">Desenha: contas (pedra)</option>
                  <option value="spacer">Desenha: entremeios</option>
                  <option value="medal">Desenha: medalha</option>
                  <option value="crucifix">Desenha: crucifixo</option>
                </select>
              </div>
              <div className="row">
                <label className="check"><input type="checkbox" checked={g.required} onChange={(e) => upG(gi, { required: e.target.checked })} /> Obrigatório</label>
                <button type="button" className="btn danger sm" onClick={() => setGroups(groups.filter((_, i) => i !== gi))}>Remover grupo</button>
              </div>
            </div>
            <div style={{ margin: '.75rem 0' }}>
              {g.values.map((v, vi) => (
                <div key={v.id} className="val-row">
                  <input className="inp v-name" placeholder="Nome da opção" value={v.label} onChange={(e) => upV(gi, vi, { label: e.target.value })} />
                  <input className="inp v-price" placeholder="+ R$" inputMode="decimal" value={v.price_delta} onChange={(e) => upV(gi, vi, { price_delta: e.target.value.replace(',', '.') })} aria-label="Acréscimo no preço" />
                  <input type="color" value={v.swatch || '#dddddd'} onChange={(e) => upV(gi, vi, { swatch: e.target.value })} aria-label="Cor" title={g.role === 'medal' || g.role === 'crucifix' ? 'Cor do metal (se não escolher, usa a cor do entremeio)' : 'Cor'} />
                  {v.swatch && (g.role === 'medal' || g.role === 'crucifix') && <button type="button" className="btn ghost sm" onClick={() => upV(gi, vi, { swatch: '' })} title="Usar a cor do entremeio">limpar cor</button>}
                  {(g.role === 'medal' || g.role === 'crucifix') && (
                    <>
                      <select className="inp v-shape" value={v.shape} onChange={(e) => upV(gi, vi, { shape: e.target.value })} aria-label="Formato do desenho">
                        <option value="">Formato padrão</option>
                        {g.role === 'medal'
                          ? <><option value="oval">Oval</option><option value="round">Redonda</option><option value="heart">Coração</option></>
                          : <><option value="simple">Simples</option><option value="flared">Pontas alargadas</option><option value="detail">Trabalhado</option></>}
                      </select>
                      <span className="v-img">
                        {v.image_url && <img src={v.image_url} alt="" />}
                        <input type="file" name={`valImg:${v.id}`} accept="image/png,image/webp,image/jpeg" aria-label="Imagem própria (PNG transparente, até 1 MB)" title="Imagem própria (PNG transparente, até 1 MB) — substitui o desenho" />
                        {v.image_url && <button type="button" className="btn ghost sm" onClick={() => upV(gi, vi, { image_url: '' })}>tirar imagem</button>}
                      </span>
                    </>
                  )}
                  <button type="button" className="btn ghost sm" onClick={() => upG(gi, { values: g.values.filter((_, i) => i !== vi) })} aria-label="Remover opção">×</button>
                </div>
              ))}
              <button type="button" className="btn ghost sm" onClick={() => addVal(gi)}>+ Adicionar opção</button>
            </div>
            <div className="row">
              <label className="check"><input type="checkbox" checked={g.text_enabled} onChange={(e) => upG(gi, { text_enabled: e.target.checked })} /> Permitir “com nome” neste grupo</label>
              {g.text_enabled && <>
                <input className="inp" style={{ width: 140 }} value={g.text_label} onChange={(e) => upG(gi, { text_label: e.target.value })} aria-label="Texto da opção" />
                <input className="inp" style={{ width: 90 }} placeholder="+ R$" value={g.text_price} onChange={(e) => upG(gi, { text_price: e.target.value.replace(',', '.') })} aria-label="Acréscimo" />
                <input className="inp" style={{ width: 90 }} type="number" min={1} max={60} value={g.text_max} onChange={(e) => upG(gi, { text_max: Number(e.target.value) })} aria-label="Máx. de letras" title="Máximo de letras" />
              </>}
            </div>
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn ghost sm" onClick={() => addGroup()}>+ Novo grupo de opções</button>
          {!groups.length && <button type="button" className="btn ghost sm" onClick={() => setGroups([['Cor da pedra', 'stone'], ['Entremeio', 'spacer'], ['Medalha', 'medal'], ['Crucifixo', 'crucifix']].map(([n, r], i) => ({ id: uid(), name: n, role: r, required: true, text_enabled: i === 0, text_label: 'Com nome', text_price: 0, text_max: 30, values: [] })))}>Usar modelo de terço</button>}
        </div>
      </section>

      <section className="panel">
        <h2>Estoque e envio</h2>
        <div className="form-grid">
          <div className="field c2"><label htmlFor="sk">Estoque (vazio = sem controle)</label><input id="sk" name="stock" type="number" min={0} defaultValue={p?.stock ?? ''} /></div>
          <div className="field c2"><label htmlFor="sku">Código (SKU)</label><input id="sku" name="sku" defaultValue={p?.sku || ''} /></div>
          <div className="field c2"><label htmlFor="w">Peso (g)</label><input id="w" name="weight_g" type="number" defaultValue={p?.weight_g ?? 200} /></div>
          <div className="field c2"><label htmlFor="h">Altura (cm)</label><input id="h" name="height_cm" type="number" defaultValue={p?.height_cm ?? 4} /></div>
          <div className="field c2"><label htmlFor="wi">Largura (cm)</label><input id="wi" name="width_cm" type="number" defaultValue={p?.width_cm ?? 12} /></div>
          <div className="field c2"><label htmlFor="l">Comprimento (cm)</label><input id="l" name="length_cm" type="number" defaultValue={p?.length_cm ?? 16} /></div>
        </div>
      </section>

      <div><button className="btn">Salvar produto</button></div>
    </form>
  );
}
