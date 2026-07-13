import { useEffect, useState, type FormEvent } from 'react'
import { createSale, getProducts, getSaleItems, getSales, updateSaleStatus } from '@/lib/api'
import { Badge, Button, Card, PageHeader, formatBRL } from '@/components/ui'
import type { NewSaleItemInput } from '@/lib/api'
import type { Product, Sale, SaleItem, SaleStatus } from '@/types/domain'

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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const reload = () => {
    Promise.all([getSales(), getSaleItems(), getProducts()]).then(([s, si, p]) => {
      setSales(s)
      setSaleItems(si)
      setProducts(p)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const changeStatus = async (id: string, status: SaleStatus) => {
    await updateSaleStatus(id, status)
    reload()
  }

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

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Canal</th>
              <th className="pb-2 font-medium">Itens</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const items = saleItems.filter((i) => i.sale_id === s.id)
              const total = items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl + s.shipping_cost_brl
              return (
                <tr key={s.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.sale_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {s.customer_name ?? '—'}
                  </td>
                  <td className="py-2.5 capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {s.channel}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {items.map((i) => {
                      const p = products.find((pr) => pr.id === i.product_id)
                      return (
                        <div key={i.id}>
                          {i.quantity}x {p?.sku ?? i.product_id}
                        </div>
                      )
                    })}
                  </td>
                  <td className="tabular py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatBRL(total)}
                  </td>
                  <td className="py-2.5">
                    <select
                      value={s.status}
                      onChange={(e) => changeStatus(s.id, e.target.value as SaleStatus)}
                      className="rounded-md border-0 bg-transparent text-xs"
                      style={{ color: 'inherit' }}
                    >
                      {(['pendente', 'pago', 'enviado', 'entregue', 'cancelado'] as SaleStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                    </div>
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
