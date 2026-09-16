// Carrega o Meta Pixel sob demanda (só se VITE_META_PIXEL_ID estiver
// configurada) — sem a env var, todo track vira no-op, então o app
// funciona normalmente sem o pixel enquanto a conta de anúncios não existe.
type FbqFn = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: FbqFn
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
  }
}

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

export const isMetaPixelConfigured = Boolean(PIXEL_ID)

let initialized = false

export function ensureMetaPixelInit() {
  if (!isMetaPixelConfigured || initialized) return
  initialized = true

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue.push(args)
    } as FbqFn
    fbq.queue = []
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    window.fbq = fbq
    window._fbq = fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window.fbq('init', PIXEL_ID)
}

export function trackPageView() {
  if (!isMetaPixelConfigured) return
  ensureMetaPixelInit()
  window.fbq?.('track', 'PageView')
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isMetaPixelConfigured) return
  ensureMetaPixelInit()
  window.fbq?.('track', name, params)
}
