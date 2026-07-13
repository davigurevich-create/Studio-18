import { useEffect, useState, type FormEvent } from 'react'
import { addMovement, createProduct, getContainers, getProducts, getStock } from '@/lib/api'
import { Badge, Button, Card, PageHeader, formatBRL } from '@/components/ui'
import type { Container, MovementType, Product, ProductStock } from '@/types/domain'

export function Estoque() {
  const [stock, setStock] = useState<ProductStock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)

  const reload = () => {
    Promise.all([getStock(), getProducts(), getContainers()]).then(([s, p, c]) => {
      setStock(s)
      setProducts(p)
      setContainers(c)
      setLoading(false)
    })
  }

  useEffect(reload, [])

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

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">Produto</th>
              <th className="pb-2 font-medium">Categoria</th>
              <th className="pb-2 font-medium">Em estoque</th>
              <th className="pb-2 font-medium">Custo unit.</th>
              <th className="pb-2 font-medium">Preço venda</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((p) => {
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
                  <td className="tabular py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatBRL(p.cost_price_brl)}
                  </td>
                  <td className="tabular py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatBRL(p.sale_price_brl)}
                  </td>
                  <td className="py-2.5">
                    {low ? <Badge tone="warning">Estoque baixo</Badge> : <Badge tone="good">OK</Badge>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
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
