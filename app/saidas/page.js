'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData } from '../../lib/sessao';
import Topo, { Cabecalho, Alerta, Esqueleto, Busca } from '../Topo';
import Icone from '../Icone';

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
    <>
      <Topo usuario={usuario} />
      <main className="conteudo">
        {!usuario ? <Esqueleto /> : (
          <>
            <Cabecalho titulo="Histórico de saídas" subtitulo="Tudo o que saiu do almoxarifado, do mais recente ao mais antigo." />
            <div style={{ marginBottom: 16 }}>
              <Busca valor={busca} aoMudar={setBusca} placeholder="Buscar por material, código ou responsável" rotulo="Buscar saída" />
            </div>
            <Alerta tipo="erro">{erro}</Alerta>

            {filtradas.length === 0 ? (
              <div className="cartao vazio">
                <Icone nome={termo ? 'busca' : 'historico'} tamanho={28} />
                <strong>{termo ? `Nada encontrado para “${busca.trim()}”` : 'Nenhuma saída registrada'}</strong>
                {!termo && <span className="fraco">As retiradas registradas no painel aparecem aqui.</span>}
              </div>
            ) : (
              <div className="cartao tabela-caixa">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data e hora</th><th>Material</th><th className="dir">Quantidade</th>
                      <th>Retirado por</th><th>Registrado por</th><th className="dir">Saldo depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((s) => (
                      <tr key={s.id}>
                        <td data-label="Data e hora" className="num">{formatarData(s.data_hora)}</td>
                        <td data-label="Material" className="titulo-cartao">
                          <span className="mono" style={{ color: 'var(--text-3)' }}>{s.codigo}</span>{' '}
                          <span className="forte">{s.material}</span>
                        </td>
                        <td data-label="Quantidade" className="dir num forte">{s.quantidade} {s.unidade}</td>
                        <td data-label="Retirado por" className="forte">{s.responsavel}</td>
                        <td data-label="Registrado por" style={{ color: 'var(--text-2)' }}>{s.registrado_por ?? 'Almoxarifado'}</td>
                        <td data-label="Saldo depois" className="dir num">{s.saldo_apos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
