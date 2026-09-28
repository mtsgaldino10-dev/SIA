import { useSessao } from '../auth/SessaoContext'
import { PaginaTopo } from '../components/ui'

export function Inicio() {
  const { perfil } = useSessao()
  return <PaginaTopo titulo={`Olá, ${perfil?.nome ?? ''}`} sub="Sistema Integrado de Almoxarifado" />
}
