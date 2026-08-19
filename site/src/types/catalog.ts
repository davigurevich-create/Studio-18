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

export interface ShippingOption {
  service: string
  company: string
  price: number
  deliveryDays: string
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
  couponCode?: string
  shipping: ShippingOption
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
