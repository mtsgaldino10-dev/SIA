import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'
import { SeletorAlmox } from '../Saldo'

export function Equipes() {
  const { basesEquipes } = useSessao()
  const [params, setParams] = useSearchParams()
  const baseId = params.get('base') ?? basesEquipes[0]?.id ?? ''
  const base = basesEquipes.find((b) => b.id === baseId)
  const consulta = useConsulta(
    () => (base ? listaOuErro(supabase.from('equipes').select('*').eq('almox_id', base.id).order('nome')) : Promise.resolve([])),
    [base?.id],
  )
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  if (!basesEquipes.length) {
    return <Vazio>As equipes são mantidas pelo supervisor da base, pela gestão do almoxarifado e pelo administrador.</Vazio>
  }

  async function executar(fn: () => Promise<unknown>, mensagem: string, repetido: string): Promise<boolean> {
    setErro(null)
    setOk(null)
    let deuCerto = false
    try {
      await fn()
      setOk(mensagem)
      deuCerto = true
    } catch (e) {
      setErro((e as { code?: string }).code === '23505' ? repetido : mensagemErro(e))
    }
    setNomes({})
    await consulta.recarregar()
    return deuCerto
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    if (!base) return
    const nome = nova.trim()
    if (!nome) return setErro('Informe o nome da equipe.')
    const feito = await executar(
      () => dadosOuErro(supabase.from('equipes').insert({ almox_id: base.id, nome })),
      `Equipe "${nome}" cadastrada em ${base.nome}.`,
      `Já existe uma equipe "${nome}" em ${base.nome}.`,
    )
    if (feito) setNova('')
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Equipes"
        trilha={['Cadastros', 'Equipes']}
        sub="Equipes de cada base, para a saída registrar quem retirou o material. Equipe que já tem saída não muda de nome: inative e cadastre outra."
      />
      <SeletorAlmox
        rotulo="Base"
        valor={baseId}
        onChange={(id) => {
          setParams({ base: id })
          setNomes({})
          setErro(null)
          setOk(null)
        }}
        opcoes={basesEquipes}
      />
      {!base && <Aviso tipo="erro">Você não mantém as equipes desta base.</Aviso>}
      <Aviso tipo="erro">{erro ?? consulta.erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      {base &&
        (consulta.carregando && !consulta.dados ? (
          <Carregando />
        ) : !consulta.dados?.length ? (
          <Vazio>Nenhuma equipe cadastrada em {base.nome}.</Vazio>
        ) : (
          <div className="tabela-envoltorio">
            <table>
              <thead>
                <tr>
                  <th>Equipe</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {consulta.dados.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <input
                        aria-label={`Nome da equipe ${q.nome}`}
                        value={nomes[q.id] ?? q.nome}
                        onChange={(e) => setNomes({ ...nomes, [q.id]: e.target.value })}
                        onBlur={() => {
                          const nome = (nomes[q.id] ?? q.nome).trim()
                          if (nome && nome !== q.nome)
                            void executar(
                              () => dadosOuErro(supabase.from('equipes').update({ nome }).eq('id', q.id)),
                              `Equipe renomeada para "${nome}".`,
                              `Já existe uma equipe "${nome}" em ${base.nome}.`,
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
                          aria-label={`${q.nome} ativa`}
                          checked={q.ativa}
                          onChange={(e) =>
                            void executar(
                              () => dadosOuErro(supabase.from('equipes').update({ ativa: e.target.checked }).eq('id', q.id)),
                              `Equipe "${q.nome}" ${e.target.checked ? 'reativada' : 'inativada'}.`,
                              '',
                            )
                          }
                        />
                        {q.ativa ? 'Ativa' : 'Inativa'}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {base && (
        <form className="cartao linha-fim" onSubmit={(e) => void cadastrar(e)}>
          <Campo rotulo="Nova equipe" style={{ flex: 1, minWidth: 220 }}>
            <input value={nova} onChange={(e) => setNova(e.target.value)} />
          </Campo>
          <button className="botao primario" type="submit">
            Cadastrar equipe
          </button>
        </form>
      )}
    </div>
  )
}
