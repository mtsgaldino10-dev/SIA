import { expect, test, type Page } from '@playwright/test'
import { entrar, FOTO, sair } from './apoio'

// Estado herdado de 01 e 02. Mantena: 900001 = 24 (5 + 18 + 1), 900003 = 10.
test.describe.configure({ mode: 'serial' })

async function adicionarItem(page: Page, codigo: string, qtd: string, rotulo = 'Quantidade') {
  await page.getByRole('combobox', { name: 'Adicionar material' }).fill(codigo)
  await page.getByRole('option', { name: new RegExp(codigo) }).click()
  await page.getByLabel(`${rotulo} de ${codigo}`).fill(qtd)
}

async function saldo(page: Page, almox: string, codigo: string) {
  await page.getByRole('link', { name: 'Saldo', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Saldo', level: 1 })).toBeVisible()
  await page.getByLabel('Almoxarifado').selectOption({ label: almox })
  return page.getByRole('row', { name: new RegExp(codigo) })
}

test('supervisor cadastra as equipes das próprias bases', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Equipes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Equipes', level: 1 })).toBeVisible()
  const bases = await page.getByLabel('Base').locator('option').allTextContents()
  expect(bases).toEqual(['CRC · Coroaci', 'ITB · Itabirinha', 'MNT · Mantena'])

  await page.getByLabel('Base').selectOption({ label: 'MNT · Mantena' })
  for (const nome of ['Equipe 12', 'Equipe 15']) {
    await page.getByLabel('Nova equipe').fill(nome)
    await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
    await expect(page.getByText(`Equipe "${nome}" cadastrada em Mantena.`)).toBeVisible()
  }
  await page.getByLabel('Nova equipe').fill('equipe 12')
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
  await expect(page.getByText('Já existe uma equipe "equipe 12" em Mantena.')).toBeVisible()

  await page.getByLabel('Base').selectOption({ label: 'ITB · Itabirinha' })
  await page.getByLabel('Nova equipe').fill('Equipe 7')
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
  await expect(page.getByText('Equipe "Equipe 7" cadastrada em Itabirinha.')).toBeVisible()
})

test('saída da base: exige equipe e quem retirou, bloqueia acima do saldo e exige justificativa de perda', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Movimentar', exact: true }).click()
  await page.getByRole('link', { name: /Registrar saída/ }).last().click()
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await adicionarItem(page, '900001', '100')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe a equipe que retirou o material.')).toBeVisible()

  // Trocar de base limpa a equipe escolhida
  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 12' })
  await page.getByLabel('Almoxarifado').selectOption({ label: 'ITB · Itabirinha' })
  await expect(page.getByLabel('Equipe')).toHaveValue('')
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByLabel('Equipe')).toHaveValue('')

  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 12' })
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe o nome de quem retirou o material.')).toBeVisible()
  await page.getByLabel('Quem retirou').fill('João Silva')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/Saldo insuficiente em Mantena.*Faça um ajuste de inventário/)).toBeVisible()

  await page.getByLabel('Quantidade de 900001').fill('4')
  await page.getByLabel('Motivo').selectOption('perda')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe a justificativa da perda.')).toBeVisible()

  await page.getByLabel('Motivo').selectOption('aplicacao')
  await page.getByLabel('Observação').fill('NS 4455')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/SAI-\d{6} registrada/)).toBeVisible()
  await expect(await saldo(page, 'MNT · Mantena', '900001')).toContainText('20')
})

test('transferência só para base do mesmo supervisor, recebida com conferência', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto('/movimentar/transferencia')
  await page.getByLabel('Origem').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByLabel('Destino').locator('option')).toHaveCount(2)
  const destinos = await page.getByLabel('Destino').locator('option').allTextContents()
  expect(destinos).toEqual(['CRC · Coroaci', 'ITB · Itabirinha'])
  await page.getByLabel('Destino').selectOption({ label: 'ITB · Itabirinha' })
  await adicionarItem(page, '900001', '5')
  await page.getByRole('button', { name: 'Enviar transferência' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/REM-\d{6}/)
  await expect(page.getByText('Transferência · Mantena → Itabirinha')).toBeVisible()

  await page.getByRole('link', { name: 'Registrar recebimento' }).click()
  await page.getByLabel('Contado de 900001').fill('5')
  await page.getByLabel('Quem contou').fill('Zé de Itabirinha')
  await page.getByLabel('Foto da guia assinada ou da carga').setInputFiles(FOTO)
  await page.getByRole('button', { name: 'Registrar recebimento' }).click()
  await expect(page.locator('.badge', { hasText: 'Encerrada' }).first()).toBeVisible()
  await expect(await saldo(page, 'ITB · Itabirinha', '900001')).toContainText('5')
})

test('outro supervisor não transfere para as bases do Victor', async ({ page }) => {
  await entrar(page, 'vinicius')
  await page.goto('/movimentar/transferencia')
  await page.getByLabel('Origem').selectOption({ label: 'RSP · Resplendor' })
  // A lista de Aimorés (origem inicial) também tem uma opção: espera o texto, não a contagem.
  await expect(page.getByLabel('Destino').locator('option')).toHaveText(['AIM · Aimorés'])
})

test('devolução ao 211, conferida pelo 211', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto('/movimentar/devolucao')
  await page.getByLabel('Origem').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByText('Destino: 211 · Almoxarifado regional')).toBeVisible()
  await adicionarItem(page, '900003', '2,5')
  await page.getByRole('button', { name: 'Enviar devolução' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/REM-\d{6}/)
  const url = page.url()
  await expect(page.getByRole('link', { name: 'Registrar recebimento' })).toHaveCount(0)
  await sair(page)

  await entrar(page, 'carlos')
  await page.goto(url)
  await page.getByRole('link', { name: 'Registrar recebimento' }).click()
  await page.getByLabel('Contado de 900003').fill('2,5')
  await page.getByLabel('Quem contou').fill('Carlos')
  await page.getByLabel('Foto da guia assinada ou da carga').setInputFiles(FOTO)
  await page.getByRole('button', { name: 'Registrar recebimento' }).click()
  await expect(page.locator('.badge', { hasText: 'Encerrada' }).first()).toBeVisible()
})

test('ajuste de inventário: só a gestão ajusta, mostra a diferença e exige justificativa', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Movimentar', exact: true }).click()
  await expect(page.getByRole('link', { name: /Ajuste de inventário/ })).toHaveCount(0)
  await page.goto('/movimentar/ajuste')
  await expect(page.getByText('Ajuste de estoque é feito pela gestão do almoxarifado ou pelo administrador.')).toBeVisible()
  await sair(page)

  await entrar(page, 'carlos')
  await page.goto('/movimentar/ajuste')
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await adicionarItem(page, '900001', '14', 'Contado')
  // saldo 15 (20 − 5 transferidos), contado 14
  await expect(page.getByRole('row', { name: /900001.*15\s+14\s+−1/ })).toBeVisible()
  await page.getByRole('button', { name: 'Registrar ajuste' }).click()
  await expect(page.getByText('Informe a justificativa do ajuste.')).toBeVisible()
  await page.getByLabel('Justificativa').fill('Contagem mensal')
  await page.getByRole('button', { name: 'Registrar ajuste' }).click()
  await expect(page.getByText(/AJU-\d{6} registrado/)).toBeVisible()
  await expect(await saldo(page, 'MNT · Mantena', '900001')).toContainText('14')

  await page.getByRole('link', { name: 'Histórico' }).click()
  await expect(page.getByRole('heading', { name: 'Histórico', level: 1 })).toBeVisible()
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByRole('row', { name: /Ajuste de inventário.*900001.*−1/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Saída.*900001.*−4.*Equipe 12 · João Silva/ })).toBeVisible()
})

test('resposta perdida na rede: tentar de novo não duplica a saída', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto('/movimentar/saida')
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await adicionarItem(page, '900003', '1')
  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 15' })
  await page.getByLabel('Quem retirou').fill('Maria')
  // A primeira chamada chega ao banco, mas a resposta não volta ao navegador
  let perdida = false
  await page.route('**/rest/v1/rpc/rpc_registrar_saida', async (route) => {
    if (perdida) return route.continue()
    perdida = true
    await route.fetch()
    await route.abort('failed')
  })
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/Sem conexão/)).toBeVisible()
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/SAI-\d{6} registrada/)).toBeVisible()
  // 10 − 2,5 devolvidos − 1 = 6,5 (e não 5,5)
  await expect(await saldo(page, 'MNT · Mantena', '900003')).toContainText('6,5')
})

test('envio do pedido falha depois de salvar os itens: nova tentativa funciona', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto('/pedidos/novo')
  await page.getByLabel('Almoxarifado solicitante').selectOption({ label: 'ITB · Itabirinha' })
  await page.getByRole('button', { name: 'Criar rascunho' }).click()
  await adicionarItem(page, '900001', '3')
  let falhou = false
  await page.route('**/rest/v1/rpc/rpc_enviar_pedido', async (route) => {
    if (falhou) return route.continue()
    falhou = true
    await route.abort('failed')
  })
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.getByText(/Sem conexão/)).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  await expect(page.locator('.badge', { hasText: 'Solicitado' }).first()).toBeVisible()
  await expect(page.getByRole('row', { name: /900001.*3/ })).toBeVisible()
})
