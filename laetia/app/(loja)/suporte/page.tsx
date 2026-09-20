import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import TicketForm from './TicketForm';

export const metadata = { title: 'Suporte' };

export default async function Suporte() {
  await requireUser('/suporte');
  const sb = await supabaseServer();
  const [{ data: tickets }, { data: orders }] = await Promise.all([
    sb.from('conversations').select('id,subject,status,last_message_at,last_sender_role').eq('kind', 'ticket').order('last_message_at', { ascending: false }),
    sb.from('orders').select('id,number').order('created_at', { ascending: false }).limit(20),
  ]);
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <h1>Suporte</h1>
      <p className="muted">Envie sua dúvida, pedido de troca ou problema. Respondemos por aqui.</p>
      <TicketForm orders={orders || []} />
      <h2 style={{ marginTop: '2rem' }}>Meus atendimentos</h2>
      {!tickets?.length ? <p className="muted">Nenhum atendimento aberto.</p> : tickets.map((t: any) => (
        <Link key={t.id} href={`/suporte/${t.id}`} className="panel row spread" style={{ marginBottom: '.6rem', color: 'inherit' }}>
          <span><b>{t.subject}</b><br /><span className="muted small">{new Date(t.last_message_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></span>
          <span>{t.last_sender_role === 'admin' && <span className="badge ok">Nova resposta</span>} <span className="badge">{t.status === 'open' ? 'Aberto' : 'Encerrado'}</span></span>
        </Link>
      ))}
    </div>
  );
}
