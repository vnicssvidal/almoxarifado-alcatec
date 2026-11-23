'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData } from '../../lib/sessao';
import Topo from '../Topo';

export default function Saidas() {
  const usuario = useSessao();
  const [saidas, setSaidas] = useState([]);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const { data, error } = await criarCliente()
        .from('vw_saidas').select('*').order('data_hora', { ascending: false });
      if (error) setErro('Não foi possível carregar as saídas.');
      setSaidas(data ?? []);
    })();
  }, [usuario]);

  const termo = busca.trim().toLowerCase();
  const filtradas = saidas.filter((s) => !termo
    || s.material.toLowerCase().includes(termo)
    || s.codigo.toLowerCase().includes(termo)
    || s.responsavel.toLowerCase().includes(termo));

  return (
    <main>
      <Topo titulo="Histórico de saídas" usuario={usuario} />
      <input
        placeholder="Buscar por material, código ou responsável"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar saída"
      />
      {erro && <p className="erro">{erro}</p>}
      {filtradas.length === 0 && <p className="sub" style={{ marginTop: 16 }}>Nenhuma saída registrada.</p>}
      {filtradas.length > 0 && (
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Data e hora</th><th>Material</th><th style={{ textAlign: 'right' }}>Quantidade</th>
              <th>Retirado por</th><th>Registrado por</th><th style={{ textAlign: 'right' }}>Saldo depois</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((s) => (
              <tr key={s.id}>
                <td>{formatarData(s.data_hora)}</td>
                <td>{s.codigo} · {s.material}</td>
                <td className="num">{s.quantidade} {s.unidade}</td>
                <td>{s.responsavel}</td>
                <td>{s.registrado_por ?? 'Almoxarifado'}</td>
                <td className="num">{s.saldo_apos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
