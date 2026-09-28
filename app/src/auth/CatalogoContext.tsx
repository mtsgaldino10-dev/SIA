import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mensagemErro } from '../lib/erros'
import { carregarTodos, supabase, type Material, type Unidade } from '../lib/supabase'
import { useSessao } from './SessaoContext'

type Catalogo = {
  materiais: Material[]
  unidades: Unidade[]
  carregando: boolean
  erro: string | null
  material: (id: string | null | undefined) => Material | undefined
  aceitaFracao: (materialId: string) => boolean
  buscar: (termo: string, limite?: number) => Material[]
  recarregar: () => Promise<void>
}

const Contexto = createContext<Catalogo | null>(null)

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Catálogo de materiais e unidades, carregado uma vez por sessão. */
export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { session } = useSessao()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [m, u] = await Promise.all([
        carregarTodos<Material>((de, ate) => supabase.from('materiais').select('*').order('codigo_sap').range(de, ate)),
        supabase.from('unidades').select('*').order('codigo'),
      ])
      if (u.error) throw u.error
      setMateriais(m)
      setUnidades(u.data ?? [])
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (session) void recarregar()
  }, [session, recarregar])

  const valor = useMemo<Catalogo>(() => {
    const porId = new Map(materiais.map((m) => [m.id, m]))
    const fracao = new Map(unidades.map((u) => [u.codigo, u.aceita_fracao]))
    const indice = materiais.map((m) => ({ m, chave: semAcento(`${m.codigo_sap} ${m.descricao}`) }))
    return {
      materiais,
      unidades,
      carregando,
      erro,
      recarregar,
      material: (id) => (id ? porId.get(id) : undefined),
      aceitaFracao: (id) => fracao.get(porId.get(id)?.unidade ?? '') ?? false,
      buscar: (termo, limite = 20) => {
        const partes = semAcento(termo).split(/\s+/).filter(Boolean)
        if (!partes.length) return []
        const achados = indice.filter((i) => i.m.ativo && partes.every((p) => i.chave.includes(p)))
        // Código exato ou que começa com o termo vem primeiro
        const t = termo.trim()
        achados.sort((a, b) => Number(b.m.codigo_sap.startsWith(t)) - Number(a.m.codigo_sap.startsWith(t)))
        return achados.slice(0, limite).map((i) => i.m)
      },
    }
  }, [materiais, unidades, carregando, erro, recarregar])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogo(): Catalogo {
  const c = useContext(Contexto)
  if (!c) throw new Error('useCatalogo fora do CatalogoProvider')
  return c
}
