import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Doc, Etiqueta, PaginaTopo, StatusBadge, Vazio } from '../components/ui'
import { formatarData } from '../lib/formato'
import { carregarTodos, supabase, type Almox } from '../lib/supabase'
import { listaOuErro, useConsulta } from '../lib/useConsulta'

export function Inicio() {
  const { perfil, atribuicoes, almox, almoxResponsavel, veTudo } = useSessao()
  const bases = [...new Set(atribuicoes.map((a) => a.almox_id))]
    .map((id) => almox(id))
    .filter((a): a is Almox => a?.tipo === 'base')
    .sort((a, b) => a.nome.localeCompare(b.nome))
  const regional = almoxResponsavel.find((a) => a.tipo === 'regional')

  return (
    <div className="pilha">
      <PaginaTopo titulo={`Olá, ${perfil?.nome ?? ''}`} sub="Sistema Integrado de Almoxarifado" />
      {regional && <Painel211 regional={regional} />}
      {bases.length > 0 && <MinhasBases bases={bases} />}
      {veTudo && <VisaoGeral />}
      {!regional && !bases.length && !veTudo && (
        <Vazio>Você ainda não tem almoxarifado atribuído. Fale com o administrador.</Vazio>
      )}
    </div>
  )
}

/** Recarrega a consulta quando pedidos, remessas ou tratamentos mudam. */
function useTempoReal(nome: string, recarregar: () => void) {
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const aviso = () => {
      if (espera.current) clearTimeout(espera.current)
      espera.current = setTimeout(recarregar, 300)
    }
    const canal = supabase
      .channel(nome)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, aviso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'remessas' }, aviso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divergencia_tratamentos' }, aviso)
      .subscribe()
    return () => {
      if (espera.current) clearTimeout(espera.current)
      void supabase.removeChannel(canal)
    }
  }, [nome, recarregar])
}

function Regiao({ titulo, children, acao }: { titulo: string; children: React.ReactNode; acao?: React.ReactNode }) {
  const id = useId()
  return (
    <section className="cartao pilha" aria-labelledby={id}>
      <div className="cartao-cab" style={{ marginBottom: 0 }}>
        <h3 id={id}>{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
function Painel211({ regional }: { regional: Almox }) {
  const { almox } = useSessao()
  const consulta = useConsulta(async () => {
    const [fila, transito, divergencias] = await Promise.all([
      listaOuErro(
        supabase
          .from('pedidos')
          .select('id, numero, status, solicitante_id, solicitado_em')
          .eq('atendente_id', regional.id)
          .eq('externo', false)
          .in('status', ['solicitado', 'aprovado'])
          .order('solicitado_em'),
      ),
      listaOuErro(
        supabase
          .from('remessas')
          .select('id, numero, destino_id, data_envio')
          .eq('origem_id', regional.id)
          .eq('status', 'em_transito')
          .order('data_envio'),
      ),
      listaOuErro(
        supabase
          .from('v_divergencias_abertas')
          .select('remessa_item_id')
          .or(`origem_id.eq.${regional.id},destino_id.eq.${regional.id}`),
      ),
    ])
    return { fila, transito, divergencias }
  }, [regional.id])
  useTempoReal('painel-211', consulta.recarregar)

  const d = consulta.dados
  return (
    <section className="pilha" aria-label="Painel do 211">
      <h2>Painel do {regional.codigo}</h2>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      <div className="grade-cartoes">
        <Etiqueta valor={d?.fila.length ?? '…'} legenda="Pedidos na fila" tom="info" para="/pedidos" />
        <Etiqueta valor={d?.transito.length ?? '…'} legenda="Remessas em trânsito" tom="transito" para="/remessas" />
        <Etiqueta
          valor={d?.divergencias.length ?? '…'}
          legenda="Divergências abertas"
          tom={d?.divergencias.length ? 'alerta' : 'ok'}
          para="/divergencias"
        />
      </div>
      {d && d.fila.length > 0 && (
        <Regiao titulo="Fila de pedidos">
          <div className="lista">
            {d.fila.map((p) => (
              <Link key={p.id} className="item-lista" to={`/pedidos/${p.id}`}>
                <div className="topo">
                  <span>
                    <Doc prefixo="PED" numero={p.numero} /> · {almox(p.solicitante_id)?.nome}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        </Regiao>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
function MinhasBases({ bases }: { bases: Almox[] }) {
  const ids = bases.map((b) => b.id)
  const consulta = useConsulta(async () => {
    const [saldos, transito, pedidos, divergencias] = await Promise.all([
      carregarTodos<{ almox_id: string | null; saldo: number | null }>((de, ate) =>
        supabase.from('v_saldo').select('almox_id, saldo').in('almox_id', ids).neq('saldo', 0).order('almox_id').order('material_id').range(de, ate),
      ),
      listaOuErro(
        supabase.from('remessas').select('id, numero, destino_id, origem_id, data_envio').in('destino_id', ids).eq('status', 'em_transito'),
      ),
      listaOuErro(
        supabase.from('pedidos').select('solicitante_id').in('solicitante_id', ids).not('status', 'in', '(encerrado,cancelado)'),
      ),
      listaOuErro(supabase.from('v_divergencias_abertas').select('origem_id, destino_id')),
    ])
    return { saldos, transito, pedidos, divergencias }
  }, [ids.join()])
  useTempoReal('minhas-bases', consulta.recarregar)

  const d = consulta.dados
  const contar = <T,>(lista: T[] | undefined, f: (x: T) => boolean) => (lista ? lista.filter(f).length : '…')

  return (
    <section className="pilha">
      <h2>Minhas bases</h2>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      <div className="grade-2">
        {bases.map((b) => {
          const chegando = d?.transito.filter((r) => r.destino_id === b.id) ?? []
          const nDiv = contar(d?.divergencias, (x) => x.destino_id === b.id || x.origem_id === b.id)
          return (
            <Regiao
              key={b.id}
              titulo={b.nome}
              acao={
                <Link className="botao fantasma peq" to={`/saldo?almox=${b.id}`}>
                  Ver saldo
                </Link>
              }
            >
              <div className="grade-etiquetas">
                <Etiqueta valor={contar(d?.saldos, (s) => s.almox_id === b.id)} legenda="Materiais com saldo" para={`/saldo?almox=${b.id}`} />
                <Etiqueta valor={d ? chegando.length : '…'} legenda="Remessas a caminho" tom="transito" para="/remessas" />
                <Etiqueta valor={contar(d?.pedidos, (p) => p.solicitante_id === b.id)} legenda="Pedidos abertos" tom="info" para="/pedidos" />
                <Etiqueta valor={nDiv} legenda="Divergências pendentes" tom={nDiv ? 'alerta' : 'ok'} para="/divergencias" />
              </div>
              {chegando.length > 0 && (
                <div className="lista">
                  {chegando.map((r) => (
                    <Link key={r.id} className="item-lista" to={`/remessas/${r.id}`}>
                      <div className="topo">
                        <Doc prefixo="REM" numero={r.numero} />
                        <span className="sec peq">enviada {formatarData(r.data_envio)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Regiao>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
function VisaoGeral() {
  const consulta = useConsulta(async () => {
    const [transito, divergencias] = await Promise.all([
      listaOuErro(supabase.from('remessas').select('id').eq('status', 'em_transito')),
      listaOuErro(supabase.from('v_divergencias_abertas').select('remessa_item_id')),
    ])
    return { transito: transito.length, divergencias: divergencias.length }
  }, [])
  const d = consulta.dados
  return (
    <section className="pilha">
      <h2>Visão geral</h2>
      <div className="grade-cartoes">
        <Etiqueta valor={d?.transito ?? '…'} legenda="Remessas em trânsito" tom="transito" para="/remessas" />
        <Etiqueta valor={d?.divergencias ?? '…'} legenda="Divergências abertas" tom={d?.divergencias ? 'alerta' : 'ok'} para="/divergencias" />
        <Etiqueta valor="→" legenda="Painel da gestão" para="/painel" />
      </div>
    </section>
  )
}
