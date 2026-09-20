import 'server-only';
import { meBase, meHeaders, buildPackage } from './shipping';
import { onlyDigits } from './validators';
import { safeDecrypt } from './crypto';

async function call(path: string, body: any) {
  const r = await fetch(meBase() + path, { method: 'POST', headers: meHeaders(), body: JSON.stringify(body), cache: 'no-store' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Melhor Envio (${path}): ${data?.message || JSON.stringify(data?.errors || data).slice(0, 300)}`);
  return data;
}

/**
 * Compra e gera a etiqueta oficial dos Correios via Melhor Envio.
 * Requer saldo na conta do Melhor Envio. Teste antes no sandbox (MELHOR_ENVIO_SANDBOX=true).
 */
export async function createLabel(order: any, items: any[], products: Record<string, any>, sender: any) {
  if (!process.env.MELHOR_ENVIO_TOKEN) throw new Error('Configure MELHOR_ENVIO_TOKEN');
  const s = order.shipping;
  const serviceId = Number(order.shipping_service_id);
  if (!serviceId) throw new Error('Este pedido usou frete fixo; gere a etiqueta manualmente ou use a impressão interna.');
  if (!sender?.postal_code || !sender?.document) throw new Error('Preencha os dados do remetente em Configurações.');

  const pkg = buildPackage(items.map((i) => ({ product: products[i.product_id] || {}, qty: i.quantity })));
  const cart = await call('/me/cart', {
    service: serviceId,
    from: {
      name: sender.name, phone: onlyDigits(sender.phone), email: sender.email, document: onlyDigits(sender.document),
      address: sender.street, complement: sender.complement, number: sender.number, district: sender.district,
      city: sender.city, state_abbr: sender.state, country_id: 'BR', postal_code: onlyDigits(sender.postal_code),
    },
    to: {
      name: s.name, phone: onlyDigits(s.phone), email: s.email, document: safeDecrypt(s.cpf_enc),
      address: s.street, complement: s.complement || '', number: s.number, district: s.district,
      city: s.city, state_abbr: s.state, country_id: 'BR', postal_code: onlyDigits(s.postal_code),
    },
    products: items.map((i) => ({ name: i.product_name.slice(0, 100), quantity: i.quantity, unitary_value: Number(i.unit_price) })),
    volumes: [{ height: pkg.height, width: pkg.width, length: pkg.length, weight: pkg.weight }],
    options: { insurance_value: Number(order.subtotal), receipt: false, own_hand: false, reverse: false, non_commercial: true, platform: 'Laetia' },
  });
  const meId = cart.id;
  await call('/me/shipment/checkout', { orders: [meId] });
  await call('/me/shipment/generate', { orders: [meId] });
  const printed = await call('/me/shipment/print', { mode: 'private', orders: [meId] });
  let tracking: string | null = null;
  try {
    const t = await call('/me/shipment/tracking', { orders: [meId] });
    tracking = t?.[meId]?.tracking || null;
  } catch {}
  return { meId: meId as string, labelUrl: printed.url as string, tracking };
}
