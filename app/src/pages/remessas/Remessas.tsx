import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Carregando, Doc, PaginaTopo, StatusBadge, Vazio } from '../../components/ui'
import { formatarData, hojeISO, rotuloStatus } from '../../lib/formato'
import { supabase } from '../../lib/supabase'
import { listaOuErro, useConsulta } from '../../lib/useConsulta'

type Aba = 'chegando' | 'enviadas' | 'transito' | 'todas'

function dias(de: string) {
  return Math.round((Date.parse(hojeISO()) - Date.parse(de)) / 86_400_000)
}

export function Remessas() {
  const { almoxResponsavel, almox } = useSessao()
  const meus = almoxResponsavel.map((a) => a.id)
  const [aba, setAba] = useState<Aba>(meus.length ? 'chegando' : 'transito')

  const consulta = useConsulta(async () => {
    let q = supabase
      .from('remessas')
      .select('id, numero, tipo, status, origem_id, destino_id, data_envio, data_recebimento, documento_ref')
      .order('numero', { ascending: false })
      .limit(200)
    if (aba === 'chegando') q = q.in('destino_id', meus).eq('status', 'em_transito')
    if (aba === 'enviadas') q = q.in('origem_id', meus).eq('status', 'em_transito')
    if (aba === 'transito') q = q.eq('status', 'em_transito')
    return listaOuErro(q)
  }, [aba, meus.join()])

  return (
    <div className="pilha">
      <PaginaTopo titulo="Remessas" trilha={['Operação', 'Remessas']} sub="Cada remessa tem guia impressa e conferência no destino." />
      <div className="abas" role="tablist">
        {meus.length > 0 && (
          <>
            <button role="tab" aria-selected={aba === 'chegando'} onClick={() => setAba('chegando')}>
              A caminho de mim
            </button>
            <button role="tab" aria-selected={aba === 'enviadas'} onClick={() => setAba('enviadas')}>
              Enviadas por mim
            </button>
          </>
        )}
        <button role="tab" aria-selected={aba === 'transito'} onClick={() => setAba('transito')}>
          Todas em trânsito
        </button>
        <button role="tab" aria-selected={aba === 'todas'} onClick={() => setAba('todas')}>
          Histórico
        </button>
      </div>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {consulta.carregando ? (
        <Carregando />
      ) : !consulta.dados?.length ? (
        <Vazio>Nenhuma remessa aqui.</Vazio>
      ) : (
        <div className="lista">
          {consulta.dados.map((r) => (
            <Link key={r.id} className="item-lista" to={`/remessas/${r.id}`}>
              <div className="topo">
                <strong>
                  <Doc prefixo="REM" numero={r.numero} />
                </strong>
                <StatusBadge status={r.status} />
              </div>
              <div className="linha peq" style={{ marginTop: 4 }}>
                <span>
                  {rotuloStatus(r.tipo)} · {almox(r.origem_id)?.nome} → {almox(r.destino_id)?.nome}
                </span>
                <span className="espaco" />
                <span className="sec">
                  enviada {formatarData(r.data_envio)}
                  {r.status === 'em_transito' && ` · há ${dias(r.data_envio)} dia(s)`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
