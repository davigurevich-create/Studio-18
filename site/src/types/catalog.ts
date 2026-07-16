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
  automotive_history: string | null
  dimensions: string | null
  quantity_available: number
}

export type PaymentMethod = 'pix' | 'cartao' | 'boleto'

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
}

export interface CheckoutInput {
  items: CheckoutItem[]
  customerName: string
  customerEmail: string
  customerCpf: string
  paymentMethod: PaymentMethod
  cardToken?: string
  cardPaymentMethodId?: string
  installments?: number
  address: CheckoutAddress
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
