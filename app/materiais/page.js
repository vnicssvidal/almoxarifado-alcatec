'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao } from '../../lib/sessao';
import Topo, { Cabecalho, Alerta, Esqueleto, Busca } from '../Topo';
import Icone from '../Icone';

function situacao(m) {
  if (m.saldo === 0) return { texto: 'Indisponível', classe: 'zerado' };
  if (m.saldo <= m.estoque_minimo) return { texto: 'Estoque baixo', classe: 'baixo' };
  return { texto: 'Normal', classe: 'normal' };
}

const ICONE_SITUACAO = { normal: 'check', baixo: 'alerta', zerado: 'proibido' };

const VAZIO = { codigo: '', nome: '', categoria: 'Material', unidade: 'un', saldo: '', estoque_minimo: '' };

export default function Materiais() {
  const usuario = useSessao();
  const [materiais, setMateriais] = useState([]);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState(VAZIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aviso, setAviso] = useState('');

  async function carregar() {
    const { data, error } = await criarCliente()
      .from('materiais').select('id, codigo, nome, categoria, unidade, saldo, estoque_minimo')
      .eq('ativo', true).order('nome');
    if (error) setErro('Não foi possível carregar os materiais.');
    setMateriais(data ?? []);
  }

  useEffect(() => {
    if (usuario) carregar();
  }, [usuario]);

  async function cadastrar(e) {
    e.preventDefault();
    setErro('');
    setAviso('');
    const saldo = Number(novo.saldo || 0);
    const minimo = Number(novo.estoque_minimo || 0);
    if (!novo.codigo.trim() || !novo.nome.trim()) {
      setErro('Código e nome são obrigatórios.');
      return;
    }
    if (!Number.isInteger(saldo) || saldo < 0 || !Number.isInteger(minimo) || minimo < 0) {
      setErro('Saldo e estoque mínimo precisam ser números inteiros a partir de 0.');
      return;
    }
    const { error } = await criarCliente().from('materiais').insert({
      codigo: novo.codigo.trim().toUpperCase(),
      nome: novo.nome.trim(),
      categoria: novo.categoria,
      unidade: novo.unidade.trim() || 'un',
      saldo,
      estoque_minimo: minimo,
    });
    if (error) {
      setErro(error.code === '23505' ? 'Já existe um material com esse código.' : 'Não foi possível cadastrar o material.');
      return;
    }
    setNovo(VAZIO);
    setMostrarForm(false);
    setAviso('Material cadastrado.');
    carregar();
  }

  function campo(nome) {
    return { value: novo[nome], onChange: (e) => setNovo({ ...novo, [nome]: e.target.value }) };
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = materiais.filter(
    (m) => !termo || m.nome.toLowerCase().includes(termo) || m.codigo.toLowerCase().includes(termo)
  );

  const qtdBaixo = materiais.filter((m) => situacao(m).classe === 'baixo').length;
  const qtdZerado = materiais.filter((m) => situacao(m).classe === 'zerado').length;
  const ehAlmoxarife = usuario?.perfil === 'almoxarife';

  return (
    <>
      <Topo usuario={usuario} />
      <main className="conteudo">
        {!usuario ? <Esqueleto /> : (
          <>
            <Cabecalho titulo="Materiais" subtitulo="Saldo atual de cada item do almoxarifado.">
              {ehAlmoxarife && !mostrarForm && (
                <button className="btn btn-primario" onClick={() => setMostrarForm(true)}>
                  <Icone nome="mais" tamanho={18} />
                  Novo material
                </button>
              )}
            </Cabecalho>

            {ehAlmoxarife && mostrarForm && (
              <form className="cartao aparecer" onSubmit={cadastrar} style={{ marginBottom: 20 }}>
                <div className="cartao-titulo">
                  <h2>Novo material</h2>
                </div>
                <div className="grade">
                  <div className="campo"><label htmlFor="codigo">Código</label><input id="codigo" autoCapitalize="characters" {...campo('codigo')} /></div>
                  <div className="campo largo"><label htmlFor="nome">Nome</label><input id="nome" {...campo('nome')} /></div>
                  <div className="campo">
                    <label htmlFor="categoria">Categoria</label>
                    <select id="categoria" {...campo('categoria')}>
                      <option>Material</option><option>Peça</option><option>Componente</option>
                    </select>
                  </div>
                  <div className="campo"><label htmlFor="unidade">Unidade</label><input id="unidade" {...campo('unidade')} /></div>
                  <div className="campo"><label htmlFor="saldo">Saldo inicial</label><input id="saldo" type="number" min="0" inputMode="numeric" {...campo('saldo')} /></div>
                  <div className="campo"><label htmlFor="minimo">Estoque mínimo</label><input id="minimo" type="number" min="0" inputMode="numeric" {...campo('estoque_minimo')} /></div>
                </div>
                <div className="form-acoes">
                  <button type="button" className="btn btn-secundario" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primario">Salvar material</button>
                </div>
              </form>
            )}

            <Alerta tipo="erro">{erro}</Alerta>
            <Alerta tipo="ok">{aviso}</Alerta>

            <div className="indicadores">
              <div className="cartao indicador">
                <div className="indicador-rotulo"><Icone nome="caixa" tamanho={16} />Itens ativos</div>
                <div className="indicador-valor">{materiais.length}</div>
              </div>
              <div className="cartao indicador baixo">
                <div className="indicador-rotulo"><Icone nome="alerta" tamanho={16} />Estoque baixo</div>
                <div className="indicador-valor">{qtdBaixo}</div>
              </div>
              <div className="cartao indicador zerado">
                <div className="indicador-rotulo"><Icone nome="proibido" tamanho={16} />Indisponíveis</div>
                <div className="indicador-valor">{qtdZerado}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Busca valor={busca} aoMudar={setBusca} placeholder="Buscar por nome ou código" rotulo="Buscar material" />
            </div>

            {filtrados.length === 0 ? (
              <div className="cartao vazio">
                <Icone nome="busca" tamanho={28} />
                <strong>{termo ? `Nada encontrado para “${busca.trim()}”` : 'Nenhum material cadastrado'}</strong>
                {termo && <span className="fraco">Confira o código ou tente outro nome.</span>}
              </div>
            ) : (
              <div className="cartao tabela-caixa">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Código</th><th>Material</th><th>Categoria</th>
                      <th className="dir">Saldo</th><th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((m) => {
                      const s = situacao(m);
                      return (
                        <tr key={m.id} className={s.classe === 'zerado' ? 'esmaecida' : ''}>
                          <td data-label="Código" className="mono">{m.codigo}</td>
                          <td data-label="Material" className="forte titulo-cartao">{m.nome}</td>
                          <td data-label="Categoria">{m.categoria}</td>
                          <td data-label="Saldo" className="dir num duas-linhas">
                            <span className="forte">{m.saldo} {m.unidade}</span>
                            <small>mín. {m.estoque_minimo}</small>
                          </td>
                          <td data-label="Situação">
                            <span className={`selo ${s.classe}`}>
                              <Icone nome={ICONE_SITUACAO[s.classe]} tamanho={14} />
                              {s.texto}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
