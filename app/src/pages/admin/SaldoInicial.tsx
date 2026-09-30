import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogo } from '../../auth/CatalogoContext'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, PaginaTopo } from '../../components/ui'
import { MaterialRotulo } from '../../components/MaterialBusca'
import { mensagemErro } from '../../lib/erros'
import { formatarDoc, formatarQtd, hojeISO } from '../../lib/formato'
import { validarSaldoInicial } from '../../lib/importacao'
import { baixarPlanilha, lerPlanilha } from '../../lib/planilha'
import { supabase } from '../../lib/supabase'

export function SaldoInicial() {
  const { almoxarifados } = useSessao()
  const { materiais, unidades } = useCatalogo()
  const destinos = almoxarifados.filter((a) => a.tipo !== 'externo' && a.ativo)
  const [almoxId, setAlmoxId] = useState(destinos[0]?.id ?? '')
  const [data, setData] = useState(hojeISO())
  const [justificativa, setJustificativa] = useState('Contagem de implantação (dia D)')
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReturnType<typeof validarSaldoInicial> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [feito, setFeito] = useState<{ id: string; numero: number; itens: number } | null>(null)

  const catalogo = useMemo(() => {
    const fracao = new Map(unidades.map((u) => [u.codigo, u.aceita_fracao]))
    return new Map(materiais.map((m) => [m.codigo_sap, { id: m.id, aceita_fracao: fracao.get(m.unidade) ?? false }]))
  }, [materiais, unidades])

  const almox = destinos.find((a) => a.id === almoxId)

  async function abrir(f: File | undefined) {
    if (!f) return
    setErro(null)
    setFeito(null)
    try {
      setArquivo(f.name)
      setResultado(validarSaldoInicial(await lerPlanilha(f), catalogo))
    } catch (e) {
      setErro(`Não foi possível ler a planilha: ${mensagemErro(e)}`)
    }
  }

  async function importar() {
    if (!resultado?.itens.length || !almox) return
    setErro(null)
    setEnviando(true)
    const { data: id, error } = await supabase.rpc('rpc_registrar_ajuste', {
      p_almox_id: almox.id,
      p_tipo: 'implantacao',
      p_justificativa: justificativa,
      p_itens: resultado.itens,
      p_data_ocorrencia: data,
    })
    setEnviando(false)
    if (error) {
      setErro(mensagemErro(error))
      return
    }
    const { data: aj } = await supabase.from('ajustes').select('numero').eq('id', id).single()
    setFeito({ id, numero: aj?.numero ?? 0, itens: resultado.itens.length })
    setResultado(null)
    setArquivo(null)
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Saldo inicial"
        trilha={['Cadastros', 'Saldo inicial']}
        sub="Uma planilha por almoxarifado, com as colunas codigo_sap e quantidade. Material inexistente bloqueia a importação."
        acoes={
          <button
            className="botao secundario"
            onClick={() => baixarPlanilha('modelo-saldo-inicial.xlsx', [['codigo_sap', 'quantidade'], ['379454', 10]])}
          >
            Baixar modelo
          </button>
        }
      />

      <div className="cartao pilha">
        <div className="grade-2">
          <Campo rotulo="Almoxarifado">
            <select value={almoxId} onChange={(e) => setAlmoxId(e.target.value)}>
              {destinos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} · {a.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Data da contagem">
            <input type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo rotulo="Justificativa" style={{ gridColumn: '1 / -1' }}>
            <input value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
          </Campo>
          <Campo rotulo="Planilha" ajuda={arquivo ?? 'XLSX ou CSV'} style={{ gridColumn: '1 / -1' }}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void abrir(e.target.files?.[0])} />
          </Campo>
        </div>
        <Aviso tipo="erro">{erro}</Aviso>
      </div>

      {resultado && resultado.erros.length > 0 && (
        <div className="cartao pilha">
          <Aviso tipo="erro">Importação bloqueada. Corrija a planilha e envie de novo.</Aviso>
          <ul>
            {resultado.erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {resultado && resultado.itens.length > 0 && (
        <div className="cartao pilha">
          <h2>
            {resultado.itens.length} materiais para {almox?.nome}
          </h2>
          <p className="sec peq">
            O sistema compara com o saldo atual e lança só a diferença (tipo implantação). Com o saldo zerado, a diferença é a própria contagem.
          </p>
          <div className="tabela-envoltorio" style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {resultado.itens.slice(0, 200).map((i) => (
                  <tr key={i.material_id}>
                    <td>
                      <MaterialRotulo id={i.material_id} compacto />
                    </td>
                    <td className="num">{formatarQtd(i.qtd_contada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="acoes">
            <button className="botao primario" disabled={enviando || !justificativa.trim()} onClick={() => void importar()}>
              {enviando ? 'Importando…' : 'Importar saldo inicial'}
            </button>
          </div>
        </div>
      )}

      {feito && (
        <Aviso tipo="sucesso">
          Saldo inicial importado: {formatarDoc('AJU', feito.numero)} com {feito.itens} materiais.{' '}
          <Link to={`/saldo?almox=${almoxId}`}>Ver saldo</Link>
        </Aviso>
      )}
    </div>
  )
}
