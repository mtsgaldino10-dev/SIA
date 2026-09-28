import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { USUARIOS } from './apoio'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function sql(comando: string) {
  execSync('docker exec -i supabase_db_SIA psql -v ON_ERROR_STOP=1 -U postgres -q', { input: comando, stdio: ['pipe', 'inherit', 'inherit'] })
}

/** Zera o banco local e cria os usuários de teste com papéis e atribuições. */
export default async function preparar() {
  execSync('supabase db reset --local', { cwd: RAIZ, stdio: 'ignore' })
  const status = JSON.parse(execSync('supabase status -o json', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString())
  const chave = status.SERVICE_ROLE_KEY as string

  // O reset reinicia os serviços; espera o Auth voltar
  for (let i = 0; i < 30; i++) {
    const r = await fetch('http://127.0.0.1:54321/auth/v1/health', { headers: { apikey: chave } }).catch(() => null)
    if (r?.ok) break
    await new Promise((ok) => setTimeout(ok, 1000))
  }

  for (const u of Object.values(USUARIOS)) {
    const r = await fetch('http://127.0.0.1:54321/auth/v1/admin/users', {
      method: 'POST',
      headers: { apikey: chave, Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, password: u.senha, email_confirm: true, user_metadata: { nome: u.nome } }),
    })
    if (!r.ok) throw new Error(`Falha ao criar ${u.email}: ${await r.text()}`)
  }

  sql(`
    update perfis set papel = 'admin'  where email = '${USUARIOS.admin.email}';
    update perfis set papel = 'gestao' where email = '${USUARIOS.gestao.email}';
    insert into atribuicoes (almox_id, usuario_id, funcao)
    select a.id, p.id, f::funcao_atribuicao
      from (values ('211', '${USUARIOS.carlos.email}', 'responsavel'),
                   ('RSP', '${USUARIOS.vinicius.email}', 'responsavel'), ('RSP', '${USUARIOS.vinicius.email}', 'supervisor'),
                   ('AIM', '${USUARIOS.vinicius.email}', 'responsavel'), ('AIM', '${USUARIOS.vinicius.email}', 'supervisor'))
           as v (codigo, email, f)
      join almoxarifados a on a.codigo = v.codigo
      join perfis p on p.email = v.email;
  `)
}
