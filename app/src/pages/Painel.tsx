import { useId, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Campo, Carregando, Doc, PaginaTopo, Vazio } from '../components/ui'
import { formatarData, formatarMoeda, formatarQtd, hojeISO } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { listaOuErro, useConsulta } from '../lib/useConsulta'

const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const formatarPct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : pct.format(Number(v)))

function diasAtras(n: number) {
  const d = new Date(`${hojeISO()}T12:00:00`)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function Regiao({ titulo, sub, children }: { titulo: string; sub?: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="cartao pilha" aria-labelledby={id}>
      <div>
        <h2 id={id}>{titulo}</h2>
        {sub && <p className="sec peq" style={{ marginTop: 4 }}>{sub}</p>}
      </div>
      {children}
    </section>
  )
}

export function Painel() {
  const { veTudo } = useSessao()
  const [de, setDe] = useState(diasAtras(30))
  const [ate, setAte] = useState(hojeISO())
  const [diasParada, setDiasParada] = useState('3')

  const consulta = useConsulta(async () => {
    const [indicadores, consumo, ajustes, transito] = await Promise.all([
      listaOuErro(supabase.rpc('fn_indicadores', { p_de: de, p_ate: ate })),
      listaOuErro(supabase.rpc('fn_consumo', { p_de: de, p_ate: ate })),
      listaOuErro(
        supabase
          .from('ajustes')
          .select('id, numero, almox_id, justificativa, data_ocorrencia, ajuste_itens(diferenca, materiais(preco))')
          .eq('tipo', 'inventario')
          .gte('data_ocorrencia', de)
          .lte('data_ocorrencia', ate)
          .order('data_ocorrencia', { ascending: false }),
      ),
      listaOuErro(supabase.from('v_em_transito').select('remessa_id, remessa_numero, origem_nome, destino_nome, data_envio, dias_em_transito')),
    ])
    return { indicadores, consumo, ajustes, transito }
  }, [de, ate])

  const paradas = useMemo(() => {
    const limite = Number(diasParada) || 0
    const porRemessa = new Map<string, NonNullable<typeof consulta.dados>['transito'][number]>()
    for (const t of consulta.dados?.transito ?? []) if ((t.dias_em_transito ?? 0) > limite) porRemessa.set(t.remessa_id ?? '', t)
    return [...porRemessa.values()].sort((a, b) => (b.dias_em_transito ?? 0) - (a.dias_em_transito ?? 0))
  }, [consulta.dados, diasParada])

  const { almox } = useSessao()
  if (!veTudo) return <Aviso tipo="erro">Painel restrito à gestão.</Aviso>
  const d = consulta.dados

  return (
    <div className="pilha">
      <PaginaTopo titulo="Painel da gestão" sub="Indicadores do período. Remessas paradas mostram a situação de agora." />
      <div className="linha-fim">
        <Campo rotulo="De">
          <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} />
        </Campo>
        <Campo rotulo="Até">
          <input type="date" value={ate} min={de} max={hojeISO()} onChange={(e) => setAte(e.target.value)} />
        </Campo>
      </div>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {!d ? (
        <Carregando />
      ) : (
        <>
          <Regiao
            titulo="Indicadores por almoxarifado"
            sub="Atendimento = enviado ÷ solicitado. Divergência = remessas com diferença ÷ recebidas. Perda = baixas em trânsito."
          >
            <div className="tabela-envoltorio">
              <table>
                <thead>
                  <tr>
                    <th>Almoxarifado</th>
                    <th className="num">Atendimento</th>
                    <th className="num">Recebidas</th>
                    <th className="num">Divergência</th>
                    <th className="num">Trânsito (dias)</th>
                    <th className="num">Perda em trânsito</th>
                    <th className="num">Ajustes</th>
                    <th className="num">Saídas</th>
                  </tr>
                </thead>
                <tbody>
                  {d.indicadores.map((i) => (
                    <tr key={i.almox_id}>
                      <td>
                        <span className="mono">{i.almox_codigo}</span> {i.almox_nome}
                      </td>
                      <td className="num">{formatarPct(i.taxa_atendimento)}</td>
                      <td className="num">{i.remessas_recebidas}</td>
                      <td className="num" style={Number(i.indice_divergencia) > 0 ? { color: 'var(--st-alerta-texto)', fontWeight: 600 } : undefined}>
                        {formatarPct(i.indice_divergencia)}
                      </td>
                      <td className="num">{formatarQtd(i.tempo_transito_medio)}</td>
                      <td className="num">{Number(i.perda_transito_valor) ? formatarMoeda(i.perda_transito_valor) : '—'}</td>
                      <td className="num">
                        {i.ajustes_qtd ? `${i.ajustes_qtd} · ${formatarMoeda(i.ajustes_valor_abs)}` : '—'}
                      </td>
                      <td className="num">{Number(i.saidas_valor) ? formatarMoeda(i.saidas_valor) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Regiao>

          <Regiao titulo="Ajustes de inventário" sub="Todo ajuste aparece aqui em destaque, com a justificativa de quem contou.">
            <div className="fita" aria-hidden="true" />
            {d.ajustes.length === 0 ? (
              <Vazio>Nenhum ajuste de inventário no período.</Vazio>
            ) : (
              <div className="tabela-envoltorio">
                <table>
                  <thead>
                    <tr>
                      <th>Ajuste</th>
                      <th>Almoxarifado</th>
                      <th>Data</th>
                      <th>Justificativa</th>
                      <th className="num">Itens</th>
                      <th className="num">Valor absoluto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.ajustes.map((a) => {
                      const valor = (a.ajuste_itens ?? []).reduce(
                        (s, it) => s + Math.abs(Number(it.diferenca ?? 0)) * Number(it.materiais?.preco ?? 0),
                        0,
                      )
                      return (
                        <tr key={a.id}>
                          <td>
                            <Doc prefixo="AJU" numero={a.numero} />
                          </td>
                          <td>{almox(a.almox_id)?.nome}</td>
                          <td>{formatarData(a.data_ocorrencia)}</td>
                          <td>{a.justificativa}</td>
                          <td className="num">{(a.ajuste_itens ?? []).filter((it) => Number(it.diferenca) !== 0).length}</td>
                          <td className="num">{formatarMoeda(valor)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Regiao>

          <Regiao titulo="Remessas paradas">
            <Campo rotulo="Parada há mais de (dias)" style={{ maxWidth: 220 }}>
              <input inputMode="numeric" value={diasParada} onChange={(e) => setDiasParada(e.target.value)} />
            </Campo>
            {paradas.length === 0 ? (
              <Vazio>Nenhuma remessa parada.</Vazio>
            ) : (
              <div className="lista">
                {paradas.map((r) => (
                  <Link key={r.remessa_id} className="item-lista" to={`/remessas/${r.remessa_id}`}>
                    <div className="topo">
                      <span>
                        <Doc prefixo="REM" numero={r.remessa_numero ?? 0} /> · {r.origem_nome} → {r.destino_nome}
                      </span>
                      <span className="badge transito">{r.dias_em_transito} dias</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Regiao>

          <Regiao titulo="Consumo" sub="Saídas registradas por base e material, ordenadas por valor.">
            {d.consumo.length === 0 ? (
              <Vazio>Nenhuma saída no período.</Vazio>
            ) : (
              <div className="tabela-envoltorio" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Almoxarifado</th>
                      <th>Código</th>
                      <th>Descrição</th>
                      <th className="num">Quantidade</th>
                      <th className="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.consumo.map((c) => (
                      <tr key={`${c.almox_id}-${c.material_id}`}>
                        <td>{c.almox_nome}</td>
                        <td className="mono">{c.codigo_sap}</td>
                        <td>{c.descricao}</td>
                        <td className="num">
                          {formatarQtd(c.quantidade)} <span className="sec">{c.unidade}</span>
                        </td>
                        <td className="num">{formatarMoeda(c.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Regiao>
        </>
      )}
    </div>
  )
}
