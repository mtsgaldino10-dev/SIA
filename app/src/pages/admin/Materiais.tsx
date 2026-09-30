import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogo } from '../../auth/CatalogoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { formatarMoeda, lerNumero } from '../../lib/formato'
import { supabase, type Material, type Unidade } from '../../lib/supabase'
import { dadosOuErro } from '../../lib/useConsulta'

type Form = { id?: string; codigo_sap: string; descricao: string; unidade: string; grupo: string; preco: string; ativo: boolean }

const POR_PAGINA = 50

export function AdminMateriais() {
  const { materiais, unidades, carregando, recarregar } = useCatalogo()
  const [termo, setTermo] = useState('')
  const [pagina, setPagina] = useState(0)
  const [form, setForm] = useState<Form | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const t = termo.trim().toLowerCase()
    return t ? materiais.filter((m) => m.codigo_sap.includes(t) || m.descricao.toLowerCase().includes(t)) : materiais
  }, [materiais, termo])
  const visiveis = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  function editar(m: Material) {
    setOk(null)
    setErro(null)
    setForm({
      id: m.id,
      codigo_sap: m.codigo_sap,
      descricao: m.descricao,
      unidade: m.unidade,
      grupo: m.grupo ?? '',
      preco: m.preco === null ? '' : String(m.preco).replace('.', ','),
      ativo: m.ativo,
    })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setErro(null)
    const preco = form.preco.trim() === '' ? null : lerNumero(form.preco)
    if (preco !== null && (Number.isNaN(preco) || preco < 0)) {
      setErro('Preço inválido.')
      return
    }
    const dados = {
      codigo_sap: form.codigo_sap.trim(),
      descricao: form.descricao.trim(),
      unidade: form.unidade,
      grupo: form.grupo.trim() || null,
      preco,
      ativo: form.ativo,
    }
    try {
      if (form.id) await dadosOuErro(supabase.from('materiais').update(dados).eq('id', form.id))
      else await dadosOuErro(supabase.from('materiais').insert(dados))
      setOk(`Material ${dados.codigo_sap} salvo.`)
      setForm(null)
      await recarregar()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Materiais"
        trilha={['Cadastros', 'Materiais']}
        sub={`${materiais.length} materiais no catálogo. O código SAP é a chave e não se repete.`}
        acoes={
          <>
            <Link className="botao secundario" to="/admin/materiais/importar">
              Importar planilha
            </Link>
            <button
              className="botao primario"
              onClick={() => setForm({ codigo_sap: '', descricao: '', unidade: unidades[0]?.codigo ?? '', grupo: '', preco: '', ativo: true })}
            >
              Novo material
            </button>
          </>
        }
      />
      <Aviso tipo="sucesso">{ok}</Aviso>

      {form && (
        <form className="cartao pilha" onSubmit={salvar}>
          <h2>{form.id ? `Editar ${form.codigo_sap}` : 'Novo material'}</h2>
          <div className="grade-2">
            <Campo rotulo="Código SAP">
              <input className="mono" required value={form.codigo_sap} onChange={(e) => setForm({ ...form, codigo_sap: e.target.value })} />
            </Campo>
            <Campo rotulo="Unidade">
              <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                {unidades.map((u) => (
                  <option key={u.codigo} value={u.codigo}>
                    {u.codigo} · {u.descricao}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Descrição" style={{ gridColumn: '1 / -1' }}>
              <input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Campo>
            <Campo rotulo="Grupo (opcional)">
              <input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
            </Campo>
            <Campo rotulo="Preço unitário (opcional)">
              <input inputMode="decimal" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
            </Campo>
          </div>
          <label className="linha">
            <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Ativo (material inativo não entra em pedidos novos)
          </label>
          <Aviso tipo="erro">{erro}</Aviso>
          <div className="acoes">
            <button type="button" className="botao secundario" onClick={() => setForm(null)}>
              Cancelar
            </button>
            <button className="botao primario" type="submit">
              Salvar material
            </button>
          </div>
        </form>
      )}

      <Campo rotulo="Buscar">
        <input
          type="search"
          placeholder="Código SAP ou descrição"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value)
            setPagina(0)
          }}
        />
      </Campo>

      {carregando ? (
        <Carregando />
      ) : visiveis.length === 0 ? (
        <Vazio>Nenhum material. Importe a planilha do SAP para começar.</Vazio>
      ) : (
        <>
          <div className="tabela-envoltorio">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Unid.</th>
                  <th>Grupo</th>
                  <th className="num">Preço</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((m) => (
                  <tr key={m.id}>
                    <td className="mono">{m.codigo_sap}</td>
                    <td>{m.descricao}</td>
                    <td>{m.unidade}</td>
                    <td>{m.grupo ?? '—'}</td>
                    <td className="num">{formatarMoeda(m.preco)}</td>
                    <td>{m.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td className="acoes-celula">
                      <button className="botao fantasma peq" onClick={() => editar(m)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="linha">
            <span className="sec peq">
              {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, filtrados.length)} de {filtrados.length}
            </span>
            <span className="espaco" />
            <button className="botao secundario peq" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
              Anterior
            </button>
            <button
              className="botao secundario peq"
              disabled={(pagina + 1) * POR_PAGINA >= filtrados.length}
              onClick={() => setPagina(pagina + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Tira uma chave do registro sem mexer no resto. */
function sem(registro: Record<string, string>, chave: string): Record<string, string> {
  const copia = { ...registro }
  delete copia[chave]
  return copia
}

export function AdminUnidades() {
  const { unidades, materiais, recarregar } = useCatalogo()
  const [codigo, setCodigo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fracao, setFracao] = useState(false)
  const [sigla, setSigla] = useState('')
  // Siglas em edição, por código da unidade (vazio = mostra a do banco)
  const [siglas, setSiglas] = useState<Record<string, string>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function executar(fn: () => Promise<unknown>, msg: string) {
    setErro(null)
    setOk(null)
    try {
      await fn()
      setOk(msg)
      await recarregar()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  /** A sigla SAP não se repete entre unidades. Devolve o erro ou null. */
  function siglaRepetida(nova: string, codigoAtual: string): string | null {
    const dona = unidades.find((u) => u.codigo !== codigoAtual && u.sigla_sap === nova)
    return nova && dona ? `A sigla ${nova} já é da unidade ${dona.codigo}.` : null
  }

  async function salvarSigla(u: Unidade) {
    const nova = (siglas[u.codigo] ?? u.sigla_sap ?? '').trim()
    if (nova === (u.sigla_sap ?? '')) {
      setSiglas((s) => sem(s, u.codigo))
      return
    }
    const repetida = siglaRepetida(nova, u.codigo)
    if (repetida) {
      setOk(null)
      setErro(repetida)
      setSiglas((s) => sem(s, u.codigo))
      return
    }
    await executar(
      () => dadosOuErro(supabase.from('unidades').update({ sigla_sap: nova || null }).eq('codigo', u.codigo)),
      `Unidade ${u.codigo} atualizada.`,
    )
    setSiglas((s) => sem(s, u.codigo))
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Unidades"
        trilha={['Cadastros', 'Unidades']}
        sub="Lista fechada. Unidade sem fração exige quantidade inteira. A importação não cria unidade: cadastre aqui antes. A sigla no SAP é como a unidade aparece na coluna UMB da planilha de reservas (ex.: PEÇ para PC)."
      />
      <Aviso tipo="erro">{erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Aceita fração</th>
              <th>Sigla no SAP</th>
              <th className="num">Materiais</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((u) => (
              <tr key={u.codigo}>
                <td className="mono">{u.codigo}</td>
                <td>{u.descricao}</td>
                <td>
                  <label className="linha">
                    <input
                      type="checkbox"
                      style={{ width: 'auto', minHeight: 0 }}
                      checked={u.aceita_fracao}
                      onChange={(e) =>
                        executar(
                          () => dadosOuErro(supabase.from('unidades').update({ aceita_fracao: e.target.checked }).eq('codigo', u.codigo)),
                          `Unidade ${u.codigo} atualizada.`,
                        )
                      }
                    />
                    {u.aceita_fracao ? 'Sim' : 'Não'}
                  </label>
                </td>
                <td style={{ width: 130 }}>
                  <input
                    aria-label={`Sigla no SAP de ${u.codigo}`}
                    value={siglas[u.codigo] ?? u.sigla_sap ?? ''}
                    onChange={(e) => setSiglas({ ...siglas, [u.codigo]: e.target.value })}
                    onBlur={() => void salvarSigla(u)}
                  />
                </td>
                <td className="num">{materiais.filter((m) => m.unidade === u.codigo).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="cartao linha-fim"
        onSubmit={(e) => {
          e.preventDefault()
          const novaSigla = sigla.trim()
          const repetida = siglaRepetida(novaSigla, '')
          if (repetida) {
            setOk(null)
            setErro(repetida)
            return
          }
          void executar(
            () =>
              dadosOuErro(
                supabase.from('unidades').insert({
                  codigo: codigo.trim().toUpperCase(),
                  descricao: descricao.trim() || null,
                  aceita_fracao: fracao,
                  sigla_sap: novaSigla || null,
                }),
              ),
            `Unidade ${codigo.trim().toUpperCase()} cadastrada.`,
          ).then(() => {
            setCodigo('')
            setDescricao('')
            setFracao(false)
            setSigla('')
          })
        }}
      >
        <Campo rotulo="Código" style={{ maxWidth: 120 }}>
          <input required value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </Campo>
        <Campo rotulo="Descrição" style={{ flex: 1, minWidth: 180 }}>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Campo>
        <Campo rotulo="Sigla no SAP" style={{ maxWidth: 130 }}>
          <input value={sigla} onChange={(e) => setSigla(e.target.value)} />
        </Campo>
        <label className="linha" style={{ minHeight: 42 }}>
          <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={fracao} onChange={(e) => setFracao(e.target.checked)} />
          Aceita fração
        </label>
        <button className="botao primario" type="submit">
          Cadastrar unidade
        </button>
      </form>
    </div>
  )
}
