import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getOrderStatus, isDemoMode, type OrderStatus } from '@/lib/api'

const steps: { id: string; label: string }[] = [
  { id: 'pendente', label: 'Pedido registrado' },
  { id: 'pago', label: 'Pagamento confirmado' },
  { id: 'enviado', label: 'Enviado' },
  { id: 'entregue', label: 'Entregue' },
]

export function Rastreio() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await getOrderStatus(orderId.trim().replace(/^#/, ''), email.trim())
      setOrder(result)
      setSearched(true)
      if (!result) setError('Não encontramos nenhum pedido com esses dados. Confira o número do pedido e o e-mail usados na compra.')
    } catch {
      setError('Não foi possível consultar o pedido agora. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = order ? steps.findIndex((s) => s.id === order.status) : -1
  const isCancelled = order?.status === 'cancelado'

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Rastrear pedido</h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Informe o número do pedido (enviado na confirmação de compra) e o e-mail usado no checkout.
      </p>

      {isDemoMode && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-xs"
          style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
        >
          Modo demonstração: conecte o Supabase para consultar pedidos reais.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label="Número do pedido" value={orderId} onChange={setOrderId} required placeholder="ex: 6818de84-79fe-4706-8dec-297638a81ec9" />
        <Field label="E-mail usado na compra" value={email} onChange={setEmail} type="email" required />

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {loading ? 'Consultando...' : 'Consultar pedido'}
        </button>
      </form>

      {searched && order && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-xl border p-6"
          style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        >
          <div className="mb-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
            PEDIDO
          </div>
          <div className="mb-4 text-sm" style={{ color: 'var(--ink)' }}>
            {order.product_names.join(', ')}
          </div>

          {isCancelled ? (
            <p className="text-sm" style={{ color: '#e88b8b' }}>
              Este pedido foi cancelado.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
                    style={{
                      background: i <= stepIndex ? 'var(--gold)' : 'var(--carbon-3)',
                      color: i <= stepIndex ? '#0a0a0a' : 'var(--ink-muted)',
                    }}
                  >
                    {i <= stepIndex ? '✓' : ''}
                  </div>
                  <span
                    className="text-sm"
                    style={{ color: i <= stepIndex ? 'var(--ink)' : 'var(--ink-muted)' }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {order.shipping_city && (
            <p className="mt-6 text-xs" style={{ color: 'var(--ink-muted)' }}>
              Destino: {order.shipping_city} · {order.shipping_federal_unit}
            </p>
          )}
        </motion.div>
      )}

      <Link to="/" className="mt-10 inline-block text-sm" style={{ color: 'var(--ink-muted)' }}>
        ← Voltar para a coleção
      </Link>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
      />
    </div>
  )
}
