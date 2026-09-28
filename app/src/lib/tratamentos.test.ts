import { describe, expect, it } from 'vitest'
import { tratamentosPermitidos } from './tratamentos'

describe('tratamentosPermitidos', () => {
  const base = { externa: false, diferenca: 2, ehOrigem: false, ehDestino: false }

  it('falta: origem reenvia ou dá baixa; destino registra que chegou depois', () => {
    expect(tratamentosPermitidos({ ...base, ehOrigem: true })).toEqual(['reenvio', 'baixa_transito'])
    expect(tratamentosPermitidos({ ...base, ehDestino: true })).toEqual(['chegou_depois'])
  })
  it('sobra: só a origem, com ajuste na origem', () => {
    expect(tratamentosPermitidos({ ...base, diferenca: -1, ehOrigem: true, ehDestino: true })).toEqual(['ajuste_origem'])
    expect(tratamentosPermitidos({ ...base, diferenca: -1, ehDestino: true })).toEqual([])
  })
  it('remessa do 3256: destino trata como externo ou chegou depois', () => {
    expect(tratamentosPermitidos({ ...base, externa: true, ehDestino: true })).toEqual(['externo', 'chegou_depois'])
    expect(tratamentosPermitidos({ ...base, externa: true, diferenca: -3, ehDestino: true })).toEqual(['externo'])
  })
  it('quem não é responsável de nenhuma ponta só acompanha', () => {
    expect(tratamentosPermitidos(base)).toEqual([])
  })
})
