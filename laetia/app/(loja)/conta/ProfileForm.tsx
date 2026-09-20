'use client';
import { useActionState, useState } from 'react';
import { saveProfile } from './actions';
import { UFS } from '@/lib/validators';

export default function ProfileForm({ profile: p, next }: { profile: any; next: string }) {
  const [state, action, pending] = useActionState(saveProfile, null as any);
  const [addr, setAddr] = useState({ street: p?.street || '', district: p?.district || '', city: p?.city || '', state: p?.state || '' });

  async function cep(e: React.FocusEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, '');
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`); const j = await r.json();
      if (!j.erro) setAddr({ street: j.logradouro || addr.street, district: j.bairro || addr.district, city: j.localidade, state: j.uf });
    } catch {}
  }
  const set = (k: string) => (e: any) => setAddr({ ...addr, [k]: e.target.value });

  return (
    <form action={action} className="panel">
      <input type="hidden" name="next" value={next} />
      {state?.error && <div className="notice err" role="alert">{state.error}</div>}
      <div className="form-grid">
        <div className="field c4"><label htmlFor="fn">Nome completo</label><input id="fn" name="full_name" defaultValue={p?.full_name || ''} autoComplete="name" required /></div>
        <div className="field c2"><label htmlFor="cpf">CPF {p?.cpf_last4 && <span className="muted">(cadastrado: final {p.cpf_last4})</span>}</label><input id="cpf" name="cpf" inputMode="numeric" placeholder={p?.cpf_last4 ? 'Deixe em branco para manter' : '000.000.000-00'} autoComplete="off" /></div>
        <div className="field c3"><label htmlFor="ph">Telefone (com DDD)</label><input id="ph" name="phone" inputMode="tel" defaultValue={p?.phone || ''} autoComplete="tel" required /></div>
        <div className="field c3"><label htmlFor="cep">CEP</label><input id="cep" name="postal_code" inputMode="numeric" defaultValue={p?.postal_code || ''} onBlur={cep} autoComplete="postal-code" required /></div>
        <div className="field c4"><label htmlFor="st">Rua</label><input id="st" name="street" value={addr.street} onChange={set('street')} autoComplete="address-line1" required /></div>
        <div className="field c2"><label htmlFor="nu">Número</label><input id="nu" name="number" defaultValue={p?.number || ''} required /></div>
        <div className="field c3"><label htmlFor="co">Complemento</label><input id="co" name="complement" defaultValue={p?.complement || ''} /></div>
        <div className="field c3"><label htmlFor="di">Bairro</label><input id="di" name="district" value={addr.district} onChange={set('district')} required /></div>
        <div className="field c4"><label htmlFor="ci">Cidade</label><input id="ci" name="city" value={addr.city} onChange={set('city')} required /></div>
        <div className="field c2"><label htmlFor="uf">Estado</label>
          <select id="uf" name="state" value={addr.state} onChange={set('state')} required><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></div>
      </div>
      {!p?.consent_at && (
        <label className="check" style={{ marginBottom: '1rem' }}>
          <input type="checkbox" name="consent" />
          <span>Li e aceito a <a href="/privacidade" target="_blank">Política de Privacidade</a>. Autorizo o uso dos meus dados para processar pedidos e entregas.</span>
        </label>
      )}
      <button className="btn" disabled={pending}>{pending ? 'Salvando…' : 'Salvar dados'}</button>
      <p className="muted small" style={{ marginTop: '.75rem' }}>Seu CPF é armazenado criptografado e usado apenas para pagamento e envio.</p>
    </form>
  );
}
