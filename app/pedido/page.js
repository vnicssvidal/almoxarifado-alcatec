'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao, formatarData, NOME_STATUS } from '../../lib/sessao';
import Topo from '../Topo';

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
    <main>
      <Topo titulo="Fazer pedido" usuario={usuario} />

      <div className="cartao">
        <div className="grade">
          <div className="largo">
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
          <div>
            <label htmlFor="quantidade">Quantidade</label>
            <input id="quantidade" type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </div>
        </div>
        <button className="secundario" style={{ marginTop: 12 }} onClick={adicionar}>Adicionar</button>

        {itens.length > 0 && (
          <table style={{ marginTop: 16 }}>
            <thead><tr><th>Material</th><th style={{ textAlign: 'right' }}>Quantidade</th><th></th></tr></thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.material_id}>
                  <td>{i.nome}</td>
                  <td className="num">{i.quantidade} {i.unidade}</td>
                  <td className="num">
                    <button className="link" onClick={() => setItens(itens.filter((x) => x.material_id !== i.material_id))}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <label htmlFor="obs">Observação (opcional)</label>
        <input id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: para a manutenção da linha 2" />

        <button onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar pedido'}</button>
        {erro && <p className="erro">{erro}</p>}
        {aviso && <p className="ok">{aviso}</p>}
      </div>

      <h2 style={{ marginTop: 28 }}>Meus pedidos</h2>
      {pedidos.length === 0 && <p className="sub">Você ainda não fez pedidos.</p>}
      {pedidos.length > 0 && (
        <table>
          <thead><tr><th>Nº</th><th>Data</th><th>Itens</th><th>Situação</th></tr></thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{formatarData(p.criada_em)}</td>
                <td>{p.itens.map((i) => `${i.quantidade} ${i.unidade} ${i.nome}`).join(', ')}</td>
                <td><span className={`selo st-${p.status}`}>{NOME_STATUS[p.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
