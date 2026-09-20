'use client';
import { useActionState } from 'react';
import { createTicket } from './actions';

export default function TicketForm({ orders }: { orders: any[] }) {
  const [state, action, pending] = useActionState(createTicket, null as any);
  return (
    <form action={action} className="panel">
      {state?.error && <div className="notice err">{state.error}</div>}
      <div className="field"><label htmlFor="sb">Assunto</label><input id="sb" name="subject" maxLength={120} required /></div>
      {orders.length > 0 && <div className="field"><label htmlFor="od">Sobre qual pedido? (opcional)</label>
        <select id="od" name="order_id"><option value="">Nenhum</option>{orders.map((o) => <option key={o.id} value={o.id}>Pedido #{o.number}</option>)}</select></div>}
      <div className="field"><label htmlFor="bd">Mensagem</label><textarea id="bd" name="body" maxLength={4000} required /></div>
      <button className="btn" disabled={pending}>{pending ? 'Enviando…' : 'Enviar'}</button>
    </form>
  );
}
