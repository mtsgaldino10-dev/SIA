import { describe, expect, it } from 'vitest'
import { emailDoUsuario } from './login'

describe('emailDoUsuario', () => {
  it('completa o usuário com o domínio da empresa', () => {
    expect(emailDoUsuario('matheus.galdino')).toBe('matheus.galdino@engelmig.com.br')
  })

  it('aceita o e-mail completo como veio', () => {
    expect(emailDoUsuario('admin@sia.test')).toBe('admin@sia.test')
  })

  it('ignora espaços e maiúsculas', () => {
    expect(emailDoUsuario('  Matheus.Galdino ')).toBe('matheus.galdino@engelmig.com.br')
  })
})
