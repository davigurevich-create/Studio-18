import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createSale, generateShippingLabel, getProducts, getSaleItems, getSales, getStock, updateSaleStatus } from '@/lib/api'
import { Badge, Button, Card, PageHeader, formatBRL } from '@/components/ui'
import type { NewSaleItemInput } from '@/lib/api'
import type { Product, ProductStock, Sale, SaleItem, SaleStatus } from '@/types/domain'

const statusTone: Record<SaleStatus, 'muted' | 'good' | 'warning' | 'critical' | 'info'> = {
  pendente: 'warning',
  pago: 'info',
  enviado: 'info',
  entregue: 'good',
  cancelado: 'critical',
}

export function Vendas() {
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stock, setStock] = useState<ProductStock[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | SaleStatus>('todos')
  const [channelFilter, setChannelFilter] = useState<'todos' | Sale['channel']>('todos')

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800)
  }

  const reload = () => {
    Promise.all([getSales(), getSaleItems(), getProducts(), getStock()]).then(([s, si, p, st]) => {
      setSales(s)
      setSaleItems(si)
      setProducts(p)
      setStock(st)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const changeStatus = async (id: string, status: SaleStatus, previousStatus: SaleStatus) => {
    await updateSaleStatus(id, status, previousStatus)
    reload()
  }

  const channels = useMemo(() => {
    const present = new Set(sales.map((s) => s.channel))
    return Array.from(present).sort()
  }, [sales])

  // Faturamento já realizado (vendas não canceladas, pelo preço de venda
  // registrado em cada item) vs. o potencial de faturamento ainda "parado"
  // no estoque atual, pelo preço de venda de tabela de cada SKU.
  const revenuePotential = useMemo(() => {
    const realized = sales
      .filter((s) => s.status !== 'cancelado')
      .reduce((sum, s) => {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        return sum + items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0)
      }, 0)
    const remainingStockPotential = stock.reduce((sum, p) => sum + p.quantity_in_stock * p.sale_price_brl, 0)
    const maxPotential = realized + remainingStockPotential
    const pct = maxPotential > 0 ? (realized / maxPotential) * 100 : 0
    return { realized, remainingStockPotential, maxPotential, pct }
  }, [sales, saleItems, stock])

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sales.filter((s) => {
      if (statusFilter !== 'todos' && s.status !== statusFilter) return false
      if (channelFilter !== 'todos' && s.channel !== channelFilter) return false
      if (q) {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        const productNames = items
          .map((i) => products.find((p) => p.id === i.product_id)?.name ?? '')
          .join(' ')
          .toLowerCase()
        const haystack = `${s.customer_name ?? ''} ${s.customer_contact ?? ''} ${s.id} ${productNames}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [sales, saleItems, products, search, statusFilter, channelFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Registro de vendas por canal, com baixa automática de estoque"
        action={<Button onClick={() => setShowForm((v) => !v)}>+ Nova venda</Button>}
      />

      {showForm && (
        <NewSaleForm
          products={products}
          onDone={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}

      <Card className="mb-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Faturamento realizado vs. potencial do estoque atual
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {revenuePotential.pct.toFixed(1)}% do potencial já faturado
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--gridline)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(revenuePotential.pct, revenuePotential.pct > 0 ? 1.5 : 0))}%`, background: 'var(--series-1)' }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(revenuePotential.realized)}</strong> já faturado
          </span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(revenuePotential.remainingStockPotential)}</strong> ainda em
            estoque (potencial)
          </span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(revenuePotential.maxPotential)}</strong> máximo possível
          </span>
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, contato, modelo ou ID do pedido..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os status</option>
          {(['pendente', 'pago', 'enviado', 'entregue', 'cancelado'] as SaleStatus[]).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os canais</option>
          {channels.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {(search || statusFilter !== 'todos' || channelFilter !== 'todos') && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filteredSales.length} de {sales.length} vendas
          </span>
        )}
      </div>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Modelo</th>
              <th className="pb-2 font-medium">Entregar para</th>
              <th className="pb-2 font-medium">Pagamento</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Etiqueta</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma venda encontrada com esses filtros.
                </td>
              </tr>
            ) : (
            filteredSales.map((s) => {
              const items = saleItems.filter((i) => i.sale_id === s.id)
              const total = items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl + s.shipping_cost_brl
              const hasAddress = Boolean(s.shipping_street_name)
              return (
                <tr key={s.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    <div>{new Date(s.sale_date).toLocaleDateString('pt-BR')}</div>
                    <button
                      type="button"
                      onClick={() => copyId(s.id)}
                      title={`Copiar ID completo: ${s.id}`}
                      className="mt-0.5 flex items-center gap-1 font-mono text-[11px]"
                      style={{ color: copiedId === s.id ? 'var(--status-good)' : 'var(--text-muted)' }}
                    >
                      {copiedId === s.id ? '✓ ID copiado!' : `ID ${s.id.slice(0, 8)}… (copiar)`}
                    </button>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    <div className="font-medium">{s.customer_name ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.customer_contact ?? '—'}
                    </div>
                    <div className="mt-0.5 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {s.channel}
                    </div>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {items.map((i) => {
                      const p = products.find((pr) => pr.id === i.product_id)
                      return (
                        <div key={i.id} className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {i.quantity}x {p?.name ?? p?.sku ?? i.product_id}
                        </div>
                      )
                    })}
                  </td>
                  <td className="py-2.5 text-xs" style={{ color: hasAddress ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {hasAddress ? (
                      <>
                        <div>
                          {s.shipping_street_name}, {s.shipping_street_number}
                          {s.shipping_complement ? ` — ${s.shipping_complement}` : ''}
                        </div>
                        <div>{s.shipping_neighborhood}</div>
                        <div>
                          {s.shipping_city} / {s.shipping_federal_unit} · CEP {s.shipping_zip_code}
                        </div>
                      </>
                    ) : (
                      'Sem endereço registrado'
                    )}
                  </td>
                  <td className="py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="capitalize">{s.payment_method ?? '—'}</div>
                    {s.payment_provider && (
                      <div style={{ color: 'var(--text-muted)' }}>via {s.payment_provider}</div>
                    )}
                  </td>
                  <td className="tabular py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatBRL(total)}
                  </td>
                  <td className="py-2.5">
                    <select
                      value={s.status}
                      onChange={(e) => changeStatus(s.id, e.target.value as SaleStatus, s.status)}
                      className="rounded-md border-0 bg-transparent text-xs"
                      style={{ color: 'inherit' }}
                    >
                      {(['pendente', 'pago', 'enviado', 'entregue', 'cancelado'] as SaleStatus[]).map((st) => (
                        <option key={st} value={st} style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <ShippingLabelCell sale={s} onGenerated={reload} />
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

function ShippingLabelCell({ sale, onGenerated }: { sale: Sale; onGenerated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sale.shipping_label_url) {
    return (
      <div className="flex flex-col gap-1 text-xs">
        <a href={sale.shipping_label_url} target="_blank" rel="noreferrer" style={{ color: 'var(--series-1)' }}>
          Ver etiqueta
        </a>
        {sale.shipping_tracking_code && (
          <span style={{ color: 'var(--text-muted)' }}>Rastreio: {sale.shipping_tracking_code}</span>
        )}
      </div>
    )
  }

  if (sale.status !== 'pago' && sale.status !== 'enviado') {
    return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      await generateShippingLabel(sale.id)
      onGenerated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar etiqueta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={generate} disabled={loading}>
        {loading ? 'Gerando...' : 'Gerar etiqueta'}
      </Button>
      {error && (
        <span className="max-w-[180px] text-[11px]" style={{ color: 'var(--status-critical)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

interface DraftItem {
  product_id: string
  quantity: number
}

function NewSaleForm({ products, onDone }: { products: Product[]; onDone: () => void }) {
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [channel, setChannel] = useState<Sale['channel']>('site')
  const [paymentMethod, setPaymentMethod] = useState<Sale['payment_method']>('pix')
  const [shipping, setShipping] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [items, setItems] = useState<DraftItem[]>([{ product_id: products[0]?.id ?? '', quantity: 1 }])

  const addItem = () => setItems([...items, { product_id: products[0]?.id ?? '', quantity: 1 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, patch: Partial<DraftItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const saleItemsInput: NewSaleItemInput[] = items
      .filter((it) => it.product_id && it.quantity > 0)
      .map((it) => {
        const product = products.find((p) => p.id === it.product_id)!
        return {
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price_brl: product.sale_price_brl,
          unit_cost_brl: product.cost_price_brl,
        }
      })

    await createSale(
      {
        sale_date: new Date().toISOString(),
        channel,
        customer_name: customerName || null,
        customer_contact: customerContact || null,
        payment_method: paymentMethod,
        status: 'pago',
        shipping_cost_brl: Number(shipping),
        discount_brl: Number(discount),
        notes: null,
      },
      saleItemsInput,
    )
    onDone()
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Cliente" value={customerName} onChange={setCustomerName} />
          <TextField label="Contato" value={customerContact} onChange={setCustomerContact} />
          <SelectField
            label="Canal"
            value={channel}
            onChange={(v) => setChannel(v as Sale['channel'])}
            options={['site', 'whatsapp', 'instagram', 'feira', 'outro'].map((v) => ({ value: v, label: v }))}
          />
          <SelectField
            label="Pagamento"
            value={paymentMethod ?? 'pix'}
            onChange={(v) => setPaymentMethod(v as Sale['payment_method'])}
            options={['pix', 'cartao', 'boleto', 'dinheiro', 'outro'].map((v) => ({ value: v, label: v }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Itens
          </label>
          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={it.product_id}
                  onChange={(e) => updateItem(idx, { product_id: e.target.value })}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({formatBRL(p.sale_price_brl)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  className="w-20 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-xs" style={{ color: 'var(--status-critical)' }}>
                    remover
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-2 text-xs font-medium" style={{ color: 'var(--series-1)' }}>
            + adicionar item
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Frete (R$)" value={shipping} onChange={setShipping} type="number" />
          <TextField label="Desconto (R$)" value={discount} onChange={setDiscount} type="number" />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">Registrar venda</Button>
        </div>
      </form>
    </Card>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
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
