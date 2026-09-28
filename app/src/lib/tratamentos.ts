import type { Enum } from './supabase'

/**
 * Tratamentos que o usuário pode registrar (espelha rpc_tratar_divergencia).
 * diferenca = enviado − recebido: positiva é falta, negativa é sobra.
 */
export function tratamentosPermitidos(p: {
  externa: boolean
  diferenca: number
  ehOrigem: boolean
  ehDestino: boolean
}): Enum<'tipo_tratamento'>[] {
  const falta = p.diferenca > 0
  if (p.externa) {
    if (!p.ehDestino) return []
    return falta ? ['externo', 'chegou_depois'] : ['externo']
  }
  if (!falta) return p.ehOrigem ? ['ajuste_origem'] : []
  return [...(p.ehOrigem ? (['reenvio', 'baixa_transito'] as const) : []), ...(p.ehDestino ? (['chegou_depois'] as const) : [])]
}
