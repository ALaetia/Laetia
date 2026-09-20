import { getPublicSettings, getPrivateSettings } from '@/lib/settings';
import { saveSettings } from '../../actions';

export default async function Config({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const { salvo, erro } = await searchParams;
  const [p, { sender: s }] = await Promise.all([getPublicSettings(), getPrivateSettings()]);
  return (
    <>
      <h1>Configurações</h1>
      {salvo && <div className="notice ok">Configurações salvas.</div>}
      {erro && <div className="notice err">{erro}</div>}
      <form action={saveSettings} encType="multipart/form-data" className="stack">
        <section className="panel">
          <h2>Logo</h2>
          <p className="muted small">Aparece no topo da loja. Use PNG com fundo transparente (ideal: pelo menos 400 px de largura), até 2 MB. Sem logo, aparece o nome da loja em texto.</p>
          {p.logoUrl && <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', display: 'inline-block' }}><img src={p.logoUrl} alt="Logo atual" style={{ height: 48, width: 'auto' }} /></div>}
          <div className="field"><label htmlFor="lg">{p.logoUrl ? 'Trocar logo' : 'Enviar logo'}</label><input id="lg" type="file" name="logo" accept="image/png,image/jpeg,image/webp" /></div>
          {p.logoUrl && <label className="check" style={{ marginBottom: '1.5rem' }}><input type="checkbox" name="removeLogo" /> Remover a logo atual</label>}
          <h2>Loja</h2>
          <div className="form-grid">
            <div className="field c3"><label htmlFor="a">Nome da loja</label><input id="a" name="storeName" defaultValue={p.storeName} /></div>
            <div className="field c3"><label htmlFor="b">WhatsApp (com DDD)</label><input id="b" name="whatsapp" placeholder="11999999999" defaultValue={p.whatsapp} /></div>
            <div className="field c6"><label htmlFor="c">Mensagem inicial do WhatsApp</label><input id="c" name="whatsappMessage" defaultValue={p.whatsappMessage} /></div>
            <div className="field c3"><label htmlFor="d">Título da página inicial</label><input id="d" name="homeTitle" defaultValue={p.homeTitle} /></div>
            <div className="field c3"><label htmlFor="e">Frase abaixo do título</label><input id="e" name="homeSubtitle" defaultValue={p.homeSubtitle} /></div>
          </div>
        </section>
        <section className="panel">
          <h2>Frete</h2>
          <div className="form-grid">
            <div className="field c3"><label htmlFor="f">Frete fixo (R$), usado se o Melhor Envio não estiver ligado</label><input id="f" name="shippingFallback" inputMode="decimal" defaultValue={String(p.shippingFallback)} /></div>
            <div className="field c3"><label htmlFor="g">Frete grátis a partir de (R$, 0 = desligado)</label><input id="g" name="freeShippingAbove" inputMode="decimal" defaultValue={String(p.freeShippingAbove)} /></div>
          </div>
        </section>
        <section className="panel">
          <h2>Remetente (aparece na etiqueta)</h2>
          <p className="muted small">Estes dados ficam protegidos: só administradores enxergam.</p>
          <div className="form-grid">
            <div className="field c3"><label>Nome / razão social</label><input name="s_name" defaultValue={s.name} /></div>
            <div className="field c3"><label>CPF ou CNPJ</label><input name="s_document" defaultValue={s.document} /></div>
            <div className="field c3"><label>Telefone</label><input name="s_phone" defaultValue={s.phone} /></div>
            <div className="field c3"><label>E-mail</label><input name="s_email" type="email" defaultValue={s.email} /></div>
            <div className="field c2"><label>CEP</label><input name="s_postal_code" defaultValue={s.postal_code} /></div>
            <div className="field c3"><label>Rua</label><input name="s_street" defaultValue={s.street} /></div>
            <div className="field c1" style={{ gridColumn: 'span 1' }}><label>Nº</label><input name="s_number" defaultValue={s.number} /></div>
            <div className="field c2"><label>Complemento</label><input name="s_complement" defaultValue={s.complement} /></div>
            <div className="field c2"><label>Bairro</label><input name="s_district" defaultValue={s.district} /></div>
            <div className="field c3"><label>Cidade</label><input name="s_city" defaultValue={s.city} /></div>
            <div className="field c1" style={{ gridColumn: 'span 1' }}><label>UF</label><input name="s_state" maxLength={2} defaultValue={s.state} /></div>
          </div>
        </section>
        <div><button className="btn">Salvar configurações</button></div>
      </form>
    </>
  );
}
