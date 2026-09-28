import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Carregando, Doc, PaginaTopo, StatusBadge } from '../../components/ui'
import { urlFoto, useNomes } from '../../lib/compartilhado'
import { formatarData, formatarDataHora, formatarDoc, formatarQtd, rotuloStatus } from '../../lib/formato'
import { supabase } from '../../lib/supabase'
import { umOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

export function RemessaDetalhe() {
  const { id = '' } = useParams()
  const { almox, responsavelEm } = useSessao()
  const nomes = useNomes()
  const [foto, setFoto] = useState<string | null>(null)

  const consulta = useConsulta(async () => {
    const [remessa, itens, relacionadas] = await Promise.all([
      umOuErro(supabase.from('remessas').select('*, pedidos(numero)').eq('id', id).single()),
      listaOuErro(
        supabase
          .from('remessa_itens')
          .select('*, materiais(codigo_sap, descricao, unidade), divergencia_tratamentos(*)')
          .eq('remessa_id', id)
          .order('material_id'),
      ),
      listaOuErro(supabase.from('remessas').select('id, numero, status, tipo').eq('remessa_ref_id', id)),
    ])
    const ref = remessa.remessa_ref_id
      ? await umOuErro(supabase.from('remessas').select('id, numero').eq('id', remessa.remessa_ref_id).single())
      : null
    return { remessa, itens, relacionadas, ref }
  }, [id])

  const fotoPath = consulta.dados?.remessa.foto_path
  useEffect(() => {
    if (fotoPath) void urlFoto(fotoPath).then(setFoto)
  }, [fotoPath])

  if (consulta.carregando && !consulta.dados) return <Carregando />
  if (consulta.erro || !consulta.dados) return <Aviso tipo="erro">{consulta.erro ?? 'Remessa não encontrada.'}</Aviso>

  const { remessa: r, itens, relacionadas, ref } = consulta.dados
  const pedido = r.pedidos as unknown as { numero: number } | null
  const podeReceber = r.status === 'em_transito' && r.tipo !== 'externa' && responsavelEm(r.destino_id)
  const tratamentos = itens.flatMap((i) =>
    (i.divergencia_tratamentos ?? []).map((t) => ({ ...t, material: i.materiais })),
  )

  return (
    <div className="pilha">
      <PaginaTopo
        titulo={
          <span className="linha">
            <Doc prefixo="REM" numero={r.numero} /> <StatusBadge status={r.status} />
          </span>
        }
        sub={`${rotuloStatus(r.tipo)} · ${almox(r.origem_id)?.nome} → ${almox(r.destino_id)?.nome}`}
        voltar={{ para: '/remessas', rotulo: 'Remessas' }}
        acoes={
          <>
            {r.tipo !== 'externa' && (
              <Link className="botao secundario" to={`/remessas/${r.id}/guia`}>
                Imprimir guia
              </Link>
            )}
            {r.status === 'com_divergencia' && (
              <Link className="botao secundario" to="/divergencias">
                Tratar divergências
              </Link>
            )}
            {podeReceber && (
              <Link className="botao primario" to={`/remessas/${r.id}/receber`}>
                Registrar recebimento
              </Link>
            )}
          </>
        }
      />

      <div className="grade-2">
        <div className="cartao">
          <h2>Envio</h2>
          <dl className="dados" style={{ marginTop: 12 }}>
            {r.pedido_id && pedido && (
              <>
                <dt>Pedido</dt>
                <dd>
                  <Link to={`/pedidos/${r.pedido_id}`}>{formatarDoc('PED', pedido.numero)}</Link>
                </dd>
              </>
            )}
            {ref && (
              <>
                <dt>Reenvio da</dt>
                <dd>
                  <Link to={`/remessas/${ref.id}`}>{formatarDoc('REM', ref.numero)}</Link>
                </dd>
              </>
            )}
            <dt>Data do envio</dt>
            <dd>{formatarData(r.data_envio)}</dd>
            <dt>Registrado por</dt>
            <dd>
              {nomes.get(r.enviado_por) ?? '—'} em {formatarDataHora(r.enviado_em)}
            </dd>
            {r.documento_ref && (
              <>
                <dt>{r.tipo === 'externa' ? 'Documento SAP' : 'Documento'}</dt>
                <dd className="mono">{r.documento_ref}</dd>
              </>
            )}
            {r.observacao && (
              <>
                <dt>Observação</dt>
                <dd>{r.observacao}</dd>
              </>
            )}
          </dl>
        </div>
        <div className="cartao">
          <h2>Recebimento</h2>
          {r.data_recebimento ? (
            <dl className="dados" style={{ marginTop: 12 }}>
              <dt>Data da chegada</dt>
              <dd>{formatarData(r.data_recebimento)}</dd>
              <dt>Quem contou</dt>
              <dd>{r.conferido_por_nome}</dd>
              <dt>Lançado por</dt>
              <dd>
                {nomes.get(r.recebido_registrado_por ?? '') ?? '—'} em {formatarDataHora(r.recebido_registrado_em)}
              </dd>
              <dt>Foto</dt>
              <dd>
                {foto ? (
                  <a href={foto} target="_blank" rel="noreferrer">
                    Ver foto
                  </a>
                ) : (
                  '…'
                )}
              </dd>
            </dl>
          ) : (
            <p className="sec" style={{ marginTop: 12 }}>
              Aguardando conferência em {almox(r.destino_id)?.nome}.
            </p>
          )}
        </div>
      </div>

      <div className="cartao pilha">
        <h2>Itens</h2>
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Unid.</th>
                <th className="num">Enviada</th>
                <th className="num">Recebida</th>
                <th className="num">Diferença</th>
                <th>Motivo</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => {
                const dif = i.qtd_recebida === null ? null : Number(i.qtd_enviada) - Number(i.qtd_recebida)
                return (
                  <tr key={i.id}>
                    <td className="mono">{i.materiais?.codigo_sap}</td>
                    <td>{i.materiais?.descricao}</td>
                    <td>{i.materiais?.unidade}</td>
                    <td className="num">{formatarQtd(i.qtd_enviada)}</td>
                    <td className="num">{formatarQtd(i.qtd_recebida)}</td>
                    <td className="num" style={dif ? { color: 'var(--st-alerta-texto)', fontWeight: 600 } : undefined}>
                      {formatarQtd(dif)}
                    </td>
                    <td>{i.motivo_divergencia ? rotuloStatus(i.motivo_divergencia) : ''}</td>
                    <td className="peq">{i.observacao}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {tratamentos.length > 0 && (
        <div className="cartao pilha">
          <h2>Tratamentos</h2>
          <div className="tabela-envoltorio">
            <table>
              <thead>
                <tr>
                  <th>Tratamento</th>
                  <th>Material</th>
                  <th className="num">Qtd.</th>
                  <th>Justificativa</th>
                  <th>Data</th>
                  <th>Por</th>
                </tr>
              </thead>
              <tbody>
                {tratamentos.map((t) => (
                  <tr key={t.id}>
                    <td>{rotuloStatus(t.tipo)}</td>
                    <td className="mono">{t.material?.codigo_sap}</td>
                    <td className="num">{formatarQtd(t.quantidade)}</td>
                    <td>{t.justificativa}</td>
                    <td>{formatarData(t.data_ocorrencia)}</td>
                    <td>{nomes.get(t.tratado_por) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {relacionadas.length > 0 && (
        <div className="cartao">
          <h2>Reenvios</h2>
          <ul>
            {relacionadas.map((x) => (
              <li key={x.id}>
                <Link to={`/remessas/${x.id}`}>{formatarDoc('REM', x.numero)}</Link> · {rotuloStatus(x.status)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
