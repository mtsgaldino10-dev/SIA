import { describe, expect, it } from 'vitest'
import { contarPorDia, diasDoPeriodo, emTransitoPorDia, formatarDiaMes, periodoAte } from './series'

describe('diasDoPeriodo', () => {
  it('lista os dias do intervalo, inclusive as pontas', () => {
    expect(diasDoPeriodo('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'])
  })
  it('atravessa a virada do horário de verão sem pular nem repetir dia', () => {
    expect(diasDoPeriodo('2026-02-20', '2026-02-24')).toHaveLength(5)
    expect(diasDoPeriodo('2026-11-01', '2026-11-03')).toHaveLength(3)
  })
  it('intervalo invertido é vazio', () => {
    expect(diasDoPeriodo('2026-09-30', '2026-09-29')).toEqual([])
  })
})

describe('periodoAte', () => {
  it('volta n−1 dias para o período ter n dias', () => {
    expect(periodoAte('2026-09-30', 7)).toEqual({ de: '2026-09-24', ate: '2026-09-30' })
    expect(periodoAte('2026-03-01', 1)).toEqual({ de: '2026-03-01', ate: '2026-03-01' })
  })
})

describe('contarPorDia', () => {
  it('conta cada data no seu dia e ignora o que está fora', () => {
    const dias = ['2026-09-28', '2026-09-29', '2026-09-30']
    expect(contarPorDia(['2026-09-28', '2026-09-30', '2026-09-30', null, '2026-09-01'], dias)).toEqual([1, 0, 2])
  })
})

describe('emTransitoPorDia', () => {
  it('conta a remessa do dia do envio até a véspera do recebimento', () => {
    const dias = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']
    const remessas = [
      { data_envio: '2026-09-27', data_recebimento: '2026-09-29' }, // em trânsito em 28
      { data_envio: '2026-09-29', data_recebimento: null }, // de 29 em diante
      { data_envio: '2026-09-30', data_recebimento: '2026-09-30' }, // recebida no mesmo dia: nunca
    ]
    expect(emTransitoPorDia(remessas, dias)).toEqual([1, 1, 1, 1])
  })
})

describe('formatarDiaMes', () => {
  it('mostra dd/mm', () => {
    expect(formatarDiaMes('2026-09-05')).toBe('05/09')
  })
})
