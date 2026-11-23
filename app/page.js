'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarCliente } from '../lib/supabase';

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
    <main>
      <form className="cartao login" onSubmit={entrar}>
        <h1>Almoxarifado Alçatec</h1>
        <p className="sub">Entre com seu e-mail e senha.</p>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'}</button>
        {erro && <p className="erro">{erro}</p>}
      </form>
    </main>
  );
}
