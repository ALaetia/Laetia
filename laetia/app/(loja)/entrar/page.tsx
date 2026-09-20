import LoginForm from './LoginForm';
export const metadata = { title: 'Entrar' };
export default async function Entrar({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/' } = await searchParams;
  return <LoginForm next={next.startsWith('/') && !next.startsWith('//') ? next : '/'} />;
}
