'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData, NOME_STATUS } from '../../lib/sessao';
import Topo, { Cabecalho, Alerta, Esqueleto, Giro } from '../Topo';
import Icone from '../Icone';

const ETAPAS = [
  { status: 'solicitado', texto: 'Solicitado' },
  { status: 'separado', texto: 'Separado' },
  { status: 'retirado', texto: 'Retirado' },
];
const ICONE_STATUS = { solicitado: 'relogio', separado: 'caixa', retirado: 'check', cancelado: 'x' };

function Etapas({ status }) {
  const atual = ETAPAS.findIndex((e) => e.status === status);
  return (
    <ol className="etapas" aria-label="Andamento do pedido">
      {ETAPAS.map((e, i) => (
        <li key={e.status} className={`${i <= atual ? 'feita' : ''} ${i === atual ? 'atual' : ''}`}
          aria-current={i === atual ? 'step' : undefined}>
          {e.texto}
        </li>
      ))}
    </ol>
  );
}

export default function Pedido() {
  const usuario = useSessao(['funcionario']);
  const [materiais, setMateriais] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [itens, setItens] = useState([]);
  const [materialId, setMaterialId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    const supabase = criarCliente();
    const [{ data: lista }, { data: meus }] = await Promise.all([
      supabase.from('materiais').select('id, codigo, nome, unidade, saldo').eq('ativo', true).order('nome'),
      supabase.from('vw_solicitacoes').select('*').order('criada_em', { ascending: false }),
    ]);
    setMateriais(lista ?? []);
    setPedidos(meus ?? []);
  }

  useEffect(() => {
    if (usuario) carregar();
  }, [usuario]);

  const escolhido = materiais.find((m) => String(m.id) === materialId);

  function adicionar() {
    setErro('');
    setAviso('');
    const qtd = Number(quantidade);
    if (!escolhido) {
      setErro('Escolha um material.');
      return;
    }
    if (!Number.isInteger(qtd) || qtd < 1) {
      setErro('A quantidade precisa ser um número inteiro maior que zero.');
      return;
    }
    const jaPedido = itens.find((i) => i.material_id === escolhido.id)?.quantidade ?? 0;
    if (qtd + jaPedido > escolhido.saldo) {
      setErro(`Só tem ${escolhido.saldo} ${escolhido.unidade} de ${escolhido.nome} no estoque.`);
      return;
    }
    const outros = itens.filter((i) => i.material_id !== escolhido.id);
    setItens([...outros, { material_id: escolhido.id, nome: escolhido.nome, unidade: escolhido.unidade, quantidade: qtd + jaPedido }]);
    setMaterialId('');
    setQuantidade('1');
  }

  async function enviar() {
    setErro('');
    setAviso('');
    if (itens.length === 0) {
      setErro('Adicione pelo menos um material ao pedido.');
      return;
    }
    setEnviando(true);
    const { error } = await criarCliente().rpc('criar_solicitacao', {
      itens: itens.map((i) => ({ material_id: i.material_id, quantidade: i.quantidade })),
      observacao: observacao.trim() || null,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message.includes('Saldo insuficiente')
        ? 'O saldo de algum item mudou. Confira as quantidades e tente de novo.'
        : 'Não foi possível enviar o pedido.');
      carregar();
      return;
    }
    setItens([]);
    setObservacao('');
    setAviso('Pedido enviado. Você vai ver aqui quando estiver separado.');
    carregar();
  }

  return (
    <>
      <Topo usuario={usuario} />
      <main className="conteudo">
        {!usuario ? <Esqueleto /> : (
          <>
            <Cabecalho titulo="Fazer pedido" subtitulo="Escolha os materiais e envie para o almoxarifado separar." />

            <Alerta tipo="erro">{erro}</Alerta>
            <Alerta tipo="ok">{aviso}</Alerta>

            <div className="duas-colunas">
              <section className="cartao" aria-labelledby="titulo-adicionar">
                <div className="cartao-titulo"><h2 id="titulo-adicionar">Adicionar material</h2></div>
                <div className="linha-adicionar">
                  <div className="campo">
                    <label htmlFor="material">Material</label>
                    <select id="material" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                      <option value="">Escolha…</option>
                      {materiais.map((m) => (
                        <option key={m.id} value={m.id} disabled={m.saldo === 0}>
                          {m.codigo} · {m.nome} ({m.saldo === 0 ? 'indisponível' : `${m.saldo} ${m.unidade}`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor="quantidade">Quantidade</label>
                    <input id="quantidade" type="number" min="1" inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-secundario" onClick={adicionar}>
                    <Icone nome="mais" tamanho={18} />
                    Adicionar
                  </button>
                </div>
                {escolhido && (
                  <div className="disponivel aparecer">
                    <Icone nome="caixa" tamanho={16} />
                    <span>Disponível agora: <strong>{escolhido.saldo} {escolhido.unidade}</strong> de {escolhido.nome}</span>
                  </div>
                )}
              </section>

              <section className="cartao fixo" aria-labelledby="titulo-carrinho">
                <div className="cartao-titulo">
                  <h2 id="titulo-carrinho">Seu pedido</h2>
                  <span className="contador">{itens.length}</span>
                </div>

                {itens.length === 0 ? (
                  <div className="vazio carrinho-vazio">
                    <Icone nome="carrinho" tamanho={28} />
                    <span className="fraco">Nenhum item ainda. Adicione materiais ao lado.</span>
                  </div>
                ) : (
                  <ul className="itens">
                    {itens.map((i) => (
                      <li key={i.material_id} className="aparecer">
                        <span className="qtd">{i.quantidade} {i.unidade}</span>
                        <span className="nome">{i.nome}</span>
                        <button type="button" className="btn-perigo-link"
                          onClick={() => setItens(itens.filter((x) => x.material_id !== i.material_id))}
                          aria-label={`Remover ${i.nome}`}>
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="carrinho-rodape">
                  <div className="campo">
                    <label htmlFor="obs">Observação <span className="fraco">(opcional)</span></label>
                    <input id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: para a manutenção da linha 2" />
                  </div>
                  <button type="button" className="btn btn-primario btn-bloco" onClick={enviar} disabled={enviando}>
                    {enviando && <Giro />}
                    {enviando ? 'Enviando…' : 'Enviar pedido'}
                  </button>
                </div>
              </section>
            </div>

            <section className="secao" aria-labelledby="titulo-meus">
              <div className="secao-titulo">
                <h2 id="titulo-meus">Meus pedidos</h2>
                <span className="contador">{pedidos.length}</span>
              </div>
              {pedidos.length === 0 ? (
                <div className="cartao vazio">
                  <Icone nome="prancheta" tamanho={28} />
                  <strong>Você ainda não fez pedidos</strong>
                  <span className="fraco">Os pedidos enviados aparecem aqui com o andamento.</span>
                </div>
              ) : (
                <div className="lista-pedidos">
                  {pedidos.map((p) => (
                    <article className="cartao pedido-cartao" key={p.id}>
                      <div className="pedido-topo">
                        <div>
                          <h3>Pedido <span className="mono">#{p.id}</span></h3>
                          <p className="fraco num">{formatarData(p.criada_em)}</p>
                        </div>
                        <span className={`selo st-${p.status}`}>
                          <Icone nome={ICONE_STATUS[p.status]} tamanho={14} />
                          {NOME_STATUS[p.status]}
                        </span>
                      </div>
                      <ul className="pedido-itens">
                        {p.itens.map((i, n) => (
                          <li key={`${i.codigo ?? i.nome}-${n}`}>
                            <span className="qtd">{i.quantidade} {i.unidade}</span>
                            <span>{i.nome}</span>
                          </li>
                        ))}
                      </ul>
                      {p.status !== 'cancelado' && <Etapas status={p.status} />}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
