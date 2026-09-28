import { Link, useParams } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Carregando, Marca } from '../../components/ui'
import { useNomes } from '../../lib/compartilhado'
import { formatarData, formatarDoc, formatarQtd, rotuloStatus } from '../../lib/formato'
import { supabase } from '../../lib/supabase'
import { umOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

/** Guia de remessa para imprimir e viajar junto com o material. */
export function Guia() {
  const { id = '' } = useParams()
  const { almox } = useSessao()
  const nomes = useNomes()
  const consulta = useConsulta(async () => {
    const [remessa, itens] = await Promise.all([
      umOuErro(supabase.from('remessas').select('*, pedidos(numero)').eq('id', id).single()),
      listaOuErro(supabase.from('remessa_itens').select('qtd_enviada, materiais(codigo_sap, descricao, unidade)').eq('remessa_id', id).gt('qtd_enviada', 0)),
    ])
    itens.sort((a, b) => (a.materiais?.codigo_sap ?? '').localeCompare(b.materiais?.codigo_sap ?? ''))
    return { remessa, itens }
  }, [id])

  if (consulta.carregando) return <Carregando />
  if (consulta.erro || !consulta.dados) return <Aviso tipo="erro">{consulta.erro ?? 'Remessa não encontrada.'}</Aviso>
  const { remessa: r, itens } = consulta.dados
  const origem = almox(r.origem_id)
  const destino = almox(r.destino_id)
  const pedido = r.pedidos as unknown as { numero: number } | null

  return (
    <>
      <div className="so-tela" style={{ padding: 16 }}>
        <div className="linha" style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link className="voltar" to={`/remessas/${r.id}`} style={{ margin: 0 }}>
            ← Voltar para a remessa
          </Link>
          <span className="espaco" />
          <button className="botao primario" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>
      <article className="guia">
        <div className="linha" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Marca />
            <div style={{ fontSize: '9pt' }}>Sistema Integrado de Almoxarifado</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '16pt' }}>Guia de remessa {formatarDoc('REM', r.numero)}</h1>
            <div>{rotuloStatus(r.tipo)}</div>
          </div>
        </div>
        <table style={{ marginTop: 16 }}>
          <tbody>
            <tr>
              <th>Origem</th>
              <td>
                {origem?.codigo} · {origem?.nome}
              </td>
              <th>Destino</th>
              <td>
                {destino?.codigo} · {destino?.nome}
              </td>
            </tr>
            <tr>
              <th>Data do envio</th>
              <td>{formatarData(r.data_envio)}</td>
              <th>Enviado por</th>
              <td>{nomes.get(r.enviado_por) ?? ''}</td>
            </tr>
            <tr>
              <th>Pedido</th>
              <td>{pedido ? formatarDoc('PED', pedido.numero) : '—'}</td>
              <th>Documento</th>
              <td className="mono">{r.documento_ref ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Código SAP</th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th className="num">Enviada</th>
              <th className="contagem">Contagem</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, n) => (
              <tr key={n}>
                <td className="mono">{i.materiais?.codigo_sap}</td>
                <td>{i.materiais?.descricao}</td>
                <td>{i.materiais?.unidade}</td>
                <td className="num">{formatarQtd(i.qtd_enviada)}</td>
                <td className="contagem" />
              </tr>
            ))}
            {[0, 1, 2].map((n) => (
              <tr key={`vazio-${n}`} aria-hidden="true">
                <td style={{ height: 28 }} />
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '9pt', marginTop: 8 }}>
          Linhas em branco: itens que chegaram sem estar na guia. Anote falta, sobra, avaria ou troca ao lado da contagem.
        </p>
        {r.observacao && <p style={{ marginTop: 8 }}>Observação: {r.observacao}</p>}

        <div className="assinaturas">
          <div>Conferido por (nome e assinatura)</div>
          <div>Data da chegada</div>
        </div>
      </article>
    </>
  )
}
