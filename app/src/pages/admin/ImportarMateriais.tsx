import { useMemo, useState } from 'react'
import { useCatalogo } from '../../auth/CatalogoContext'
import { Aviso, Campo, PaginaTopo } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { formatarMoeda } from '../../lib/formato'
import {
  detectarMapeamento,
  emLotes,
  encontrarCabecalho,
  validarMateriais,
  type LinhaBloqueada,
  type Mapeamento,
} from '../../lib/importacao'
import { lerPlanilha } from '../../lib/planilha'
import { supabase } from '../../lib/supabase'

const CAMPOS: { chave: keyof Mapeamento; rotulo: string; obrigatorio: boolean }[] = [
  { chave: 'codigo_sap', rotulo: 'Código SAP', obrigatorio: true },
  { chave: 'descricao', rotulo: 'Descrição', obrigatorio: true },
  { chave: 'unidade', rotulo: 'Unidade', obrigatorio: true },
  { chave: 'preco', rotulo: 'Preço', obrigatorio: false },
  { chave: 'grupo', rotulo: 'Grupo', obrigatorio: false },
]

type Relatorio = { inseridos: number; bloqueadas: LinhaBloqueada[] }

export function ImportarMateriais() {
  const { materiais, unidades, recarregar } = useCatalogo()
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<unknown[][]>([])
  const [iCabecalho, setICabecalho] = useState(-1)
  const [mapa, setMapa] = useState<Mapeamento | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [progresso, setProgresso] = useState<string | null>(null)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)

  const cabecalho = iCabecalho >= 0 ? linhas[iCabecalho] : []
  const faltaObrigatorio = !mapa || CAMPOS.some((c) => c.obrigatorio && mapa[c.chave] === null)

  const previa = useMemo(() => {
    if (!mapa || faltaObrigatorio) return null
    return validarMateriais(
      linhas.slice(iCabecalho + 1),
      mapa,
      unidades.map((u) => u.codigo),
      new Set(materiais.map((m) => m.codigo_sap)),
      iCabecalho + 2,
    )
  }, [linhas, iCabecalho, mapa, faltaObrigatorio, unidades, materiais])

  async function abrir(f: File | undefined) {
    if (!f) return
    setErro(null)
    setRelatorio(null)
    try {
      const l = await lerPlanilha(f)
      const i = encontrarCabecalho(l)
      setArquivo(f.name)
      setLinhas(l)
      setICabecalho(i === -1 ? 0 : i)
      setMapa(detectarMapeamento(l[i === -1 ? 0 : i] ?? []))
    } catch (e) {
      setErro(`Não foi possível ler a planilha: ${mensagemErro(e)}`)
    }
  }

  async function importar() {
    if (!previa) return
    setErro(null)
    const bloqueadas = [...previa.bloqueadas]
    let inseridos = 0
    const lotes = emLotes(previa.validas, 50)
    for (const [n, lote] of lotes.entries()) {
      setProgresso(`Importando lote ${n + 1} de ${lotes.length}…`)
      const { error } = await supabase
        .from('materiais')
        .insert(lote.map(({ linha: _linha, ...m }) => m))
      if (error) {
        for (const m of lote) bloqueadas.push({ linha: m.linha, codigo_sap: m.codigo_sap, motivo: `Erro no lote: ${mensagemErro(error)}` })
      } else {
        inseridos += lote.length
      }
    }
    setProgresso(null)
    setRelatorio({ inseridos, bloqueadas: bloqueadas.sort((a, b) => a.linha - b.linha) })
    setLinhas([])
    setMapa(null)
    await recarregar()
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Importar materiais"
        sub="Planilha exportada do SAP (XLSX ou CSV). Códigos já cadastrados não são atualizados."
        voltar={{ para: '/admin/materiais', rotulo: 'Materiais' }}
        trilha={['Cadastros', { rotulo: 'Materiais', para: '/admin/materiais' }, 'Importar']}
      />
      <div className="cartao pilha">
        <Campo rotulo="1. Arquivo" ajuda={arquivo ?? 'A linha de cabeçalho é detectada automaticamente.'}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void abrir(e.target.files?.[0])} />
        </Campo>
        <Aviso tipo="erro">{erro}</Aviso>
      </div>

      {mapa && (
        <div className="cartao pilha">
          <h2>2. Colunas</h2>
          <p className="sec peq">
            Cabeçalho na linha {iCabecalho + 1}. Confira a coluna de cada campo.
          </p>
          <div className="grade-cartoes">
            {CAMPOS.map((c) => (
              <Campo key={c.chave} rotulo={`${c.rotulo}${c.obrigatorio ? '' : ' (opcional)'}`}>
                <select
                  value={mapa[c.chave] ?? ''}
                  onChange={(e) => setMapa({ ...mapa, [c.chave]: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">— não usar —</option>
                  {cabecalho.map((nome, i) => (
                    <option key={i} value={i}>
                      {String(nome ?? `Coluna ${i + 1}`)}
                    </option>
                  ))}
                </select>
              </Campo>
            ))}
          </div>
          {faltaObrigatorio && <Aviso tipo="atencao">Escolha as colunas de código, descrição e unidade.</Aviso>}
        </div>
      )}

      {previa && (
        <div className="cartao pilha">
          <h2>3. Pré-visualização</h2>
          <div className="linha">
            <span className="badge ok">{previa.validas.length} prontos para importar</span>
            <span className={`badge ${previa.bloqueadas.length ? 'alerta' : 'neutro'}`}>{previa.bloqueadas.length} bloqueados</span>
          </div>
          {previa.bloqueadas.length > 0 && <TabelaBloqueadas linhas={previa.bloqueadas} />}
          {previa.validas.length > 0 && (
            <div className="tabela-envoltorio" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Unid.</th>
                    <th className="num">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {previa.validas.slice(0, 100).map((m) => (
                    <tr key={m.linha}>
                      <td className="mono">{m.linha}</td>
                      <td className="mono">{m.codigo_sap}</td>
                      <td>{m.descricao}</td>
                      <td>{m.unidade}</td>
                      <td className="num">{formatarMoeda(m.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {previa.validas.length > 100 && <p className="sec peq">Mostrando os primeiros 100.</p>}
          <Aviso tipo="info">{progresso}</Aviso>
          <div className="acoes">
            <button className="botao primario" disabled={!previa.validas.length || !!progresso} onClick={() => void importar()}>
              Importar {previa.validas.length} materiais
            </button>
          </div>
        </div>
      )}

      {relatorio && (
        <div className="cartao pilha">
          <h2>Relatório</h2>
          <Aviso tipo="sucesso">{relatorio.inseridos} materiais inseridos.</Aviso>
          {relatorio.bloqueadas.length > 0 && (
            <>
              <Aviso tipo="atencao">{relatorio.bloqueadas.length} linhas bloqueadas.</Aviso>
              <TabelaBloqueadas linhas={relatorio.bloqueadas} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TabelaBloqueadas({ linhas }: { linhas: LinhaBloqueada[] }) {
  return (
    <div className="tabela-envoltorio" style={{ maxHeight: 280, overflowY: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Linha</th>
            <th>Código</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((b, i) => (
            <tr key={`${b.linha}-${i}`}>
              <td className="mono">{b.linha}</td>
              <td className="mono">{b.codigo_sap || '—'}</td>
              <td>{b.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
