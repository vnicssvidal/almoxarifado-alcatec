'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarCliente } from '../lib/supabase';
import { Marca, Alerta, Giro } from './Topo';
import Icone from './Icone';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    const { error } = await criarCliente().auth.signInWithPassword({ email, password: senha });
    setEntrando(false);
    if (error) {
      setErro('E-mail ou senha incorretos.');
      return;
    }
    router.push('/materiais');
  }

  return (
    <main className="login-pagina">
      <aside className="login-lado">
        <span className="marca">
          <span className="marca-simbolo"><Icone nome="caixa" tamanho={20} /></span>
          <span>Alçatec Procópio</span>
        </span>
        <div>
          <h2>Consulta, pedidos e saídas do almoxarifado em um só lugar.</h2>
          <p>Veja o saldo dos materiais, faça pedidos e acompanhe a separação e a retirada.</p>
        </div>
        <small>Sistema interno · uso restrito a colaboradores</small>
      </aside>

      <div className="login-area">
        <form className="login-form" onSubmit={entrar}>
          <div className="login-marca-movel"><Marca /></div>
          <h1>Entrar</h1>
          <p className="sub">Use seu e-mail e senha da empresa.</p>

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" inputMode="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" autoComplete="current-password"
              value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primario btn-bloco" disabled={entrando}>
            {entrando && <Giro />}
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>
          <Alerta tipo="erro">{erro}</Alerta>
        </form>
      </div>
    </main>
  );
}
