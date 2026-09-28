import { useMemo } from 'react'
import { useCatalogo } from '../auth/CatalogoContext'
import { formatarQtd, lerNumero, qtdValida } from '../lib/formato'
import { MaterialBusca, MaterialRotulo } from './MaterialBusca'
import { Vazio } from './ui'

export type LinhaQtd = { material_id: string; qtd: string }

export function validarLinhas(
  linhas: LinhaQtd[],
  aceitaFracao: (id: string) => boolean,
  codigo: (id: string) => string,
): string | null {
  if (!linhas.length) return 'Informe ao menos um item.'
  for (const l of linhas) {
    const e = qtdValida(l.qtd, aceitaFracao(l.material_id))
    if (e) return `${codigo(l.material_id)}: ${e}`
  }
  return null
}

/** Lista de materiais com quantidade, mostrando o saldo disponível. */
export function ItensQuantidade({
  linhas,
  onChange,
  saldos,
}: {
  linhas: LinhaQtd[]
  onChange: (l: LinhaQtd[]) => void
  saldos: Map<string, number> | null
}) {
  const { material } = useCatalogo()
  const escolhidos = useMemo(() => new Set(linhas.map((l) => l.material_id)), [linhas])

  return (
    <div className="pilha">
      <MaterialBusca excluir={escolhidos} onEscolher={(m) => onChange([...linhas, { material_id: m.id, qtd: '' }])} />
      {linhas.length === 0 ? (
        <Vazio>Busque pelo código SAP ou pela descrição para adicionar itens.</Vazio>
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th className="num">Saldo</th>
                <th className="num">Quantidade</th>
                <th>Unid.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const m = material(l.material_id)
                const saldo = saldos?.get(l.material_id) ?? 0
                const acima = saldos !== null && lerNumero(l.qtd) > saldo
                return (
                  <tr key={l.material_id}>
                    <td>
                      <MaterialRotulo id={l.material_id} />
                    </td>
                    <td className="num" style={acima ? { color: 'var(--st-alerta-texto)', fontWeight: 600 } : undefined}>
                      {saldos ? formatarQtd(saldo) : '…'}
                    </td>
                    <td style={{ width: 130 }}>
                      <input
                        inputMode="decimal"
                        aria-label={`Quantidade de ${m?.codigo_sap}`}
                        aria-invalid={acima || undefined}
                        value={l.qtd}
                        onChange={(e) => onChange(linhas.map((x, j) => (j === i ? { ...x, qtd: e.target.value } : x)))}
                      />
                    </td>
                    <td>{m?.unidade}</td>
                    <td className="acoes-celula">
                      <button className="botao fantasma peq" onClick={() => onChange(linhas.filter((_, j) => j !== i))}>
                        Remover
                      </button>
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
