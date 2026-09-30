import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { formatarQtd } from '../lib/formato'

/** Mini-gráfico de linha para indicadores: tendência, sem eixos. */
export function Sparkline({
  valores,
  cor = 'var(--cor-marca)',
  largura = 84,
  altura = 30,
}: {
  valores: number[]
  cor?: string
  largura?: number
  altura?: number
}) {
  if (valores.length < 2) return null
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const faixa = max - min || 1
  const pontos = valores.map((v, i) => [(i / (valores.length - 1)) * (largura - 4) + 2, altura - 3 - ((v - min) / faixa) * (altura - 6)])
  const linha = pontos.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [ux, uy] = pontos[pontos.length - 1]
  return (
    <svg className="sparkline" width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true" style={{ color: cor }}>
      <path d={`${linha} L${ux.toFixed(1)} ${altura} L2 ${altura} Z`} fill="currentColor" opacity="0.1" />
      <path d={linha} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r="2.6" fill="currentColor" />
    </svg>
  )
}

export type FatiaDonut = { rotulo: string; valor: number; cor: string }

/** Donut com legenda à direita (rótulo, valor e %). As cores são as de status. */
export function Donut({
  fatias,
  centro,
  legendaCentro,
  tamanho = 168,
  espessura = 22,
}: {
  fatias: FatiaDonut[]
  centro?: number
  legendaCentro?: string
  tamanho?: number
  espessura?: number
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1
  const raio = (tamanho - espessura) / 2
  const volta = 2 * Math.PI * raio
  const comprimentos = fatias.map((f) => (f.valor / total) * volta)
  const inicios = comprimentos.map((_, i) => comprimentos.slice(0, i).reduce((s, c) => s + c, 0))
  return (
    <div className="donut">
      <div className="donut-grafico" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
          <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="var(--st-neutro-fundo)" strokeWidth={espessura} />
          {fatias.map((f, i) => (
            <circle
              key={f.rotulo}
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              fill="none"
              stroke={f.cor}
              strokeWidth={espessura}
              strokeDasharray={`${Math.max(comprimentos[i] - 2, 0)} ${volta}`}
              strokeDashoffset={-inicios[i]}
            />
          ))}
        </svg>
        {centro !== undefined && (
          <div className="donut-centro">
            <div className="numero">{formatarQtd(centro)}</div>
            {legendaCentro && <div className="rotulo">{legendaCentro}</div>}
          </div>
        )}
      </div>
      <ul className="donut-legenda">
        {fatias.map((f) => (
          <li key={f.rotulo}>
            <span className="amostra" style={{ background: f.cor }} />
            <span className="rotulo">{f.rotulo}</span>
            <span className="mono">{formatarQtd(f.valor)}</span>
            <span className="mono pct">{Math.round((f.valor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export type SerieLinha = { nome: string; cor: string; valores: number[] }

const MARGEM = { esq: 36, dir: 12, topo: 12, base: 26 }

/** Gráfico de linha com grade tracejada, eixos em mono e dica no hover. */
export function GraficoLinha({
  series,
  rotulosX,
  altura = 220,
  unidade = '',
  descricao,
}: {
  series: SerieLinha[]
  rotulosX: string[]
  altura?: number
  /** Sufixo na dica, ex. " rem." */
  unidade?: string
  /** Resumo para leitor de tela. */
  descricao: string
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(640)
  const [indice, setIndice] = useState<number | null>(null)

  // Mede a largura real para os rótulos não esticarem com o SVG.
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const observador = new ResizeObserver(([e]) => setLargura(Math.max(240, Math.round(e.contentRect.width))))
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  const n = rotulosX.length
  const maior = Math.max(0, ...series.flatMap((s) => s.valores))
  // Topo múltiplo de 4 para as cinco linhas da grade caírem em números inteiros.
  const topo = Math.max(4, Math.ceil((maior * 1.15) / 4) * 4)
  const x = (i: number) => (n < 2 ? largura / 2 : MARGEM.esq + (i / (n - 1)) * (largura - MARGEM.esq - MARGEM.dir))
  const y = (v: number) => MARGEM.topo + (1 - v / topo) * (altura - MARGEM.topo - MARGEM.base)
  const grade = [0, 0.25, 0.5, 0.75, 1].map((f) => topo * f)
  // Um rótulo "dd/mm" a cada ~52px; o último sempre aparece, e o regular que
  // ficaria colado nele é omitido.
  const cabem = Math.max(2, Math.floor((largura - MARGEM.esq - MARGEM.dir) / 52))
  const passo = Math.max(1, Math.ceil(n / cabem))
  const mostraRotulo = (i: number) => i === n - 1 || (i % passo === 0 && n - 1 - i >= passo / 2)

  function mover(e: PointerEvent<SVGSVGElement>) {
    if (n < 2) return setIndice(0)
    const caixaSvg = e.currentTarget.getBoundingClientRect()
    const rx = e.clientX - caixaSvg.left
    setIndice(Math.max(0, Math.min(n - 1, Math.round(((rx - MARGEM.esq) / (largura - MARGEM.esq - MARGEM.dir)) * (n - 1)))))
  }

  return (
    <div className="grafico-linha" ref={caixa}>
      <svg
        width={largura}
        height={altura}
        viewBox={`0 0 ${largura} ${altura}`}
        role="img"
        aria-label={descricao}
        onPointerMove={mover}
        onPointerLeave={() => setIndice(null)}
      >
        {grade.map((g, i) => (
          <g key={g}>
            <line x1={MARGEM.esq} x2={largura - MARGEM.dir} y1={y(g)} y2={y(g)} stroke="var(--borda)" strokeDasharray={i ? '3 4' : undefined} />
            <text x={MARGEM.esq - 6} y={y(g) + 4} textAnchor="end" className="eixo">
              {g}
            </text>
          </g>
        ))}
        {rotulosX.map(
          (r, i) =>
            mostraRotulo(i) && (
              <text key={r} x={x(i)} y={altura - 6} textAnchor="middle" className="eixo">
                {r}
              </text>
            ),
        )}
        {indice !== null && <line x1={x(indice)} x2={x(indice)} y1={MARGEM.topo} y2={altura - MARGEM.base} stroke="var(--cor-neutra)" />}
        {series.map((s) => (
          <path
            key={s.nome}
            d={s.valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.cor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {indice !== null && (
        <div className={`grafico-dica${indice > n / 2 ? ' esquerda' : ''}`} style={{ left: x(indice) }} aria-hidden="true">
          <div className="dia">{rotulosX[indice]}</div>
          {series.map((s) => (
            <div key={s.nome} className="serie">
              <span className="amostra" style={{ background: s.cor }} />
              <span className="espaco">{s.nome}</span>
              <span className="mono valor">
                {formatarQtd(s.valores[indice])}
                {unidade}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="grafico-legenda">
        {series.map((s) => (
          <span key={s.nome}>
            <i style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  )
}
