import 'server-only';
import crypto from 'crypto';

const API = 'https://api.mercadopago.com';
const H = () => ({ Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' });

export async function createPreference(input: {
  orderId: string; items: { id: string; title: string; quantity: number; unit_price: number }[];
  shippingCost: number; payer: any; siteUrl: string;
}) {
  const https = input.siteUrl.startsWith('https://');
  const back = (p: string) => `${input.siteUrl}/pedido/${input.orderId}?retorno=${p}`;
  const body: any = {
    items: input.items.map((i) => ({ ...i, currency_id: 'BRL' })),
    payer: input.payer,
    back_urls: { success: back('sucesso'), pending: back('pendente'), failure: back('falha') },
    external_reference: input.orderId,
    notification_url: `${input.siteUrl}/api/mercadopago/webhook`,
    statement_descriptor: 'LAETIA',
    shipments: { cost: input.shippingCost, mode: 'not_specified' },
  };
  if (https) body.auto_return = 'approved'; // o MP exige https para auto_return
  const r = await fetch(`${API}/checkout/preferences`, { method: 'POST', headers: H(), body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error('Mercado Pago: ' + (data?.message || r.status));
  return { id: data.id as string, url: data.init_point as string };
}

export async function getPayment(id: string) {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: H(), cache: 'no-store' });
  if (!r.ok) throw new Error('Pagamento não encontrado');
  return r.json();
}

/** Confere se a notificação veio mesmo do Mercado Pago (assinatura HMAC-SHA256). */
export function verifySignature(headers: Headers, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  const sig = headers.get('x-signature') || '';
  const ts = /ts=([^,]+)/.exec(sig)?.[1];
  const v1 = /v1=([^,]+)/.exec(sig)?.[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${headers.get('x-request-id') || ''};ts:${ts};`;
  const mine = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(v1)); } catch { return false; }
}
