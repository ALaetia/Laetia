import Link from 'next/link';
import CartLink from './CartLink';

export default function Header({ categories, user, storeName }: { categories: any[]; user: any; storeName: string }) {
  return (
    <header className="header">
      <div className="container header-in">
        <Link href="/" className="brand">{storeName}</Link>
        <form action="/busca" className="search" role="search">
          <input name="q" type="search" placeholder="Buscar terços e outros itens" aria-label="Buscar" />
        </form>
        <nav className="head-links" aria-label="Conta">
          <Link href={user ? '/conta' : '/entrar'}>{user ? 'Minha conta' : 'Entrar'}</Link>
          <CartLink />
        </nav>
      </div>
      {categories.length > 0 && (
        <div className="catnav">
          <nav className="container catnav-in" aria-label="Categorias">
            <Link href="/">Início</Link>
            {categories.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`}>{c.name}</Link>)}
          </nav>
        </div>
      )}
    </header>
  );
}
