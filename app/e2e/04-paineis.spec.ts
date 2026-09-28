import { expect, test } from '@playwright/test'
import { entrar, USUARIOS } from './apoio'

// Estado herdado de 01–03.
test.describe.configure({ mode: 'serial' })

test('início da base: minhas bases, a caminho, pedidos e divergências', async ({ page }) => {
  await entrar(page, 'victor')
  await expect(page.getByRole('heading', { name: 'Minhas bases' })).toBeVisible()
  const mantena = page.getByRole('region', { name: 'Mantena' })
  await expect(mantena.getByText('Remessas a caminho')).toBeVisible()
  await expect(mantena.getByText('Pedidos abertos')).toBeVisible()
  await expect(mantena.getByText('Divergências pendentes')).toBeVisible()
  await expect(mantena.getByText('Materiais com saldo')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Coroaci' })).toBeVisible()
})

test('painel do 211 atualiza sozinho quando uma base envia pedido (Realtime)', async ({ page, browser }) => {
  await entrar(page, 'carlos')
  await expect(page.getByRole('heading', { name: 'Painel do 211' })).toBeVisible()
  const fila = page.getByRole('link', { name: /Pedidos na fila/ })
  await expect(fila.locator('.valor')).toHaveText(/^\d+$/)
  const antes = Number((await fila.locator('.valor').textContent())?.trim())

  // Outra sessão: Victor envia um pedido de Coroaci
  const outro = await browser.newContext()
  const p2 = await outro.newPage()
  await entrar(p2, 'victor')
  await p2.goto('/pedidos/novo')
  await p2.getByLabel('Almoxarifado solicitante').selectOption({ label: 'CRC · Coroaci' })
  await p2.getByRole('button', { name: 'Criar rascunho' }).click()
  await p2.getByRole('combobox', { name: 'Adicionar material' }).fill('900002')
  await p2.getByRole('option', { name: /900002/ }).click()
  await p2.getByLabel('Quantidade de 900002').fill('2')
  await p2.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(p2.locator('.badge', { hasText: 'Solicitado' }).first()).toBeVisible()
  await outro.close()

  // Sem recarregar a página
  await expect(fila.locator('.valor')).toHaveText(String(antes + 1), { timeout: 15_000 })
  await expect(page.getByRole('link', { name: /PED-\d{6}.*Coroaci/ })).toBeVisible()
})

test('painel da gestão: indicadores por base e ajustes em destaque', async ({ page }) => {
  await entrar(page, 'gestao')
  await page.getByRole('complementary').getByRole('link', { name: 'Painel da gestão' }).click()
  await expect(page.getByRole('heading', { name: 'Painel da gestão', level: 1 })).toBeVisible()
  // Mantena: solicitado 20+5+10 = 35, enviado 20+3+10 = 33 → 94,3%
  const mantena = page.getByRole('row', { name: /^MNT/ })
  await expect(mantena).toContainText('94,3%')
  await expect(mantena).toContainText('100%') // 1 recebida com divergência de 1 recebida
  await expect(page.getByRole('region', { name: 'Ajustes de inventário' }).getByText('Contagem mensal')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Consumo' }).getByRole('row', { name: /Mantena.*900001/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Remessas paradas' })).toBeVisible()

  // Todas as remessas do cenário já foram recebidas
  await expect(page.getByRole('region', { name: 'Remessas paradas' }).getByText('Nenhuma remessa parada.')).toBeVisible()
})

test('supervisor não acessa o painel da gestão', async ({ page }) => {
  await entrar(page, 'victor')
  await expect(page.getByRole('complementary').getByRole('link', { name: 'Painel da gestão' })).toHaveCount(0)
  await page.goto('/painel')
  await expect(page.getByText('Painel restrito à gestão.')).toBeVisible()
  expect(USUARIOS.victor.email).toBeTruthy()
})
