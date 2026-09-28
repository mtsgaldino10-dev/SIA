import { lerNumero } from './formato'

export type Mapeamento = {
  codigo_sap: number | null
  descricao: number | null
  unidade: number | null
  preco: number | null
  grupo: number | null
}

export type MaterialImportado = {
  linha: number
  codigo_sap: string
  descricao: string
  unidade: string
  preco: number | null
  grupo: string | null
}

export type LinhaBloqueada = { linha: number; codigo_sap: string; motivo: string }

function normalizar(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

const SINONIMOS: Record<keyof Mapeamento, string[]> = {
  codigo_sap: ['codigo', 'codigo sap', 'cod', 'cod sap', 'material', 'codigo_sap'],
  descricao: ['descricao', 'texto breve', 'texto breve material', 'denominacao'],
  unidade: ['unidade', 'um', 'unid', 'un', 'unidade de medida', 'umb'],
  preco: ['preco', 'preco unitario', 'valor', 'valor unitario'],
  grupo: ['grupo', 'grupo de mercadorias', 'grupo mercadoria', 'familia'],
}

export function detectarMapeamento(cabecalho: unknown[]): Mapeamento {
  const nomes = cabecalho.map(normalizar)
  const achar = (campo: keyof Mapeamento) => {
    const i = nomes.findIndex((n) => SINONIMOS[campo].includes(n))
    return i === -1 ? null : i
  }
  return {
    codigo_sap: achar('codigo_sap'),
    descricao: achar('descricao'),
    unidade: achar('unidade'),
    preco: achar('preco'),
    grupo: achar('grupo'),
  }
}

/** Índice da linha de cabeçalho (a primeira que tem uma coluna de código). */
export function encontrarCabecalho(linhas: unknown[][]): number {
  return linhas.findIndex((l) => detectarMapeamento(l).codigo_sap !== null)
}

function celula(linha: unknown[], indice: number | null): string {
  if (indice === null) return ''
  const v = linha[indice]
  return v === null || v === undefined ? '' : String(v).trim()
}

export function validarMateriais(
  linhas: unknown[][],
  mapa: Mapeamento,
  unidades: string[],
  existentes: Set<string>,
  primeiraLinha = 1,
): { validas: MaterialImportado[]; bloqueadas: LinhaBloqueada[] } {
  const unidadesOk = new Set(unidades)
  const candidatas = linhas
    .map((l, i) => ({
      linha: primeiraLinha + i,
      codigo_sap: celula(l, mapa.codigo_sap),
      descricao: celula(l, mapa.descricao),
      unidade: celula(l, mapa.unidade).toUpperCase(),
      precoTexto: celula(l, mapa.preco),
      grupo: celula(l, mapa.grupo) || null,
    }))
    .filter((c) => c.codigo_sap !== '' || c.descricao !== '')

  const contagem = new Map<string, number>()
  for (const c of candidatas) contagem.set(c.codigo_sap, (contagem.get(c.codigo_sap) ?? 0) + 1)

  const validas: MaterialImportado[] = []
  const bloqueadas: LinhaBloqueada[] = []

  for (const c of candidatas) {
    const bloquear = (motivo: string) => bloqueadas.push({ linha: c.linha, codigo_sap: c.codigo_sap, motivo })
    const preco = c.precoTexto === '' ? null : lerNumero(c.precoTexto)

    if (c.codigo_sap === '') bloquear('Código vazio')
    else if ((contagem.get(c.codigo_sap) ?? 0) > 1) bloquear('Código repetido na planilha')
    else if (existentes.has(c.codigo_sap)) bloquear('Já cadastrado')
    else if (c.descricao === '') bloquear('Descrição vazia')
    else if (!unidadesOk.has(c.unidade)) bloquear(c.unidade ? `Unidade ${c.unidade} não cadastrada` : 'Unidade vazia')
    else if (preco !== null && (Number.isNaN(preco) || preco < 0)) bloquear('Preço inválido')
    else {
      validas.push({
        linha: c.linha,
        codigo_sap: c.codigo_sap,
        descricao: c.descricao,
        unidade: c.unidade,
        preco,
        grupo: c.grupo,
      })
    }
  }

  return { validas, bloqueadas }
}

export function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho))
  return lotes
}

export type MaterialCatalogo = { id: string; aceita_fracao: boolean }

/**
 * Planilha de saldo inicial: colunas codigo_sap e quantidade.
 * Qualquer erro bloqueia a importação inteira (itens volta vazio).
 */
export function validarSaldoInicial(
  linhas: unknown[][],
  materiais: Map<string, MaterialCatalogo>,
): { itens: { material_id: string; qtd_contada: number }[]; erros: string[] } {
  const cabecalho = (linhas[0] ?? []).map(normalizar)
  const iCodigo = cabecalho.indexOf('codigo_sap')
  const iQtd = cabecalho.indexOf('quantidade')
  if (iCodigo === -1 || iQtd === -1) {
    return { itens: [], erros: ['A planilha precisa das colunas codigo_sap e quantidade'] }
  }

  const itens: { material_id: string; qtd_contada: number }[] = []
  const erros: string[] = []
  const vistos = new Set<string>()

  linhas.slice(1).forEach((l, i) => {
    const linha = i + 2
    const codigo = celula(l, iCodigo)
    const qtdTexto = celula(l, iQtd)
    if (codigo === '' && qtdTexto === '') return

    const material = materiais.get(codigo)
    const qtd = lerNumero(qtdTexto)

    if (!material) erros.push(`Linha ${linha}: material ${codigo || '(vazio)'} não existe no catálogo`)
    else if (Number.isNaN(qtd) || qtd < 0) erros.push(`Linha ${linha}: quantidade inválida`)
    else if (!material.aceita_fracao && !Number.isInteger(qtd)) erros.push(`Linha ${linha}: material ${codigo} não aceita fração`)
    else if (vistos.has(codigo)) erros.push(`Linha ${linha}: material ${codigo} repetido`)
    else itens.push({ material_id: material.id, qtd_contada: qtd })

    vistos.add(codigo)
  })

  return erros.length ? { itens: [], erros } : { itens, erros }
}
