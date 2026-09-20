'use server';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseMoney, slugify } from '@/lib/money';
import { STATUS_ORDER } from '@/lib/status';
import { getPrivateSettings } from '@/lib/settings';
import { createLabel } from '@/lib/melhorenvio';

const refresh = () => revalidatePath('/', 'layout');
const ROLES = ['stone', 'spacer', 'medal', 'crucifix'];
const SHAPES: Record<string, string[]> = { medal: ['oval', 'round', 'heart'], crucifix: ['simple', 'flared', 'detail'] };
const num = (v: FormDataEntryValue | null, d = 0) => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : d; };

/* ---------------- Produtos ---------------- */
export async function saveProduct(fd: FormData) {
  await requireAdmin();
  const db = supabaseAdmin();
  const id = String(fd.get('id') || '') || crypto.randomUUID();
  const isNew = !fd.get('id');
  const name = String(fd.get('name') || '').trim();
  if (!name) redirect(`/admin/produtos/${isNew ? 'novo' : id}?erro=Informe o nome`);

  // slug único
  let slug = slugify(String(fd.get('slug') || name));
  const { data: clash } = await db.from('products').select('id').eq('slug', slug).neq('id', id).maybeSingle();
  if (clash) slug += '-' + id.slice(0, 4);

  // imagens: mantém as existentes (na ordem) + envia as novas
  let images: string[] = [];
  try { images = JSON.parse(String(fd.get('images') || '[]')); } catch {}
  for (const f of fd.getAll('newImages')) {
    if (!(f instanceof File) || !f.size) continue;
    if (!f.type.startsWith('image/') || f.type === 'image/svg+xml' || f.size > 4 * 1024 * 1024) continue;
    const ext = (f.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
    const path = `${id}/${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
    const { error } = await db.storage.from('products').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
    if (!error) images.push(db.storage.from('products').getPublicUrl(path).data.publicUrl);
  }

  const stockRaw = String(fd.get('stock') || '').trim();
  const { error } = await db.from('products').upsert({
    id, name, slug,
    category_id: String(fd.get('category_id') || '') || null,
    short_description: String(fd.get('short_description') || '').slice(0, 200),
    description: String(fd.get('description') || ''),
    base_price: parseMoney(fd.get('base_price')),
    images, active: fd.get('active') === 'on',
    featured: fd.get('featured') === 'on', featured_sort: num(fd.get('featured_sort')),
    stock: stockRaw === '' ? null : Math.max(0, Math.floor(num(stockRaw))),
    sku: String(fd.get('sku') || '').trim() || null,
    weight_g: num(fd.get('weight_g'), 200), height_cm: num(fd.get('height_cm'), 4), width_cm: num(fd.get('width_cm'), 12), length_cm: num(fd.get('length_cm'), 16),
  });
  if (error) redirect(`/admin/produtos/${isNew ? 'novo' : id}?erro=${encodeURIComponent(error.message)}`);

  // opções (grupos e valores) — IDs gerados no formulário, então dá para atualizar sem perder referências
  let groups: any[] = [];
  try { groups = JSON.parse(String(fd.get('groups') || '[]')); } catch {}
  const keepG = groups.map((g) => g.id);
  const { data: oldG } = await db.from('option_groups').select('id').eq('product_id', id);
  const dropG = (oldG || []).map((g) => g.id).filter((x) => !keepG.includes(x));
  if (dropG.length) await db.from('option_groups').delete().in('id', dropG);

  for (const [gi, g] of groups.entries()) {
    await db.from('option_groups').upsert({
      id: g.id, product_id: id, name: String(g.name || 'Opção').slice(0, 60), required: !!g.required, sort: gi,
      text_enabled: !!g.text_enabled, text_label: String(g.text_label || 'Com nome').slice(0, 40),
      text_price: Number(g.text_price) || 0, text_max: Math.min(Math.max(Number(g.text_max) || 30, 1), 60),
      role: ROLES.includes(g.role) ? g.role : null,
    });
    const values = (g.values || []).filter((v: any) => String(v.label || '').trim());
    const keepV = values.map((v: any) => v.id);
    const { data: oldV } = await db.from('option_values').select('id').eq('group_id', g.id);
    const dropV = (oldV || []).map((v) => v.id).filter((x) => !keepV.includes(x));
    if (dropV.length) await db.from('option_values').delete().in('id', dropV);
    // imagem própria (PNG transparente) da medalha/crucifixo, se enviada
    for (const v of values) {
      const f = fd.get('valImg:' + v.id);
      if (f instanceof File && f.size && ['image/png', 'image/webp', 'image/jpeg'].includes(f.type) && f.size <= 1024 * 1024) {
        const path = `${id}/opt-${v.id}-${Date.now()}.${f.type.split('/')[1].replace('jpeg', 'jpg')}`;
        const { error: e2 } = await db.storage.from('products').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
        if (!e2) v.image_url = db.storage.from('products').getPublicUrl(path).data.publicUrl;
      }
    }
    if (values.length) await db.from('option_values').upsert(values.map((v: any, vi: number) => ({
      id: v.id, group_id: g.id, label: String(v.label).slice(0, 80), price_delta: Number(v.price_delta) || 0,
      swatch: /^#[0-9a-fA-F]{6}$/.test(v.swatch || '') ? v.swatch : null,
      shape: (SHAPES[g.role] || []).includes(v.shape) ? v.shape : null,
      image_url: ['medal', 'crucifix'].includes(g.role) && /^https?:\/\//.test(v.image_url || '') ? v.image_url : null,
      sort: vi, active: v.active !== false,
    })));
  }
  refresh();
  redirect(`/admin/produtos/${id}?salvo=1`);
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await supabaseAdmin().from('products').delete().eq('id', String(fd.get('id')));
  refresh();
  redirect('/admin/produtos');
}

/* ---------------- Categorias ---------------- */
export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const id = String(fd.get('id') || '');
  const row: any = { name, sort: num(fd.get('sort')), active: fd.get('active') === 'on', description: String(fd.get('description') || '') };
  const db = supabaseAdmin();
  if (id) await db.from('categories').update(row).eq('id', id);
  else { row.slug = slugify(name); row.active = true; await db.from('categories').insert(row); }
  refresh();
  redirect('/admin/categorias');
}
export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  await supabaseAdmin().from('categories').delete().eq('id', String(fd.get('id')));
  refresh();
  redirect('/admin/categorias');
}

/* ---------------- Pedidos ---------------- */
export async function updateOrder(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const status = String(fd.get('status'));
  if (!STATUS_ORDER.includes(status)) return;
  await supabaseAdmin().from('orders').update({
    status, tracking_code: String(fd.get('tracking_code') || '').trim() || null, notes: String(fd.get('notes') || '') || null,
  }).eq('id', id);
  revalidatePath('/admin/pedidos');
  redirect(`/admin/pedidos/${id}?salvo=1`);
}

export async function generateLabel(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const db = supabaseAdmin();
  try {
    const { data: order } = await db.from('orders').select('*').eq('id', id).single();
    const { data: items } = await db.from('order_items').select('*').eq('order_id', id);
    const ids = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
    const { data: prods } = await db.from('products').select('*').in('id', ids as string[]);
    const products = Object.fromEntries((prods || []).map((p) => [p.id, p]));
    const { sender } = await getPrivateSettings();
    const r = await createLabel(order, items || [], products, sender);
    await db.from('orders').update({ me_order_id: r.meId, label_url: r.labelUrl, tracking_code: r.tracking || order.tracking_code }).eq('id', id);
  } catch (e: any) {
    redirect(`/admin/pedidos/${id}?erro=${encodeURIComponent(e.message)}`);
  }
  redirect(`/admin/pedidos/${id}?salvo=1`);
}

/* ---------------- Mensagens ---------------- */
export async function closeConversation(fd: FormData) {
  await requireAdmin();
  await supabaseAdmin().from('conversations').update({ status: 'closed' }).eq('id', String(fd.get('id')));
  redirect('/admin/mensagens');
}

/* ---------------- Configurações ---------------- */
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const s = (k: string) => String(fd.get(k) || '').trim();
  const db = supabaseAdmin();
  await db.from('settings').upsert({ key: 'public', value: {
    storeName: s('storeName') || 'Laetia', whatsapp: s('whatsapp'), whatsappMessage: s('whatsappMessage'),
    homeTitle: s('homeTitle'), homeSubtitle: s('homeSubtitle'),
    shippingFallback: num(fd.get('shippingFallback')), freeShippingAbove: num(fd.get('freeShippingAbove')),
  } });
  await db.from('settings').upsert({ key: 'private', value: { sender: {
    name: s('s_name'), phone: s('s_phone'), email: s('s_email'), document: s('s_document'), postal_code: s('s_postal_code'),
    street: s('s_street'), number: s('s_number'), complement: s('s_complement'), district: s('s_district'), city: s('s_city'), state: s('s_state'),
  } } });
  refresh();
  redirect('/admin/configuracoes?salvo=1');
}
