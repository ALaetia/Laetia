'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ t: 'err' | 'ok'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const sb = supabaseBrowser();
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(mode === 'reset' ? '/conta/nova-senha' : next === '/' ? '/conta' : next)}`;
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg({ t: 'err', m: 'E-mail ou senha incorretos.' });
      else location.href = next;
    } else if (mode === 'signup') {
      if (password.length < 8) { setMsg({ t: 'err', m: 'Use uma senha com pelo menos 8 caracteres.' }); setBusy(false); return; }
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (error) setMsg({ t: 'err', m: 'Não foi possível criar a conta. Verifique o e-mail.' });
      else if (data.session) location.href = next === '/' ? '/conta' : next;
      else setMsg({ t: 'ok', m: 'Enviamos um link de confirmação para o seu e-mail.' });
    } else {
      await sb.auth.resetPasswordForEmail(email, { redirectTo });
      setMsg({ t: 'ok', m: 'Se o e-mail existir, enviamos um link para criar nova senha.' });
    }
    setBusy(false);
  }

  return (
    <div className="narrow">
      <h1>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}</h1>
      <form className="panel" onSubmit={submit}>
        {msg && <div className={'notice ' + msg.t} role="alert">{msg.m}</div>}
        <div className="field"><label htmlFor="e">E-mail</label><input id="e" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== 'reset' && <div className="field"><label htmlFor="p">Senha</label><input id="p" type="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
        <button className="btn block" disabled={busy}>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}</button>
        <p className="small center" style={{ marginTop: '1rem' }}>
          {mode === 'login' ? <>Primeira vez? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); }}>Criar conta</a> · <a href="#" onClick={(e) => { e.preventDefault(); setMode('reset'); }}>Esqueci a senha</a></>
            : <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Voltar para entrar</a>}
        </p>
      </form>
    </div>
  );
}
