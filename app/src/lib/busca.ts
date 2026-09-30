export type PrefixoDoc = 'PED' | 'REM' | 'SAI' | 'AJU'

const PREFIXOS: PrefixoDoc[] = ['PED', 'REM', 'SAI', 'AJU']

/**
 * Interpreta o termo da busca global (⌘K).
 * - Com prefixo ("PED-001042", "rem 418"): só aquele tipo de documento.
 * - Só dígitos, até 7: número em qualquer documento e também código de material.
 * - Qualquer outro texto: só materiais (código SAP ou descrição).
 */
export function interpretarBusca(termo: string): { prefixos: PrefixoDoc[]; numero: number | null; texto: string } {
  const t = termo.trim()
  const comPrefixo = /^(PED|REM|SAI|AJU)[\s-]*(\d+)$/i.exec(t)
  if (comPrefixo) {
    return { prefixos: [comPrefixo[1].toUpperCase() as PrefixoDoc], numero: Number(comPrefixo[2]), texto: '' }
  }
  if (/^\d{1,7}$/.test(t)) return { prefixos: PREFIXOS, numero: Number(t), texto: t }
  return { prefixos: [], numero: null, texto: t }
}
