export type ProductCategory = 'carro' | 'moto' | 'motor'

export interface Product {
  id: string
  sku: string
  name: string
  category: ProductCategory
  brand_model: string | null
  scale: string
  piece_count: number | null
  cost_price_brl: number
  sale_price_brl: number
  min_stock_alert: number
  image_url: string | null
  image_urls?: string[]
  manufacturer?: string | null
  collection_tag?: string | null
  automotive_history?: string | null
  dimensions?: string | null
  spec_highlights?: string[] | null
  length_cm?: number | null
  height_cm?: number | null
  width_cm?: number | null
  active: boolean
  created_at: string
}

export type ContainerStatus = 'em_transito' | 'chegou' | 'liberado'

export interface Container {
  id: string
  code: string
  origin: string
  status: ContainerStatus
  eta_date: string | null
  arrival_date: string | null
  freight_cost_brl: number
  customs_cost_brl: number
  notes: string | null
  created_at: string
}

export type MovementType = 'entrada' | 'saida' | 'ajuste'

export interface InventoryMovement {
  id: string
  product_id: string
  type: MovementType
  quantity: number
  unit_cost_brl: number | null
  container_id: string | null
  sale_id: string | null
  notes: string | null
  moved_at: string
  created_at: string
}

export type SalesChannel = 'site' | 'whatsapp' | 'instagram' | 'feira' | 'outro'
export type SaleStatus = 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado'
export type PaymentMethod = 'pix' | 'cartao' | 'boleto' | 'dinheiro' | 'outro'

export interface Sale {
  id: string
  sale_date: string
  channel: SalesChannel
  customer_name: string | null
  customer_contact: string | null
  payment_method: PaymentMethod | null
  status: SaleStatus
  shipping_cost_brl: number
  discount_brl: number
  notes: string | null
  created_at: string
  payment_provider?: string | null
  provider_payment_id?: string | null
  provider_status?: string | null
  shipping_zip_code?: string | null
  shipping_street_name?: string | null
  shipping_street_number?: string | null
  shipping_neighborhood?: string | null
  shipping_city?: string | null
  shipping_federal_unit?: string | null
  shipping_complement?: string | null
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price_brl: number
  unit_cost_brl: number
}

export type ExpenseCategory =
  | 'importacao'
  | 'marketing'
  | 'operacional'
  | 'frete'
  | 'taxas'
  | 'outros'

export interface Expense {
  id: string
  expense_date: string
  category: ExpenseCategory
  description: string
  amount_brl: number
  container_id: string | null
  created_at: string
}

export interface ProductStock {
  product_id: string
  sku: string
  name: string
  category: ProductCategory
  manufacturer: string | null
  min_stock_alert: number
  cost_price_brl: number
  sale_price_brl: number
  length_cm: number | null
  height_cm: number | null
  width_cm: number | null
  quantity_in_stock: number
  piece_count: number | null
}

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product?: Product })[]
}

export type ReplacementType = 'impressao_3d' | 'original_fabricante'
export type PartRequestStatus = 'pendente' | 'em_producao' | 'enviado' | 'concluido'

export interface PartRequest {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  order_reference: string
  product_model: string
  part_description: string
  replacement_type: ReplacementType
  status: PartRequestStatus
  admin_notes: string | null
  photo_url: string | null
}

export type AuditAction = 'criar' | 'editar' | 'excluir'

export interface AuditLogEntry {
  id: string
  created_at: string
  actor_email: string
  action: AuditAction
  entity: string
  entity_id: string | null
  summary: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  content: string
  author: string
  published: boolean
  published_at: string | null
  ai_generated: boolean
  created_at: string
  updated_at: string
}
