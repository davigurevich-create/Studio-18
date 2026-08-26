import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addMovement,
  createProduct,
  getContainers,
  getProducts,
  getRestockWaitlist,
  getSaleItems,
  getSales,
  getStock,
  updateProduct,
} from '@/lib/api'
import { Badge, Button, Card, PageHeader, StatTile, formatBRL } from '@/components/ui'
import type { Container, MovementReason, MovementType, Product, ProductStock, RestockWaitlistEntry, Sale, SaleItem } from '@/types/domain'

export function Estoque() {
  const [stock, setStock] = useState<ProductStock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [waitlist, setWaitlist] = useState<RestockWaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'baixo' | 'ok'>('todos')

  const reload = () => {
    Promise.all([getStock(), getProducts(), getContainers(), getSales(), getSaleItems(), getRestockWaitlist()]).then(
      ([s, p, c, sa, si, w]) => {
        setStock(s)
        setProducts(p)
        setContainers(c)
        setSales(sa)
        setSaleItems(si)
        setWaitlist(w)
        setLoading(false)
      },
    )
  }

  useEffect(reload, [])

  const categories = useMemo(() => {
    const present = new Set(stock.map((p) => p.category))
    return ['todas', ...Array.from(present).sort()]
  }, [stock])

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stock.filter((p) => {
      const low = p.quantity_in_stock <= p.min_stock_alert
      if (categoryFilter !== 'todas' && p.category !== categoryFilter) return false
      if (statusFilter === 'baixo' && !low) return false
      if (statusFilter === 'ok' && low) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [stock, search, categoryFilter, statusFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Produtos, quantidade disponível e movimentações de entrada/saída"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowProductForm((v) => !v)}>
              + Produto
            </Button>
            <Button onClick={() => setShowMovementForm((v) => !v)}>+ Movimentação</Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="SKUs cadastrados" value={String(stock.length)} />
        <StatTile
          label="Estoque baixo"
          value={String(stock.filter((p) => p.quantity_in_stock <= p.min_stock_alert).length)}
          status={stock.some((p) => p.quantity_in_stock <= p.min_stock_alert) ? 'warning' : 'good'}
        />
        <StatTile label="Unidades em estoque" value={stock.reduce((t, p) => t + p.quantity_in_stock, 0).toLocaleString('pt-BR')} />
        <StatTile
          label="Valor em estoque (custo)"
          value={formatBRL(stock.reduce((t, p) => t + p.quantity_in_stock * p.cost_price_brl, 0))}
        />
      </div>

      {showProductForm && (
        <ProductForm
          onDone={() => {
            setShowProductForm(false)
            reload()
          }}
        />
      )}

      {showMovementForm && (
        <MovementForm
          products={products}
          containers={containers}
          onDone={() => {
            setShowMovementForm(false)
            reload()
          }}
        />
      )}

      <MarginComparison stock={stock} />

      <ReorderSuggestions stock={stock} sales={sales} saleItems={saleItems} waitlist={waitlist} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-64"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'todas' ? 'Todas as categorias' : c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os status</option>
          <option value="baixo">Só estoque baixo</option>
          <option value="ok">Só estoque OK</option>
        </select>
        {(search || categoryFilter !== 'todas' || statusFilter !== 'todos') && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filteredStock.length} de {stock.length} produtos
          </span>
        )}
      </div>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">SKU</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Produto</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Fabricante</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Categoria</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Peças (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Em estoque</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Custo unit. (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Preço venda (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Compr. (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Altura (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Largura (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">NCM (clique p/ editar)</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum produto encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              filteredStock.map((p) => {
              const low = p.quantity_in_stock <= p.min_stock_alert
              return (
                <tr key={p.product_id} className="border-t" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {p.sku}
                  </td>
                  <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {p.manufacturer ?? '—'}
                  </td>
                  <td className="py-2.5 pr-4 capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {p.category}
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditableDimension
                      value={p.piece_count}
                      unit=""
                      step="1"
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { piece_count: v },
                          `Editou quantidade de peças do SKU ${p.sku}: ${p.piece_count ?? '—'} → ${v}`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="tabular py-2.5 pr-4" style={{ color: 'var(--text-primary)' }}>
                    {p.quantity_in_stock}
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditablePrice
                      value={p.cost_price_brl}
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { cost_price_brl: v },
                          `Editou custo unitário do SKU ${p.sku}: ${formatBRL(p.cost_price_brl)} → ${formatBRL(v)}`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditablePrice
                      value={p.sale_price_brl}
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { sale_price_brl: v },
                          `Editou preço de venda do SKU ${p.sku}: ${formatBRL(p.sale_price_brl)} → ${formatBRL(v)}`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditableDimension
                      value={p.length_cm}
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { length_cm: v },
                          `Editou comprimento do SKU ${p.sku}: ${p.length_cm ?? '—'} → ${v} cm`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditableDimension
                      value={p.height_cm}
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { height_cm: v },
                          `Editou altura do SKU ${p.sku}: ${p.height_cm ?? '—'} → ${v} cm`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditableDimension
                      value={p.width_cm}
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { width_cm: v },
                          `Editou largura do SKU ${p.sku}: ${p.width_cm ?? '—'} → ${v} cm`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <EditableText
                      value={p.ncm}
                      placeholder="cadastrar"
                      onSave={(v) =>
                        updateProduct(
                          p.product_id,
                          { ncm: v },
                          `Editou NCM do SKU ${p.sku}: ${p.ncm ?? '—'} → ${v}`,
                        ).then(reload)
                      }
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    {low ? <Badge tone="warning">Estoque baixo</Badge> : <Badge tone="good">OK</Badge>}
                  </td>
                </tr>
              )
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function MarginComparison({ stock }: { stock: ProductStock[] }) {
  const { ranked, unpriced, maxMargin } = useMemo(() => {
    const priced = stock.filter((p) => p.cost_price_brl > 0)
    const unpriced = stock.filter((p) => p.cost_price_brl <= 0)
    const ranked = priced
      .map((p) => {
        const marginBrl = p.sale_price_brl - p.cost_price_brl
        const marginPct = p.sale_price_brl > 0 ? (marginBrl / p.sale_price_brl) * 100 : 0
        return { ...p, marginBrl, marginPct }
      })
      .sort((a, b) => b.marginBrl - a.marginBrl)
    return { ranked, unpriced, maxMargin: ranked[0]?.marginBrl ?? 0 }
  }, [stock])

  if (stock.length === 0) return null

  return (
    <Card className="mb-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Margem por SKU
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Preço de venda menos custo unitário, do maior para o menor
        </p>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Cadastre o custo unitário dos produtos para calcular a margem.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ranked.map((p, i) => (
            <div key={p.product_id} className="flex items-center gap-3">
              <div className="w-6 shrink-0 text-right text-xs tabular" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </div>
              <div className="w-44 shrink-0 truncate text-sm" style={{ color: 'var(--text-primary)' }} title={`${p.sku} — ${p.name}`}>
                {p.name}
              </div>
              <div className="flex-1 rounded-full" style={{ background: 'var(--gridline)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${maxMargin > 0 ? Math.max((p.marginBrl / maxMargin) * 100, 2) : 0}%`,
                    background: p.marginBrl >= 0 ? 'var(--series-1)' : 'var(--status-critical)',
                  }}
                />
              </div>
              <div className="w-24 shrink-0 text-right text-sm font-medium tabular" style={{ color: 'var(--text-primary)' }}>
                {formatBRL(p.marginBrl)}
              </div>
              <div className="w-14 shrink-0 text-right text-xs tabular" style={{ color: 'var(--text-muted)' }}>
                {p.marginPct.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {unpriced.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--gridline)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {unpriced.length} SKU{unpriced.length > 1 ? 's' : ''} sem custo unitário cadastrado — a margem não pode ser
            calculada até informar o custo em Estoque: {unpriced.map((p) => p.sku).join(', ')}
          </p>
        </div>
      )}
    </Card>
  )
}

// Prazo médio estimado entre decidir comprar um novo container e ele estar
// liberado e pronto para venda (compra + trânsito + desembaraço aduaneiro),
// mais uma margem de segurança — usados para calcular quanto pedir do
// próximo lote com base na velocidade real de venda de cada SKU.
const LEAD_TIME_DAYS = 75
const SAFETY_BUFFER_DAYS = 30
const VELOCITY_LOOKBACK_DAYS = 90
const SOLD_STATUSES = new Set(['pago', 'enviado', 'entregue'])

interface ReorderRow extends ProductStock {
  soldUnitsInWindow: number
  velocityPerWeek: number
  daysOfStockLeft: number
  pendingWaitlist: number
  suggestedQty: number
}

function ReorderSuggestions({
  stock,
  sales,
  saleItems,
  waitlist,
}: {
  stock: ProductStock[]
  sales: Sale[]
  saleItems: SaleItem[]
  waitlist: RestockWaitlistEntry[]
}) {
  const { rows, windowDays } = useMemo(() => {
    const now = Date.now()
    const cutoff = now - VELOCITY_LOOKBACK_DAYS * 86400000

    const validSales = sales.filter((s) => SOLD_STATUSES.has(s.status) && new Date(s.sale_date).getTime() >= cutoff)
    const validSaleIds = new Set(validSales.map((s) => s.id))

    const oldestValidSaleTime = validSales.reduce(
      (min, s) => Math.min(min, new Date(s.sale_date).getTime()),
      now,
    )
    const windowDays = Math.max(7, Math.min(VELOCITY_LOOKBACK_DAYS, Math.ceil((now - oldestValidSaleTime) / 86400000)))

    const soldByProduct = new Map<string, number>()
    for (const item of saleItems) {
      if (!validSaleIds.has(item.sale_id)) continue
      soldByProduct.set(item.product_id, (soldByProduct.get(item.product_id) ?? 0) + item.quantity)
    }

    const waitlistByProduct = new Map<string, number>()
    for (const w of waitlist) {
      if (w.notified) continue
      waitlistByProduct.set(w.product_id, (waitlistByProduct.get(w.product_id) ?? 0) + 1)
    }

    const rows: ReorderRow[] = stock
      .map((p) => {
        const soldUnitsInWindow = soldByProduct.get(p.product_id) ?? 0
        const velocityPerDay = soldUnitsInWindow / windowDays
        const daysOfStockLeft = velocityPerDay > 0 ? p.quantity_in_stock / velocityPerDay : Infinity
        const pendingWaitlist = waitlistByProduct.get(p.product_id) ?? 0
        const targetUnits = velocityPerDay * (LEAD_TIME_DAYS + SAFETY_BUFFER_DAYS)
        const suggestedQty = Math.max(0, Math.ceil(targetUnits - p.quantity_in_stock + pendingWaitlist))
        return {
          ...p,
          soldUnitsInWindow,
          velocityPerWeek: velocityPerDay * 7,
          daysOfStockLeft,
          pendingWaitlist,
          suggestedQty,
        }
      })
      .filter((r) => r.suggestedQty > 0)
      .sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft)

    return { rows, windowDays }
  }, [stock, sales, saleItems, waitlist])

  if (rows.length === 0) return null

  return (
    <Card className="mb-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Sugestão de reposição por velocidade de venda
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Baseado nos últimos {windowDays} dias de vendas confirmadas e num prazo de importação estimado de{' '}
          {LEAD_TIME_DAYS + SAFETY_BUFFER_DAYS} dias (trânsito + margem de segurança). Quanto menos dias de estoque
          restam, mais urgente é repor.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">SKU</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Produto</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Vendas/semana</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Estoque atual</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Dias de estoque</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Lista de espera</th>
              <th className="pb-2 pr-4 font-medium whitespace-nowrap">Sugestão de compra</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const critical = r.daysOfStockLeft < LEAD_TIME_DAYS
              return (
                <tr key={r.product_id} className="border-t" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {r.sku}
                  </td>
                  <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.name}
                  </td>
                  <td className="tabular py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {r.velocityPerWeek.toFixed(1)}
                  </td>
                  <td className="tabular py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {r.quantity_in_stock}
                  </td>
                  <td className="py-2.5 pr-4">
                    {Number.isFinite(r.daysOfStockLeft) ? (
                      <Badge tone={critical ? 'critical' : 'warning'}>{Math.floor(r.daysOfStockLeft)} dias</Badge>
                    ) : (
                      <Badge tone="muted">sem giro no período</Badge>
                    )}
                  </td>
                  <td className="tabular py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {r.pendingWaitlist > 0 ? `${r.pendingWaitlist} aguardando` : '—'}
                  </td>
                  <td className="tabular py-2.5 pr-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {r.suggestedQty} unidades
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'carro' as Product['category'],
    manufacturer: '',
    brand_model: '',
    scale: '1:8',
    piece_count: '',
    cost_price_brl: '',
    sale_price_brl: '',
    min_stock_alert: '5',
    length_cm: '',
    height_cm: '',
    width_cm: '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await createProduct({
      sku: form.sku,
      name: form.name,
      category: form.category,
      manufacturer: form.manufacturer || null,
      brand_model: form.brand_model || null,
      scale: form.scale,
      piece_count: form.piece_count ? Number(form.piece_count) : null,
      cost_price_brl: Number(form.cost_price_brl),
      sale_price_brl: Number(form.sale_price_brl),
      min_stock_alert: Number(form.min_stock_alert),
      length_cm: form.length_cm ? Number(form.length_cm) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      width_cm: form.width_cm ? Number(form.width_cm) : null,
      image_url: null,
      active: true,
    })
    onDone()
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
        <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required className="md:col-span-2" />
        <SelectField
          label="Categoria"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v as Product['category'] })}
          options={[
            { value: 'carro', label: 'Carro' },
            { value: 'moto', label: 'Moto' },
            { value: 'motor', label: 'Motor' },
          ]}
        />
        <Field label="Fabricante" value={form.manufacturer} onChange={(v) => setForm({ ...form, manufacturer: v })} placeholder="Ex: CADA, GULY, REOBRIX, KBOX" />
        <Field label="Modelo" value={form.brand_model} onChange={(v) => setForm({ ...form, brand_model: v })} />
        <Field label="Peças" value={form.piece_count} onChange={(v) => setForm({ ...form, piece_count: v })} type="number" />
        <Field label="Custo (R$)" value={form.cost_price_brl} onChange={(v) => setForm({ ...form, cost_price_brl: v })} type="number" required />
        <Field label="Preço venda (R$)" value={form.sale_price_brl} onChange={(v) => setForm({ ...form, sale_price_brl: v })} type="number" required />
        <Field label="Alerta estoque mín." value={form.min_stock_alert} onChange={(v) => setForm({ ...form, min_stock_alert: v })} type="number" />
        <Field label="Comprimento (cm)" value={form.length_cm} onChange={(v) => setForm({ ...form, length_cm: v })} type="number" />
        <Field label="Altura (cm)" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} type="number" />
        <Field label="Largura (cm)" value={form.width_cm} onChange={(v) => setForm({ ...form, width_cm: v })} type="number" />
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Salvar produto</Button>
        </div>
      </form>
    </Card>
  )
}

function MovementForm({
  products,
  containers,
  onDone,
}: {
  products: Product[]
  containers: Container[]
  onDone: () => void
}) {
  const [form, setForm] = useState({
    product_id: products[0]?.id ?? '',
    type: 'entrada' as MovementType,
    quantity: '1',
    unit_cost_brl: '',
    container_id: '',
    notes: '',
    reason: '' as '' | MovementReason,
    influencer_name: '',
  })

  const isInfluencerInvestment = form.type === 'saida' && form.reason === 'investimento_influencer'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const product = products.find((p) => p.id === form.product_id)
    await addMovement(
      {
        product_id: form.product_id,
        type: form.type,
        quantity: Number(form.quantity),
        unit_cost_brl: form.unit_cost_brl ? Number(form.unit_cost_brl) : null,
        container_id: form.container_id || null,
        sale_id: null,
        notes: form.notes || (isInfluencerInvestment ? `Set enviado para ${form.influencer_name} (parceria de conteúdo)` : null),
        reason: isInfluencerInvestment ? 'investimento_influencer' : null,
        influencer_name: isInfluencerInvestment ? form.influencer_name : null,
        moved_at: new Date().toISOString(),
      },
      product ? `${product.sku} — ${product.name}` : form.product_id,
    )
    onDone()
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SelectField
          label="Produto"
          value={form.product_id}
          onChange={(v) => setForm({ ...form, product_id: v })}
          options={products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))}
          className="md:col-span-2"
        />
        <SelectField
          label="Tipo"
          value={form.type}
          onChange={(v) => setForm({ ...form, type: v as MovementType })}
          options={[
            { value: 'entrada', label: 'Entrada' },
            { value: 'saida', label: 'Saída' },
            { value: 'ajuste', label: 'Ajuste' },
          ]}
        />
        <Field label="Quantidade" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} type="number" required />
        <Field label="Custo unit. (R$)" value={form.unit_cost_brl} onChange={(v) => setForm({ ...form, unit_cost_brl: v })} type="number" />
        <SelectField
          label="Container (opcional)"
          value={form.container_id}
          onChange={(v) => setForm({ ...form, container_id: v })}
          options={[{ value: '', label: '—' }, ...containers.map((c) => ({ value: c.id, label: c.code }))]}
        />
        {form.type === 'saida' && (
          <SelectField
            label="Motivo da saída"
            value={form.reason}
            onChange={(v) => setForm({ ...form, reason: v as '' | MovementReason })}
            options={[
              { value: '', label: 'Venda / baixa manual' },
              { value: 'investimento_influencer', label: 'Investimento com influencer' },
            ]}
          />
        )}
        {isInfluencerInvestment && (
          <Field
            label="Influenciador"
            value={form.influencer_name}
            onChange={(v) => setForm({ ...form, influencer_name: v })}
            placeholder="Nome do perfil/parceria"
            required
          />
        )}
        <Field
          label="Notas"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
          placeholder={isInfluencerInvestment ? `Set enviado para ${form.influencer_name || '...'} (parceria de conteúdo)` : undefined}
          className="md:col-span-2"
        />
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Registrar movimentação</Button>
        </div>
      </form>
    </Card>
  )
}

function EditablePrice({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(value))
          setEditing(true)
        }}
        className="tabular text-left"
        style={{ color: 'var(--text-secondary)' }}
        title="Clique para editar"
      >
        {formatBRL(value)}
      </button>
    )
  }

  const commit = () => {
    setEditing(false)
    const parsed = Number(draft)
    if (!Number.isNaN(parsed) && parsed !== value) onSave(parsed)
  }

  return (
    <input
      autoFocus
      type="number"
      step="0.01"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setEditing(false)
      }}
      className="tabular w-24 rounded-md border px-2 py-1 text-sm"
      style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
    />
  )
}

function EditableDimension({
  value,
  onSave,
  unit = 'cm',
  step = '0.1',
}: {
  value: number | null
  onSave: (value: number) => void
  unit?: string
  step?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(value ?? ''))
          setEditing(true)
        }}
        className="tabular text-left"
        style={{ color: 'var(--text-secondary)' }}
        title="Clique para editar"
      >
        {value != null ? (unit ? `${value} ${unit}` : String(value)) : '—'}
      </button>
    )
  }

  const commit = () => {
    setEditing(false)
    const parsed = Number(draft)
    if (!Number.isNaN(parsed) && parsed !== value) onSave(parsed)
  }

  return (
    <input
      autoFocus
      type="number"
      step={step}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setEditing(false)
      }}
      className="tabular w-20 rounded-md border px-2 py-1 text-sm"
      style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
    />
  )
}

function EditableText({ value, onSave, placeholder }: { value: string | null; onSave: (value: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? '')
          setEditing(true)
        }}
        className="tabular text-left"
        style={{ color: value ? 'var(--text-secondary)' : 'var(--status-warning)' }}
        title="Clique para editar"
      >
        {value || placeholder || '—'}
      </button>
    )
  }

  const commit = () => {
    setEditing(false)
    if (draft !== (value ?? '')) onSave(draft)
  }

  return (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setEditing(false)
      }}
      className="w-24 rounded-md border px-2 py-1 text-sm"
      style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
    />
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className = '',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  className?: string
  placeholder?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
