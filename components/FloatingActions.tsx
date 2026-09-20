'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import Thread, { Msg } from './Thread';

const ChatIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>;
const WaIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>;

export default function FloatingActions({ whatsappUrl }: { whatsappUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ loading: boolean; userId?: string; convId?: string; msgs: Msg[] }>({ loading: true, msgs: [] });
  const [first, setFirst] = useState('');
  const [err, setErr] = useState('');

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || !state.loading) return;
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setState({ loading: false, msgs: [] }); return; }
    const { data: conv } = await sb.from('conversations').select('id').eq('user_id', user.id).eq('kind', 'chat').eq('status', 'open').order('created_at', { ascending: false }).limit(1).maybeSingle();
    let msgs: Msg[] = [];
    if (conv) {
      const r = await sb.from('messages').select('id,sender_id,sender_role,body,created_at').eq('conversation_id', conv.id).order('created_at');
      msgs = (r.data as Msg[]) || [];
    }
    setState({ loading: false, userId: user.id, convId: conv?.id, msgs });
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const body = first.trim();
    if (!body || !state.userId) return;
    setErr('');
    const sb = supabaseBrowser();
    const { data: conv, error } = await sb.from('conversations').insert({ user_id: state.userId, kind: 'chat', subject: 'Chat' }).select('id').single();
    if (error || !conv) { setErr('Não foi possível iniciar o chat.'); return; }
    const { data: m, error: e2 } = await sb.from('messages').insert({ conversation_id: conv.id, sender_id: state.userId, sender_role: 'customer', body }).select().single();
    if (e2) { setErr('Não foi possível enviar.'); return; }
    setState({ ...state, convId: conv.id, msgs: [m as Msg] });
  }

  return (
    <>
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Chat com a Laetia">
          <div className="chat-head"><span>Fale conosco</span><button onClick={() => setOpen(false)} aria-label="Fechar chat">×</button></div>
          {state.loading ? <div className="chat-body"><p className="muted small">Carregando…</p></div>
            : !state.userId ? (
              <div className="chat-body"><p>Para conversar com a gente, entre na sua conta.</p><Link className="btn sm" href="/entrar?next=/">Entrar ou criar conta</Link></div>
            ) : state.convId ? (
              <Thread conversationId={state.convId} meId={state.userId} meRole="customer" initial={state.msgs} className="" />
            ) : (
              <form onSubmit={start} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="chat-body"><p>Olá! Como podemos ajudar?</p>{err && <p className="notice err">{err}</p>}</div>
                <div className="chat-form"><input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Escreva sua mensagem" aria-label="Mensagem" /><button className="btn sm" disabled={!first.trim()}>Enviar</button></div>
              </form>
            )}
        </section>
      )}
      <div className="float-stack">
        {whatsappUrl && <a className="fab wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp"><WaIcon /></a>}
        <button className="fab chat" onClick={toggle} aria-label="Abrir chat" aria-expanded={open}><ChatIcon /></button>
      </div>
    </>
  );
}
