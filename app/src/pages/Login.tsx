import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { Aviso, Campo, Marca } from '../components/ui'
import { mensagemErro } from '../lib/erros'
import { supabase } from '../lib/supabase'

export function Login() {
  const { session } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) setErro(mensagemErro(error))
  }

  return (
    <div className="login">
      <form className="login-cartao pilha" onSubmit={entrar}>
        <Marca comNome />
        <Campo rotulo="E-mail">
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo rotulo="Senha">
          <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <Aviso tipo="erro">{erro}</Aviso>
        <button className="botao primario" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="sec peq">Sem acesso? Peça ao administrador do sistema.</p>
      </form>
    </div>
  )
}
