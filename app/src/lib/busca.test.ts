import { describe, expect, it } from 'vitest'
import { interpretarBusca } from './busca'

describe('interpretarBusca', () => {
  it('reconhece documento com prefixo, com ou sem hífen e zeros', () => {
    expect(interpretarBusca('PED-001042')).toEqual({ prefixos: ['PED'], numero: 1042, texto: '' })
    expect(interpretarBusca('rem 418')).toEqual({ prefixos: ['REM'], numero: 418, texto: '' })
    expect(interpretarBusca(' aju12 ')).toEqual({ prefixos: ['AJU'], numero: 12, texto: '' })
    expect(interpretarBusca('SAI-0001234567')).toEqual({ prefixos: ['SAI'], numero: 1234567, texto: '' })
  })

  it('número sem prefixo procura em todos os documentos e também nos materiais', () => {
    expect(interpretarBusca('1042')).toEqual({ prefixos: ['PED', 'REM', 'SAI', 'AJU'], numero: 1042, texto: '1042' })
  })

  it('código SAP longo procura só nos materiais', () => {
    expect(interpretarBusca('10004521')).toEqual({ prefixos: [], numero: null, texto: '10004521' })
  })

  it('texto procura só nos materiais', () => {
    expect(interpretarBusca('cabo de cobre')).toEqual({ prefixos: [], numero: null, texto: 'cabo de cobre' })
    expect(interpretarBusca('PED')).toEqual({ prefixos: [], numero: null, texto: 'PED' })
  })

  it('termo vazio não procura nada', () => {
    expect(interpretarBusca('   ')).toEqual({ prefixos: [], numero: null, texto: '' })
  })
})
