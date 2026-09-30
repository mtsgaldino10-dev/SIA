import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalogo } from '../auth/CatalogoContext'
import { useSessao } from '../auth/SessaoContext'
import { interpretarBusca, type PrefixoDoc } from '../lib/busca'
import { mensagemErro } from '../lib/erros'
import { formatarDoc } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { StatusBadge } from './ui'

function atalho() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'
}

/** Gatilho da busca global, no topo do menu lateral. */
export function BuscaComando({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="busca-comando" onClick={onClick} aria-keyshortcuts="Control+K Meta+K">
      <span>Buscar</span>
      <kbd aria-hidden="true">{atalho()}</kbd>
    </button>
  )
}

type Resultado = {
  chave: string
  codigo: string
  texto: string
  status?: string
  destino: string
}

async function procurarDocumentos(
  prefixos: PrefixoDoc[],
  numero: number,
  nomeAlmox: (id: string) => string,
): Promise<Resultado[]> {
  const buscas = prefixos.map(async (prefixo): Promise<Resultado[]> => {
    const codigo = formatarDoc(prefixo, numero)
    if (prefixo === 'PED') {
      const { data, error } = await supabase.from('pedidos').select('id, status, solicitante_id').eq('numero', numero).limit(1)
      if (error) throw error
      return data.map((p) => ({ chave: `PED-${p.id}`, codigo, texto: `Pedido de ${nomeAlmox(p.solicitante_id)}`, status: p.status, destino: `/pedidos/${p.id}` }))
    }
    if (prefixo === 'REM') {
      const { data, error } = await supabase.from('remessas').select('id, status, origem_id, destino_id').eq('numero', numero).limit(1)
      if (error) throw error
      return data.map((r) => ({
        chave: `REM-${r.id}`,
        codigo,
        texto: `${nomeAlmox(r.origem_id)} → ${nomeAlmox(r.destino_id)}`,
        status: r.status,
        destino: `/remessas/${r.id}`,
      }))
    }
    // Saídas e ajustes não têm página própria: abrem o histórico do almoxarifado filtrado pelo documento.
    const tabela = prefixo === 'SAI' ? 'saidas' : 'ajustes'
    const { data, error } = await supabase.from(tabela).select('id, almox_id').eq('numero', numero).limit(1)
    if (error) throw error
    return data.map((d) => ({
      chave: `${prefixo}-${d.id}`,
      codigo,
      texto: `${prefixo === 'SAI' ? 'Saída' : 'Ajuste'} em ${nomeAlmox(d.almox_id)}`,
      destino: `/historico?almox=${d.almox_id}&busca=${codigo}`,
    }))
  })
  return (await Promise.all(buscas)).flat()
}

/** Busca global: documento pelo número ou material pelo código ou descrição. */
export function DialogoBusca({ onFechar }: { onFechar: () => void }) {
  const navegar = useNavigate()
  const { buscar } = useCatalogo()
  const { almox } = useSessao()
  const [termo, setTermo] = useState('')
  const [docs, setDocs] = useState<{ chave: string; itens: Resultado[] } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ativo, setAtivo] = useState(0)
  const entrada = useRef<HTMLInputElement>(null)
  const idLista = useId()

  const busca = useMemo(() => interpretarBusca(termo), [termo])
  const chaveDocs = busca.numero === null ? null : `${busca.prefixos.join()}:${busca.numero}`

  // Devolve o foco para onde estava ao fechar.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    entrada.current?.focus()
    return () => anterior?.focus()
  }, [])

  useEffect(() => {
    if (busca.numero === null || chaveDocs === null) return
    const { prefixos, numero } = busca
    let vivo = true
    const espera = setTimeout(async () => {
      try {
        const itens = await procurarDocumentos(prefixos, numero, (id) => almox(id)?.nome ?? '')
        if (vivo) {
          setDocs({ chave: chaveDocs, itens })
          setErro(null)
        }
      } catch (e) {
        if (vivo) setErro(mensagemErro(e))
      }
    }, 200)
    return () => {
      vivo = false
      clearTimeout(espera)
    }
  }, [busca, chaveDocs, almox])

  const documentos = docs && docs.chave === chaveDocs ? docs.itens : []
  const procurando = chaveDocs !== null && docs?.chave !== chaveDocs && !erro
  const materiais: Resultado[] =
    busca.texto.length >= 2
      ? buscar(busca.texto, 6).map((m) => ({
          chave: `MAT-${m.id}`,
          codigo: m.codigo_sap,
          texto: `${m.descricao} (${m.unidade})`,
          destino: `/saldo?busca=${encodeURIComponent(m.codigo_sap)}`,
        }))
      : []
  const todos = [...documentos, ...materiais]
  const indiceAtivo = Math.min(ativo, Math.max(todos.length - 1, 0))

  function abrir(r: Resultado) {
    onFechar()
    navegar(r.destino)
  }

  function opcao(r: Resultado, i: number) {
    return (
      <div
        key={r.chave}
        id={`${idLista}-${i}`}
        role="option"
        aria-selected={i === indiceAtivo}
        className="opcao-busca"
        onMouseEnter={() => setAtivo(i)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => abrir(r)}
      >
        <span className="mono">{r.codigo}</span>
        <span className="espaco">{r.texto}</span>
        {r.status && <StatusBadge status={r.status} />}
      </div>
    )
  }

  return (
    <>
      <div className="veu" onClick={onFechar} />
      <div className="dialogo-busca" role="dialog" aria-modal="true" aria-label="Buscar documento ou material">
        <input
          ref={entrada}
          type="search"
          role="combobox"
          aria-label="Buscar documento ou material"
          aria-expanded={todos.length > 0}
          aria-controls={idLista}
          aria-activedescendant={todos.length ? `${idLista}-${indiceAtivo}` : undefined}
          autoComplete="off"
          placeholder="PED-001042, código SAP ou descrição"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value)
            setAtivo(0)
            setErro(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setAtivo(Math.min(indiceAtivo + 1, todos.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAtivo(Math.max(indiceAtivo - 1, 0))
            } else if (e.key === 'Enter' && todos[indiceAtivo]) {
              e.preventDefault()
              abrir(todos[indiceAtivo])
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onFechar()
            } else if (e.key === 'Tab') {
              // O diálogo só tem o campo: o foco não sai dele.
              e.preventDefault()
            }
          }}
        />
        <div className="resultados-busca" id={idLista} role="listbox" aria-label="Resultados">
          {documentos.length > 0 && (
            <div role="group" aria-label="Documentos">
              <div className="busca-grupo" aria-hidden="true">
                Documentos
              </div>
              {documentos.map((r, i) => opcao(r, i))}
            </div>
          )}
          {materiais.length > 0 && (
            <div role="group" aria-label="Materiais">
              <div className="busca-grupo" aria-hidden="true">
                Materiais
              </div>
              {materiais.map((r, i) => opcao(r, documentos.length + i))}
            </div>
          )}
        </div>
        <div className="estado-busca peq sec" role="status">
          {erro
            ? erro
            : !termo.trim()
              ? 'Digite o número de um documento (PED, REM, SAI, AJU) ou o código ou a descrição de um material.'
              : procurando
                ? 'Procurando…'
                : todos.length === 0
                  ? `Nada encontrado para “${termo.trim()}”.`
                  : '↑ ↓ para escolher · Enter para abrir · Esc para fechar'}
        </div>
      </div>
    </>
  )
}
