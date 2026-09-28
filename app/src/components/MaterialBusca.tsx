import { useId, useMemo, useState } from 'react'
import { useCatalogo } from '../auth/CatalogoContext'
import type { Material } from '../lib/supabase'

/** Campo de busca por código SAP ou descrição; escolhe um material ativo. */
export function MaterialBusca({
  onEscolher,
  excluir,
  rotulo = 'Adicionar material',
  placeholder = 'Código SAP ou descrição',
}: {
  onEscolher: (m: Material) => void
  excluir?: Set<string>
  rotulo?: string
  placeholder?: string
}) {
  const { buscar, carregando } = useCatalogo()
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const id = useId()

  const resultados = useMemo(
    () => buscar(termo, 30).filter((m) => !excluir?.has(m.id)).slice(0, 20),
    [buscar, termo, excluir],
  )

  function escolher(m: Material) {
    onEscolher(m)
    setTermo('')
    setAberto(false)
    setAtivo(0)
  }

  return (
    <div className="busca">
      <label className="campo">
        <span>{rotulo}</span>
        <input
          type="search"
          value={termo}
          placeholder={carregando ? 'Carregando catálogo…' : placeholder}
          role="combobox"
          aria-expanded={aberto && resultados.length > 0}
          aria-controls={id}
          autoComplete="off"
          onChange={(e) => {
            setTermo(e.target.value)
            setAberto(true)
            setAtivo(0)
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setAtivo((a) => Math.min(a + 1, resultados.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAtivo((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && resultados[ativo]) {
              e.preventDefault()
              escolher(resultados[ativo])
            } else if (e.key === 'Escape') {
              setAberto(false)
            }
          }}
        />
      </label>
      {aberto && termo.trim() && (
        <div className="busca-resultados" id={id} role="listbox">
          {resultados.length === 0 ? (
            <div className="carregando peq">Nenhum material encontrado.</div>
          ) : (
            resultados.map((m, i) => (
              <button
                type="button"
                key={m.id}
                role="option"
                aria-selected={i === ativo}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(m)}
              >
                <span className="mono">{m.codigo_sap}</span> · {m.descricao} <span className="sec">({m.unidade})</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/** Código + descrição de um material do catálogo. */
export function MaterialRotulo({ id, compacto = false }: { id: string; compacto?: boolean }) {
  const { material } = useCatalogo()
  const m = material(id)
  if (!m) return <span className="sec">Material não encontrado</span>
  return (
    <span>
      <span className="mono">{m.codigo_sap}</span>
      {compacto ? ' ' : <br />}
      <span className={compacto ? '' : 'peq'}>{m.descricao}</span>
    </span>
  )
}
