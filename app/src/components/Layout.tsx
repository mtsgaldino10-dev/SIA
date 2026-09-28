import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSessao } from '../auth/SessaoContext'
import { rotuloStatus } from '../lib/formato'
import { Marca } from './ui'

type ItemMenu = { para: string; rotulo: string; grupo: string; curto?: string; principal?: boolean }

/** Itens de navegação conforme papel e atribuições. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMenu(): ItemMenu[] {
  const { ehAdmin, veTudo, almoxResponsavel, almoxVisiveis } = useSessao()
  const opera = almoxResponsavel.length > 0
  const operaBase = almoxResponsavel.some((a) => a.tipo === 'base')
  const operaRegional = almoxResponsavel.some((a) => a.tipo === 'regional')
  const ve = veTudo || almoxVisiveis.length > 0

  const itens: ItemMenu[] = [{ para: '/', rotulo: 'Início', grupo: 'Operação', principal: true }]
  if (ve) {
    itens.push({ para: '/saldo', rotulo: 'Saldo', grupo: 'Operação', principal: true })
    itens.push({ para: '/pedidos', rotulo: 'Pedidos', grupo: 'Operação', principal: true })
    itens.push({ para: '/remessas', rotulo: 'Remessas', grupo: 'Operação', principal: true })
    itens.push({ para: '/divergencias', rotulo: 'Divergências', grupo: 'Operação' })
  }
  if (opera) itens.push({ para: '/movimentar', rotulo: 'Movimentar', grupo: 'Operação' })
  if (operaRegional) itens.push({ para: '/entradas', rotulo: 'Entradas do 3256', grupo: 'Operação' })
  if (operaBase && !operaRegional) itens.push({ para: '/movimentar/saida', rotulo: 'Registrar saída', grupo: 'Operação' })
  if (ve) itens.push({ para: '/historico', rotulo: 'Histórico', grupo: 'Operação' })
  if (veTudo) itens.push({ para: '/painel', rotulo: 'Painel da gestão', grupo: 'Gestão' })
  if (ehAdmin) {
    itens.push({ para: '/admin/almoxarifados', rotulo: 'Almoxarifados', grupo: 'Cadastros' })
    itens.push({ para: '/admin/usuarios', rotulo: 'Usuários e atribuições', grupo: 'Cadastros' })
    itens.push({ para: '/admin/materiais', rotulo: 'Materiais', grupo: 'Cadastros' })
    itens.push({ para: '/admin/unidades', rotulo: 'Unidades', grupo: 'Cadastros' })
    itens.push({ para: '/admin/saldo-inicial', rotulo: 'Saldo inicial', grupo: 'Cadastros' })
  }
  return itens
}

export function Layout() {
  const { perfil, sair } = useSessao()
  const itens = useMenu()
  const [maisAberto, setMaisAberto] = useState(false)
  const local = useLocation()
  const grupos = [...new Set(itens.map((i) => i.grupo))]
  const principais = itens.filter((i) => i.principal).slice(0, 4)
  const outros = itens.filter((i) => !principais.includes(i))

  return (
    <div className="app">
      <aside className="menu-lateral">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none', padding: '0 10px' }}>
          <Marca />
        </Link>
        <nav aria-label="Menu principal">
          {grupos.map((g) => (
            <div key={g} style={{ display: 'contents' }}>
              <div className="menu-grupo">{g}</div>
              {itens
                .filter((i) => i.grupo === g)
                .map((i) => (
                  <NavLink key={i.para} to={i.para} end={i.para === '/' || i.para === '/movimentar'}>
                    {i.rotulo}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="menu-rodape">
          <div style={{ color: 'var(--cor-fundo)', fontWeight: 500 }}>{perfil?.nome}</div>
          <div>{rotuloStatus(perfil?.papel)}</div>
          <button type="button" onClick={() => void sair()}>
            Sair
          </button>
          <div style={{ marginTop: 12 }}>Sistema Integrado de Almoxarifado</div>
        </div>
      </aside>

      <header className="cabecalho-movel">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Marca />
        </Link>
        <span className="peq" style={{ opacity: 0.8 }}>
          {perfil?.nome}
        </span>
      </header>

      <main className="conteudo" key={local.pathname}>
        <Outlet />
      </main>

      <nav className="barra-inferior" aria-label="Menu rápido">
        {principais.map((i) => (
          <NavLink key={i.para} to={i.para} end={i.para === '/'}>
            {i.rotulo}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMaisAberto(true)} aria-haspopup="dialog">
          Mais
        </button>
      </nav>

      {maisAberto && (
        <>
          <div className="folha-fundo" onClick={() => setMaisAberto(false)} />
          <div className="folha" role="dialog" aria-label="Mais opções" onClick={() => setMaisAberto(false)}>
            {outros.map((i) => (
              <Link key={i.para} to={i.para}>
                {i.rotulo}
              </Link>
            ))}
            <button type="button" className="botao secundario" style={{ width: '100%', marginTop: 16 }} onClick={() => void sair()}>
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}
