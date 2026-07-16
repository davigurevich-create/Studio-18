import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addMovement, createProduct, getContainers, getProducts, getStock, updateProduct } from '@/lib/api'
import { Badge, Button, Card, PageHeader, StatTile, formatBRL } from '@/components/ui'
import type { Container, MovementType, Product, ProductStock } from '@/types/domain'

export function Estoque() {
  const [stock, setStock] = useState<ProductStock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'baixo' | 'ok'>('todos')

  const reload = () => {
    Promise.all([getStock(), getProducts(), getContainers()]).then(([s, p, c]) => {
      setStock(s)
      setProducts(p)
      setContainers(c)
      setLoading(false)
    })
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

      <MarginComparison stock={stock} />

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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">Produto</th>
              <th className="pb-2 font-medium">Categoria</th>
              <th className="pb-2 font-medium">Em estoque</th>
              <th className="pb-2 font-medium">Custo unit. (clique p/ editar)</th>
              <th className="pb-2 font-medium">Preço venda (clique p/ editar)</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum produto encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              filteredStock.map((p) => {
              const low = p.quantity_in_stock <= p.min_stock_alert
              return (
                <tr key={p.product_id} className="border-t" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.sku}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.name}
                  </td>
                  <td className="py-2.5 capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {p.category}
                  </td>
                  <td className="tabular py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {p.quantity_in_stock}
                  </td>
                  <td className="py-2.5">
                    <EditablePrice
                      value={p.cost_price_brl}
                      onSave={(v) => updateProduct(p.product_id, { cost_price_brl: v }).then(reload)}
                    />
                  </td>
                  <td className="py-2.5">
                    <EditablePrice
                      value={p.sale_price_brl}
                      onSave={(v) => updateProduct(p.product_id, { sale_price_brl: v }).then(reload)}
                    />
                  </td>
                  <td className="py-2.5">
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

function ProductForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'carro' as Product['category'],
    brand_model: '',
    scale: '1:8',
    piece_count: '',
    cost_price_brl: '',
    sale_price_brl: '',
    min_stock_alert: '5',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await createProduct({
      sku: form.sku,
      name: form.name,
      category: form.category,
      brand_model: form.brand_model || null,
      scale: form.scale,
      piece_count: form.piece_count ? Number(form.piece_count) : null,
      cost_price_brl: Number(form.cost_price_brl),
      sale_price_brl: Number(form.sale_price_brl),
      min_stock_alert: Number(form.min_stock_alert),
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
        <Field label="Modelo" value={form.brand_model} onChange={(v) => setForm({ ...form, brand_model: v })} />
        <Field label="Peças" value={form.piece_count} onChange={(v) => setForm({ ...form, piece_count: v })} type="number" />
        <Field label="Custo (R$)" value={form.cost_price_brl} onChange={(v) => setForm({ ...form, cost_price_brl: v })} type="number" required />
        <Field label="Preço venda (R$)" value={form.sale_price_brl} onChange={(v) => setForm({ ...form, sale_price_brl: v })} type="number" required />
        <Field label="Alerta estoque mín." value={form.min_stock_alert} onChange={(v) => setForm({ ...form, min_stock_alert: v })} type="number" />
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
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await addMovement({
      product_id: form.product_id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_cost_brl: form.unit_cost_brl ? Number(form.unit_cost_brl) : null,
      container_id: form.container_id || null,
      sale_id: null,
      notes: form.notes || null,
      moved_at: new Date().toISOString(),
    })
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
        <Field label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} className="md:col-span-2" />
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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  className?: string
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
