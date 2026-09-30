import type { Enum } from './supabase'

/**
 * Na aplicação em serviço de uma base, a saída diz qual equipe e quem retirou.
 * Mesmas regras e mensagens da rpc_registrar_saida. Devolve o erro ou null.
 */
export function validarQuemRetirou(p: {
  ehBase: boolean
  motivo: Enum<'motivo_saida'>
  equipeId: string
  retiradoPor: string
}): string | null {
  if (!p.ehBase || p.motivo !== 'aplicacao') return null
  if (!p.equipeId) return 'Informe a equipe que retirou o material.'
  if (!p.retiradoPor.trim()) return 'Informe o nome de quem retirou o material.'
  return null
}
