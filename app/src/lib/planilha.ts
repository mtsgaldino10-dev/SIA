import * as XLSX from 'xlsx'

/** Lê a primeira aba de um XLSX ou CSV como matriz de células. */
export async function lerPlanilha(arquivo: File): Promise<unknown[][]> {
  const dados = await arquivo.arrayBuffer()
  const livro = XLSX.read(dados, { type: 'array' })
  const aba = livro.Sheets[livro.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: null, raw: true })
}

export function baixarPlanilha(nomeArquivo: string, linhas: unknown[][]) {
  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), 'Planilha')
  XLSX.writeFile(livro, nomeArquivo)
}
