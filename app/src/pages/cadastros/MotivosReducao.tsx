import { useState, type FormEvent } from 'react'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

/** Motivos novos entram depois dos padrões e antes de "Outro" (90). */
const ORDEM_NOVO = 50

export function MotivosReducao() {
  const { ehGestora, ehAdmin } = useSessao()
  const consulta = useConsulta(
    () => listaOuErro(supabase.from('motivos_reducao').select('*').order('ordem').order('descricao')),
    [],
  )
  const [nomes, setNomes] = useState<Record<number, string>>({})
  const [novo, setNovo] = useState('')
  const [exigeTexto, setExigeTexto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  if (!ehGestora && !ehAdmin) return <Aviso tipo="erro">Acesso restrito à gestão do almoxarifado e ao administrador.</Aviso>

  async function executar(fn: () => Promise<unknown>, mensagem: string): Promise<boolean> {
    setErro(null)
    setOk(null)
    let deuCerto = false
    try {
      await fn()
      setOk(mensagem)
      deuCerto = true
    } catch (e) {
      setErro((e as { code?: string }).code === '23505' ? 'Já existe um motivo com esse nome.' : mensagemErro(e))
    }
    setNomes({})
    await consulta.recarregar()
    return deuCerto
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    const descricao = novo.trim()
    if (!descricao) return setErro('Informe o motivo.')
    const feito = await executar(
      () => dadosOuErro(supabase.from('motivos_reducao').insert({ descricao, exige_texto: exigeTexto, ordem: ORDEM_NOVO })),
      `Motivo "${descricao}" cadastrado.`,
    )
    if (feito) {
      setNovo('')
      setExigeTexto(false)
    }
  }

  const motivos = consulta.dados ?? []
  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Motivos de redução"
        trilha={['Cadastros', 'Motivos de redução']}
        sub="Usados quando a solicitação é aprovada abaixo do pedido. Motivo não é apagado: inative para tirar da lista. Com “exige texto”, quem aprova precisa escrever o detalhe."
      />
      <Aviso tipo="erro">{erro ?? consulta.erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      {consulta.carregando && !consulta.dados ? (
        <Carregando />
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Motivo</th>
                <th>Exige texto</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {motivos.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input
                      aria-label={`Nome do motivo ${m.descricao}`}
                      value={nomes[m.id] ?? m.descricao}
                      onChange={(e) => setNomes({ ...nomes, [m.id]: e.target.value })}
                      onBlur={() => {
                        const nome = (nomes[m.id] ?? m.descricao).trim()
                        if (nome && nome !== m.descricao)
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ descricao: nome }).eq('id', m.id)),
                            `Motivo renomeado para "${nome}".`,
                          )
                        else setNomes({})
                      }}
                    />
                  </td>
                  <td>
                    <label className="linha">
                      <input
                        type="checkbox"
                        style={{ width: 'auto', minHeight: 0 }}
                        aria-label={`${m.descricao} exige texto`}
                        checked={m.exige_texto}
                        onChange={(e) =>
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ exige_texto: e.target.checked }).eq('id', m.id)),
                            `Motivo "${m.descricao}" atualizado.`,
                          )
                        }
                      />
                      {m.exige_texto ? 'Sim' : 'Não'}
                    </label>
                  </td>
                  <td>
                    <label className="linha">
                      <input
                        type="checkbox"
                        style={{ width: 'auto', minHeight: 0 }}
                        aria-label={`${m.descricao} ativo`}
                        checked={m.ativo}
                        onChange={(e) =>
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ ativo: e.target.checked }).eq('id', m.id)),
                            `Motivo "${m.descricao}" ${e.target.checked ? 'reativado' : 'inativado'}.`,
                          )
                        }
                      />
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="cartao linha-fim" onSubmit={(e) => void cadastrar(e)}>
        <Campo rotulo="Novo motivo" style={{ flex: 1, minWidth: 220 }}>
          <input value={novo} onChange={(e) => setNovo(e.target.value)} />
        </Campo>
        <label className="linha" style={{ minHeight: 42 }}>
          <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={exigeTexto} onChange={(e) => setExigeTexto(e.target.checked)} />
          Exige texto livre
        </label>
        <button className="botao primario" type="submit">
          Cadastrar motivo
        </button>
      </form>
    </div>
  )
}
