import { describe, expect, it } from 'vitest'
import { paraRpc, validarConferencia, type LinhaConferencia } from './Conferencia'

const linha = (p: Partial<LinhaConferencia>): LinhaConferencia => ({
  material_id: 'm1', enviada: '10', contado: '10', motivo: '', observacao: '', ...p,
})
const inteiro = () => false
const cod = () => '900001'

describe('validarConferencia', () => {
  it('exige contagem de todos os itens', () => {
    expect(validarConferencia([linha({ contado: '' })], inteiro, cod)).toBe('900001 (contado): Informe a quantidade.')
  })
  it('exige motivo quando chegou menos', () => {
    expect(validarConferencia([linha({ contado: '8' })], inteiro, cod)).toBe('Informe o motivo da diferença de 900001.')
    expect(validarConferencia([linha({ contado: '8', motivo: 'falta' })], inteiro, cod)).toBeNull()
  })
  it('sobra sem motivo é aceita (vira sobra)', () => {
    expect(validarConferencia([linha({ contado: '12' })], inteiro, cod)).toBeNull()
  })
  it('item fora da guia precisa de quantidade', () => {
    expect(validarConferencia([linha({ enviada: '0', contado: '0', extra: true })], inteiro, cod)).toMatch(/Item fora da guia/)
  })
  it('respeita unidade sem fração', () => {
    expect(validarConferencia([linha({ contado: '9,5', motivo: 'falta' })], inteiro, cod)).toBe('900001 (contado): Esta unidade não aceita fração.')
  })
})

describe('paraRpc', () => {
  it('limpa motivo quando bate e assume sobra quando chegou mais', () => {
    expect(paraRpc([linha({ motivo: 'falta' }), linha({ material_id: 'm2', contado: '12' })], false)).toEqual([
      { material_id: 'm1', qtd_recebida: 10, motivo_divergencia: null, observacao: null },
      { material_id: 'm2', qtd_recebida: 12, motivo_divergencia: 'sobra', observacao: null },
    ])
  })
  it('inclui a quantidade do documento na entrada do 3256', () => {
    expect(paraRpc([linha({ enviada: '50', contado: '52,5', motivo: 'sobra' })], true)[0]).toMatchObject({ qtd_enviada: 50, qtd_recebida: 52.5 })
  })
})
