import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Painel', robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="side">
        <Link href="/admin" className="brand">Laetia</Link>
        <nav aria-label="Painel">
          <Link href="/admin">Resumo</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/produtos">Produtos</Link>
          <Link href="/admin/categorias">Categorias</Link>
          <Link href="/admin/mensagens">Mensagens</Link>
          <Link href="/admin/configuracoes">Configurações</Link>
          <Link href="/" style={{ color: 'var(--muted)' }}>Ver loja</Link>
        </nav>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
