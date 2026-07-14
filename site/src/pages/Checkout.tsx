import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, isDemoMode, submitOrder } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import type { CatalogProduct, PaymentMethod } from '@/types/catalog'

const methods: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'pix', label: 'PIX', hint: 'Aprovação em minutos' },
  { id: 'cartao', label: 'Cartão', hint: 'Crédito, em até 12x' },
  { id: 'boleto', label: 'Boleto', hint: 'Compensação em até 3 dias úteis' },
]

export function Checkout() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getProduct(id).then((p) => setProduct(p ?? null))
  }, [id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!product) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitOrder(product, {
        productId: product.id,
        customerName: name,
        customerContact: contact,
        paymentMethod: method,
      })
      setOrderId(result.orderId)
    } catch {
      setError('Não foi possível registrar o pedido agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (product === undefined) {
    return <div className="px-6 py-40 text-center" style={{ color: 'var(--ink-muted)' }}>Carregando...</div>
  }

  if (product === null) {
    return (
      <div className="px-6 py-40 text-center">
        <p style={{ color: 'var(--ink-muted)' }}>Modelo não encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-sm" style={{ color: 'var(--gold)' }}>
          Voltar para a coleção
        </Link>
      </div>
    )
  }

  if (orderId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-40 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mb-5 text-4xl" style={{ color: 'var(--gold)' }}>
            ✓
          </div>
          <h1 className="mb-3 text-2xl">Pedido registrado</h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Recebemos seu pedido do <strong style={{ color: 'var(--ink)' }}>{product.name}</strong> via{' '}
            <strong style={{ color: 'var(--ink)' }}>{methods.find((m) => m.id === method)?.label}</strong>. Nossa
            equipe vai entrar em contato para confirmar o pagamento e os próximos passos da entrega.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-medium"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Voltar para a coleção
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <Link to={`/produto/${product.id}`} className="mb-8 inline-block text-sm" style={{ color: 'var(--ink-muted)' }}>
        ← Voltar para o modelo
      </Link>

      <h1 className="mb-8 text-3xl">Finalizar pedido</h1>

      {isDemoMode && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-xs"
          style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
        >
          Modo demonstração: este pedido não será salvo (conecte o Supabase para registrar pedidos de verdade).
        </div>
      )}

      <div
        className="mb-8 flex items-center justify-between rounded-xl border p-4"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
      >
        <div>
          <div className="text-sm" style={{ color: 'var(--ink)' }}>
            {product.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {product.manufacturer} · {product.scale} · {product.piece_count?.toLocaleString('pt-BR')} peças
          </div>
        </div>
        <div className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
          {formatBRL(product.sale_price_brl)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            FORMA DE PAGAMENTO
          </label>
          <div className="grid grid-cols-3 gap-3">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className="rounded-lg border p-3 text-left transition"
                style={{
                  borderColor: method === m.id ? 'var(--gold)' : 'var(--hairline)',
                  background: method === m.id ? 'var(--gold-wash)' : 'var(--carbon-2)',
                }}
              >
                <div className="text-sm font-medium" style={{ color: method === m.id ? 'var(--gold-bright)' : 'var(--ink)' }}>
                  {m.label}
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  {m.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Field label="Nome completo" value={name} onChange={setName} required />
        <Field label="E-mail ou WhatsApp" value={contact} onChange={setContact} required />

        {method === 'pix' && (
          <PaymentNote text="Após confirmar, geramos o QR Code / código PIX copia-e-cola para pagamento." />
        )}
        {method === 'cartao' && (
          <PaymentNote text="Após confirmar, você será direcionado para a página segura de pagamento com cartão." />
        )}
        {method === 'boleto' && (
          <PaymentNote text="Após confirmar, o boleto é gerado e enviado para o seu e-mail." />
        )}

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {submitting ? 'Registrando pedido...' : `Confirmar pedido — ${formatBRL(product.sale_price_brl)}`}
        </button>
      </form>
    </div>
  )
}

function PaymentNote({ text }: { text: string }) {
  return (
    <p className="rounded-lg border px-4 py-3 text-xs" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}>
      {text}
    </p>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
      />
    </div>
  )
}
