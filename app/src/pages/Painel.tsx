import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Donut, GraficoLinha } from '../components/graficos'
import { FiltroPeriodo, MenuAcoes } from '../components/Menus'
import { Aviso, Campo, Carregando, Doc, Etiqueta, PaginaTopo, Regiao, StatusBadge, Vazio } from '../components/ui'
import { formatarData, formatarDoc, formatarMoeda, formatarQtd } from '../lib/formato'
import { baixarPlanilha } from '../lib/planilha'
import { contarPorDia, diasDoPeriodo, emTransitoPorDia, formatarDiaMes, ultimosDias, type Periodo } from '../lib/series'
import { carregarTodos, supabase } from '../lib/supabase'
import { listaOuErro, useConsulta } from '../lib/useConsulta'

const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const formatarPct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : pct.format(Number(v)))

type RemessaPeriodo = { id: string; status: string; data_envio: string; data_recebimento: string | null }

export function Painel() {
  const { veTudo, almox } = useSessao()
  const [periodo, setPeriodo] = useState<Periodo>(() => ultimosDias(30))
  const [diasParada, setDiasParada] = useState('3')
  const { de, ate } = periodo

  const consulta = useConsulta(async () => {
    const [indicadores, consumo, ajustes, transito, remessas, divergencias] = await Promise.all([
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
      // Toda remessa que esteve em trânsito em algum dia do período: base dos gráficos.
      carregarTodos<RemessaPeriodo>((i, f) =>
        supabase
          .from('remessas')
          .select('id, status, data_envio, data_recebimento')
          .lte('data_envio', ate)
          .or(`data_recebimento.is.null,data_recebimento.gte.${de}`)
          .order('id')
          .range(i, f),
      ),
      supabase.from('v_divergencias_abertas').select('remessa_item_id', { count: 'exact', head: true }),
    ])
    if (divergencias.error) throw divergencias.error
    return { indicadores, consumo, ajustes, transito, remessas, divergenciasAbertas: divergencias.count ?? 0 }
  }, [de, ate])

  const d = consulta.dados

  const paradas = useMemo(() => {
    const limite = Number(diasParada) || 0
    const porRemessa = new Map<string, NonNullable<typeof d>['transito'][number]>()
    for (const t of d?.transito ?? []) if ((t.dias_em_transito ?? 0) > limite) porRemessa.set(t.remessa_id ?? '', t)
    return [...porRemessa.values()].sort((a, b) => (b.dias_em_transito ?? 0) - (a.dias_em_transito ?? 0))
  }, [d, diasParada])

  const graficos = useMemo(() => {
    if (!d) return null
    const dias = diasDoPeriodo(de, ate)
    const enviadasNoPeriodo = d.remessas.filter((r) => r.data_envio >= de)
    const enviadas = contarPorDia(enviadasNoPeriodo.map((r) => r.data_envio), dias)
    const recebidas = contarPorDia(d.remessas.map((r) => r.data_recebimento), dias)
    const porStatus = (s: string) => enviadasNoPeriodo.filter((r) => r.status === s).length
    const bases = d.indicadores.filter((i) => i.almox_tipo === 'base')
    const solicitada = bases.reduce((s, i) => s + Number(i.qtd_solicitada), 0)
    const enviada = bases.reduce((s, i) => s + Number(i.qtd_enviada), 0)
    return {
      rotulos: dias.map(formatarDiaMes),
      enviadas,
      recebidas,
      emTransito: emTransitoPorDia(d.remessas, dias),
      totalEnviadas: enviadasNoPeriodo.length,
      totalRecebidas: recebidas.reduce((s, n) => s + n, 0),
      atendimento: solicitada ? enviada / solicitada : null,
      fatias: [
        { rotulo: 'Encerrada', valor: porStatus('encerrada'), cor: 'var(--st-ok)' },
        { rotulo: 'Em trânsito', valor: porStatus('em_transito'), cor: 'var(--st-transito)' },
        { rotulo: 'Com divergência', valor: porStatus('com_divergencia'), cor: 'var(--st-alerta)' },
      ],
    }
  }, [d, de, ate])

  if (!veTudo) return <Aviso tipo="erro">Painel restrito à gestão.</Aviso>

  const sufixo = `${de}-a-${ate}`
  const emTransitoAgora = new Set(d?.transito.map((t) => t.remessa_id)).size

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Painel da gestão"
        trilha={['Gestão', 'Painel da gestão']}
        sub="Indicadores do período. Remessas paradas mostram a situação de agora."
        acoes={<FiltroPeriodo valor={periodo} onChange={setPeriodo} />}
      />
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {!d || !graficos ? (
        <Carregando />
      ) : (
        <>
          <div className="grade-cartoes">
            <Etiqueta valor={emTransitoAgora} legenda="Remessas em trânsito" tom="transito" serie={graficos.emTransito} href="/remessas" />
            <Etiqueta valor={graficos.totalRecebidas} legenda="Recebidas no período" tom="ok" serie={graficos.recebidas} />
            <Etiqueta valor={formatarPct(graficos.atendimento)} legenda="Atendimento às bases" tom="info" />
            <Etiqueta
              valor={d.divergenciasAbertas}
              legenda="Divergências abertas"
              tom={d.divergenciasAbertas ? 'alerta' : 'ok'}
              href="/divergencias"
            />
          </div>

          <div className="grade-graficos">
            <Regiao titulo="Remessas enviadas × recebidas" sub="Por dia, todos os almoxarifados.">
              <GraficoLinha
                rotulosX={graficos.rotulos}
                unidade=" rem."
                descricao={`Remessas por dia de ${formatarData(de)} a ${formatarData(ate)}: ${graficos.totalEnviadas} enviadas e ${graficos.totalRecebidas} recebidas.`}
                series={[
                  { nome: 'Enviadas', cor: 'var(--cor-marca)', valores: graficos.enviadas },
                  { nome: 'Recebidas', cor: 'var(--cor-estrutura)', valores: graficos.recebidas },
                ]}
              />
            </Regiao>
            <Regiao titulo="Remessas por status" sub="Enviadas no período, situação de agora.">
              {graficos.totalEnviadas === 0 ? (
                <Vazio>Nenhuma remessa enviada no período.</Vazio>
              ) : (
                <Donut tamanho={150} espessura={20} centro={graficos.totalEnviadas} legendaCentro="remessas" fatias={graficos.fatias} />
              )}
            </Regiao>
          </div>

          <Regiao
            titulo="Indicadores por almoxarifado"
            sub="Atendimento = enviado ÷ solicitado. Divergência = remessas com diferença ÷ recebidas. Perda = baixas em trânsito."
            acoes={
              <MenuAcoes
                itens={[
                  {
                    rotulo: 'Baixar planilha',
                    onClick: () =>
                      baixarPlanilha(`indicadores-${sufixo}.xlsx`, [
                        ['Código', 'Almoxarifado', 'Atendimento', 'Recebidas', 'Divergência', 'Trânsito (dias)', 'Perda em trânsito (R$)', 'Ajustes', 'Ajustes (R$)', 'Saídas (R$)'],
                        ...d.indicadores.map((i) => [
                          i.almox_codigo,
                          i.almox_nome,
                          i.taxa_atendimento,
                          i.remessas_recebidas,
                          i.indice_divergencia,
                          i.tempo_transito_medio,
                          i.perda_transito_valor,
                          i.ajustes_qtd,
                          i.ajustes_valor_abs,
                          i.saidas_valor,
                        ]),
                      ]),
                  },
                ]}
              />
            }
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
                      <td className={Number(i.indice_divergencia) > 0 ? 'num valor-critico' : 'num'}>{formatarPct(i.indice_divergencia)}</td>
                      <td className="num">{formatarQtd(i.tempo_transito_medio)}</td>
                      <td className="num">{Number(i.perda_transito_valor) ? formatarMoeda(i.perda_transito_valor) : '—'}</td>
                      <td className="num">{i.ajustes_qtd ? `${i.ajustes_qtd} · ${formatarMoeda(i.ajustes_valor_abs)}` : '—'}</td>
                      <td className="num">{Number(i.saidas_valor) ? formatarMoeda(i.saidas_valor) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Regiao>

          <Regiao
            titulo="Ajustes de inventário"
            sub="Todo ajuste aparece aqui em destaque, com a justificativa de quem contou."
            fita
            acoes={
              d.ajustes.length > 0 && (
                <MenuAcoes
                  itens={[
                    {
                      rotulo: 'Baixar planilha',
                      onClick: () =>
                        baixarPlanilha(`ajustes-${sufixo}.xlsx`, [
                          ['Ajuste', 'Almoxarifado', 'Data', 'Justificativa', 'Itens', 'Valor absoluto (R$)'],
                          ...d.ajustes.map((a) => [
                            formatarDoc('AJU', a.numero),
                            almox(a.almox_id)?.nome ?? '',
                            formatarData(a.data_ocorrencia),
                            a.justificativa,
                            (a.ajuste_itens ?? []).filter((it) => Number(it.diferenca) !== 0).length,
                            valorAjuste(a.ajuste_itens),
                          ]),
                        ]),
                    },
                  ]}
                />
              )
            }
          >
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
                    {d.ajustes.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Doc prefixo="AJU" numero={a.numero} />
                        </td>
                        <td>{almox(a.almox_id)?.nome}</td>
                        <td>{formatarData(a.data_ocorrencia)}</td>
                        <td>{a.justificativa}</td>
                        <td className="num">{(a.ajuste_itens ?? []).filter((it) => Number(it.diferenca) !== 0).length}</td>
                        <td className="num">{formatarMoeda(valorAjuste(a.ajuste_itens))}</td>
                      </tr>
                    ))}
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
                      <StatusBadge tom="transito">{r.dias_em_transito} dias</StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Regiao>

          <Regiao
            titulo="Consumo"
            sub="Saídas registradas por base e material, ordenadas por valor."
            acoes={
              d.consumo.length > 0 && (
                <MenuAcoes
                  itens={[
                    {
                      rotulo: 'Baixar planilha',
                      onClick: () =>
                        baixarPlanilha(`consumo-${sufixo}.xlsx`, [
                          ['Almoxarifado', 'Código SAP', 'Descrição', 'Quantidade', 'Unidade', 'Valor (R$)'],
                          ...d.consumo.map((c) => [c.almox_nome, c.codigo_sap, c.descricao, c.quantidade, c.unidade, c.valor]),
                        ]),
                    },
                  ]}
                />
              )
            }
          >
            {d.consumo.length === 0 ? (
              <Vazio>Nenhuma saída no período.</Vazio>
            ) : (
              <div className="tabela-envoltorio rolagem">
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

/** Σ |diferença| × preço dos itens do ajuste. */
function valorAjuste(itens: { diferenca: number | null; materiais: { preco: number | null } | null }[] | null) {
  return (itens ?? []).reduce((s, it) => s + Math.abs(Number(it.diferenca ?? 0)) * Number(it.materiais?.preco ?? 0), 0)
}
