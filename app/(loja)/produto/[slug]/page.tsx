import { notFound } from 'next/navigation';
import ProductView from '@/components/ProductView';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await supabaseServer();
  const { data } = await sb.from('products').select('name,short_description').eq('slug', slug).maybeSingle();
  return { title: data?.name, description: data?.short_description };
}

export default async function Produto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await supabaseServer();
  const { data: product } = await sb.from('products').select('*, option_groups(*, option_values(*))').eq('slug', slug).eq('active', true).maybeSingle();
  if (!product) notFound();
  return <div className="container"><ProductView product={product} /></div>;
}
