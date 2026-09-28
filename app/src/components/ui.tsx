import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatarDoc, formatarQtd, rotuloStatus, tomStatus } from '../lib/formato'

/** Símbolo: tronco que se divide em três ramos (o 211 distribuindo para as bases). */
export function Simbolo({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
      <g stroke="var(--cor-marca)" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M16 29V16M16 16L8 8.5M16 16V6.5M16 16l8-7.5" />
      </g>
      <g fill="var(--cor-marca)">
        <circle cx="8" cy="7.5" r="2.8" />
        <circle cx="16" cy="5" r="2.8" />
        <circle cx="24" cy="7.5" r="2.8" />
      </g>
    </svg>
  )
}

export function Marca({ comNome = false }: { comNome?: boolean }) {
  return (
    <span className="marca">
      <Simbolo />
      <span>
        <span className="marca-sigla">SIA</span>
        {comNome && <span className="marca-nome" style={{ display: 'block' }}>Sistema Integrado de Almoxarifado</span>}
      </span>
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${tomStatus(status)}`}>{rotuloStatus(status)}</span>
}

export function Doc({ prefixo, numero }: { prefixo: 'PED' | 'REM' | 'SAI' | 'AJU'; numero: number }) {
  return <span className="mono">{formatarDoc(prefixo, numero)}</span>
}

export function Qtd({ valor, unidade }: { valor: number | string | null | undefined; unidade?: string | null }) {
  return (
    <span className="mono">
      {formatarQtd(valor)}
      {unidade && valor !== null && valor !== undefined ? <span className="sec"> {unidade}</span> : null}
    </span>
  )
}

export function PaginaTopo({
  titulo,
  sub,
  voltar,
  acoes,
}: {
  titulo: ReactNode
  sub?: ReactNode
  voltar?: { para: string; rotulo: string }
  acoes?: ReactNode
}) {
  return (
    <>
      {voltar && (
        <Link className="voltar" to={voltar.para}>
          ← {voltar.rotulo}
        </Link>
      )}
      <div className="pagina-topo">
        <div>
          <h1>{titulo}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {acoes && <div className="linha">{acoes}</div>}
      </div>
    </>
  )
}

export function Campo({
  rotulo,
  ajuda,
  erro,
  children,
  style,
}: {
  rotulo: ReactNode
  ajuda?: ReactNode
  erro?: string | null
  children: ReactNode
  style?: React.CSSProperties
}) {
  return (
    <label className="campo" style={style}>
      <span>{rotulo}</span>
      {children}
      {erro ? <span className="erro-campo">{erro}</span> : ajuda ? <span className="ajuda">{ajuda}</span> : null}
    </label>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso' | 'info' | 'atencao'; children: ReactNode }) {
  if (!children) return null
  return (
    <div className={`aviso ${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>
}

export function Etiqueta({
  valor,
  legenda,
  tom,
  para,
}: {
  valor: ReactNode
  legenda: ReactNode
  tom?: 'alerta' | 'transito' | 'ok' | 'info'
  para?: string
}) {
  const conteudo = (
    <>
      <div className="valor">{valor}</div>
      <div className="legenda">{legenda}</div>
    </>
  )
  return para ? (
    <Link className={`etiqueta ${tom ?? ''}`} to={para}>
      {conteudo}
    </Link>
  ) : (
    <div className={`etiqueta ${tom ?? ''}`}>{conteudo}</div>
  )
}
