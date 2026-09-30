import { useState, type FormEvent } from 'react'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { rotuloStatus } from '../../lib/formato'
import { supabase, type Almox } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

type Form = { id?: string; codigo: string; nome: string; cidade: string; pai_id: string; ativo: boolean }

export function AdminAlmoxarifados() {
  const { almoxarifados, recarregarPerfil } = useSessao()
  const regionais = almoxarifados.filter((a) => a.tipo === 'regional')
  const [form, setForm] = useState<Form | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const supervisores = useConsulta(async () => {
    const [atrib, usuarios] = await Promise.all([
      listaOuErro(supabase.from('atribuicoes').select('almox_id, usuario_id, funcao')),
      listaOuErro(supabase.from('v_usuarios').select('id, nome')),
    ])
    const nomes = new Map(usuarios.map((u) => [u.id, u.nome]))
    const porAlmox = new Map<string, { sup: string[]; resp: string[] }>()
    for (const a of atrib) {
      const r = porAlmox.get(a.almox_id) ?? { sup: [], resp: [] }
      ;(a.funcao === 'supervisor' ? r.sup : r.resp).push(nomes.get(a.usuario_id) ?? '?')
      porAlmox.set(a.almox_id, r)
    }
    return porAlmox
  }, [])

  function editar(a: Almox) {
    setOk(null)
    setErro(null)
    setForm({ id: a.id, codigo: a.codigo, nome: a.nome, cidade: a.cidade ?? '', pai_id: a.pai_id ?? '', ativo: a.ativo })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setErro(null)
    try {
      const dados = { codigo: form.codigo.trim(), nome: form.nome.trim(), cidade: form.cidade.trim() || null, ativo: form.ativo }
      if (form.id) {
        await dadosOuErro(supabase.from('almoxarifados').update(dados).eq('id', form.id))
      } else {
        await dadosOuErro(supabase.from('almoxarifados').insert({ ...dados, tipo: 'base', pai_id: form.pai_id }))
      }
      setOk(`${dados.nome} salvo.`)
      setForm(null)
      await recarregarPerfil()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Almoxarifados"
        trilha={['Cadastros', 'Almoxarifados']}
        sub="O 3256 é externo e não opera o sistema. Novas bases ficam sob um almoxarifado regional."
        acoes={
          <button
            className="botao primario"
            onClick={() => setForm({ codigo: '', nome: '', cidade: '', pai_id: regionais[0]?.id ?? '', ativo: true })}
          >
            Nova base
          </button>
        }
      />
      <Aviso tipo="sucesso">{ok}</Aviso>

      {form && (
        <form className="cartao pilha" onSubmit={salvar}>
          <h2>{form.id ? `Editar ${form.nome}` : 'Nova base'}</h2>
          <div className="grade-2">
            <Campo rotulo="Código">
              <input required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
            </Campo>
            <Campo rotulo="Nome">
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Campo>
            <Campo rotulo="Cidade">
              <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </Campo>
            {!form.id && (
              <Campo rotulo="Abastecida por">
                <select value={form.pai_id} onChange={(e) => setForm({ ...form, pai_id: e.target.value })}>
                  {regionais.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.codigo} · {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
          </div>
          <label className="linha">
            <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Ativo
          </label>
          <Aviso tipo="erro">{erro}</Aviso>
          <div className="acoes">
            <button type="button" className="botao secundario" onClick={() => setForm(null)}>
              Cancelar
            </button>
            <button className="botao primario" type="submit">
              Salvar almoxarifado
            </button>
          </div>
        </form>
      )}

      {supervisores.carregando && <Carregando />}
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Pai</th>
              <th>Responsável</th>
              <th>Supervisor</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {almoxarifados.map((a) => {
              const pai = almoxarifados.find((p) => p.id === a.pai_id)
              const s = supervisores.dados?.get(a.id)
              return (
                <tr key={a.id}>
                  <td className="mono">{a.codigo}</td>
                  <td>{a.nome}</td>
                  <td>{rotuloStatus(a.tipo === 'externo' ? 'externo' : a.tipo)}</td>
                  <td className="mono">{pai?.codigo ?? '—'}</td>
                  <td>{s?.resp.join(', ') || '—'}</td>
                  <td>{s?.sup.join(', ') || '—'}</td>
                  <td>{a.ativo ? 'Ativo' : 'Inativo'}</td>
                  <td className="acoes-celula">
                    <button className="botao fantasma peq" onClick={() => editar(a)}>
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
