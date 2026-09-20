import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { quoteShipping } from '@/lib/shipping';
import { isValidCEP } from '@/lib/validators';

export async function POST(req: Request) {
  const { cep, items } = await req.json().catch(() => ({}));
  if (!isValidCEP(cep || '') || !Array.isArray(items) || !items.length) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const ids = [...new Set(items.map((i: any) => String(i.productId)))];
  const { data: products } = await supabaseAdmin().from('products').select('*').in('id', ids);
  const map = Object.fromEntries((products || []).map((p: any) => [p.id, p]));
  const lines = items.filter((i: any) => map[i.productId]).map((i: any) => ({ product: map[i.productId], qty: Math.max(1, Math.min(50, Number(i.qty) || 1)) }));
  const subtotal = lines.reduce((a: number, l: any) => a + Number(l.product.base_price) * l.qty, 0);
  return NextResponse.json({ options: await quoteShipping(cep, lines, subtotal) });
}
