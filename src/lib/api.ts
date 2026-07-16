import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { makeTable, newId } from '@/lib/localStore'
import {
  seedBlogPosts,
  seedContainers,
  seedExpenses,
  seedMovements,
  seedPartRequests,
  seedProducts,
  seedSaleItems,
  seedSales,
} from '@/lib/mockData'
import type {
  BlogPost,
  Container,
  Expense,
  InventoryMovement,
  PartRequest,
  PartRequestStatus,
  Product,
  ProductStock,
  Sale,
  SaleItem,
} from '@/types/domain'

const productsTable = makeTable<Product>('products', seedProducts)
const containersTable = makeTable<Container>('containers', seedContainers)
const movementsTable = makeTable<InventoryMovement>('movements', seedMovements)
const salesTable = makeTable<Sale>('sales', seedSales)
const saleItemsTable = makeTable<SaleItem>('sale_items', seedSaleItems)
const expensesTable = makeTable<Expense>('expenses', seedExpenses)
const blogPostsTable = makeTable<BlogPost>('blog_posts', seedBlogPosts)
const partRequestsTable = makeTable<PartRequest>('part_requests', seedPartRequests)

/** True when reading from the local demo store instead of Supabase. */
export const isDemoMode = !isSupabaseConfigured

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export async function getProducts(): Promise<Product[]> {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw error
    return data as Product[]
  }
  return productsTable.all()
}

export async function createProduct(input: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  if (supabase) {
    const { data, error } = await supabase.from('products').insert(input).select().single()
    if (error) throw error
    return data as Product
  }
  return productsTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('products').update(patch).eq('id', id)
    if (error) throw error
    return
  }
  productsTable.update(id, patch)
}

// ---------------------------------------------------------------------------
// Stock (derived: entradas - saidas por produto)
// ---------------------------------------------------------------------------
export async function getStock(): Promise<ProductStock[]> {
  if (supabase) {
    const { data, error } = await supabase.from('product_stock').select('*')
    if (error) throw error
    return data as ProductStock[]
  }
  const products = productsTable.all()
  const movements = movementsTable.all()
  return products.map((p) => {
    const qty = movements
      .filter((m) => m.product_id === p.id)
      .reduce((sum, m) => {
        if (m.type === 'entrada' || m.type === 'ajuste') return sum + m.quantity
        if (m.type === 'saida') return sum - m.quantity
        return sum
      }, 0)
    return {
      product_id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      min_stock_alert: p.min_stock_alert,
      cost_price_brl: p.cost_price_brl,
      sale_price_brl: p.sale_price_brl,
      quantity_in_stock: qty,
    }
  })
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------
export async function getContainers(): Promise<Container[]> {
  if (supabase) {
    const { data, error } = await supabase.from('containers').select('*').order('eta_date')
    if (error) throw error
    return data as Container[]
  }
  return containersTable.all()
}

export async function createContainer(input: Omit<Container, 'id' | 'created_at'>): Promise<Container> {
  if (supabase) {
    const { data, error } = await supabase.from('containers').insert(input).select().single()
    if (error) throw error
    return data as Container
  }
  return containersTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// Inventory movements
// ---------------------------------------------------------------------------
export async function getMovements(): Promise<InventoryMovement[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .order('moved_at', { ascending: false })
    if (error) throw error
    return data as InventoryMovement[]
  }
  return [...movementsTable.all()].sort((a, b) => b.moved_at.localeCompare(a.moved_at))
}

export async function addMovement(
  input: Omit<InventoryMovement, 'id' | 'created_at'>,
): Promise<InventoryMovement> {
  if (supabase) {
    const { data, error } = await supabase.from('inventory_movements').insert(input).select().single()
    if (error) throw error
    return data as InventoryMovement
  }
  return movementsTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// Sales (+ items, + stock deduction via movements)
// ---------------------------------------------------------------------------
export interface NewSaleItemInput {
  product_id: string
  quantity: number
  unit_price_brl: number
  unit_cost_brl: number
}

export async function getSales(): Promise<Sale[]> {
  if (supabase) {
    const { data, error } = await supabase.from('sales').select('*').order('sale_date', { ascending: false })
    if (error) throw error
    return data as Sale[]
  }
  return [...salesTable.all()].sort((a, b) => b.sale_date.localeCompare(a.sale_date))
}

export async function getSaleItems(saleId?: string): Promise<SaleItem[]> {
  if (supabase) {
    let query = supabase.from('sale_items').select('*')
    if (saleId) query = query.eq('sale_id', saleId)
    const { data, error } = await query
    if (error) throw error
    return data as SaleItem[]
  }
  const items = saleItemsTable.all()
  return saleId ? items.filter((i) => i.sale_id === saleId) : items
}

export async function createSale(
  sale: Omit<Sale, 'id' | 'created_at'>,
  items: NewSaleItemInput[],
): Promise<Sale> {
  if (supabase) {
    const { data: createdSale, error: saleError } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single()
    if (saleError) throw saleError

    const itemsPayload = items.map((i) => ({ ...i, sale_id: createdSale.id }))
    const { error: itemsError } = await supabase.from('sale_items').insert(itemsPayload)
    if (itemsError) throw itemsError

    const movementsPayload = items.map((i) => ({
      product_id: i.product_id,
      type: 'saida' as const,
      quantity: i.quantity,
      unit_cost_brl: i.unit_cost_brl,
      container_id: null,
      sale_id: createdSale.id,
      notes: 'Baixa automatica por venda',
      moved_at: sale.sale_date,
    }))
    const { error: movError } = await supabase.from('inventory_movements').insert(movementsPayload)
    if (movError) throw movError

    return createdSale as Sale
  }

  const createdSale = salesTable.insert({ ...sale, id: newId(), created_at: new Date().toISOString() })
  for (const item of items) {
    saleItemsTable.insert({ ...item, id: newId(), sale_id: createdSale.id })
    movementsTable.insert({
      id: newId(),
      product_id: item.product_id,
      type: 'saida',
      quantity: item.quantity,
      unit_cost_brl: item.unit_cost_brl,
      container_id: null,
      sale_id: createdSale.id,
      notes: 'Baixa automatica por venda',
      moved_at: sale.sale_date,
      created_at: new Date().toISOString(),
    })
  }
  return createdSale
}

export async function updateSaleStatus(id: string, status: Sale['status']): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('sales').update({ status }).eq('id', id)
    if (error) throw error
    return
  }
  salesTable.update(id, { status })
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export async function getExpenses(): Promise<Expense[]> {
  if (supabase) {
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
    if (error) throw error
    return data as Expense[]
  }
  return [...expensesTable.all()].sort((a, b) => b.expense_date.localeCompare(a.expense_date))
}

export async function addExpense(input: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  if (supabase) {
    const { data, error } = await supabase.from('expenses').insert(input).select().single()
    if (error) throw error
    return data as Expense
  }
  return expensesTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (supabase) {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as BlogPost[]
  }
  return [...blogPostsTable.all()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export type NewBlogPostInput = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>

export async function createBlogPost(input: NewBlogPostInput): Promise<BlogPost> {
  const now = new Date().toISOString()
  if (supabase) {
    const { data, error } = await supabase.from('blog_posts').insert(input).select().single()
    if (error) throw error
    return data as BlogPost
  }
  return blogPostsTable.insert({ ...input, id: newId(), created_at: now, updated_at: now })
}

export async function updateBlogPost(id: string, patch: Partial<NewBlogPostInput>): Promise<void> {
  const payload = { ...patch, updated_at: new Date().toISOString() }
  if (supabase) {
    const { error } = await supabase.from('blog_posts').update(payload).eq('id', id)
    if (error) throw error
    return
  }
  blogPostsTable.update(id, payload)
}

export async function deleteBlogPost(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw error
    return
  }
  blogPostsTable.remove(id)
}

// ---------------------------------------------------------------------------
// Solicitações de peças faltantes
// ---------------------------------------------------------------------------
export async function getPartRequests(): Promise<PartRequest[]> {
  if (supabase) {
    const { data, error } = await supabase.from('part_requests').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as PartRequest[]
  }
  return [...partRequestsTable.all()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function updatePartRequestStatus(id: string, status: PartRequestStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('part_requests').update({ status }).eq('id', id)
    if (error) throw error
    return
  }
  partRequestsTable.update(id, { status })
}

export async function updatePartRequestNotes(id: string, admin_notes: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('part_requests').update({ admin_notes }).eq('id', id)
    if (error) throw error
    return
  }
  partRequestsTable.update(id, { admin_notes })
}
