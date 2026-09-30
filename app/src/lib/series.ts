import { hojeISO } from './formato'

// Séries diárias para os gráficos do painel. Datas em ISO (AAAA-MM-DD), sem fuso:
// a conta é feita em UTC para não pular nem repetir dia no horário de verão.

const DIA = 86_400_000

function paraUTC(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

const paraISO = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Todos os dias de `de` até `ate`, inclusive. */
export function diasDoPeriodo(de: string, ate: string): string[] {
  const dias: string[] = []
  for (let t = paraUTC(de), fim = paraUTC(ate); t <= fim; t += DIA) dias.push(paraISO(t))
  return dias
}

/** Período de `n` dias terminando em `ate`. */
export function periodoAte(ate: string, n: number): { de: string; ate: string } {
  return { de: paraISO(paraUTC(ate) - (n - 1) * DIA), ate }
}

export type Periodo = { de: string; ate: string; rotulo: string }

/** Os últimos `dias` dias, terminando hoje. */
export function ultimosDias(dias: number, hoje = hojeISO()): Periodo {
  return { ...periodoAte(hoje, dias), rotulo: `Últimos ${dias} dias` }
}

/** Quantas datas caem em cada dia. */
export function contarPorDia(datas: (string | null | undefined)[], dias: string[]): number[] {
  const posicao = new Map(dias.map((d, i) => [d, i]))
  const contagem = dias.map(() => 0)
  for (const data of datas) {
    const i = data ? posicao.get(data.slice(0, 10)) : undefined
    if (i !== undefined) contagem[i]++
  }
  return contagem
}

/** Remessas em trânsito ao fim de cada dia: enviadas até o dia e recebidas depois dele (ou ainda não). */
export function emTransitoPorDia(
  remessas: { data_envio: string; data_recebimento: string | null }[],
  dias: string[],
): number[] {
  return dias.map((dia) => remessas.filter((r) => r.data_envio <= dia && (!r.data_recebimento || r.data_recebimento > dia)).length)
}

/** 2026-09-05 → 05/09 */
export function formatarDiaMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}
