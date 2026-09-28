import { useMemo } from 'react'
import { useCatalogo } from '../auth/CatalogoContext'
import { formatarQtd, lerNumero, qtdValida } from '../lib/formato'
import type { Enum } from '../lib/supabase'
import { MaterialBusca, MaterialRotulo } from './MaterialBusca'
import { Campo } from './ui'

export type LinhaConferencia = {
  material_id: string
  /** texto quando editável (entrada do 3256); número vindo da guia nos demais casos */
  enviada: string
  contado: string
  motivo: Enum<'motivo_divergencia'> | ''
  observacao: string
  /** item que não estava na guia */
  extra?: boolean
}

const MOTIVOS_FALTA: { valor: Enum<'motivo_divergencia'>; rotulo: string }[] = [
  { valor: 'falta', rotulo: 'Falta' },
  { valor: 'avaria', rotulo: 'Avaria (não entra no saldo)' },
  { valor: 'trocado', rotulo: 'Trocado' },
]
const MOTIVOS_SOBRA: { valor: Enum<'motivo_divergencia'>; rotulo: string }[] = [
  { valor: 'sobra', rotulo: 'Sobra' },
  { valor: 'trocado', rotulo: 'Trocado' },
]

/** Diferença entre enviado e contado; null enquanto não dá para comparar. */
function sentido(l: LinhaConferencia): 'igual' | 'menos' | 'mais' | null {
  const e = l.enviada.trim() === '' ? Number.NaN : lerNumero(l.enviada)
  const c = l.contado.trim() === '' ? Number.NaN : lerNumero(l.contado)
  if (Number.isNaN(e) || Number.isNaN(c)) return null
  return c === e ? 'igual' : c < e ? 'menos' : 'mais'
}

/** Valida as linhas; devolve a primeira mensagem de erro. */
export function validarConferencia(
  linhas: LinhaConferencia[],
  aceitaFracao: (id: string) => boolean,
  codigo: (id: string) => string,
): string | null {
  if (!linhas.length) return 'Informe ao menos um item.'
  for (const l of linhas) {
    const f = aceitaFracao(l.material_id)
    const eEnv = qtdValida(l.enviada, f, { permiteZero: true })
    if (eEnv) return `${codigo(l.material_id)} (documento): ${eEnv}`
    const eCont = qtdValida(l.contado, f, { permiteZero: true })
    if (eCont) return `${codigo(l.material_id)} (contado): ${eCont}`
    const s = sentido(l)
    if (s === 'menos' && !l.motivo) return `Informe o motivo da diferença de ${codigo(l.material_id)}.`
    if (l.extra && lerNumero(l.contado) === 0) return `Item fora da guia precisa de quantidade maior que zero (${codigo(l.material_id)}).`
  }
  return null
}

export function paraRpc(linhas: LinhaConferencia[], comEnviada: boolean) {
  return linhas.map((l) => {
    const s = sentido(l)
    return {
      material_id: l.material_id,
      ...(comEnviada ? { qtd_enviada: lerNumero(l.enviada) } : {}),
      qtd_recebida: lerNumero(l.contado),
      motivo_divergencia: s === 'igual' ? null : l.motivo || (s === 'mais' ? 'sobra' : null),
      observacao: l.observacao.trim() || null,
    }
  })
}

export function TabelaConferencia({
  linhas,
  onChange,
  enviadaEditavel,
  rotuloEnviada = 'Na guia',
}: {
  linhas: LinhaConferencia[]
  onChange: (l: LinhaConferencia[]) => void
  enviadaEditavel: boolean
  rotuloEnviada?: string
}) {
  const { material } = useCatalogo()
  const escolhidos = useMemo(() => new Set(linhas.map((l) => l.material_id)), [linhas])
  const mudar = (i: number, p: Partial<LinhaConferencia>) => onChange(linhas.map((l, j) => (j === i ? { ...l, ...p } : l)))

  return (
    <div className="pilha">
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th className="num">{rotuloEnviada}</th>
              <th className="num">Contado</th>
              <th>Motivo da diferença</th>
              <th>Obs.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const m = material(l.material_id)
              const cod = m?.codigo_sap ?? ''
              const s = sentido(l)
              const opcoes = s === 'menos' ? MOTIVOS_FALTA : s === 'mais' ? MOTIVOS_SOBRA : []
              return (
                <tr key={l.material_id}>
                  <td>
                    <MaterialRotulo id={l.material_id} />
                    {l.extra && <div className="sec peq">Não estava na guia</div>}
                  </td>
                  <td className="num" style={{ width: 120 }}>
                    {enviadaEditavel ? (
                      <input
                        inputMode="decimal"
                        aria-label={`No documento de ${cod}`}
                        value={l.enviada}
                        onChange={(e) => mudar(i, { enviada: e.target.value })}
                      />
                    ) : (
                      <>
                        {formatarQtd(lerNumero(l.enviada))} <span className="sec">{m?.unidade}</span>
                      </>
                    )}
                  </td>
                  <td style={{ width: 120 }}>
                    <input
                      inputMode="decimal"
                      aria-label={`Contado de ${cod}`}
                      value={l.contado}
                      onChange={(e) => mudar(i, { contado: e.target.value })}
                    />
                  </td>
                  <td style={{ minWidth: 170 }}>
                    {opcoes.length > 0 && (
                      <select
                        aria-label={`Motivo da diferença de ${cod}`}
                        value={l.motivo}
                        onChange={(e) => mudar(i, { motivo: e.target.value as LinhaConferencia['motivo'] })}
                      >
                        <option value="">Escolha…</option>
                        {opcoes.map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.rotulo}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <input aria-label={`Observação de ${cod}`} value={l.observacao} onChange={(e) => mudar(i, { observacao: e.target.value })} />
                  </td>
                  <td className="acoes-celula">
                    {(l.extra || enviadaEditavel) && (
                      <button className="botao fantasma peq" onClick={() => onChange(linhas.filter((_, j) => j !== i))}>
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <MaterialBusca
        rotulo={enviadaEditavel ? 'Adicionar material' : 'Item que chegou sem estar na guia'}
        excluir={escolhidos}
        onEscolher={(m) =>
          onChange([
            ...linhas,
            { material_id: m.id, enviada: enviadaEditavel ? '' : '0', contado: '', motivo: '', observacao: '', extra: !enviadaEditavel },
          ])
        }
      />
    </div>
  )
}

export function CamposConferencia({
  quemContou,
  setQuemContou,
  data,
  setData,
  dataMin,
  dataMax,
  onFoto,
  fotoNome,
}: {
  quemContou: string
  setQuemContou: (v: string) => void
  data: string
  setData: (v: string) => void
  dataMin?: string
  dataMax: string
  onFoto: (f: File | null) => void
  fotoNome: string | null
}) {
  return (
    <div className="grade-2">
      <Campo rotulo="Quem contou" ajuda="Nome de quem conferiu o material na chegada (não precisa ter login).">
        <input value={quemContou} onChange={(e) => setQuemContou(e.target.value)} />
      </Campo>
      <Campo rotulo="Data da chegada" ajuda="A data real, mesmo que o lançamento seja depois.">
        <input type="date" min={dataMin} max={dataMax} value={data} onChange={(e) => setData(e.target.value)} />
      </Campo>
      <Campo rotulo="Foto da guia assinada ou da carga" ajuda={fotoNome ?? 'Obrigatória. Pode tirar pelo celular.'} style={{ gridColumn: '1 / -1' }}>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => onFoto(e.target.files?.[0] ?? null)} />
      </Campo>
    </div>
  )
}
