import { describe, expect, it } from 'vitest'
import {
  detectarMapeamento,
  encontrarCabecalho,
  emLotes,
  validarMateriais,
  validarSaldoInicial,
  type Mapeamento,
} from './importacao'

// Formato real da planilha ALMOXARIF 211.xlsx: título, linha em branco e cabeçalho na 3ª linha.
const planilha: unknown[][] = [
  [null, null, null, null, null, null],
  [null, 'LISTA BÁSICA DE MATERIAIS PADRONIZADOS NA DISTRIBUIÇÃO', null, null, null, null],
  [null, 'SEQ', 'CÓDIGO', 'DESCRIÇÃO', 'UNIDADE', 'PREÇO'],
  [null, 1, 379454, 'ACESSÓRIO DESCONECTÁVEL', 'PC', 1060],
  [null, 2, 229641, 'CABO CA 34MM²', 'kg ', 41.42],
  [null, 1712, null, null, null, null],
  [null, 'PE/RD - Gerência de Gestão', null, null, null, null],
]

describe('encontrarCabecalho', () => {
  it('acha a linha que contém a coluna de código', () => {
    expect(encontrarCabecalho(planilha)).toBe(2)
  })
  it('retorna -1 quando não acha', () => {
    expect(encontrarCabecalho([['a', 'b']])).toBe(-1)
  })
})

describe('detectarMapeamento', () => {
  it('reconhece os nomes usuais das colunas, com ou sem acento', () => {
    expect(detectarMapeamento(planilha[2])).toEqual({ codigo_sap: 2, descricao: 3, unidade: 4, preco: 5, grupo: null })
    expect(detectarMapeamento(['Material', 'Texto breve', 'UM', 'Grupo de mercadorias'])).toEqual({
      codigo_sap: 0, descricao: 1, unidade: 2, preco: null, grupo: 3,
    })
  })
})

const mapa: Mapeamento = { codigo_sap: 2, descricao: 3, unidade: 4, preco: 5, grupo: null }
const unidades = ['PC', 'KG', 'M']

describe('validarMateriais', () => {
  it('normaliza código, unidade e preço, numerando pela linha real da planilha', () => {
    const r = validarMateriais(planilha.slice(3), mapa, unidades, new Set(), 4)
    expect(r.validas).toEqual([
      { linha: 4, codigo_sap: '379454', descricao: 'ACESSÓRIO DESCONECTÁVEL', unidade: 'PC', preco: 1060, grupo: null },
      { linha: 5, codigo_sap: '229641', descricao: 'CABO CA 34MM²', unidade: 'KG', preco: 41.42, grupo: null },
    ])
  })
  it('ignora linhas sem código nem descrição (rodapé e sequência solta)', () => {
    const r = validarMateriais(planilha.slice(3), mapa, unidades, new Set())
    expect(r.bloqueadas).toEqual([])
  })
  it('bloqueia código vazio', () => {
    const r = validarMateriais([[null, 1, '', 'PARAFUSO', 'PC', 1]], mapa, unidades, new Set())
    expect(r.bloqueadas).toEqual([{ linha: 1, codigo_sap: '', motivo: 'Código vazio' }])
  })
  it('bloqueia todas as ocorrências de código repetido na planilha', () => {
    const r = validarMateriais(
      [[null, 1, 10, 'A', 'PC', 1], [null, 2, 10, 'B', 'PC', 1], [null, 3, 11, 'C', 'PC', 1]],
      mapa, unidades, new Set(),
    )
    expect(r.validas.map((v) => v.codigo_sap)).toEqual(['11'])
    expect(r.bloqueadas).toEqual([
      { linha: 1, codigo_sap: '10', motivo: 'Código repetido na planilha' },
      { linha: 2, codigo_sap: '10', motivo: 'Código repetido na planilha' },
    ])
  })
  it('bloqueia código que já existe no banco, sem atualizar', () => {
    const r = validarMateriais([[null, 1, 10, 'A', 'PC', 1]], mapa, unidades, new Set(['10']))
    expect(r.bloqueadas[0].motivo).toBe('Já cadastrado')
  })
  it('bloqueia unidade fora da lista e não cria unidade', () => {
    const r = validarMateriais([[null, 1, 10, 'A', 'CX', 1]], mapa, unidades, new Set())
    expect(r.bloqueadas[0].motivo).toBe('Unidade CX não cadastrada')
  })
  it('bloqueia descrição vazia e preço inválido', () => {
    const r = validarMateriais(
      [[null, 1, 10, '', 'PC', 1], [null, 2, 11, 'B', 'PC', 'abc'], [null, 3, 12, 'C', 'PC', '1.060,50']],
      mapa, unidades, new Set(),
    )
    expect(r.bloqueadas.map((b) => b.motivo)).toEqual(['Descrição vazia', 'Preço inválido'])
    expect(r.validas[0].preco).toBe(1060.5)
  })
})

describe('emLotes', () => {
  it('divide em lotes do tamanho pedido', () => {
    expect(emLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
})

describe('validarSaldoInicial', () => {
  const materiais = new Map([
    ['10', { id: 'id-10', aceita_fracao: false }],
    ['20', { id: 'id-20', aceita_fracao: true }],
  ])
  it('monta os itens do ajuste de implantação', () => {
    const r = validarSaldoInicial([['codigo_sap', 'quantidade'], [10, 5], ['20', '2,5']], materiais)
    expect(r.erros).toEqual([])
    expect(r.itens).toEqual([
      { material_id: 'id-10', qtd_contada: 5 },
      { material_id: 'id-20', qtd_contada: 2.5 },
    ])
  })
  it('material inexistente bloqueia a importação inteira', () => {
    const r = validarSaldoInicial([['codigo_sap', 'quantidade'], [10, 5], [99, 1]], materiais)
    expect(r.erros).toEqual(['Linha 3: material 99 não existe no catálogo'])
    expect(r.itens).toEqual([])
  })
  it('valida quantidade, fração e repetição', () => {
    const r = validarSaldoInicial(
      [['codigo_sap', 'quantidade'], [10, 1.5], [20, -1], [20, 'x'], [10, 2]],
      materiais,
    )
    expect(r.erros).toEqual([
      'Linha 2: material 10 não aceita fração',
      'Linha 3: quantidade inválida',
      'Linha 4: quantidade inválida',
      'Linha 5: material 10 repetido',
    ])
  })
  it('exige as colunas codigo_sap e quantidade', () => {
    const r = validarSaldoInicial([['codigo', 'qtd']], materiais)
    expect(r.erros).toEqual(['A planilha precisa das colunas codigo_sap e quantidade'])
  })
})
