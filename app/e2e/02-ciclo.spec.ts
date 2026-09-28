import { expect, test, type Page } from '@playwright/test'
import { entrar, FOTO, sair } from './apoio'

// Depende do estado deixado por 01-cadastros (materiais 900001-3, saldos e atribuições).
test.describe.configure({ mode: 'serial' })

let pedidoUrl = ''
let remessaUrl = ''

async function escolherMaterial(page: Page, codigo: string) {
  await page.getByRole('combobox', { name: 'Adicionar material' }).fill(codigo)
  await page.getByRole('option', { name: new RegExp(codigo) }).click()
}

async function adicionarItem(page: Page, codigo: string, qtd: string) {
  await escolherMaterial(page, codigo)
  await page.getByLabel(`Quantidade de ${codigo}`).fill(qtd)
}

test('base cria e envia pedido', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Pedidos', exact: true }).first().click()
  await page.getByRole('link', { name: 'Novo pedido' }).click()
  await page.getByLabel('Almoxarifado solicitante').selectOption({ label: 'MNT · Mantena' })
  await page.getByRole('button', { name: 'Criar rascunho' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/PED-\d{6}/)
  pedidoUrl = page.url()

  await adicionarItem(page, '900001', '20')
  await adicionarItem(page, '900002', '5')
  await adicionarItem(page, '900003', '10')
  await page.getByRole('button', { name: 'Salvar itens' }).click()
  await expect(page.getByText('Itens salvos.')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.locator('.badge', { hasText: 'Solicitado' }).first()).toBeVisible()
})

test('211 aprova com corte e envia a remessa', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.goto(pedidoUrl)
  await page.getByLabel('Aprovada de 900002').fill('3')
  await page.getByRole('button', { name: 'Aprovar pedido' }).click()
  await expect(page.getByText(/Informe o motivo do corte/)).toBeVisible()
  await page.getByLabel('Motivo do corte de 900002').fill('Estoque baixo no 211')
  await page.getByRole('button', { name: 'Aprovar pedido' }).click()
  await expect(page.locator('.badge', { hasText: 'Aprovado' }).first()).toBeVisible()

  await expect(page.getByLabel('Enviada de 900002')).toHaveValue('3')
  await page.getByLabel('Documento / guia').fill('GUIA 77')
  await page.getByRole('button', { name: 'Registrar envio' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/REM-\d{6}/)
  remessaUrl = page.url()
  await expect(page.locator('.badge', { hasText: 'Em trânsito' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Imprimir guia' }).click()
  await expect(page.getByRole('heading', { name: /Guia de remessa REM-\d{6}/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /900003.*CABO MULTIPLEX 16MM.*M.*10/ })).toBeVisible()
  await expect(page.getByText('Conferido por (nome e assinatura)')).toBeVisible()
})

test('base registra o recebimento com falta, foto e quem contou', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Remessas', exact: true }).first().click()
  await page.getByRole('link', { name: /REM-\d{6}/ }).first().click()
  await page.getByRole('link', { name: 'Registrar recebimento' }).click()

  await page.getByLabel('Contado de 900001').fill('18')
  await page.getByLabel('Contado de 900002').fill('3')
  await page.getByLabel('Contado de 900003').fill('10')
  await page.getByLabel('Motivo da diferença de 900001').selectOption('falta')
  await page.getByLabel('Quem contou').fill('João da Silva')
  await page.getByRole('button', { name: 'Registrar recebimento' }).click()
  await expect(page.getByText('Anexe a foto da guia assinada ou da carga.')).toBeVisible()

  await page.getByLabel('Foto da guia assinada ou da carga').setInputFiles(FOTO)
  await page.getByRole('button', { name: 'Registrar recebimento' }).click()
  await expect(page.locator('.badge', { hasText: 'Com divergência' }).first()).toBeVisible()
  await expect(page.getByText('João da Silva')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver foto' })).toBeVisible()
})

test('aceite: resumo separa corte e falta, e os saldos batem', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto(pedidoUrl)
  // colunas: código · solicitada · aprovada · enviada · recebida · dif. atendimento · dif. conferência
  await expect(page.getByRole('row', { name: /900001.*20\s+20\s+20\s+18\s+0\s+2/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /900002.*5\s+3\s+3\s+3\s+2\s+0/ })).toBeVisible()

  await page.getByRole('link', { name: 'Saldo', exact: true }).first().click()
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByRole('row', { name: /900001.*23/ })).toBeVisible() // 5 iniciais + 18

  await sair(page)
  await entrar(page, 'carlos')
  await page.getByRole('link', { name: 'Saldo', exact: true }).first().click()
  await page.getByLabel('Almoxarifado').selectOption({ label: '211 · Almoxarifado regional' })
  await expect(page.getByRole('row', { name: /900001.*30/ })).toBeVisible() // 50 − 20
  await expect(page.getByRole('row', { name: /900002.*7/ })).toBeVisible() // 10 − 3
})

test('divergência: origem dá baixa de 1 e destino registra que 1 chegou depois', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.getByRole('link', { name: 'Divergências', exact: true }).click()
  const linha = page.getByRole('row', { name: /900001/ })
  await expect(linha).toContainText('Falta')
  await linha.getByRole('button', { name: 'Tratar' }).click()
  await page.getByLabel('Tratamento').selectOption('baixa_transito')
  await page.getByLabel('Quantidade', { exact: true }).fill('1')
  await page.getByLabel('Justificativa').fill('Extraviado no caminhão')
  await page.getByRole('button', { name: 'Registrar tratamento' }).click()
  await expect(page.getByText('Tratamento registrado.')).toBeVisible()

  await sair(page)
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Divergências', exact: true }).click()
  await page.getByRole('row', { name: /900001/ }).getByRole('button', { name: 'Tratar' }).click()
  const opcoes = await page.getByLabel('Tratamento').locator('option').allTextContents()
  expect(opcoes).toEqual(['Chegou depois'])
  await page.getByLabel('Quantidade', { exact: true }).fill('1')
  await page.getByLabel('Justificativa').fill('Achado na caixa do cabo')
  await page.getByRole('button', { name: 'Registrar tratamento' }).click()
  await expect(page.getByText('Nenhuma divergência em aberto.')).toBeVisible()

  await page.goto(remessaUrl)
  await expect(page.locator('.badge', { hasText: 'Encerrada' }).first()).toBeVisible()
  await expect(page.getByRole('row', { name: /Baixa em trânsito.*Extraviado no caminhão/ })).toBeVisible()
})

test('211 registra pedido externo ao 3256 e o recebimento com documento SAP', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.getByRole('link', { name: 'Entradas do 3256' }).click()
  await page.getByRole('button', { name: 'Novo pedido ao 3256' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/PED-\d{6}/)
  await adicionarItem(page, '900002', '20')
  await page.getByRole('button', { name: 'Salvar itens' }).click()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.locator('.badge', { hasText: 'Solicitado' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Registrar recebimento do 3256' }).click()
  await page.getByLabel('Documento SAP').fill('4900012345')
  await page.getByLabel('No documento de 900002').fill('20')
  await page.getByLabel('Contado de 900002').fill('20')
  await page.getByLabel('Quem contou').fill('Carlos')
  await page.getByLabel('Foto da guia assinada ou da carga').setInputFiles(FOTO)
  await page.getByRole('button', { name: 'Registrar entrada' }).click()
  await expect(page.locator('.badge', { hasText: 'Encerrada' }).first()).toBeVisible()
  await expect(page.getByText('4900012345')).toBeVisible()
})

test('211 registra entrada avulsa com sobra e trata como externo', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.getByRole('link', { name: 'Entradas do 3256' }).click()
  await page.getByRole('link', { name: 'Entrada avulsa' }).click()
  await page.getByLabel('Documento SAP').fill('4900099999')
  await escolherMaterial(page, '900003')
  await page.getByLabel('No documento de 900003').fill('50')
  await page.getByLabel('Contado de 900003').fill('52,5')
  await page.getByLabel('Motivo da diferença de 900003').selectOption('sobra')
  await page.getByLabel('Quem contou').fill('Carlos')
  await page.getByLabel('Foto da guia assinada ou da carga').setInputFiles(FOTO)
  await page.getByRole('button', { name: 'Registrar entrada' }).click()
  await expect(page.locator('.badge', { hasText: 'Com divergência' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Divergências', exact: true }).click()
  await page.getByRole('row', { name: /900003/ }).getByRole('button', { name: 'Tratar' }).click()
  await page.getByLabel('Tratamento').selectOption('externo')
  await page.getByLabel('Quantidade', { exact: true }).fill('2,5')
  await page.getByLabel('Justificativa').fill('Chamado aberto no SAP')
  await page.getByRole('button', { name: 'Registrar tratamento' }).click()
  await expect(page.getByText('Nenhuma divergência em aberto.')).toBeVisible()
})
