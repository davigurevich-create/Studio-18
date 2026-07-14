import { initMercadoPago } from '@mercadopago/sdk-react'

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined

export const isMercadoPagoConfigured = Boolean(publicKey)

let initialized = false

export function ensureMercadoPagoInit() {
  if (!isMercadoPagoConfigured || initialized) return
  initMercadoPago(publicKey!, { locale: 'pt-BR' })
  initialized = true
}
