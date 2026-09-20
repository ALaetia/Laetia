import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPayment, verifySignature } from '@/lib/mercadopago';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const raw = await req.text();
  let body: any = {};
  try { body = JSON.parse(raw || '{}'); } catch {}
  const type = url.searchParams.get('type') || body.type || url.searchParams.get('topic');
  const dataId = String(url.searchParams.get('data.id') || body?.data?.id || '');
  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true });

  if (!verifySignature(req.headers, dataId)) return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 });

  try {
    const payment = await getPayment(dataId); // sempre consultamos o MP; nunca confiamos só na notificação
    const orderId = payment.external_reference;
    const admin = supabaseAdmin();
    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return NextResponse.json({ ok: true });

    const patch: any = { mp_payment_id: String(payment.id), payment_status: payment.status };
    if (payment.status === 'approved' && order.payment_status !== 'approved') {
      if (Math.abs(Number(payment.transaction_amount) - Number(order.total)) > 0.01) {
        patch.notes = `ATENÇÃO: valor pago (${payment.transaction_amount}) diferente do pedido (${order.total}).`;
      } else {
        patch.status = order.status === 'pending' ? 'paid' : order.status;
        patch.paid_at = new Date().toISOString();
        const { data: items } = await admin.from('order_items').select('product_id, quantity').eq('order_id', order.id);
        for (const it of items || []) if (it.product_id) await admin.rpc('decrement_stock', { pid: it.product_id, qty: it.quantity });
      }
    } else if (['cancelled', 'rejected'].includes(payment.status) && order.status === 'pending') {
      patch.status = payment.status === 'cancelled' ? 'cancelled' : 'pending';
    }
    await admin.from('orders').update(patch).eq('id', order.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'erro' }, { status: 500 }); // o MP tenta de novo
  }
}
