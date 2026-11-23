// ícones SVG inline (traço no estilo Lucide). decorativos por padrão.
const CAMINHOS = {
  caixa: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  carrinho: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 6H6" />
    </>
  ),
  prancheta: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  historico: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sair: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alerta: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  mais: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  proibido: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.7 5.7 12.6 12.6" />
    </>
  ),
  olho: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export default function Icone({ nome, tamanho = 18, className = '', rotulo }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icone ${className}`}
      aria-hidden={rotulo ? undefined : true}
      aria-label={rotulo}
      role={rotulo ? 'img' : undefined}
      focusable="false"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
