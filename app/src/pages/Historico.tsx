import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../components/ui'
import { useNomes } from '../lib/compartilhado'
import { formatarData, formatarDataHora, formatarDoc, formatarSinal, rotuloStatus } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { listaOuErro, useConsulta } from '../lib/useConsulta'
import { SeletorAlmox } from './Saldo'

type LinhaDocumento = {
  saida_id: string | null
  ajuste_id: string | null
  remessas: { numero: number } | null
  saidas: { numero: number; retirado_por_nome?: string | null; equipes?: { nome: string } | null } | null
  ajustes: { numero: number } | null
}

/** Número do documento da movimentação, para o filtro (REM, SAI ou AJU). */
function documentoDe(m: LinhaDocumento): string {
  if (m.remessas) return formatarDoc('REM', m.remessas.numero)
  if (m.saida_id && m.saidas) return formatarDoc('SAI', m.saidas.numero)
  if (m.ajuste_id && m.ajustes) return formatarDoc('AJU', m.ajustes.numero)
  return ''
}

/** Livro-razão: toda movimentação de um almoxarifado, mais recente primeiro. */
export function Historico() {
  const { almoxVisiveis, almoxResponsavel } = useSessao()
  const nomes = useNomes()
  const [params, setParams] = useSearchParams()
  const almoxId = params.get('almox') ?? almoxResponsavel[0]?.id ?? almoxVisiveis[0]?.id ?? ''
  const [termo, setTermo] = useState(params.get('busca') ?? '')

  const consulta = useConsulta(
    () =>
      listaOuErro(
        supabase
          .from('movimentacoes')
          .select(
            'id, quantidade, tipo, data_ocorrencia, criado_em, criado_por, remessa_id, saida_id, ajuste_id, tratamento_id, materiais(codigo_sap, descricao, unidade), remessas(numero), saidas(numero, retirado_por_nome, equipes(nome)), ajustes(numero), divergencia_tratamentos(remessa_itens(remessa_id, remessas(numero)))',
          )
          .eq('almox_id', almoxId)
          .order('id', { ascending: false })
          .limit(300),
      ),
    [almoxId],
  )

  const t = termo.trim().toLowerCase()
  const linhas = (consulta.dados ?? []).filter(
    (m) =>
      !t ||
      m.materiais?.codigo_sap.includes(t) ||
      m.materiais?.descricao.toLowerCase().includes(t) ||
      documentoDe(m).toLowerCase().includes(t),
  )

  return (
    <div className="pilha">
      <PaginaTopo titulo="Histórico" trilha={['Operação', 'Histórico']} sub="Todas as movimentações que formam o saldo. Nada aqui é editado ou apagado." />
      <div className="grade-2">
        <SeletorAlmox valor={almoxId} onChange={(id) => setParams({ almox: id })} opcoes={almoxVisiveis} />
        <Campo rotulo="Filtrar material ou documento">
          <input type="search" placeholder="Código SAP, descrição ou SAI-000012" value={termo} onChange={(e) => setTermo(e.target.value)} />
        </Campo>
      </div>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {consulta.carregando ? (
        <Carregando />
      ) : !linhas.length ? (
        <Vazio>Nenhuma movimentação.</Vazio>
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Material</th>
                <th className="num">Qtd.</th>
                <th>Documento</th>
                <th>Lançado</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((m) => {
                const trat = m.divergencia_tratamentos as unknown as { remessa_itens: { remessa_id: string; remessas: { numero: number } } } | null
                const doc = m.remessa_id ? (
                  <Link to={`/remessas/${m.remessa_id}`}>{formatarDoc('REM', m.remessas?.numero ?? 0)}</Link>
                ) : m.saida_id ? (
                  [formatarDoc('SAI', m.saidas?.numero ?? 0), m.saidas?.equipes?.nome, m.saidas?.retirado_por_nome].filter(Boolean).join(' · ')
                ) : m.ajuste_id ? (
                  formatarDoc('AJU', m.ajustes?.numero ?? 0)
                ) : trat ? (
                  <Link to={`/remessas/${trat.remessa_itens.remessa_id}`}>
                    Tratamento da {formatarDoc('REM', trat.remessa_itens.remessas.numero)}
                  </Link>
                ) : null
                return (
                  <tr key={m.id}>
                    <td>{formatarData(m.data_ocorrencia)}</td>
                    <td>{rotuloStatus(m.tipo)}</td>
                    <td>
                      <span className="mono">{m.materiais?.codigo_sap}</span> <span className="peq">{m.materiais?.descricao}</span>
                    </td>
                    <td className="num">
                      {formatarSinal(m.quantidade)} <span className="sec">{m.materiais?.unidade}</span>
                    </td>
                    <td className="mono peq">{doc}</td>
                    <td className="sec peq">
                      {nomes.get(m.criado_por) ?? '—'} · {formatarDataHora(m.criado_em)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
