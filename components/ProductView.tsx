'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { brl } from '@/lib/money';
import { priceFor, validateSelection } from '@/lib/pricing';
import { useCart } from './CartProvider';
import RosaryPreview from './RosaryPreview';

export default function ProductView({ product }: { product: any }) {
  const router = useRouter();
  const { add } = useCart();
  const [img, setImg] = useState(0);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [withName, setWithName] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');

  const groups = (product.option_groups || []).sort((a: any, b: any) => a.sort - b.sort);
  const hasBuilder = groups.some((g: any) => g.role);
  const [view, setView] = useState<'build' | 'photos'>(hasBuilder ? 'build' : 'photos');
  const showBuild = hasBuilder && (view === 'build' || !product.images?.length);
  const pick = (role: string) => {
    const g = groups.find((x: any) => x.role === role);
    return g ? (g.option_values || []).find((v: any) => v.id === sel[g.id]) || null : null;
  };
  const part = (v: any) => (v ? { color: v.swatch, shape: v.shape, image: v.image_url } : null);
  const customText = withName ? name : '';
  const { unit } = useMemo(() => priceFor(product, sel, customText), [product, sel, customText]);
  const soldOut = product.stock != null && product.stock <= 0;

  function submit() {
    setErr('');
    if (withName && !name.trim()) return setErr('Escreva o nome que deseja.');
    const v: any = validateSelection(product, sel, customText);
    if (!v.ok) return setErr(v.error);
    add({
      productId: product.id, slug: product.slug, name: product.name, image: product.images?.[0] || null,
      unitPrice: v.unit, qty, selections: sel, customText: v.text || '',
      optionsLabel: v.details.map((d: any) => ({ group: d.group, value: d.value })),
    });
    router.push('/carrinho');
  }

  return (
    <div className="product">
      <div className="gallery">
        {hasBuilder && product.images?.length > 0 && (
          <div className="tabs" role="tablist" aria-label="Modo de visualização">
            <button role="tab" aria-selected={showBuild} onClick={() => setView('build')}>Montar o seu</button>
            <button role="tab" aria-selected={!showBuild} onClick={() => setView('photos')}>Fotos</button>
          </div>
        )}
        {showBuild ? (
          <>
            <div className="arch builder">
              <RosaryPreview
                stone={pick('stone')?.swatch} spacer={pick('spacer')?.swatch}
                medal={part(pick('medal'))} crucifix={part(pick('crucifix'))}
                name={withName ? name.trim() : ''}
              />
            </div>
            <p className="muted small" style={{ marginTop: '.6rem' }}>Prévia ilustrativa: ela se monta conforme você escolhe. As fotos mostram o acabamento real.</p>
          </>
        ) : (
          <>
            <div className="arch">{product.images?.[img] ? <img src={product.images[img]} alt={product.name} /> : <span className="ph">✝</span>}</div>
            {product.images?.length > 1 && (
              <div className="thumbs">
                {product.images.map((u: string, i: number) => (
                  <button key={u} onClick={() => setImg(i)} aria-current={i === img} aria-label={`Foto ${i + 1}`}><img src={u} alt="" /></button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div>
        <h1>{product.name}</h1>
        {product.short_description && <p className="muted">{product.short_description}</p>}
        <p className="price" style={{ fontSize: '1.4rem' }}>{brl(unit)}</p>

        {groups.map((g: any) => {
          const values = (g.option_values || []).filter((v: any) => v.active !== false).sort((a: any, b: any) => a.sort - b.sort);
          if (!values.length) return null;
          return (
            <fieldset key={g.id} className="opt-group">
              <legend>{g.name}{g.required ? '' : ' (opcional)'}</legend>
              <div className="chips">
                {values.map((v: any) => (
                  <label key={v.id} className="chip">
                    <input type="radio" name={g.id} checked={sel[g.id] === v.id} onChange={() => setSel({ ...sel, [g.id]: v.id })} />
                    <span>
                      {v.swatch && <i className="swatch" style={{ background: v.swatch }} />}
                      {v.label}{Number(v.price_delta) > 0 && <small className="muted"> +{brl(v.price_delta)}</small>}
                    </span>
                  </label>
                ))}
              </div>
              {g.text_enabled && (
                <div style={{ marginTop: '.75rem' }}>
                  <label className="check">
                    <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} />
                    <span>{g.text_label || 'Com nome'}{Number(g.text_price) > 0 && <span className="muted"> (+{brl(g.text_price)})</span>}</span>
                  </label>
                  {withName && (
                    <div className="field" style={{ marginTop: '.5rem' }}>
                      <label htmlFor="nm">Nome nas contas (até {g.text_max || 30} letras)</label>
                      <input id="nm" value={name} maxLength={g.text_max || 30} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria" />
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="total-bar">
          {err && <div className="notice err" role="alert">{err}</div>}
          <div className="row">
            <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">−</button><span>{qty}</span><button onClick={() => setQty(Math.min(50, qty + 1))} aria-label="Mais">+</button></div>
            <button className="btn" style={{ flex: 1 }} onClick={submit} disabled={soldOut}>{soldOut ? 'Esgotado' : `Adicionar à sacola · ${brl(unit * qty)}`}</button>
          </div>
        </div>

        {product.description && <div style={{ marginTop: '1.5rem' }}><h2>Sobre o item</h2><p style={{ whiteSpace: 'pre-line' }}>{product.description}</p></div>}
      </div>
    </div>
  );
}
