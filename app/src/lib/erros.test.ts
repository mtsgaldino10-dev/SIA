import { describe, expect, it } from 'vitest'
import { mensagemErro } from './erros'

describe('mensagemErro', () => {
  it('repassa a mensagem das RPCs, que já vem pronta para o usuário', () => {
    expect(mensagemErro({ code: 'P0001', message: 'Saldo insuficiente em Mantena.' })).toBe('Saldo insuficiente em Mantena.')
  })
  it('repassa mensagens de permissão escritas pelas RPCs', () => {
    expect(mensagemErro({ code: '42501', message: 'Você não é responsável por Mantena. Peça a atribuição ao administrador.' }))
      .toBe('Você não é responsável por Mantena. Peça a atribuição ao administrador.')
  })
  it('traduz permissão negada do Postgres', () => {
    expect(mensagemErro({ code: '42501', message: 'new row violates row-level security policy for table "pedidos"' }))
      .toBe('Você não tem permissão para esta ação.')
    expect(mensagemErro({ code: '42501', message: 'permission denied for table movimentacoes' }))
      .toBe('Você não tem permissão para esta ação.')
  })
  it('traduz duplicidade', () => {
    expect(mensagemErro({ code: '23505', message: 'duplicate key value violates unique constraint "pedido_itens_pedido_id_material_id_key"' }))
      .toBe('Registro repetido. Este item já existe.')
  })
  it('traduz falha de rede', () => {
    expect(mensagemErro(new TypeError('Failed to fetch'))).toBe('Sem conexão com o servidor. Verifique a internet e tente de novo.')
  })
  it('traduz login inválido', () => {
    expect(mensagemErro({ message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.')
  })
  it('tem mensagem genérica para o desconhecido', () => {
    expect(mensagemErro(undefined)).toBe('Algo deu errado. Tente de novo.')
  })
})
