import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCatalogo } from '../../auth/CatalogoContext'
import { useSessao } from '../../auth/SessaoContext'
import { CamposConferencia, paraRpc, TabelaConferencia, validarConferencia, type LinhaConferencia } from '../../components/Conferencia'
import { Aviso, Carregando, PaginaTopo } from '../../components/ui'
import { enviarFoto } from '../../lib/compartilhado'
import { mensagemErro } from '../../lib/erros'
import { formatarData, formatarDoc, hojeISO } from '../../lib/formato'
import { supabase } from '../../lib/supabase'
import { umOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

export function Receber() {
  const { id = '' } = useParams()
  const consulta = useConsulta(async () => {
    const [remessa, itens] = await Promise.all([
      umOuErro(supabase.from('remessas').select('*').eq('id', id).single()),
      listaOuErro(supabase.from('remessa_itens').select('material_id, qtd_enviada').eq('remessa_id', id)),
    ])
    return { remessa, itens }
  }, [id])

  if (consulta.carregando) return <Carregando />
  if (consulta.erro || !consulta.dados) return <Aviso tipo="erro">{consulta.erro ?? 'Remessa não encontrada.'}</Aviso>
  return <FormRecebimento {...consulta.dados} />
}

function FormRecebimento({
  remessa,
  itens,
}: {
  remessa: { id: string; numero: number; origem_id: string; destino_id: string; data_envio: string; status: string }
  itens: { material_id: string; qtd_enviada: number }[]
}) {
  const { almox } = useSessao()
  const { material, aceitaFracao } = useCatalogo()
  const navegar = useNavigate()
  const [linhas, setLinhas] = useState<LinhaConferencia[]>(() =>
    itens.map((i) => ({ material_id: i.material_id, enviada: String(i.qtd_enviada), contado: '', motivo: '', observacao: '' })),
  )
  const [quemContou, setQuemContou] = useState('')
  const [data, setData] = useState(hojeISO())
  const [foto, setFoto] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<string | null>(null)

  if (remessa.status !== 'em_transito') return <Aviso tipo="info">Esta remessa já teve o recebimento registrado.</Aviso>

  async function registrar() {
    setErro(null)
    const e = validarConferencia(linhas, aceitaFracao, (id) => material(id)?.codigo_sap ?? '')
    if (e) return setErro(e)
    if (!quemContou.trim()) return setErro('Informe o nome de quem contou o material.')
    if (!foto) return setErro('Anexe a foto da guia assinada ou da carga.')
    try {
      setEtapa('Enviando foto…')
      const caminho = await enviarFoto(remessa.id, foto)
      setEtapa('Registrando recebimento…')
      const { error } = await supabase.rpc('rpc_registrar_recebimento', {
        p_remessa_id: remessa.id,
        p_data_recebimento: data,
        p_conferido_por_nome: quemContou,
        p_foto_path: caminho,
        p_itens: paraRpc(linhas, false),
      })
      if (error) throw error
      navegar(`/remessas/${remessa.id}`, { replace: true })
    } catch (e) {
      setErro(mensagemErro(e))
      setEtapa(null)
    }
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo={`Receber ${formatarDoc('REM', remessa.numero)}`}
        sub={`${almox(remessa.origem_id)?.nome} → ${almox(remessa.destino_id)?.nome} · enviada em ${formatarData(remessa.data_envio)}`}
        voltar={{ para: `/remessas/${remessa.id}`, rotulo: 'Remessa' }}
        trilha={[
          { rotulo: 'Remessas', para: '/remessas' },
          { rotulo: formatarDoc('REM', remessa.numero), para: `/remessas/${remessa.id}` },
          'Receber',
        ]}
      />
      <Aviso tipo="info">
        Lance o que foi contado na guia assinada. Item avariado não entra no saldo: conte só o que chegou em condições de uso.
      </Aviso>
      <div className="cartao pilha">
        <h2>Contagem</h2>
        <TabelaConferencia linhas={linhas} onChange={setLinhas} enviadaEditavel={false} />
        <div className="acoes">
          <button
            type="button"
            className="botao fantasma peq"
            onClick={() => setLinhas(linhas.map((l) => (l.extra ? l : { ...l, contado: l.contado || l.enviada.replace('.', ',') })))}
          >
            Preencher vazios igual à guia
          </button>
        </div>
      </div>
      <div className="cartao pilha">
        <h2>Conferência</h2>
        <CamposConferencia
          quemContou={quemContou}
          setQuemContou={setQuemContou}
          data={data}
          setData={setData}
          dataMin={remessa.data_envio}
          dataMax={hojeISO()}
          onFoto={setFoto}
          fotoNome={foto?.name ?? null}
        />
      </div>
      <Aviso tipo="erro">{erro}</Aviso>
      <Aviso tipo="info">{etapa}</Aviso>
      <div className="acoes fixas">
        <button className="botao primario" disabled={!!etapa} onClick={() => void registrar()}>
          Registrar recebimento
        </button>
      </div>
    </div>
  )
}
