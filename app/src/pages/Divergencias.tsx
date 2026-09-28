import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogo } from '../auth/CatalogoContext'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../components/ui'
import { mensagemErro } from '../lib/erros'
import { formatarDoc, formatarQtd, hojeISO, lerNumero, qtdValida, rotuloStatus } from '../lib/formato'
import { supabase, type Enum, type Visao } from '../lib/supabase'
import { tratamentosPermitidos } from '../lib/tratamentos'
import { listaOuErro, useConsulta } from '../lib/useConsulta'

type Div = Visao<'v_divergencias_abertas'>

const EXPLICACAO: Record<Enum<'tipo_tratamento'>, string> = {
  reenvio: 'A origem manda de novo. Gera uma nova remessa, com nova conferência.',
  baixa_transito: 'Falta aceita como perda. Não mexe no saldo: já saiu da origem e não entrou no destino.',
  chegou_depois: 'O material faltante apareceu. Entra no saldo do destino.',
  ajuste_origem: 'A origem mandou mais do que registrou. Baixa o saldo da origem.',
  externo: 'Divergência com o 3256, tratada fora do sistema.',
}

export function Divergencias() {
  const [aberta, setAberta] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const consulta = useConsulta(
    () => listaOuErro(supabase.from('v_divergencias_abertas').select('*').order('data_recebimento').order('remessa_numero')),
    [],
  )

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Divergências"
        sub="Divergência não some sozinha: fica aberta até ser tratada com justificativa."
      />
      <Aviso tipo="sucesso">{ok}</Aviso>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {consulta.carregando && !consulta.dados ? (
        <Carregando />
      ) : !consulta.dados?.length ? (
        <Vazio>Nenhuma divergência em aberto.</Vazio>
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Remessa</th>
                <th>Origem → destino</th>
                <th>Material</th>
                <th>Motivo</th>
                <th className="num">Diferença</th>
                <th className="num">Em aberto</th>
                <th className="num">Dias</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {consulta.dados.map((d) => (
                <Fragment key={d.remessa_item_id}>
                  <tr>
                    <td>
                      <Link className="mono" to={`/remessas/${d.remessa_id}`}>
                        {formatarDoc('REM', d.remessa_numero ?? 0)}
                      </Link>
                      <div className="sec peq">{rotuloStatus(d.remessa_tipo)}</div>
                    </td>
                    <td>
                      {d.origem_codigo} → {d.destino_codigo}
                    </td>
                    <td>
                      <span className="mono">{d.codigo_sap}</span>
                      <div className="peq">{d.descricao}</div>
                    </td>
                    <td>{rotuloStatus(d.motivo_divergencia)}</td>
                    <td className="num">
                      {Number(d.diferenca) > 0 ? 'faltou ' : 'sobrou '}
                      {formatarQtd(Math.abs(Number(d.diferenca)))} {d.unidade}
                    </td>
                    <td className="num">{formatarQtd(d.qtd_em_aberto)}</td>
                    <td className="num">{d.dias_em_aberto}</td>
                    <td className="acoes-celula">
                      <button
                        className="botao secundario peq"
                        onClick={() => {
                          setOk(null)
                          setAberta(aberta === d.remessa_item_id ? null : d.remessa_item_id)
                        }}
                      >
                        Tratar
                      </button>
                    </td>
                  </tr>
                  {aberta === d.remessa_item_id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--cor-fundo)' }}>
                        <FormTratamento
                          div={d}
                          onFeito={async () => {
                            setAberta(null)
                            setOk('Tratamento registrado.')
                            await consulta.recarregar()
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FormTratamento({ div, onFeito }: { div: Div; onFeito: () => Promise<void> }) {
  const { responsavelEm } = useSessao()
  const { aceitaFracao } = useCatalogo()
  const opcoes = tratamentosPermitidos({
    externa: div.remessa_tipo === 'externa',
    diferenca: Number(div.diferenca),
    ehOrigem: responsavelEm(div.origem_id ?? ''),
    ehDestino: responsavelEm(div.destino_id ?? ''),
  })
  const [tipo, setTipo] = useState<Enum<'tipo_tratamento'> | ''>(opcoes[0] ?? '')
  const [qtd, setQtd] = useState(formatarQtd(div.qtd_em_aberto))
  const [justificativa, setJustificativa] = useState('')
  const [data, setData] = useState(hojeISO())
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  if (!opcoes.length) {
    return (
      <Aviso tipo="info">
        Você acompanha esta divergência, mas quem trata é o responsável de{' '}
        {Number(div.diferenca) < 0 || div.remessa_tipo !== 'externa' ? div.origem_nome : div.destino_nome}.
      </Aviso>
    )
  }

  async function registrar() {
    setErro(null)
    const e = qtdValida(qtd, aceitaFracao(div.material_id ?? ''))
    if (e) return setErro(e)
    if (!justificativa.trim()) return setErro('Informe a justificativa do tratamento.')
    setOcupado(true)
    const { error } = await supabase.rpc('rpc_tratar_divergencia', {
      p_remessa_item_id: div.remessa_item_id ?? '',
      p_tipo: tipo as Enum<'tipo_tratamento'>,
      p_quantidade: lerNumero(qtd),
      p_justificativa: justificativa,
      p_data_ocorrencia: data,
    })
    setOcupado(false)
    if (error) setErro(mensagemErro(error))
    else await onFeito()
  }

  return (
    <div className="pilha" style={{ padding: '8px 0' }}>
      <div className="grade-2">
        <Campo rotulo="Tratamento" ajuda={tipo ? EXPLICACAO[tipo] : undefined}>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as Enum<'tipo_tratamento'>)}>
            {opcoes.map((o) => (
              <option key={o} value={o}>
                {rotuloStatus(o)}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grade-2">
          <Campo rotulo="Quantidade" ajuda={`Em aberto: ${formatarQtd(div.qtd_em_aberto)} ${div.unidade ?? ''}`}>
            <input inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </Campo>
          <Campo rotulo="Data">
            <input type="date" min={div.data_recebimento ?? undefined} max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Justificativa" style={{ gridColumn: '1 / -1' }}>
          <input value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
        </Campo>
      </div>
      <Aviso tipo="erro">{erro}</Aviso>
      <div className="acoes">
        <button className="botao primario" disabled={ocupado} onClick={() => void registrar()}>
          Registrar tratamento
        </button>
      </div>
    </div>
  )
}
