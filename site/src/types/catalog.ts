export interface CatalogProduct {
  id: string
  sku: string
  name: string
  category: 'carro' | 'moto' | 'motor'
  brand_model: string | null
  manufacturer: string | null
  collection_tag: string | null
  scale: string
  piece_count: number | null
  sale_price_brl: number
  image_url: string | null
  image_urls: string[]
  video_url: string | null
  automotive_history: string | null
  dimensions: string | null
  spec_highlights: string[] | null
  length_cm: number | null
  height_cm: number | null
  width_cm: number | null
  quantity_available: number
  motor_product_id?: string | null
  motor_name?: string | null
  motor_price_brl?: number | null
  motor_quantity_available?: number | null
}

export type PaymentMethod = 'pix' | 'cartao'

export interface CheckoutAddress {
  zipCode: string
  streetName: string
  streetNumber: string
  complement?: string
  neighborhood: string
  city: string
  federalUnit: string
}

export interface CheckoutItem {
  productId: string
  quantity: number
  withMotor?: boolean
}

export interface ShippingOption {
  id: number
  service: string
  company: string
  price: number
  deliveryDays: string
}

export interface CheckoutCard {
  number: string
  holderName: string
  expirationMonth: number
  expirationYear: number
  securityCode: string
}

// dados do navegador do cliente, usados pelo 3DS 2.0 "frictionless" —
// o banco emissor usa isso pra avaliar o risco da transação em segundo
// plano, sem pedir nenhuma confirmação extra ao cliente
export interface CheckoutDevice {
  colorDepth: number
  javaEnabled: boolean
  language: string
  screenHeight: number
  screenWidth: number
  timeZoneOffset: number
  userAgent: string
}

export interface CheckoutInput {
  items: CheckoutItem[]
  customerName: string
  customerEmail: string
  customerCpf: string
  customerPhone: string
  paymentMethod: PaymentMethod
  // só para cartão — a Rede não tem tokenização no navegador como o
  // Mercado Pago tinha, então os dados crus vão direto pra Edge Function
  card?: CheckoutCard
  device?: CheckoutDevice
  installments?: number
  address: CheckoutAddress
  couponCode?: string
  shipping: ShippingOption
  turnstileToken?: string | null
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  content: string
  author: string
  published_at: string | null
}
