import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { hojeISO } from '../lib/formato'
import { formatarDiaMes, ultimosDias, type Periodo } from '../lib/series'

/** Abre e fecha um painel flutuante; fecha com clique fora ou Esc. */
function usePopover() {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAberto(false)
      raiz.current?.querySelector('button')?.focus()
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])
  return { aberto, setAberto, raiz }
}

function Popover({
  gatilho,
  rotulo,
  children,
}: {
  gatilho: ReactNode
  /** Nome acessível do botão, quando o gatilho não tem texto. */
  rotulo?: string
  children: (fechar: () => void) => ReactNode
}) {
  const { aberto, setAberto, raiz } = usePopover()
  const id = useId()
  return (
    <div className="popover" ref={raiz}>
      <button
        type="button"
        className="botao-mini"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => setAberto(!aberto)}
      >
        {gatilho}
      </button>
      {aberto && (
        <div className="menu-flutuante" id={id}>
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  )
}

/** Menu "…" do cabeçalho de um cartão. */
export function MenuAcoes({ itens }: { itens: { rotulo: string; onClick: () => void }[] }) {
  return (
    <Popover rotulo="Mais opções" gatilho={<span aria-hidden="true">…</span>}>
      {(fechar) =>
        itens.map((item) => (
          <button
            key={item.rotulo}
            type="button"
            className="item-menu"
            onClick={() => {
              fechar()
              item.onClick()
            }}
          >
            {item.rotulo}
          </button>
        ))
      }
    </Popover>
  )
}

function esteMes(): Periodo {
  const hoje = hojeISO()
  return { de: `${hoje.slice(0, 8)}01`, ate: hoje, rotulo: 'Este mês' }
}

/** Filtro de período: atalhos e intervalo personalizado. */
export function FiltroPeriodo({ valor, onChange }: { valor: Periodo; onChange: (p: Periodo) => void }) {
  const hoje = hojeISO()
  const atalhos = [ultimosDias(7), ultimosDias(30), ultimosDias(90), esteMes()]
  const personalizado = (de: string, ate: string) =>
    onChange({ de, ate, rotulo: `${formatarDiaMes(de)} a ${formatarDiaMes(ate)}` })
  return (
    <Popover
      gatilho={
        <>
          <span className="sec">Período:</span> {valor.rotulo} <span aria-hidden="true">▾</span>
        </>
      }
    >
      {(fechar) => (
        <>
          {atalhos.map((p) => (
            <button
              key={p.rotulo}
              type="button"
              className="item-menu"
              aria-pressed={p.rotulo === valor.rotulo}
              onClick={() => {
                onChange(p)
                fechar()
              }}
            >
              {p.rotulo}
            </button>
          ))}
          <div className="menu-personalizado">
            <span className="peq sec">Personalizado</span>
            <label className="campo">
              <span>De</span>
              <input type="date" value={valor.de} max={valor.ate} onChange={(e) => e.target.value && personalizado(e.target.value, valor.ate)} />
            </label>
            <label className="campo">
              <span>Até</span>
              <input type="date" value={valor.ate} min={valor.de} max={hoje} onChange={(e) => e.target.value && personalizado(valor.de, e.target.value)} />
            </label>
          </div>
        </>
      )}
    </Popover>
  )
}
