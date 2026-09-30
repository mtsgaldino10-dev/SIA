import { describe, expect, it } from 'vitest'
import { validarQuemRetirou } from './saida'

describe('validarQuemRetirou', () => {
  const aplicacaoNaBase = { ehBase: true, motivo: 'aplicacao' as const, equipeId: 'e1', retiradoPor: 'João' }

  it('aplicação na base exige a equipe', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, equipeId: '' })).toBe('Informe a equipe que retirou o material.')
  })
  it('e o nome de quem retirou, sem aceitar só espaços', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, retiradoPor: '   ' })).toBe('Informe o nome de quem retirou o material.')
  })
  it('com equipe e nome, passa', () => {
    expect(validarQuemRetirou(aplicacaoNaBase)).toBeNull()
  })
  it('perda e avaria não exigem equipe nem nome', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, motivo: 'perda', equipeId: '', retiradoPor: '' })).toBeNull()
    expect(validarQuemRetirou({ ...aplicacaoNaBase, motivo: 'avaria', equipeId: '', retiradoPor: '' })).toBeNull()
  })
  it('no almoxarifado regional os dois são opcionais', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, ehBase: false, equipeId: '', retiradoPor: '' })).toBeNull()
  })
})
