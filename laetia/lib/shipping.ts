import 'server-only';
import { getPublicSettings } from './settings';
import { onlyDigits } from './validators';

export type ShipOption = { id: string; name: string; price: number; days: number | null };

export const meBase = () =>
  process.env.MELHOR_ENVIO_SANDBOX === 'true' ? 'https://sandbox.melhorenvio.com.br/api/v2' : 'https://melhorenvio.com.br/api/v2';
export const meHeaders = () => ({
  Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Laetia (contato@laetia.com.br)',
});

/** Une os volumes dos itens em uma caixa única (regra simples; ajuste se precisar). */
export function buildPackage(lines: { product: any; qty: number }[]) {
  let weight = 0, height = 0, width = 0, length = 0;
  for (const { product: p, qty } of lines) {
    weight += (p.weight_g || 200) * qty;
    height += (p.height_cm || 4) * qty;
    width = Math.max(width, p.width_cm || 12);
    length = Math.max(length, p.length_cm || 16);
  }
  return {
    weight: Math.max(weight / 1000, 0.1),
    height: Math.max(height, 2), width: Math.max(width, 11), length: Math.max(length, 16),
  };
}

export async function quoteShipping(cep: string, lines: { product: any; qty: number; total?: number }[], subtotal = 0): Promise<ShipOption[]> {
  const s = await getPublicSettings();
  const to = onlyDigits(cep);
  const fallback: ShipOption[] = [{ id: 'fixo', name: 'Envio pelos Correios', price: Number(s.shippingFallback) || 0, days: null }];

  const { getPrivateSettings } = await import('./settings');
  const from = onlyDigits((await getPrivateSettings()).sender.postal_code);
  if (!process.env.MELHOR_ENVIO_TOKEN || from.length !== 8) return applyFree(fallback, s, subtotal);

  try {
    const pkg = buildPackage(lines);
    const r = await fetch(`${meBase()}/me/shipment/calculate`, {
      method: 'POST', headers: meHeaders(), cache: 'no-store',
      body: JSON.stringify({
        from: { postal_code: from }, to: { postal_code: to }, package: pkg,
        options: { receipt: false, own_hand: false, insurance_value: Math.max(subtotal, 0) }, services: '1,2',
      }),
    });
    const data = await r.json();
    const opts: ShipOption[] = (Array.isArray(data) ? data : [])
      .filter((x: any) => !x.error && (x.custom_price || x.price))
      .map((x: any) => ({ id: String(x.id), name: x.name === 'PAC' ? 'PAC (Correios)' : x.name === 'SEDEX' ? 'SEDEX (Correios)' : x.name, price: Number(x.custom_price ?? x.price), days: x.custom_delivery_time ?? x.delivery_time ?? null }))
      .sort((a: ShipOption, b: ShipOption) => a.price - b.price);
    return applyFree(opts.length ? opts : fallback, s, subtotal);
  } catch { return applyFree(fallback, s, subtotal); }
}

function applyFree(opts: ShipOption[], s: any, subtotal: number) {
  const min = Number(s.freeShippingAbove) || 0;
  if (min > 0 && subtotal >= min && opts.length) opts[0] = { ...opts[0], price: 0, name: opts[0].name + ' — frete grátis' };
  return opts;
}
