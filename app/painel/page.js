'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData, NOME_STATUS } from '../../lib/sessao';
import Topo, { Cabecalho, Alerta, Esqueleto, Giro } from '../Topo';
import Icone from '../Icone';

const ICONE_STATUS = { solicitado: 'relogio', separado: 'caixa' };

// fora do componente da página pra não remontar a cada render
function Lista({ titulo, lista, vazio, podeAgir, ocupado, executar }) {
  return (
    <section className="coluna" aria-label={titulo}>
      <div className="secao-titulo">
        <h2>{titulo}</h2>
        <span className="contador">{lista.length}</span>
      </div>
      {lista.length === 0 && (
        <div className="vazio">
          <Icone nome="check" tamanho={24} />
          <span className="fraco">{vazio}</span>
        </div>
      )}
      <div className="lista-pedidos">
        {lista.map((p) => (
          <article className="cartao pedido-cartao" key={p.id}>
            <div className="pedido-topo">
              <div>
                <h3>Pedido <span className="mono">#{p.id}</span></h3>
                <p className="sub" style={{ marginTop: 2 }}>{p.funcionario}</p>
                <p className="fraco num">{formatarData(p.criada_em)}</p>
              </div>
              <span className={`selo st-${p.status}`}>
                <Icone nome={ICONE_STATUS[p.status] ?? 'relogio'} tamanho={14} />
                {NOME_STATUS[p.status]}
              </span>
            </div>
            <ul className="pedido-itens">
              {p.itens.map((i) => (
                <li key={i.codigo}>
                  <span className="qtd">{i.quantidade} {i.unidade}</span>
                  <span><span className="mono">{i.codigo}</span> {i.nome}</span>
                </li>
              ))}
            </ul>
            {p.observacao && <p className="observacao">{p.observacao}</p>}
            {podeAgir && p.status === 'solicitado' && (
              <div className="pedido-acao">
                <button className="btn btn-primario btn-bloco" disabled={ocupado === p.id}
                  onClick={() => executar('marcar_separado', p.id, `Pedido ${p.id} marcado como separado.`)}>
                  {ocupado === p.id ? <Giro /> : <Icone nome="caixa" tamanho={18} />}
                  Marcar como separado
                </button>
              </div>
            )}
            {podeAgir && p.status === 'separado' && (
              <div className="pedido-acao">
                <button className="btn btn-sucesso btn-bloco" disabled={ocupado === p.id}
                  onClick={() => executar('registrar_retirada', p.id, `Retirada do pedido ${p.id} registrada e saldo atualizado.`)}>
                  {ocupado === p.id ? <Giro /> : <Icone nome="check" tamanho={18} />}
                  Registrar retirada
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

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
  const comum = { podeAgir, ocupado, executar };

  return (
    <>
      <Topo usuario={usuario} />
      <main className="conteudo">
        {!usuario ? <Esqueleto /> : (
          <>
            <Cabecalho titulo="Pedidos"
              subtitulo={podeAgir ? 'Separe os pedidos e registre a retirada.' : 'Acompanhe os pedidos em andamento.'}>
              {!podeAgir && (
                <span className="selo neutro"><Icone nome="olho" tamanho={14} />Somente acompanhamento</span>
              )}
            </Cabecalho>
            <Alerta tipo="erro">{erro}</Alerta>
            <Alerta tipo="ok">{aviso}</Alerta>
            <div className="quadro">
              <Lista titulo="Aguardando separação" lista={aguardando} vazio="Nenhum pedido esperando." {...comum} />
              <Lista titulo="Prontos para retirada" lista={separados} vazio="Nenhum pedido separado." {...comum} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
