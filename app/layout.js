import './globals.css';

export const metadata = {
  title: 'Almoxarifado Alçatec',
  description: 'Sistema de Gerenciamento de Almoxarifado — Alçatec Procópio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
