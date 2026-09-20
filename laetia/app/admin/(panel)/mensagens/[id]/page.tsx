import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Thread from '@/components/Thread';
import { closeConversation } from '../../../actions';

export default async function Conversa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const db = supabaseAdmin();
  const { data: conv } = await db.from('conversations').select('*').eq('id', id).maybeSingle();
  if (!conv) notFound();
  const [{ data: prof }, { data: order }] = await Promise.all([
    db.from('profiles').select('full_name,phone').eq('id', conv.user_id).single(),
    conv.order_id ? db.from('orders').select('id,number').eq('id', conv.order_id).single() : Promise.resolve({ data: null }),
  ]);
  // mensagens lidas com a sessão do admin (RLS) para o Realtime funcionar igual
  const sb = await supabaseServer();
  const { data: msgs } = await sb.from('messages').select('id,sender_id,sender_role,body,created_at').eq('conversation_id', id).order('created_at');
  return (
    <>
      <p><Link href="/admin/mensagens">← Mensagens</Link></p>
      <div className="row spread">
        <div><h1>{conv.subject || 'Chat'}</h1><p className="muted">{prof?.full_name} · {prof?.phone}{order && <> · <Link href={`/admin/pedidos/${order.id}`}>Pedido #{order.number}</Link></>}</p></div>
        {conv.status === 'open' && <form action={closeConversation}><input type="hidden" name="id" value={id} /><button className="btn ghost sm">Encerrar atendimento</button></form>}
      </div>
      <Thread conversationId={id} meId={admin.id} meRole="admin" initial={(msgs as any) || []} />
    </>
  );
}
