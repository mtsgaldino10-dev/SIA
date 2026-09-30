import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../components/ui'
import { formatarData, formatarQtd } from '../lib/formato'
import { carregarTodos, supabase, type Visao } from '../lib/supabase'
import { useConsulta } from '../lib/useConsulta'

export function SeletorAlmox({
  valor,
  onChange,
  opcoes,
  rotulo = 'Almoxarifado',
}: {
  valor: string
  onChange: (id: string) => void
  opcoes: { id: string; codigo: string; nome: string }[]
  rotulo?: string
}) {
  return (
    <Campo rotulo={rotulo}>
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        {opcoes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.codigo} · {a.nome}
          </option>
        ))}
      </select>
    </Campo>
  )
}

export function Saldo() {
  const { almoxVisiveis, almoxResponsavel } = useSessao()
  const [params, setParams] = useSearchParams()
  const padrao = almoxResponsavel[0]?.id ?? almoxVisiveis[0]?.id ?? ''
  const almoxId = params.get('almox') ?? padrao
  const [termo, setTermo] = useState(params.get('busca') ?? '')
  const [zerados, setZerados] = useState(false)

  const consulta = useConsulta(
    () =>
      almoxId
        ? carregarTodos<Visao<'v_saldo'>>((de, ate) =>
            supabase.from('v_saldo').select('*').eq('almox_id', almoxId).order('codigo_sap').range(de, ate),
          )
        : Promise.resolve([]),
    [almoxId],
  )

  const linhas = useMemo(() => {
    const t = termo.trim().toLowerCase()
    return (consulta.dados ?? []).filter(
      (l) =>
        (zerados || Number(l.saldo) !== 0) &&
        (!t || l.codigo_sap?.includes(t) || l.descricao?.toLowerCase().includes(t)),
    )
  }, [consulta.dados, termo, zerados])

  if (!almoxVisiveis.length) return <Vazio>Você ainda não tem almoxarifado atribuído. Fale com o administrador.</Vazio>

  return (
    <div className="pilha">
      <PaginaTopo titulo="Saldo" trilha={['Operação', 'Saldo']} sub="Saldo é sempre a soma das movimentações. Nunca é editado." />
      <div className="grade-2">
        <SeletorAlmox valor={almoxId} onChange={(id) => setParams({ almox: id })} opcoes={almoxVisiveis} />
        <Campo rotulo="Buscar">
          <input type="search" placeholder="Código SAP ou descrição" value={termo} onChange={(e) => setTermo(e.target.value)} />
        </Campo>
      </div>
      <label className="linha peq">
        <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={zerados} onChange={(e) => setZerados(e.target.checked)} />
        Mostrar materiais zerados
      </label>
      <Aviso tipo="erro">{consulta.erro}</Aviso>
      {consulta.carregando ? (
        <Carregando />
      ) : linhas.length === 0 ? (
        <Vazio>Nenhum material com saldo aqui.</Vazio>
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th className="num">Saldo</th>
                <th>Unid.</th>
                <th>Última mov.</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.material_id}>
                  <td className="mono">{l.codigo_sap}</td>
                  <td>{l.descricao}</td>
                  <td className="num">{formatarQtd(l.saldo)}</td>
                  <td>{l.unidade}</td>
                  <td className="sec peq">{formatarData(l.ultima_movimentacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="sec peq">{linhas.length} materiais</p>
    </div>
  )
}
