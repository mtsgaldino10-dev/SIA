/** Erros que costumam passar sozinhos: relógio do token adiantado e rede. */
export function erroTransitorio(erro: unknown): boolean {
  const msg = (erro as { message?: string } | null)?.message ?? ''
  return /JWT issued at future|Failed to fetch|NetworkError|timeout/i.test(msg)
}

export async function comRetentativa<T>(
  fn: () => Promise<T>,
  { tentativas = 3, esperaMs = 1000 }: { tentativas?: number; esperaMs?: number } = {},
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i >= tentativas || !erroTransitorio(e)) throw e
      await new Promise((ok) => setTimeout(ok, esperaMs * i))
    }
  }
}

/**
 * fetch que repete a chamada quando o PostgREST recusa um token recém-emitido
 * ("JWT issued at future"): o relógio em cache do servidor atrasa até ~1 s.
 */
export function fetchComRetentativa(base: typeof fetch = fetch, esperaMs = 400, tentativas = 4): typeof fetch {
  return async (entrada, init) => {
    for (let i = 1; ; i++) {
      const r = await base(entrada, init)
      if (r.status !== 401 || i >= tentativas) return r
      const corpo = await r.clone().text()
      if (!/issued at future/i.test(corpo)) return r
      await new Promise((ok) => setTimeout(ok, esperaMs))
    }
  }
}
