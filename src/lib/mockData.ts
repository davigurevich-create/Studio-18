import type {
  BlogPost,
  Container,
  Expense,
  InventoryMovement,
  PartRequest,
  Product,
  Sale,
  SaleItem,
} from '@/types/domain'

const now = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export const seedProducts: Product[] = []

export const seedContainers: Container[] = [
  {
    id: 'c1',
    code: 'CONT-2026-01',
    origin: 'China',
    status: 'em_transito',
    eta_date: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    arrival_date: null,
    freight_cost_brl: 18000,
    customs_cost_brl: 6500,
    notes: 'Primeiro container - abertura da Studio 18',
    created_at: now,
  },
]

export const seedMovements: InventoryMovement[] = []

export const seedSales: Sale[] = []

export const seedSaleItems: SaleItem[] = []

export const seedBlogPosts: BlogPost[] = []

export const seedPartRequests: PartRequest[] = []

export const seedExpenses: Expense[] = [
  { id: 'e1', expense_date: daysAgo(15), category: 'importacao', description: 'Compra do primeiro lote (fornecedor China)', amount_brl: 48000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e2', expense_date: daysAgo(15), category: 'frete', description: 'Frete maritimo container CONT-2026-01', amount_brl: 18000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e3', expense_date: daysAgo(7), category: 'marketing', description: 'Criacao de site (Lovable) + trafego pago inicial', amount_brl: 3200, container_id: null, created_at: daysAgo(7) },
  { id: 'e4', expense_date: daysAgo(3), category: 'operacional', description: 'Embalagens e etiquetas', amount_brl: 850, container_id: null, created_at: daysAgo(3) },
]
