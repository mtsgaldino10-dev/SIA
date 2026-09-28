import { expect, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

export const USUARIOS = {
  admin: { email: 'admin@sia.test', senha: 'Senha123!', nome: 'Ana Admin' },
  gestao: { email: 'gestao@sia.test', senha: 'Senha123!', nome: 'Gil Gestão' },
  carlos: { email: 'carlos@sia.test', senha: 'Senha123!', nome: 'Carlos 211' },
  victor: { email: 'victor@sia.test', senha: 'Senha123!', nome: 'Victor' },
  vinicius: { email: 'vinicius@sia.test', senha: 'Senha123!', nome: 'Vinícius' },
} as const

export type Quem = keyof typeof USUARIOS

export const FOTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'guia.jpg')

export async function entrar(page: Page, quem: Quem) {
  const u = USUARIOS[quem]
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(u.email)
  await page.getByLabel('Senha').fill(u.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Olá, ${u.nome.split(' ')[0]}`)
}

export async function sair(page: Page) {
  await page.getByRole('complementary').getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)
}

/** Gera um XLSX em memória e devolve no formato aceito por setInputFiles. */
export function xlsx(nome: string, linhas: unknown[][]) {
  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), 'Planilha')
  const buffer = XLSX.write(livro, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return { name: nome, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer }
}
