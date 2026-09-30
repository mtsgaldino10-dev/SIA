import { useState, type FormEvent } from 'react'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { formatarData, rotuloStatus } from '../../lib/formato'
import { supabase, type Enum, type Perfil } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

export function AdminUsuarios() {
  const { almoxarifados, recarregarPerfil, perfil: eu } = useSessao()
  const operaveis = almoxarifados.filter((a) => a.tipo !== 'externo')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const consulta = useConsulta(async () => {
    const [perfis, atribuicoes] = await Promise.all([
      listaOuErro(supabase.from('perfis').select('*').order('nome')),
      listaOuErro(supabase.from('atribuicoes').select('*')),
    ])
    return { perfis, atribuicoes }
  }, [])

  const perfis = consulta.dados?.perfis ?? []
  const atual = perfis.find((p) => p.id === selecionado) ?? null
  const minhas = (consulta.dados?.atribuicoes ?? []).filter((a) => a.usuario_id === selecionado)

  async function executar(fn: () => Promise<unknown>, mensagem: string) {
    setErro(null)
    setOk(null)
    try {
      await fn()
      setOk(mensagem)
      await consulta.recarregar()
      if (selecionado === eu?.id) await recarregarPerfil()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Usuários e atribuições"
        trilha={['Cadastros', 'Usuários e atribuições']}
        sub="Crie o usuário no painel do Supabase (Authentication → Add user). O perfil aparece aqui automaticamente."
      />
      <Aviso tipo="erro">{erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      {consulta.carregando && <Carregando />}
      <Aviso tipo="erro">{consulta.erro}</Aviso>

      <div className="grade-2" style={{ alignItems: 'start' }}>
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th>Atribuições</th>
              </tr>
            </thead>
            <tbody>
              {perfis.map((p) => {
                const n = (consulta.dados?.atribuicoes ?? []).filter((a) => a.usuario_id === p.id).length
                return (
                  <tr key={p.id} className="clicavel" onClick={() => setSelecionado(p.id)} aria-selected={p.id === selecionado}>
                    <td>
                      {p.nome}
                      <div className="sec peq">{p.email}</div>
                    </td>
                    <td>
                      {rotuloStatus(p.papel)}
                      {!p.ativo && <div className="sec peq">Inativo</div>}
                    </td>
                    <td className="num">{n}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {atual ? (
          <div className="pilha">
            <PerfilForm
              key={atual.id}
              perfil={atual}
              onSalvar={(dados) =>
                executar(() => dadosOuErro(supabase.from('perfis').update(dados).eq('id', atual.id)), `${dados.nome} atualizado.`)
              }
            />
            <div className="cartao pilha">
              <h2>Atribuições</h2>
              <p className="sec peq">
                Responsável opera o almoxarifado. Supervisor acompanha. Nas bases, cada supervisor recebe as duas funções. Responsável no 211 é a gestão do almoxarifado: aprova, entrega, ajusta o estoque e inventaria.
              </p>
              {minhas.length === 0 ? (
                <Vazio>Sem atribuições.</Vazio>
              ) : (
                <div className="tabela-envoltorio">
                  <table>
                    <tbody>
                      {minhas.map((a) => {
                        const al = almoxarifados.find((x) => x.id === a.almox_id)
                        return (
                          <tr key={`${a.almox_id}-${a.funcao}`}>
                            <td>
                              <span className="mono">{al?.codigo}</span> {al?.nome}
                            </td>
                            <td>{rotuloStatus(a.funcao)}</td>
                            <td className="sec peq">desde {formatarData(a.desde)}</td>
                            <td className="acoes-celula">
                              <button
                                className="botao fantasma peq"
                                onClick={() =>
                                  executar(
                                    () =>
                                      dadosOuErro(
                                        supabase
                                          .from('atribuicoes')
                                          .delete()
                                          .eq('almox_id', a.almox_id)
                                          .eq('usuario_id', a.usuario_id)
                                          .eq('funcao', a.funcao),
                                      ),
                                    'Atribuição removida.',
                                  )
                                }
                              >
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
              <NovaAtribuicao
                almox={operaveis}
                onAdicionar={(almoxIds, funcoes) =>
                  executar(
                    () =>
                      dadosOuErro(
                        supabase.from('atribuicoes').upsert(
                          almoxIds.flatMap((almox_id) => funcoes.map((funcao) => ({ almox_id, usuario_id: atual.id, funcao }))),
                          { onConflict: 'almox_id,usuario_id,funcao', ignoreDuplicates: true },
                        ),
                      ),
                    'Atribuição adicionada.',
                  )
                }
              />
            </div>
          </div>
        ) : (
          <Vazio>Escolha um usuário na lista.</Vazio>
        )}
      </div>
    </div>
  )
}

function PerfilForm({
  perfil,
  onSalvar,
}: {
  perfil: Perfil
  onSalvar: (dados: { nome: string; matricula: string | null; papel: Enum<'papel_usuario'>; ativo: boolean }) => void
}) {
  const [nome, setNome] = useState(perfil.nome)
  const [matricula, setMatricula] = useState(perfil.matricula ?? '')
  const [papel, setPapel] = useState<Enum<'papel_usuario'>>(perfil.papel)
  const [ativo, setAtivo] = useState(perfil.ativo)

  function enviar(e: FormEvent) {
    e.preventDefault()
    onSalvar({ nome: nome.trim(), matricula: matricula.trim() || null, papel, ativo })
  }

  return (
    <form className="cartao pilha" onSubmit={enviar}>
      <h2>{perfil.nome}</h2>
      <p className="sec peq">{perfil.email}</p>
      <div className="grade-2">
        <Campo rotulo="Nome">
          <input required value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo rotulo="Matrícula">
          <input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
        </Campo>
        <Campo rotulo="Papel" ajuda="Gestão e admin veem tudo. Operador vê só onde tem atribuição.">
          <select value={papel} onChange={(e) => setPapel(e.target.value as Enum<'papel_usuario'>)}>
            <option value="operador">Operador</option>
            <option value="gestao">Gerência (só consulta)</option>
            <option value="admin">Administrador</option>
          </select>
        </Campo>
        <label className="linha" style={{ alignSelf: 'center' }}>
          <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Usuário ativo
        </label>
      </div>
      <div className="acoes">
        <button className="botao primario" type="submit">
          Salvar usuário
        </button>
      </div>
    </form>
  )
}

function NovaAtribuicao({
  almox,
  onAdicionar,
}: {
  almox: { id: string; codigo: string; nome: string }[]
  onAdicionar: (almoxIds: string[], funcoes: Enum<'funcao_atribuicao'>[]) => void
}) {
  const [ids, setIds] = useState<string[]>([])
  const [funcao, setFuncao] = useState<'ambas' | Enum<'funcao_atribuicao'>>('ambas')

  return (
    <div className="pilha separada">
      <h3>Adicionar</h3>
      <div className="grade-cartoes">
        {almox.map((a) => (
          <label key={a.id} className="linha peq">
            <input
              type="checkbox"
              style={{ width: 'auto', minHeight: 0 }}
              checked={ids.includes(a.id)}
              onChange={(e) => setIds(e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id))}
            />
            <span className="mono">{a.codigo}</span> {a.nome}
          </label>
        ))}
      </div>
      <div className="linha-fim">
        <Campo rotulo="Função" style={{ minWidth: 220 }}>
          <select value={funcao} onChange={(e) => setFuncao(e.target.value as typeof funcao)}>
            <option value="ambas">Responsável e supervisor</option>
            <option value="responsavel">Responsável</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </Campo>
        <button
          className="botao secundario"
          disabled={!ids.length}
          onClick={() => {
            onAdicionar(ids, funcao === 'ambas' ? ['responsavel', 'supervisor'] : [funcao])
            setIds([])
          }}
        >
          Adicionar atribuição
        </button>
      </div>
    </div>
  )
}
