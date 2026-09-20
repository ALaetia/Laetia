import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateSelection } from '@/lib/pricing';
import { quoteShipping } from '@/lib/shipping';
import { createPreference } from '@/lib/mercadopago';
import { profileComplete, onlyDigits } from '@/lib/validators';
import { safeDecrypt } from '@/lib/crypto';

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return fail('Entre na sua conta para continuar.', 401);

  const body = await req.json().catch(() => null);
  if (!body?.items?.length || body.items.length > 30) return fail('Sacola vazia.');

  const admin = supabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  if (!profileComplete(profile)) return fail('Complete seus dados de entrega.');

  // Preços SEMPRE recalculados aqui: nunca confiamos no valor vindo do navegador.
  const ids = [...new Set(body.items.map((i: any) => String(i.productId)))];
  const { data: products } = await admin.from('products').select('*, option_groups(*, option_values(*))').in('id', ids).eq('active', true);
  const map: Record<string, any> = Object.fromEntries((products || []).map((p: any) => [p.id, p]));

  const lines: any[] = [];
  const qtyByProduct: Record<string, number> = {};
  for (const it of body.items) {
    const p = map[it.productId];
    if (!p) return fail('Um dos itens não está mais disponível. Remova-o da sacola.');
    const qty = Math.max(1, Math.min(50, Math.floor(Number(it.qty) || 1)));
    const v: any = validateSelection(p, it.selections || {}, it.customText || '');
    if (!v.ok) return fail(`${p.name}: ${v.error}`);
    qtyByProduct[p.id] = (qtyByProduct[p.id] || 0) + qty;
    if (p.stock != null && qtyByProduct[p.id] > p.stock) return fail(`${p.name}: só temos ${p.stock} em estoque.`);
    lines.push({ product: p, qty, unit: v.unit, details: v.details, text: v.text });
  }

  const subtotal = Math.round(lines.reduce((a, l) => a + l.unit * l.qty, 0) * 100) / 100;
  const options = await quoteShipping(profile.postal_code, lines.map((l) => ({ product: l.product, qty: l.qty })), subtotal);
  const ship = options.find((o) => o.id === String(body.serviceId)) || options[0];
  if (!ship) return fail('Não foi possível calcular o frete.');
  const total = Math.round((subtotal + ship.price) * 100) / 100;

  const shipping = {
    name: profile.full_name, email: user.email, phone: profile.phone, cpf_enc: profile.cpf_enc,
    postal_code: profile.postal_code, street: profile.street, number: profile.number, complement: profile.complement,
    district: profile.district, city: profile.city, state: profile.state,
  };
  const { data: order, error } = await admin.from('orders').insert({
    user_id: user.id, subtotal, shipping_cost: ship.price, total, shipping,
    shipping_service: ship.name, shipping_service_id: ship.id,
  }).select().single();
  if (error || !order) return fail('Não foi possível criar o pedido.', 500);

  await admin.from('order_items').insert(lines.map((l) => ({
    order_id: order.id, product_id: l.product.id, product_name: l.product.name, image_url: l.product.images?.[0] || null,
    quantity: l.qty, unit_price: l.unit, options: l.details, custom_text: l.text || null,
  })));

  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
    const cpf = safeDecrypt(profile.cpf_enc);
    const [first, ...rest] = String(profile.full_name).split(' ');
    const pref = await createPreference({
      orderId: order.id, shippingCost: ship.price, siteUrl,
      items: lines.map((l) => ({
        id: l.product.id,
        title: [l.product.name, ...l.details.map((d: any) => d.value), l.text ? `nome: ${l.text}` : ''].filter(Boolean).join(' | ').slice(0, 250),
        quantity: l.qty, unit_price: l.unit,
      })),
      payer: {
        name: first, surname: rest.join(' ') || first, email: user.email,
        phone: { area_code: onlyDigits(profile.phone).slice(0, 2), number: onlyDigits(profile.phone).slice(2) },
        identification: { type: 'CPF', number: cpf },
      },
    });
    await admin.from('orders').update({ mp_preference_id: pref.id, mp_init_point: pref.url }).eq('id', order.id);
    return NextResponse.json({ url: pref.url, orderId: order.id });
  } catch (e: any) {
    await admin.from('orders').update({ status: 'cancelled', notes: 'Falha ao criar pagamento: ' + e.message }).eq('id', order.id);
    return fail('Não foi possível iniciar o pagamento. Tente novamente.', 502);
  }
}
