'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { criarCliente } from '../lib/supabase';
import Icone from './Icone';

const NOME_PERFIL = { funcionario: 'Funcionário', almoxarife: 'Almoxarife', gestor: 'Gestor' };

const MENU = [
  { href: '/materiais', texto: 'Materiais', icone: 'caixa', perfis: ['funcionario', 'almoxarife', 'gestor'] },
  { href: '/pedido', texto: 'Fazer pedido', curto: 'Pedir', icone: 'carrinho', perfis: ['funcionario'] },
  { href: '/painel', texto: 'Pedidos', icone: 'prancheta', perfis: ['almoxarife', 'gestor'] },
  { href: '/saidas', texto: 'Saídas', icone: 'historico', perfis: ['funcionario', 'almoxarife', 'gestor'] },
];

export function Marca() {
  return (
    <span className="marca">
      <span className="marca-simbolo"><Icone nome="caixa" tamanho={18} /></span>
      <span>Almoxarifado<small>Alçatec Procópio</small></span>
    </span>
  );
}

export default function Topo({ usuario }) {
  const router = useRouter();
  const caminho = usePathname();

  async function sair() {
    await criarCliente().auth.signOut();
    router.replace('/');
  }

  const itens = usuario ? MENU.filter((m) => m.perfis.includes(usuario.perfil)) : [];

  return (
    <>
      <header className="barra">
        <div className="barra-interna">
          <Marca />
          <nav className="links" aria-label="Principal">
            {itens.map((m) => (
              <Link key={m.href} href={m.href} className={caminho === m.href ? 'ativo' : ''}
                aria-current={caminho === m.href ? 'page' : undefined}>
                {m.texto}
              </Link>
            ))}
          </nav>
          <div className="usuario">
            {usuario && (
              <div className="usuario-nome">
                {usuario.nome}
                <small>{NOME_PERFIL[usuario.perfil]}</small>
              </div>
            )}
            <button className="btn btn-fantasma" onClick={sair}>
              <Icone nome="sair" tamanho={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {itens.length > 0 && (
        <nav className="abas" aria-label="Principal">
          {itens.map((m) => (
            <Link key={m.href} href={m.href} className={caminho === m.href ? 'ativo' : ''}
              aria-current={caminho === m.href ? 'page' : undefined}>
              <Icone nome={m.icone} tamanho={22} />
              {m.curto ?? m.texto}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

export function Cabecalho({ titulo, subtitulo, usuario, children }) {
  return (
    <div className="cabecalho">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="sub">{subtitulo}</p>}
        {!subtitulo && usuario && (
          <p className="sub">{usuario.nome} · {NOME_PERFIL[usuario.perfil]}</p>
        )}
      </div>
      {children && <div className="cabecalho-acoes">{children}</div>}
    </div>
  );
}

export function Alerta({ tipo, children }) {
  if (!children) return null;
  return (
    <div className={`alerta ${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Icone nome={tipo === 'erro' ? 'alerta' : 'check'} tamanho={18} />
      <span>{children}</span>
    </div>
  );
}

export function Esqueleto({ linhas = 5 }) {
  return (
    <div className="esqueleto" aria-busy="true" aria-label="Carregando">
      <div className="esqueleto-linha titulo" />
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="esqueleto-linha bloco" />
      ))}
    </div>
  );
}

export function Busca({ valor, aoMudar, placeholder, rotulo }) {
  return (
    <div className="busca">
      <Icone nome="busca" tamanho={18} />
      <input
        type="search"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        aria-label={rotulo}
      />
      {valor && (
        <button type="button" className="limpar" onClick={() => aoMudar('')} aria-label="Limpar busca">
          <Icone nome="x" tamanho={16} />
        </button>
      )}
    </div>
  );
}

export function Giro() {
  return <span className="giro" aria-hidden="true" />;
}
