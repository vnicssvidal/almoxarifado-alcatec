import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--fonte-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Almoxarifado Alçatec',
  description: 'Sistema de Gerenciamento de Almoxarifado — Alçatec Procópio',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0E5A6F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
