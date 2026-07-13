import type {
  Container,
  Expense,
  InventoryMovement,
  Product,
  Sale,
  SaleItem,
} from '@/types/domain'

const now = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export const seedProducts: Product[] = [
  {
    id: 'p1',
    sku: 'S18-CAR-001',
    name: 'Ferrari F40 Premium Kit',
    category: 'carro',
    brand_model: 'Ferrari F40',
    scale: '1:8',
    piece_count: 850,
    cost_price_brl: 420,
    sale_price_brl: 899.9,
    min_stock_alert: 5,
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: 'p2',
    sku: 'S18-CAR-002',
    name: 'Porsche 911 GT3 Kit',
    category: 'carro',
    brand_model: 'Porsche 911 GT3',
    scale: '1:8',
    piece_count: 780,
    cost_price_brl: 390,
    sale_price_brl: 849.9,
    min_stock_alert: 5,
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: 'p3',
    sku: 'S18-MOTO-001',
    name: 'Harley-Davidson Fat Boy Kit',
    category: 'moto',
    brand_model: 'Harley-Davidson Fat Boy',
    scale: '1:8',
    piece_count: 620,
    cost_price_brl: 310,
    sale_price_brl: 699.9,
    min_stock_alert: 5,
    image_url: null,
    active: true,
    created_at: now,
  },
  {
    id: 'p4',
    sku: 'S18-MOT-001',
    name: 'V8 Engine Block Kit',
    category: 'motor',
    brand_model: 'V8 Small Block',
    scale: '1:8',
    piece_count: 450,
    cost_price_brl: 260,
    sale_price_brl: 599.9,
    min_stock_alert: 5,
    image_url: null,
    active: true,
    created_at: now,
  },
]

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

export const seedMovements: InventoryMovement[] = [
  { id: 'm1', product_id: 'p1', type: 'entrada', quantity: 20, unit_cost_brl: 420, container_id: null, sale_id: null, notes: 'Estoque inicial (amostras)', moved_at: daysAgo(10), created_at: daysAgo(10) },
  { id: 'm2', product_id: 'p2', type: 'entrada', quantity: 15, unit_cost_brl: 390, container_id: null, sale_id: null, notes: 'Estoque inicial (amostras)', moved_at: daysAgo(10), created_at: daysAgo(10) },
  { id: 'm3', product_id: 'p3', type: 'entrada', quantity: 12, unit_cost_brl: 310, container_id: null, sale_id: null, notes: 'Estoque inicial (amostras)', moved_at: daysAgo(10), created_at: daysAgo(10) },
  { id: 'm4', product_id: 'p4', type: 'entrada', quantity: 10, unit_cost_brl: 260, container_id: null, sale_id: null, notes: 'Estoque inicial (amostras)', moved_at: daysAgo(10), created_at: daysAgo(10) },
  { id: 'm5', product_id: 'p1', type: 'saida', quantity: 3, unit_cost_brl: 420, container_id: null, sale_id: 's1', notes: null, moved_at: daysAgo(2), created_at: daysAgo(2) },
  { id: 'm6', product_id: 'p3', type: 'saida', quantity: 2, unit_cost_brl: 310, container_id: null, sale_id: 's2', notes: null, moved_at: daysAgo(1), created_at: daysAgo(1) },
]

export const seedSales: Sale[] = [
  { id: 's1', sale_date: daysAgo(2), channel: 'site', customer_name: 'Marcelo Andrade', customer_contact: '(11) 98888-1234', payment_method: 'pix', status: 'pago', shipping_cost_brl: 45, discount_brl: 0, notes: null, created_at: daysAgo(2) },
  { id: 's2', sale_date: daysAgo(1), channel: 'instagram', customer_name: 'Fernanda Lima', customer_contact: '(21) 97777-5678', payment_method: 'cartao', status: 'enviado', shipping_cost_brl: 35, discount_brl: 20, notes: null, created_at: daysAgo(1) },
]

export const seedSaleItems: SaleItem[] = [
  { id: 'si1', sale_id: 's1', product_id: 'p1', quantity: 3, unit_price_brl: 899.9, unit_cost_brl: 420 },
  { id: 'si2', sale_id: 's2', product_id: 'p3', quantity: 2, unit_price_brl: 699.9, unit_cost_brl: 310 },
]

export const seedExpenses: Expense[] = [
  { id: 'e1', expense_date: daysAgo(15), category: 'importacao', description: 'Compra do primeiro lote (fornecedor China)', amount_brl: 48000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e2', expense_date: daysAgo(15), category: 'frete', description: 'Frete maritimo container CONT-2026-01', amount_brl: 18000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e3', expense_date: daysAgo(7), category: 'marketing', description: 'Criacao de site (Lovable) + trafego pago inicial', amount_brl: 3200, container_id: null, created_at: daysAgo(7) },
  { id: 'e4', expense_date: daysAgo(3), category: 'operacional', description: 'Embalagens e etiquetas', amount_brl: 850, container_id: null, created_at: daysAgo(3) },
]
