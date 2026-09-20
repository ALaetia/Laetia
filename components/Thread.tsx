'use client';
import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export type Msg = { id: string; sender_id: string; sender_role: 'customer' | 'admin'; body: string; created_at: string };

export default function Thread({ conversationId, meId, meRole, initial, className = 'thread' }: {
  conversationId: string; meId: string; meRole: 'customer' | 'admin'; initial: Msg[]; className?: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const sb = useRef(supabaseBrowser()).current;

  useEffect(() => {
    const ch = sb.channel('conv-' + conversationId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => setMsgs((cur) => (cur.some((m) => m.id === payload.new.id) ? cur : [...cur, payload.new])))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [conversationId, sb]);

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr('');
    const { data, error } = await sb.from('messages').insert({ conversation_id: conversationId, sender_id: meId, sender_role: meRole, body }).select().single();
    setBusy(false);
    if (error) { setErr('Não foi possível enviar. Tente novamente.'); return; }
    setText('');
    setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data as Msg]));
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div className="chat-body" aria-live="polite">
        {msgs.length === 0 && <p className="muted small center">Escreva sua mensagem abaixo.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={'msg' + (m.sender_id === meId ? ' me' : '')}>
            {m.body}
            <small>{m.sender_role === 'admin' ? 'Laetia' : 'Cliente'} · {new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>
          </div>
        ))}
        <div ref={end} />
      </div>
      {err && <div className="notice err" style={{ margin: 0, borderRadius: 0 }}>{err}</div>}
      <form className="chat-form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva aqui…" maxLength={4000} aria-label="Mensagem" />
        <button className="btn sm" disabled={busy || !text.trim()}>Enviar</button>
      </form>
    </div>
  );
}
