import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, Doc, PaginaTopo, StatusBadge, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { formatarDataHora } from '../../lib/formato'
import type { TablesInsert } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { listaOuErro, useConsulta } from '../../lib/useConsulta'

type Aba = 'fila' | 'abertos' | 'todos'

export function Pedidos() {
  const { almoxResponsavel, almox } = useSessao()
  const regionais = almoxResponsavel.filter((a) => a.tipo === 'regional').map((a) => a.id)
  const [aba, setAba] = useState<Aba>(regionais.length ? 'fila' : 'abertos')

  const consulta = useConsulta(async () => {
    let q = supabase
      .from('pedidos')
      .select('id, numero, status, externo, solicitante_id, atendente_id, criado_em, solicitado_em, pedido_itens(count)')
      .order('numero', { ascending: false })
      .limit(200)
    if (aba === 'fila') q = q.in('atendente_id', regionais).in('status', ['solicitado', 'aprovado']).eq('externo', false)
    if (aba === 'abertos') q = q.not('status', 'in', '(encerrado,cancelado)')
    return listaOuErro(q)
  }, [aba, regionais.join()])

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Pedidos"
        trilha={['Operação', 'Pedidos']}
        acoes={
          almoxResponsavel.length > 0 && (
            <Link className="botao primario" to="/pedidos/novo">
              Novo pedido
            </Link>
          )
        }
      />
      <div className="abas" role="tablist">
        {regionais.length > 0 && (
          <button role="tab" aria-selected={aba === 'fila'} onClick={() => setAba('fila')}>
            Fila do 211
          </button>
        )}
        <button role="tab" aria-selected={aba === 'abertos'} onClick={() => setAba('abertos')}>
          Abertos
        </button>
        <button role="tab" aria-selected={aba === 'todos'} onClick={() => setAba('todos')}>
          Todos
        </button>
      </div>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {consulta.carregando ? (
        <Carregando />
      ) : !consulta.dados?.length ? (
        <Vazio>{aba === 'fila' ? 'Nenhum pedido aguardando o 211.' : 'Nenhum pedido.'}</Vazio>
      ) : (
        <div className="lista">
          {consulta.dados.map((p) => (
            <Link key={p.id} className="item-lista" to={`/pedidos/${p.id}`}>
              <div className="topo">
                <strong>
                  <Doc prefixo="PED" numero={p.numero} />
                </strong>
                <StatusBadge status={p.status} />
              </div>
              <div className="linha peq" style={{ marginTop: 4 }}>
                <span>
                  {almox(p.solicitante_id)?.nome} → {almox(p.atendente_id)?.codigo}
                  {p.externo && ' (externo)'}
                </span>
                <span className="espaco" />
                <span className="sec">
                  {(p.pedido_itens as unknown as { count: number }[])[0]?.count ?? 0} itens ·{' '}
                  {formatarDataHora(p.solicitado_em ?? p.criado_em)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function NovoPedido() {
  const { almoxResponsavel } = useSessao()
  const navegar = useNavigate()
  const [almoxId, setAlmoxId] = useState(almoxResponsavel.find((a) => a.tipo === 'base')?.id ?? almoxResponsavel[0]?.id ?? '')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function criar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const id = await criarRascunho(almoxId, observacao)
      navegar(`/pedidos/${id}`, { replace: true })
    } catch (e) {
      setErro(mensagemErro(e))
      setEnviando(false)
    }
  }

  if (!almoxResponsavel.length) return <Vazio>Você não é responsável por nenhum almoxarifado.</Vazio>

  return (
    <form className="pilha" onSubmit={criar}>
      <PaginaTopo
        titulo="Novo pedido"
        voltar={{ para: '/pedidos', rotulo: 'Pedidos' }}
        trilha={[{ rotulo: 'Pedidos', para: '/pedidos' }, 'Novo pedido']}
      />
      <div className="cartao pilha">
        <Campo rotulo="Almoxarifado solicitante" ajuda="O pedido vai para o almoxarifado que abastece este.">
          <select value={almoxId} onChange={(e) => setAlmoxId(e.target.value)}>
            {almoxResponsavel.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} · {a.nome}
                {a.tipo === 'regional' ? ' (pedido externo ao 3256)' : ''}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Observação (opcional)">
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Campo>
        <Aviso tipo="erro">{erro}</Aviso>
        <div className="acoes">
          <button className="botao primario" type="submit" disabled={enviando || !almoxId}>
            Criar rascunho
          </button>
        </div>
      </div>
    </form>
  )
}

export async function criarRascunho(solicitanteId: string, observacao = ''): Promise<string> {
  const { data, error } = await supabase
    .from('pedidos')
    // atendente_id e externo são preenchidos pelo banco (pai do solicitante)
    .insert({ solicitante_id: solicitanteId, observacao: observacao.trim() || null } as TablesInsert<'pedidos'>)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
