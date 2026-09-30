import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MenuGrupo } from './MenuGrupo'

afterEach(cleanup)

function renderizar() {
  render(
    <MenuGrupo titulo="Cadastros">
      <a href="/admin/unidades">Unidades</a>
    </MenuGrupo>,
  )
  return screen.getByRole('button', { name: 'Cadastros' })
}

describe('MenuGrupo', () => {
  it('começa aberto', () => {
    const titulo = renderizar()
    expect(titulo.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByRole('link', { name: 'Unidades' })).not.toBeNull()
  })

  it('o título recolhe e reabre os itens', () => {
    const titulo = renderizar()
    fireEvent.click(titulo)
    expect(titulo.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: 'Unidades' })).toBeNull()
    fireEvent.click(titulo)
    expect(titulo.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByRole('link', { name: 'Unidades' })).not.toBeNull()
  })

  it('o título aponta para a lista que controla', () => {
    const titulo = renderizar()
    const lista = document.getElementById(titulo.getAttribute('aria-controls') ?? '')
    expect(lista?.contains(screen.getByRole('link', { name: 'Unidades' }))).toBe(true)
  })
})
