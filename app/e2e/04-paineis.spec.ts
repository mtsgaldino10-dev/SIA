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

test('painel da gestão: indicadores com mini-gráfico, gráficos e filtro de período', async ({ page }) => {
  await entrar(page, 'gestao')
  await page.goto('/painel')
  await expect(page.getByRole('link', { name: /Remessas em trânsito/ }).locator('.sparkline')).toBeVisible()
  await expect(page.getByRole('img', { name: /Remessas por dia de .*enviadas e .*recebidas/ })).toBeVisible()
  const porStatus = page.getByRole('region', { name: 'Remessas por status' })
  await expect(porStatus.getByText('Encerrada')).toBeVisible()
  await expect(porStatus.getByText('Com divergência')).toBeVisible()

  await page.getByRole('button', { name: /Período: Últimos 30 dias/ }).click()
  await page.getByRole('button', { name: 'Últimos 7 dias' }).click()
  await expect(page.getByRole('button', { name: /Período: Últimos 7 dias/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /^MNT/ })).toBeVisible()
})

test('menu mostra a fila do 211 e a trilha leva de volta à lista', async ({ page }) => {
  await entrar(page, 'carlos')
  const menu = page.getByRole('complementary')
  // O pedido de Coroaci do teste de Realtime está na fila
  await expect(menu.getByRole('link', { name: 'Pedidos', exact: true })).toHaveAccessibleDescription(/\d+ na fila/)
  await menu.getByRole('link', { name: 'Pedidos', exact: true }).click()
  await page.getByRole('link', { name: /PED-\d{6}/ }).first().click()
  const trilha = page.getByRole('navigation', { name: 'Trilha' })
  await expect(trilha).toContainText(/Pedidos\s*\/\s*PED-\d{6}/)
  await trilha.getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
})

test('busca global (Ctrl+K) abre documento pelo número e material pelo código', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.getByRole('complementary').getByRole('link', { name: 'Pedidos', exact: true }).click()
  const numero = (await page.getByRole('link', { name: /PED-\d{6}/ }).first().locator('strong').textContent())?.trim() ?? ''
  expect(numero).toMatch(/^PED-\d{6}$/)

  await page.keyboard.press('Control+K')
  const busca = page.getByRole('dialog', { name: 'Buscar documento ou material' })
  await busca.getByRole('combobox').fill(numero.toLowerCase())
  await expect(busca.getByRole('option', { name: new RegExp(numero) })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(numero)

  await page.getByRole('complementary').getByRole('button', { name: 'Buscar' }).click()
  await busca.getByRole('combobox').fill('900001')
  await busca.getByRole('option', { name: /900001/ }).click()
  await expect(page).toHaveURL(/\/saldo\?busca=900001/)
  await expect(page.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('900001')
})
