'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData, NOME_STATUS } from '../../lib/sessao';
import Topo from '../Topo';

export default function Painel() {
  const usuario = useSessao(['almoxarife', 'gestor']);
  const [pedidos, setPedidos] = useState([]);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(null);

  async function carregar() {
    const { data, error } = await criarCliente()
      .from('vw_solicitacoes').select('*')
      .in('status', ['solicitado', 'separado'])
      .order('criada_em', { ascending: true });
    if (error) setErro('Não foi possível carregar os pedidos.');
    setPedidos(data ?? []);
  }

  useEffect(() => {
    if (usuario) carregar();
  }, [usuario]);

  async function executar(funcao, id, mensagem) {
    setErro('');
    setAviso('');
    setOcupado(id);
    const { error } = await criarCliente().rpc(funcao, { p_solicitacao: id });
    setOcupado(null);
    if (error) {
      setErro(error.message.includes('Saldo insuficiente')
        ? `Pedido ${id}: não tem saldo suficiente para a retirada.`
        : `Pedido ${id}: não foi possível concluir.`);
    } else {
      setAviso(mensagem);
    }
    carregar();
  }

  const podeAgir = usuario?.perfil === 'almoxarife';
  const aguardando = pedidos.filter((p) => p.status === 'solicitado');
  const separados = pedidos.filter((p) => p.status === 'separado');

  function Lista({ titulo, lista, vazio }) {
    return (
      <>
        <h2 style={{ marginTop: 24 }}>{titulo} ({lista.length})</h2>
        {lista.length === 0 && <p className="sub">{vazio}</p>}
        {lista.map((p) => (
          <div className="cartao pedido" key={p.id}>
            <div className="topo" style={{ marginBottom: 8 }}>
              <div>
                <strong>Pedido {p.id}</strong> · {p.funcionario}
                <p className="sub">{formatarData(p.criada_em)}{p.observacao ? ` · ${p.observacao}` : ''}</p>
              </div>
              <span className={`selo st-${p.status}`}>{NOME_STATUS[p.status]}</span>
            </div>
            <ul>
              {p.itens.map((i) => (
                <li key={i.codigo}>{i.quantidade} {i.unidade} · {i.codigo} {i.nome}</li>
              ))}
            </ul>
            {podeAgir && p.status === 'solicitado' && (
              <button disabled={ocupado === p.id}
                onClick={() => executar('marcar_separado', p.id, `Pedido ${p.id} marcado como separado.`)}>
                Marcar como separado
              </button>
            )}
            {podeAgir && p.status === 'separado' && (
              <button disabled={ocupado === p.id}
                onClick={() => executar('registrar_retirada', p.id, `Retirada do pedido ${p.id} registrada e saldo atualizado.`)}>
                Registrar retirada
              </button>
            )}
          </div>
        ))}
      </>
    );
  }

  return (
    <main>
      <Topo titulo="Pedidos" usuario={usuario} />
      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="ok">{aviso}</p>}
      <Lista titulo="Aguardando separação" lista={aguardando} vazio="Nenhum pedido esperando." />
      <Lista titulo="Separados, aguardando retirada" lista={separados} vazio="Nenhum pedido separado." />
    </main>
  );
}
