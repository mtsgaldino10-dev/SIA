import { useEffect, useState } from 'react'
import { caminhoFoto, comprimirFoto } from './foto'
import { carregarTodos, supabase } from './supabase'

let nomesCache: Promise<Map<string, string>> | null = null

/** Nomes dos usuários (id → nome), carregados uma vez. */
export function useNomes(): Map<string, string> {
  const [nomes, setNomes] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    nomesCache ??= Promise.resolve(
      supabase
        .from('v_usuarios')
        .select('id, nome')
        .then(({ data }) => new Map((data ?? []).map((u) => [u.id ?? '', u.nome ?? '']))),
    )
    void nomesCache.then(setNomes)
  }, [])
  return nomes
}

/** Saldo por material num almoxarifado. */
export async function saldosDe(almoxId: string): Promise<Map<string, number>> {
  const linhas = await carregarTodos<{ material_id: string | null; saldo: number | null }>((de, ate) =>
    supabase.from('v_saldo').select('material_id, saldo').eq('almox_id', almoxId).range(de, ate),
  )
  return new Map(linhas.map((l) => [l.material_id ?? '', Number(l.saldo ?? 0)]))
}

/** Comprime e envia a foto do recebimento; devolve o caminho no Storage. */
export async function enviarFoto(remessaId: string, arquivo: File): Promise<string> {
  const blob = await comprimirFoto(arquivo)
  const caminho = caminhoFoto(remessaId)
  const { error } = await supabase.storage.from('recebimentos').upload(caminho, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return caminho
}

export async function urlFoto(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from('recebimentos').createSignedUrl(caminho, 60 * 60)
  return data?.signedUrl ?? null
}
