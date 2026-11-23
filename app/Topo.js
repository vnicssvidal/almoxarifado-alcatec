'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { criarCliente } from '../lib/supabase';

const NOME_PERFIL = { funcionario: 'Funcionário', almoxarife: 'Almoxarife', gestor: 'Gestor' };

const MENU = [
  { href: '/materiais', texto: 'Materiais', perfis: ['funcionario', 'almoxarife', 'gestor'] },
  { href: '/pedido', texto: 'Fazer pedido', perfis: ['funcionario'] },
  { href: '/painel', texto: 'Pedidos', perfis: ['almoxarife', 'gestor'] },
  { href: '/saidas', texto: 'Saídas', perfis: ['funcionario', 'almoxarife', 'gestor'] },
];

export default function Topo({ titulo, usuario }) {
  const router = useRouter();
  const caminho = usePathname();

  async function sair() {
    await criarCliente().auth.signOut();
    router.replace('/');
  }

  return (
    <>
      <nav className="menu">
        <strong>Almoxarifado Alçatec</strong>
        {usuario && MENU.filter((m) => m.perfis.includes(usuario.perfil)).map((m) => (
          <Link key={m.href} href={m.href} className={caminho === m.href ? 'ativo' : ''}>{m.texto}</Link>
        ))}
        <button className="secundario" onClick={sair}>Sair</button>
      </nav>
      <div className="topo">
        <div>
          <h1>{titulo}</h1>
          {usuario && <p className="sub">{usuario.nome} · {NOME_PERFIL[usuario.perfil]}</p>}
        </div>
      </div>
    </>
  );
}
