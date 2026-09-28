import { describe, expect, it } from 'vitest'
import { tratamentosPermitidos } from './tratamentos'

describe('tratamentosPermitidos', () => {
  const base = { externa: false, diferenca: 2, ehOrigem: false, ehDestino: false }

  it('falta: origem reenvia ou dá baixa; destino registra que chegou depois', () => {
    expect(tratamentosPermitidos({ ...base, ehOrigem: true })).toEqual(['reenvio', 'baixa_transito', 'estorno_origem'])
    expect(tratamentosPermitidos({ ...base, ehDestino: true })).toEqual(['chegou_depois'])
  })
  it('sobra: origem ajusta o próprio saldo; destino corrige erro de contagem', () => {
    expect(tratamentosPermitidos({ ...base, diferenca: -1, ehOrigem: true })).toEqual(['ajuste_origem'])
    expect(tratamentosPermitidos({ ...base, diferenca: -1, ehDestino: true })).toEqual(['erro_contagem'])
    expect(tratamentosPermitidos({ ...base, diferenca: -1, ehOrigem: true, ehDestino: true })).toEqual(['ajuste_origem', 'erro_contagem'])
  })
  it('remessa do 3256: destino trata como externo ou chegou depois', () => {
    expect(tratamentosPermitidos({ ...base, externa: true, ehDestino: true })).toEqual(['externo', 'chegou_depois'])
    expect(tratamentosPermitidos({ ...base, externa: true, diferenca: -3, ehDestino: true })).toEqual(['externo', 'erro_contagem'])
  })
  it('quem não é responsável de nenhuma ponta só acompanha', () => {
    expect(tratamentosPermitidos(base)).toEqual([])
  })
})
