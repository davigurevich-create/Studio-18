import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      execute: (widgetId: string) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
export const isTurnstileConfigured = Boolean(SITE_KEY)

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar o Turnstile.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Widget invisível do Cloudflare Turnstile, em modo "execute" — renderiza uma
 * vez e gera um token novo a cada chamada de getToken(), sem exigir nenhuma
 * interação do visitante na imensa maioria dos casos. Protege o checkout e o
 * chat de automação em massa (bots), sem CAPTCHA visível pro cliente real.
 *
 * O container é um "ref callback" (não um useRef comum) de propósito: em
 * páginas como o Checkout, a div que hospeda o widget pode não existir ainda
 * no primeiro render (ex: carrinho carregando) — com um useRef comum, o
 * efeito de inicialização rodaria uma única vez, veria o container nulo e
 * nunca mais tentaria de novo. Usando estado pro nó do DOM, o efeito
 * reexecuta automaticamente assim que a div passa a existir de verdade.
 */
export function useTurnstile() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => setContainer(node), [])
  const widgetIdRef = useRef<string | null>(null)
  const pendingRef = useRef<((token: string | null) => void) | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isTurnstileConfigured || !container) return
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled) return
        if (!window.turnstile) {
          console.error('Turnstile: script carregado mas window.turnstile ausente.')
          return
        }
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          execution: 'execute',
          appearance: 'interaction-only',
          callback: (token: string) => {
            pendingRef.current?.(token)
            pendingRef.current = null
          },
          'error-callback': () => {
            pendingRef.current?.(null)
            pendingRef.current = null
          },
        })
        setReady(true)
      })
      .catch((err) => {
        console.error('Turnstile: falha ao carregar/renderizar o widget:', err)
        setReady(false)
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
      setReady(false)
    }
  }, [container])

  /** Resolve com o token do desafio, ou null se o Turnstile não estiver configurado/pronto. */
  const getToken = (): Promise<string | null> => {
    if (!isTurnstileConfigured || !ready || !widgetIdRef.current || !window.turnstile) {
      return Promise.resolve(null)
    }
    const widgetId = widgetIdRef.current
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        pendingRef.current = null
        resolve(null)
      }, 15000)
      pendingRef.current = (token) => {
        window.clearTimeout(timeout)
        resolve(token)
      }
      window.turnstile!.reset(widgetId)
      window.turnstile!.execute(widgetId)
    })
  }

  return { containerRef, getToken, ready }
}
