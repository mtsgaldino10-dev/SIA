import { describe, expect, it } from 'vitest'
import { caminhoFoto, dimensoesAlvo } from './foto'

describe('dimensoesAlvo', () => {
  it('reduz o lado maior para 1600 mantendo a proporção', () => {
    expect(dimensoesAlvo(4000, 3000)).toEqual({ largura: 1600, altura: 1200 })
    expect(dimensoesAlvo(3000, 4000)).toEqual({ largura: 1200, altura: 1600 })
  })
  it('não amplia imagem menor', () => {
    expect(dimensoesAlvo(800, 600)).toEqual({ largura: 800, altura: 600 })
  })
  it('arredonda para inteiro', () => {
    expect(dimensoesAlvo(4001, 3001)).toEqual({ largura: 1600, altura: 1200 })
  })
})

describe('caminhoFoto', () => {
  it('segue o padrão {remessa_id}/{uuid}.jpg', () => {
    const remessa = '608ff89f-3b79-4157-9287-30d93b578a92'
    expect(caminhoFoto(remessa)).toMatch(
      /^608ff89f-3b79-4157-9287-30d93b578a92\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    )
  })
})
