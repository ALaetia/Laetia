'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';

export async function createTicket(_prev: any, fd: FormData) {
  const user = await requireUser('/suporte');
  const subject = String(fd.get('subject') || '').trim().slice(0, 120);
  const body = String(fd.get('body') || '').trim().slice(0, 4000);
  const orderId = String(fd.get('order_id') || '') || null;
  if (!subject || !body) return { error: 'Preencha o assunto e a mensagem.' };
  const sb = await supabaseServer();
  const { data: conv, error } = await sb.from('conversations').insert({ user_id: user.id, kind: 'ticket', subject, order_id: orderId }).select('id').single();
  if (error || !conv) return { error: 'Não foi possível abrir o pedido de suporte.' };
  await sb.from('messages').insert({ conversation_id: conv.id, sender_id: user.id, sender_role: 'customer', body });
  redirect(`/suporte/${conv.id}`);
}
