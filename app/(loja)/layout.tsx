import Link from 'next/link';
import CartProvider from '@/components/CartProvider';
import Header from '@/components/Header';
import FloatingActions from '@/components/FloatingActions';
import { supabaseServer } from '@/lib/supabase/server';
import { getPublicSettings } from '@/lib/settings';
import { onlyDigits } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const [{ data: { user } }, { data: categories }, s] = await Promise.all([
    sb.auth.getUser(),
    sb.from('categories').select('id,name,slug').eq('active', true).order('sort'),
    getPublicSettings(),
  ]);
  const wa = onlyDigits(s.whatsapp);
  const waUrl = wa ? `https://wa.me/${wa.length <= 11 ? '55' + wa : wa}?text=${encodeURIComponent(s.whatsappMessage)}` : null;

  return (
    <CartProvider>
      <Header categories={categories || []} user={user} storeName={s.storeName} />
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-in">
          <div><b style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.2rem' }}>{s.storeName}</b><br />Artigos religiosos católicos.</div>
          <div>
            <Link href="/suporte">Suporte</Link><br />
            <Link href="/pedidos">Meus pedidos</Link><br />
            <Link href="/privacidade">Privacidade</Link>
          </div>
        </div>
      </footer>
      <FloatingActions whatsappUrl={waUrl} />
    </CartProvider>
  );
}
