'use client';

import { useEffect, useState } from 'react';
import { criarCliente } from '../../lib/supabase';
import { useSessao } from '../../lib/sessao';
import Topo from '../Topo';

function situacao(m) {
  if (m.saldo === 0) return { texto: 'Indisponível', classe: 'zerado' };
  if (m.saldo <= m.estoque_minimo) return { texto: 'Estoque baixo', classe: 'baixo' };
  return { texto: 'Normal', classe: 'normal' };
}

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

  return (
    <main>
      <Topo titulo="Consulta de materiais" usuario={usuario} />

      {usuario?.perfil === 'almoxarife' && (
        <div style={{ marginBottom: 16 }}>
          {!mostrarForm && <button className="secundario" onClick={() => setMostrarForm(true)}>+ Novo material</button>}
          {mostrarForm && (
            <form className="cartao" onSubmit={cadastrar}>
              <h2>Novo material</h2>
              <div className="grade">
                <div><label htmlFor="codigo">Código</label><input id="codigo" {...campo('codigo')} /></div>
                <div className="largo"><label htmlFor="nome">Nome</label><input id="nome" {...campo('nome')} /></div>
                <div>
                  <label htmlFor="categoria">Categoria</label>
                  <select id="categoria" {...campo('categoria')}>
                    <option>Material</option><option>Peça</option><option>Componente</option>
                  </select>
                </div>
                <div><label htmlFor="unidade">Unidade</label><input id="unidade" {...campo('unidade')} /></div>
                <div><label htmlFor="saldo">Saldo inicial</label><input id="saldo" type="number" min="0" {...campo('saldo')} /></div>
                <div><label htmlFor="minimo">Estoque mínimo</label><input id="minimo" type="number" min="0" {...campo('estoque_minimo')} /></div>
              </div>
              <div className="acoes">
                <button type="submit">Salvar</button>
                <button type="button" className="secundario" onClick={() => setMostrarForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      <input
        placeholder="Buscar por nome ou código"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar material"
      />
      {erro && <p className="erro">{erro}</p>}
      {aviso && <p className="ok">{aviso}</p>}

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Código</th><th>Material</th><th>Categoria</th>
            <th style={{ textAlign: 'right' }}>Saldo</th><th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((m) => {
            const s = situacao(m);
            return (
              <tr key={m.id}>
                <td>{m.codigo}</td>
                <td>{m.nome}</td>
                <td>{m.categoria}</td>
                <td className="num">{m.saldo} {m.unidade}</td>
                <td><span className={`selo ${s.classe}`}>{s.texto}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
