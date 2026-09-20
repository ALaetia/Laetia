import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Laetia — artigos religiosos católicos', template: '%s · Laetia' },
  description: 'Terços e artigos religiosos católicos, feitos com cuidado.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F7F6F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
