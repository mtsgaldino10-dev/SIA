import { describe, expect, it } from 'vitest'
import { comRetentativa, erroTransitorio, fetchComRetentativa } from './retentativa'

describe('comRetentativa', () => {
  it('repete enquanto o erro for transitório e devolve o resultado', async () => {
    let n = 0
    const r = await comRetentativa(
      async () => {
        n++
        if (n < 3) throw { message: 'JWT issued at future' }
        return 'ok'
      },
      { tentativas: 3, esperaMs: 1 },
    )
    expect(r).toBe('ok')
    expect(n).toBe(3)
  })
  it('não repete erro definitivo', async () => {
    let n = 0
    await expect(
      comRetentativa(
        async () => {
          n++
          throw { message: 'permission denied for table perfis' }
        },
        { tentativas: 3, esperaMs: 1 },
      ),
    ).rejects.toMatchObject({ message: 'permission denied for table perfis' })
    expect(n).toBe(1)
  })
  it('desiste após o limite e lança o último erro', async () => {
    let n = 0
    await expect(
      comRetentativa(
        async () => {
          n++
          throw new TypeError('Failed to fetch')
        },
        { tentativas: 2, esperaMs: 1 },
      ),
    ).rejects.toThrow('Failed to fetch')
    expect(n).toBe(2)
  })
})

describe('erroTransitorio', () => {
  it('reconhece relógio adiantado e falha de rede', () => {
    expect(erroTransitorio({ message: 'JWT issued at future' })).toBe(true)
    expect(erroTransitorio(new TypeError('Failed to fetch'))).toBe(true)
    expect(erroTransitorio({ message: 'Saldo insuficiente' })).toBe(false)
  })
})

describe('fetchComRetentativa', () => {
  const resposta = (status: number, corpo: object) =>
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

  it('repete a chamada quando o token ainda é "do futuro" para o servidor', async () => {
    let n = 0
    const base = async () => (++n < 3 ? resposta(401, { code: 'PGRST303', message: 'JWT issued at future' }) : resposta(200, { ok: true }))
    const r = await fetchComRetentativa(base, 1)('http://x')
    expect(r.status).toBe(200)
    expect(n).toBe(3)
  })
  it('não repete outros 401', async () => {
    let n = 0
    const base = async () => {
      n++
      return resposta(401, { message: 'JWT expired' })
    }
    const r = await fetchComRetentativa(base, 1)('http://x')
    expect(r.status).toBe(401)
    expect(await r.json()).toEqual({ message: 'JWT expired' })
    expect(n).toBe(1)
  })
})
