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
  const t: Enum<'tipo_tratamento'>[] = []
  if (p.externa) {
    if (p.ehDestino) t.push('externo', falta ? 'chegou_depois' : 'erro_contagem')
    return t
  }
  if (falta) {
    if (p.ehOrigem) t.push('reenvio', 'baixa_transito', 'estorno_origem')
    if (p.ehDestino) t.push('chegou_depois')
  } else {
    if (p.ehOrigem) t.push('ajuste_origem')
    if (p.ehDestino) t.push('erro_contagem')
  }
  return t
}
