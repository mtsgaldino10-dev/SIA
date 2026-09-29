/** Domínio completado quando a pessoa digita só o usuário (ex.: matheus.galdino). */
export const DOMINIO_LOGIN = 'engelmig.com.br'

/** O Supabase autentica por e-mail; o usuário sem "@" ganha o domínio da empresa. */
export function emailDoUsuario(usuario: string): string {
  const u = usuario.trim().toLowerCase()
  return u.includes('@') ? u : `${u}@${DOMINIO_LOGIN}`
}
