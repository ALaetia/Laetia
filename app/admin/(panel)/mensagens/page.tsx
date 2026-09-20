import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function Mensagens() {
  const { data: convs } = await supabaseAdmin().from('conversations').select('id,kind,subject,status,last_sender_role,last_message_at,user_id').order('last_message_at', { ascending: false }).limit(100);
  const ids = [...new Set((convs || []).map((c) => c.user_id))];
  const { data: profs } = await supabaseAdmin().from('profiles').select('id,full_name').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const name = Object.fromEntries((profs || []).map((p) => [p.id, p.full_name || 'Cliente']));
  return (
    <>
      <h1>Mensagens</h1>
      <div className="table-wrap"><table>
        <thead><tr><th>Cliente</th><th>Tipo</th><th>Assunto</th><th>Última</th><th></th></tr></thead>
        <tbody>
          {(convs || []).map((c) => (
            <tr key={c.id}>
              <td><Link href={`/admin/mensagens/${c.id}`}>{name[c.user_id]}</Link></td>
              <td>{c.kind === 'chat' ? 'Chat' : 'Suporte'}</td><td>{c.subject}</td>
              <td>{new Date(c.last_message_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{c.status === 'closed' ? <span className="badge">Encerrado</span> : c.last_sender_role === 'customer' ? <span className="badge">Responder</span> : <span className="badge ok">Respondido</span>}</td>
            </tr>
          ))}
          {!convs?.length && <tr><td colSpan={5} className="muted">Nenhuma mensagem ainda.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
