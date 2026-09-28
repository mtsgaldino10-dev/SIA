import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalogo } from '../../auth/CatalogoContext'
import { useSessao } from '../../auth/SessaoContext'
import { MaterialBusca, MaterialRotulo } from '../../components/MaterialBusca'
import { Aviso, Campo, Carregando, Doc, PaginaTopo, StatusBadge, Vazio } from '../../components/ui'
import { saldosDe, useNomes } from '../../lib/compartilhado'
import { mensagemErro } from '../../lib/erros'
import { formatarDataHora, formatarDoc, formatarQtd, hojeISO, lerNumero, qtdValida, rotuloStatus } from '../../lib/formato'
import { supabase, type Pedido, type PedidoItem, type Remessa, type Visao } from '../../lib/supabase'
import { umOuErro, dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

type Dados = {
  pedido: Pedido
  itens: PedidoItem[]
  resumo: Visao<'v_pedido_resumo'>[]
  remessa: Pick<Remessa, 'id' | 'numero' | 'status'> | null
}

export function PedidoDetalhe() {
  const { id = '' } = useParams()
  const { almox, responsavelEm } = useSessao()
  const nomes = useNomes()
  const [aviso, setAviso] = useState<string | null>(null)
  const [erroEditor, setErroEditor] = useState<string | null>(null)

  const consulta = useConsulta<Dados>(async () => {
    const [pedido, itens, resumo, remessas] = await Promise.all([
      umOuErro(supabase.from('pedidos').select('*').eq('id', id).single()),
      listaOuErro(supabase.from('pedido_itens').select('*').eq('pedido_id', id)),
      listaOuErro(supabase.from('v_pedido_resumo').select('*').eq('pedido_id', id).order('codigo_sap')),
      listaOuErro(supabase.from('remessas').select('id, numero, status').eq('pedido_id', id)),
    ])
    return { pedido, itens, resumo, remessa: remessas[0] ?? null }
  }, [id])

  if (consulta.carregando && !consulta.dados) return <Carregando />
  if (consulta.erro || !consulta.dados) return <Aviso tipo="erro">{consulta.erro ?? 'Pedido não encontrado.'}</Aviso>

  const { pedido: p, itens, resumo, remessa } = consulta.dados
  const solicitante = almox(p.solicitante_id)
  const atendente = almox(p.atendente_id)
  const ehSolicitante = responsavelEm(p.solicitante_id)
  const ehAtendente = responsavelEm(p.atendente_id)
  const podeCancelar =
    (p.status === 'rascunho' && ehSolicitante) ||
    ((p.status === 'solicitado' || p.status === 'aprovado') && (ehSolicitante || ehAtendente))

  async function aposAcao(mensagem: string) {
    setErroEditor(null)
    setAviso(mensagem)
    await consulta.recarregar()
  }

  // Falha depois de já ter gravado algo: recarrega para o editor refletir o banco
  async function aposFalhaParcial(mensagem: string) {
    setAviso(null)
    setErroEditor(mensagem)
    await consulta.recarregar()
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo={
          <span className="linha">
            <Doc prefixo="PED" numero={p.numero} /> <StatusBadge status={p.status} />
          </span>
        }
        sub={`${solicitante?.nome} → ${atendente?.codigo} · ${atendente?.nome}${p.externo ? ' (pedido externo)' : ''}`}
        voltar={{ para: '/pedidos', rotulo: 'Pedidos' }}
        acoes={
          <>
            {remessa && (
              <Link className="botao secundario" to={`/remessas/${remessa.id}`}>
                Ver remessa {formatarDoc('REM', remessa.numero)}
              </Link>
            )}
            {p.externo && p.status === 'solicitado' && ehSolicitante && (
              <Link className="botao primario" to={`/entradas/receber?pedido=${p.id}`}>
                Registrar recebimento do 3256
              </Link>
            )}
          </>
        }
      />
      <Aviso tipo="sucesso">{aviso}</Aviso>
      <Aviso tipo="erro">{erroEditor}</Aviso>

      <div className="cartao">
        <dl className="dados">
          <dt>Criado</dt>
          <dd>
            {formatarDataHora(p.criado_em)} por {nomes.get(p.criado_por) ?? '—'}
          </dd>
          {p.solicitado_em && (
            <>
              <dt>Solicitado</dt>
              <dd>{formatarDataHora(p.solicitado_em)}</dd>
            </>
          )}
          {p.aprovado_em && (
            <>
              <dt>Aprovado</dt>
              <dd>
                {formatarDataHora(p.aprovado_em)} por {nomes.get(p.aprovado_por ?? '') ?? '—'}
              </dd>
            </>
          )}
          {p.encerrado_em && (
            <>
              <dt>Encerrado</dt>
              <dd>{formatarDataHora(p.encerrado_em)}</dd>
            </>
          )}
          {p.cancelado_em && (
            <>
              <dt>Cancelado</dt>
              <dd>
                {formatarDataHora(p.cancelado_em)} por {nomes.get(p.cancelado_por ?? '') ?? '—'}: {p.motivo_cancelamento}
              </dd>
            </>
          )}
          {p.observacao && (
            <>
              <dt>Observação</dt>
              <dd>{p.observacao}</dd>
            </>
          )}
        </dl>
      </div>

      {p.status === 'rascunho' && ehSolicitante ? (
        <EditorRascunho key={itens.map((i) => `${i.id}:${i.qtd_solicitada}`).join()} pedido={p} itens={itens} onMudou={aposAcao} onFalhaParcial={aposFalhaParcial} />
      ) : p.status === 'solicitado' && !p.externo && ehAtendente ? (
        <Aprovacao pedido={p} itens={itens} onMudou={aposAcao} />
      ) : p.status === 'aprovado' && ehAtendente ? (
        <Envio pedido={p} itens={itens} />
      ) : null}

      {p.status !== 'rascunho' && <Resumo linhas={resumo} />}

      {podeCancelar && <Cancelamento pedido={p} onMudou={aposAcao} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
type Linha = { material_id: string; qtd: string; id?: string }

function EditorRascunho({
  pedido,
  itens,
  onMudou,
  onFalhaParcial,
}: {
  pedido: Pedido
  itens: PedidoItem[]
  onMudou: (m: string) => Promise<void>
  onFalhaParcial: (m: string) => Promise<void>
}) {
  const { material, aceitaFracao } = useCatalogo()
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    itens.map((i) => ({ id: i.id, material_id: i.material_id, qtd: String(i.qtd_solicitada).replace('.', ',') })),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const escolhidos = useMemo(() => new Set(linhas.map((l) => l.material_id)), [linhas])

  const original = new Map(itens.map((i) => [i.id, Number(i.qtd_solicitada)]))
  const sujo =
    linhas.length !== itens.length || linhas.some((l) => !l.id || original.get(l.id) !== lerNumero(l.qtd))

  function validar(): string | null {
    for (const l of linhas) {
      const e = qtdValida(l.qtd, aceitaFracao(l.material_id))
      if (e) return `${material(l.material_id)?.codigo_sap}: ${e}`
    }
    return null
  }

  /** Grava o rascunho. Diz se deu certo e se algo chegou a ser gravado. */
  async function salvar(): Promise<{ ok: boolean; gravou: boolean }> {
    const e = validar()
    if (e) {
      setErro(e)
      return { ok: false, gravou: false }
    }
    setErro(null)
    const manter = new Set(linhas.filter((l) => l.id).map((l) => l.id))
    const remover = itens.filter((i) => !manter.has(i.id)).map((i) => i.id)
    let gravou = false
    try {
      if (remover.length) {
        await dadosOuErro(supabase.from('pedido_itens').delete().in('id', remover))
        gravou = true
      }
      for (const l of linhas.filter((l) => l.id && original.get(l.id!) !== lerNumero(l.qtd))) {
        await dadosOuErro(supabase.from('pedido_itens').update({ qtd_solicitada: lerNumero(l.qtd) }).eq('id', l.id!))
        gravou = true
      }
      const novos = linhas.filter((l) => !l.id)
      if (novos.length) {
        await dadosOuErro(
          supabase
            .from('pedido_itens')
            .insert(novos.map((l) => ({ pedido_id: pedido.id, material_id: l.material_id, qtd_solicitada: lerNumero(l.qtd) }))),
        )
        gravou = true
      }
      return { ok: true, gravou }
    } catch (e) {
      if (gravou) await onFalhaParcial(mensagemErro(e))
      else setErro(mensagemErro(e))
      return { ok: false, gravou }
    }
  }

  async function acao(fn: () => Promise<void>) {
    setOcupado(true)
    try {
      await fn()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="cartao pilha">
      <div className="cartao-cab">
        <h2>Itens do pedido</h2>
        <span className="sec peq">{linhas.length} itens</span>
      </div>
      <MaterialBusca excluir={escolhidos} onEscolher={(m) => setLinhas([...linhas, { material_id: m.id, qtd: '' }])} />
      {linhas.length === 0 ? (
        <Vazio>Busque pelo código SAP ou pela descrição para adicionar itens.</Vazio>
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th className="num">Quantidade</th>
                <th>Unid.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const m = material(l.material_id)
                return (
                  <tr key={l.material_id}>
                    <td>
                      <MaterialRotulo id={l.material_id} />
                    </td>
                    <td style={{ width: 130 }}>
                      <input
                        inputMode="decimal"
                        aria-label={`Quantidade de ${m?.codigo_sap}`}
                        value={l.qtd}
                        onChange={(e) => setLinhas(linhas.map((x, j) => (j === i ? { ...x, qtd: e.target.value } : x)))}
                      />
                    </td>
                    <td>{m?.unidade}</td>
                    <td className="acoes-celula">
                      <button className="botao fantasma peq" onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}>
                        Remover
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Aviso tipo="erro">{erro}</Aviso>
      <div className="acoes fixas">
        <button
          className="botao secundario"
          disabled={ocupado || !sujo}
          onClick={() =>
            acao(async () => {
              if ((await salvar()).ok) await onMudou('Itens salvos.')
            })
          }
        >
          Salvar itens
        </button>
        <button
          className="botao primario"
          disabled={ocupado || linhas.length === 0}
          onClick={() =>
            acao(async () => {
              let gravou = false
              if (sujo) {
                const r = await salvar()
                if (!r.ok) return
                gravou = r.gravou
              }
              const { error } = await supabase.rpc('rpc_enviar_pedido', { p_pedido_id: pedido.id })
              if (!error) await onMudou(`Pedido ${formatarDoc('PED', pedido.numero)} enviado.`)
              else if (gravou) await onFalhaParcial(`Itens salvos, mas o pedido não foi enviado: ${mensagemErro(error)}`)
              else setErro(mensagemErro(error))
            })
          }
        >
          Enviar pedido
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function useSaldos(almoxId: string) {
  const [saldos, setSaldos] = useState<Map<string, number> | null>(null)
  useEffect(() => {
    void saldosDe(almoxId).then(setSaldos).catch(() => setSaldos(new Map()))
  }, [almoxId])
  return saldos
}

function Aprovacao({ pedido, itens, onMudou }: { pedido: Pedido; itens: PedidoItem[]; onMudou: (m: string) => Promise<void> }) {
  const { material, aceitaFracao } = useCatalogo()
  const saldos = useSaldos(pedido.atendente_id)
  const [valores, setValores] = useState(() =>
    Object.fromEntries(itens.map((i) => [i.material_id, { qtd: String(i.qtd_solicitada).replace('.', ','), motivo: '' }])),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function aprovar() {
    setErro(null)
    for (const i of itens) {
      const e = qtdValida(valores[i.material_id].qtd, aceitaFracao(i.material_id), { permiteZero: true })
      if (e) return setErro(`${material(i.material_id)?.codigo_sap}: ${e}`)
    }
    setOcupado(true)
    const { error } = await supabase.rpc('rpc_aprovar_pedido', {
      p_pedido_id: pedido.id,
      p_itens: itens.map((i) => ({
        material_id: i.material_id,
        qtd_aprovada: lerNumero(valores[i.material_id].qtd),
        motivo_corte: valores[i.material_id].motivo || null,
      })),
    })
    setOcupado(false)
    if (error) setErro(mensagemErro(error))
    else await onMudou(`Pedido ${formatarDoc('PED', pedido.numero)} aprovado.`)
  }

  return (
    <div className="cartao pilha">
      <h2>Aprovação</h2>
      <p className="sec peq">Aprove a quantidade de cada item. Abaixo do solicitado é corte e exige motivo.</p>
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th className="num">Solicitada</th>
              <th className="num">Saldo disponível</th>
              <th className="num">Aprovada</th>
              <th>Motivo do corte</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => {
              const m = material(i.material_id)
              const v = valores[i.material_id]
              const corte = lerNumero(v.qtd) < Number(i.qtd_solicitada)
              return (
                <tr key={i.id}>
                  <td>
                    <MaterialRotulo id={i.material_id} />
                  </td>
                  <td className="num">
                    {formatarQtd(i.qtd_solicitada)} {m?.unidade}
                  </td>
                  <td className="num">{saldos ? formatarQtd(saldos.get(i.material_id) ?? 0) : '…'}</td>
                  <td style={{ width: 120 }}>
                    <input
                      inputMode="decimal"
                      aria-label={`Aprovada de ${m?.codigo_sap}`}
                      value={v.qtd}
                      onChange={(e) => setValores({ ...valores, [i.material_id]: { ...v, qtd: e.target.value } })}
                    />
                  </td>
                  <td style={{ minWidth: 200 }}>
                    {corte && (
                      <input
                        aria-label={`Motivo do corte de ${m?.codigo_sap}`}
                        value={v.motivo}
                        placeholder="Por que cortou"
                        onChange={(e) => setValores({ ...valores, [i.material_id]: { ...v, motivo: e.target.value } })}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Aviso tipo="erro">{erro}</Aviso>
      <div className="acoes fixas">
        <button className="botao primario" disabled={ocupado} onClick={() => void aprovar()}>
          Aprovar pedido
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Envio({ pedido, itens }: { pedido: Pedido; itens: PedidoItem[] }) {
  const { material, aceitaFracao } = useCatalogo()
  const saldos = useSaldos(pedido.atendente_id)
  const navegar = useNavigate()
  const aprovados = itens.filter((i) => Number(i.qtd_aprovada) > 0)
  const [qtds, setQtds] = useState(() =>
    Object.fromEntries(aprovados.map((i) => [i.material_id, String(i.qtd_aprovada).replace('.', ',')])),
  )
  const [data, setData] = useState(hojeISO())
  const [documento, setDocumento] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function enviar() {
    setErro(null)
    for (const i of aprovados) {
      const e = qtdValida(qtds[i.material_id], aceitaFracao(i.material_id), { permiteZero: true })
      if (e) return setErro(`${material(i.material_id)?.codigo_sap}: ${e}`)
    }
    setOcupado(true)
    const { data: remessaId, error } = await supabase.rpc('rpc_enviar_remessa_pedido', {
      p_pedido_id: pedido.id,
      p_itens: aprovados.map((i) => ({ material_id: i.material_id, qtd_enviada: lerNumero(qtds[i.material_id]) })),
      p_data_envio: data,
      p_documento_ref: documento || undefined,
      p_observacao: observacao || undefined,
    })
    setOcupado(false)
    if (error) setErro(mensagemErro(error))
    else navegar(`/remessas/${remessaId}`)
  }

  return (
    <div className="cartao pilha">
      <h2>Separação e envio</h2>
      <p className="sec peq">Informe o que foi efetivamente separado. O que não for enviado vira corte.</p>
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th className="num">Aprovada</th>
              <th className="num">Saldo</th>
              <th className="num">Enviada</th>
            </tr>
          </thead>
          <tbody>
            {aprovados.map((i) => {
              const m = material(i.material_id)
              const saldo = saldos?.get(i.material_id) ?? 0
              const falta = saldos && lerNumero(qtds[i.material_id]) > saldo
              return (
                <tr key={i.id}>
                  <td>
                    <MaterialRotulo id={i.material_id} />
                  </td>
                  <td className="num">
                    {formatarQtd(i.qtd_aprovada)} {m?.unidade}
                  </td>
                  <td className="num" style={falta ? { color: 'var(--st-alerta-texto)' } : undefined}>
                    {saldos ? formatarQtd(saldo) : '…'}
                  </td>
                  <td style={{ width: 120 }}>
                    <input
                      inputMode="decimal"
                      aria-label={`Enviada de ${m?.codigo_sap}`}
                      aria-invalid={falta || undefined}
                      value={qtds[i.material_id]}
                      onChange={(e) => setQtds({ ...qtds, [i.material_id]: e.target.value })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grade-2">
        <Campo rotulo="Data do envio">
          <input type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo rotulo="Documento / guia" ajuda="Opcional: número da guia ou do documento SAP.">
          <input value={documento} onChange={(e) => setDocumento(e.target.value)} />
        </Campo>
        <Campo rotulo="Observação" style={{ gridColumn: '1 / -1' }}>
          <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Campo>
      </div>
      <Aviso tipo="erro">{erro}</Aviso>
      <div className="acoes fixas">
        <button className="botao primario" disabled={ocupado} onClick={() => void enviar()}>
          Registrar envio
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Resumo({ linhas }: { linhas: Visao<'v_pedido_resumo'>[] }) {
  const recebido = linhas.some((l) => l.qtd_recebida !== null)
  return (
    <div className="cartao pilha">
      <h2>Resumo</h2>
      <p className="sec peq">
        Diferença de atendimento = solicitado − enviado (o 211 não tinha ou cortou). Diferença de conferência = enviado − recebido
        (saiu e não chegou igual).
      </p>
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th className="num">Solicitada</th>
              <th className="num">Aprovada</th>
              <th className="num">Enviada</th>
              <th className="num">Recebida</th>
              <th className="num">Dif. atendimento</th>
              <th className="num">Dif. conferência</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.material_id}>
                <td className="mono">{l.codigo_sap}</td>
                <td>{l.descricao}</td>
                <td>{l.unidade}</td>
                <td className="num">{formatarQtd(l.qtd_solicitada)}</td>
                <td className="num">{formatarQtd(l.qtd_aprovada)}</td>
                <td className="num">{formatarQtd(l.qtd_enviada)}</td>
                <td className="num">{formatarQtd(l.qtd_recebida)}</td>
                <td className="num">{formatarQtd(l.diferenca_atendimento)}</td>
                <td className="num" style={Number(l.diferenca_conferencia) ? { color: 'var(--st-alerta-texto)', fontWeight: 600 } : undefined}>
                  {formatarQtd(l.diferenca_conferencia)}
                </td>
                <td className="peq">
                  {[l.motivo_corte && `Corte: ${l.motivo_corte}`, l.motivo_divergencia && rotuloStatus(l.motivo_divergencia)]
                    .filter(Boolean)
                    .join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!recebido && <p className="sec peq">Recebido e diferença de conferência aparecem depois da conferência na base.</p>}
    </div>
  )
}

function Cancelamento({ pedido, onMudou }: { pedido: Pedido; onMudou: (m: string) => Promise<void> }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  if (!aberto) {
    return (
      <div className="acoes">
        <button className="botao perigo" onClick={() => setAberto(true)}>
          Cancelar pedido
        </button>
      </div>
    )
  }
  return (
    <div className="cartao pilha">
      <h2>Cancelar pedido</h2>
      <Campo rotulo="Motivo do cancelamento">
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Campo>
      <Aviso tipo="erro">{erro}</Aviso>
      <div className="acoes">
        <button className="botao secundario" onClick={() => setAberto(false)}>
          Voltar
        </button>
        <button
          className="botao perigo"
          onClick={async () => {
            const { error } = await supabase.rpc('rpc_cancelar_pedido', { p_pedido_id: pedido.id, p_motivo: motivo })
            if (error) setErro(mensagemErro(error))
            else await onMudou(`Pedido ${formatarDoc('PED', pedido.numero)} cancelado.`)
          }}
        >
          Confirmar cancelamento
        </button>
      </div>
    </div>
  )
}
