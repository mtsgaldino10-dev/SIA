type ErroLike = { code?: string; message?: string } | Error | null | undefined

/**
 * Mensagem para o usuário. As RPCs já devolvem texto pronto em português;
 * erros genéricos do Postgres/PostgREST são traduzidos.
 */
export function mensagemErro(erro: unknown): string {
  const e = erro as ErroLike
  const msg = e?.message ?? ''
  const code = e && 'code' in e ? e.code : undefined

  if (erro instanceof TypeError && /fetch/i.test(msg)) {
    return 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
  }
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/row-level security|permission denied/i.test(msg)) return 'Você não tem permissão para esta ação.'
  if (code === '23505') return 'Registro repetido. Este item já existe.'
  if (code === '23503') return 'Referência inválida: um dos itens não existe mais.'
  if (msg) return msg
  return 'Algo deu errado. Tente de novo.'
}
