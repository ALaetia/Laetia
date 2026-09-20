import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import Thread from '@/components/Thread';

export default async function Atendimento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser('/suporte/' + id);
  const sb = await supabaseServer();
  const { data: conv } = await sb.from('conversations').select('id,subject,status').eq('id', id).maybeSingle();
  if (!conv) notFound();
  const { data: msgs } = await sb.from('messages').select('id,sender_id,sender_role,body,created_at').eq('conversation_id', id).order('created_at');
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <p><Link href="/suporte">← Suporte</Link></p>
      <h1>{conv.subject}</h1>
      {conv.status === 'closed' && <div className="notice">Atendimento encerrado. Se responder, ele será reaberto.</div>}
      <Thread conversationId={id} meId={user.id} meRole="customer" initial={(msgs as any) || []} />
    </div>
  );
}
