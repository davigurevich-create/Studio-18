import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { makeTable, newId } from '@/lib/localStore'
import {
  seedAuditLog,
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
  AuditAction,
  AuditLogEntry,
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
const auditLogTable = makeTable<AuditLogEntry>('audit_log', seedAuditLog)

/** True when reading from the local demo store instead of Supabase. */
export const isDemoMode = !isSupabaseConfigured

// ---------------------------------------------------------------------------
// Log de auditoria — registra quem fez o quê e quando. Nunca derruba a
// operação principal se o registro falhar (só loga o erro no console).
// ---------------------------------------------------------------------------
async function logAudit(action: AuditAction, entity: string, entityId: string | null, summary: string): Promise<void> {
  try {
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      const actorEmail = data.user?.email ?? 'desconhecido'
      const { error } = await supabase
        .from('audit_log')
        .insert({ actor_email: actorEmail, action, entity, entity_id: entityId, summary })
      if (error) throw error
      return
    }
    auditLogTable.insert({
      id: newId(),
      created_at: new Date().toISOString(),
      actor_email: 'demo@studio18',
      action,
      entity,
      entity_id: entityId,
      summary,
    })
  } catch (err) {
    console.error('Falha ao registrar log de auditoria:', err)
  }
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  if (supabase) {
    const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as AuditLogEntry[]
  }
  return [...auditLogTable.all()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

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
  let created: Product
  if (supabase) {
    const { data, error } = await supabase.from('products').insert(input).select().single()
    if (error) throw error
    created = data as Product
  } else {
    created = productsTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
  }
  await logAudit('criar', 'produto', created.id, `Cadastrou o produto ${input.sku} — ${input.name}`)
  return created
}

export async function updateProduct(id: string, patch: Partial<Product>, summary: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('products').update(patch).eq('id', id)
    if (error) throw error
  } else {
    productsTable.update(id, patch)
  }
  await logAudit('editar', 'produto', id, summary)
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
      manufacturer: p.manufacturer ?? null,
      min_stock_alert: p.min_stock_alert,
      cost_price_brl: p.cost_price_brl,
      sale_price_brl: p.sale_price_brl,
      length_cm: p.length_cm ?? null,
      height_cm: p.height_cm ?? null,
      width_cm: p.width_cm ?? null,
      quantity_in_stock: qty,
      piece_count: p.piece_count ?? null,
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
  let created: Container
  if (supabase) {
    const { data, error } = await supabase.from('containers').insert(input).select().single()
    if (error) throw error
    created = data as Container
  } else {
    created = containersTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
  }
  await logAudit('criar', 'container', created.id, `Criou o container ${input.code} (origem: ${input.origin})`)
  return created
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
  productLabel: string,
): Promise<InventoryMovement> {
  let created: InventoryMovement
  if (supabase) {
    const { data, error } = await supabase.from('inventory_movements').insert(input).select().single()
    if (error) throw error
    created = data as InventoryMovement
  } else {
    created = movementsTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
  }
  const typeLabel = input.type === 'entrada' ? 'Entrada' : input.type === 'saida' ? 'Saída' : 'Ajuste'
  await logAudit(
    'criar',
    'movimentacao',
    created.id,
    `${typeLabel} de ${input.quantity} unidade(s) — ${productLabel}`,
  )
  return created
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
  const created = await createSaleInternal(sale, items)
  await logAudit(
    'criar',
    'venda',
    created.id,
    `Registrou venda pelo canal ${sale.channel} para ${sale.customer_name ?? 'cliente não informado'}`,
  )
  return created
}

async function createSaleInternal(
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

export async function updateSaleStatus(id: string, status: Sale['status'], previousStatus: Sale['status']): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('sales').update({ status }).eq('id', id)
    if (error) throw error
  } else {
    salesTable.update(id, { status })
  }
  await logAudit('editar', 'venda', id, `Alterou status da venda de "${previousStatus}" para "${status}"`)
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
  let created: Expense
  if (supabase) {
    const { data, error } = await supabase.from('expenses').insert(input).select().single()
    if (error) throw error
    created = data as Expense
  } else {
    created = expensesTable.insert({ ...input, id: newId(), created_at: new Date().toISOString() })
  }
  await logAudit(
    'criar',
    'despesa',
    created.id,
    `Registrou despesa de ${input.category}: R$ ${input.amount_brl.toFixed(2)} — ${input.description}`,
  )
  return created
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
  let created: BlogPost
  if (supabase) {
    const { data, error } = await supabase.from('blog_posts').insert(input).select().single()
    if (error) throw error
    created = data as BlogPost
  } else {
    created = blogPostsTable.insert({ ...input, id: newId(), created_at: now, updated_at: now })
  }
  await logAudit('criar', 'post_blog', created.id, `Criou o post "${input.title}"${input.published ? ' (publicado)' : ' (rascunho)'}`)
  return created
}

export async function updateBlogPost(id: string, patch: Partial<NewBlogPostInput>, summary: string): Promise<void> {
  const payload = { ...patch, updated_at: new Date().toISOString() }
  if (supabase) {
    const { error } = await supabase.from('blog_posts').update(payload).eq('id', id)
    if (error) throw error
  } else {
    blogPostsTable.update(id, payload)
  }
  await logAudit('editar', 'post_blog', id, summary)
}

export async function deleteBlogPost(id: string, title: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw error
  } else {
    blogPostsTable.remove(id)
  }
  await logAudit('excluir', 'post_blog', id, `Excluiu o post "${title}"`)
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

export async function updatePartRequestStatus(
  id: string,
  status: PartRequestStatus,
  previousStatus: PartRequestStatus,
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('part_requests').update({ status }).eq('id', id)
    if (error) throw error
  } else {
    partRequestsTable.update(id, { status })
  }
  await logAudit(
    'editar',
    'solicitacao_peca',
    id,
    `Alterou status da solicitação de peça de "${previousStatus}" para "${status}"`,
  )
}

export async function updatePartRequestNotes(id: string, admin_notes: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('part_requests').update({ admin_notes }).eq('id', id)
    if (error) throw error
  } else {
    partRequestsTable.update(id, { admin_notes })
  }
  await logAudit('editar', 'solicitacao_peca', id, `Atualizou notas internas: "${admin_notes}"`)
}
