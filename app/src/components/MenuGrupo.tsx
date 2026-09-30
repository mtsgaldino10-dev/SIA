import { useId, useState, type ReactNode } from 'react'
import { IcSeta } from './icones'

/** Grupo do menu lateral: o título abre e fecha a lista. Começa aberto. */
export function MenuGrupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(true)
  const id = useId()
  return (
    <div className="menu-secao">
      <button
        type="button"
        className="menu-grupo"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto(!aberto)}
      >
        {titulo}
        <IcSeta />
      </button>
      <div id={id} className="menu-itens" hidden={!aberto}>
        {children}
      </div>
    </div>
  )
}
