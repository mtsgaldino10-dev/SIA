import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Carregando, Doc, PaginaTopo, StatusBadge, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { formatarData, formatarDataHora } from '../../lib/formato'
import { supabase } from '../../lib/supabase'
import { listaOuErro, useConsulta } from '../../lib/useConsulta'
import { criarRascunho } from '../pedidos/Pedidos'

export function Entradas() {
  const { almoxResponsavel } = useSessao()
  const regional = almoxResponsavel.find((a) => a.tipo === 'regional')
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)

  const consulta = useConsulta(async () => {
    if (!regional) return { pedidos: [], entradas: [] }
    const [pedidos, entradas] = await Promise.all([
      listaOuErro(
        supabase
          .from('pedidos')
          .select('id, numero, status, criado_em, solicitado_em')
          .eq('solicitante_id', regional.id)
          .eq('externo', true)
          .in('status', ['rascunho', 'solicitado'])
          .order('numero', { ascending: false }),
      ),
      listaOuErro(
        supabase
          .from('remessas')
          .select('id, numero, status, documento_ref, data_recebimento, pedido_id')
          .eq('destino_id', regional.id)
          .eq('tipo', 'externa')
          .order('numero', { ascending: false })
          .limit(50),
      ),
    ])
    return { pedidos, entradas }
  }, [regional?.id])

  if (!regional) return <Vazio>Só o responsável do almoxarifado regional registra entradas do 3256.</Vazio>

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Entradas do 3256"
        sub="O 3256 não opera o sistema. O 211 registra o pedido e, na chegada, a quantidade do documento SAP e a contada."
        acoes={
          <>
            <Link className="botao secundario" to="/entradas/receber">
              Entrada avulsa
            </Link>
            <button
              className="botao primario"
              onClick={async () => {
                try {
                  navegar(`/pedidos/${await criarRascunho(regional.id)}`)
                } catch (e) {
                  setErro(mensagemErro(e))
                }
              }}
            >
              Novo pedido ao 3256
            </button>
          </>
        }
      />
      <Aviso tipo="erro">{erro ?? consulta.erro}</Aviso>
      {consulta.carregando ? (
        <Carregando />
      ) : (
        <>
          <h2>Pedidos abertos ao 3256</h2>
          {consulta.dados?.pedidos.length ? (
            <div className="lista">
              {consulta.dados.pedidos.map((p) => (
                <div key={p.id} className="item-lista">
                  <div className="topo">
                    <Link to={`/pedidos/${p.id}`}>
                      <Doc prefixo="PED" numero={p.numero} />
                    </Link>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="linha peq" style={{ marginTop: 4 }}>
                    <span className="sec">{formatarDataHora(p.solicitado_em ?? p.criado_em)}</span>
                    <span className="espaco" />
                    {p.status === 'solicitado' && (
                      <Link className="botao secundario peq" to={`/entradas/receber?pedido=${p.id}`}>
                        Registrar recebimento
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Vazio>Nenhum pedido aberto ao 3256.</Vazio>
          )}

          <h2>Últimas entradas</h2>
          {consulta.dados?.entradas.length ? (
            <div className="lista">
              {consulta.dados.entradas.map((r) => (
                <Link key={r.id} className="item-lista" to={`/remessas/${r.id}`}>
                  <div className="topo">
                    <Doc prefixo="REM" numero={r.numero} />
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="sec peq" style={{ marginTop: 4 }}>
                    Documento SAP <span className="mono">{r.documento_ref}</span> · chegou {formatarData(r.data_recebimento)}
                    {!r.pedido_id && ' · avulsa'}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Vazio>Nenhuma entrada registrada.</Vazio>
          )}
        </>
      )}
    </div>
  )
}
