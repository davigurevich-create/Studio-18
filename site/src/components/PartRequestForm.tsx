import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Factory, Printer } from 'lucide-react'
import { getCatalog, submitPartRequest, type PartRequestInput } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

const replacementOptions: {
  id: PartRequestInput['replacementType']
  icon: typeof Printer
  title: string
  hint: string
}[] = [
  {
    id: 'impressao_3d',
    icon: Printer,
    title: 'Peça impressa em 3D',
    hint: 'Produzida no nosso estúdio e enviada em até 2 dias úteis.',
  },
  {
    id: 'original_fabricante',
    icon: Factory,
    title: 'Peça original do fabricante',
    hint: 'Solicitada direto ao fabricante — prazo de envio maior.',
  },
]

export function PartRequestForm() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [orderReference, setOrderReference] = useState('')
  const [productModel, setProductModel] = useState('')
  const [partDescription, setPartDescription] = useState('')
  const [replacementType, setReplacementType] = useState<PartRequestInput['replacementType']>('impressao_3d')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCatalog().then(setCatalog)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await submitPartRequest({
        customerName,
        customerEmail,
        orderReference,
        productModel,
        partDescription,
        replacementType,
      })
      setDone(true)
    } catch {
      setError('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center rounded-2xl border p-10 text-center"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
      >
        <div className="mb-4 text-4xl" style={{ color: 'var(--gold)' }}>✓</div>
        <h3 className="mb-2 text-xl" style={{ color: 'var(--ink)' }}>
          Solicitação recebida!
        </h3>
        <p className="max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Já registramos seu pedido de reposição e enviamos um e-mail de confirmação para{' '}
          <strong style={{ color: 'var(--ink)' }}>{customerEmail}</strong>. Nossa equipe cuida do resto — sem
          nenhum custo para você.
        </p>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome completo" value={customerName} onChange={setCustomerName} required />
        <Field label="E-mail" value={customerEmail} onChange={setCustomerEmail} type="email" required />
        <Field label="Número do pedido" value={orderReference} onChange={setOrderReference} required />
        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            MODELO DO SET
          </label>
          <select
            value={productModel}
            onChange={(e) => setProductModel(e.target.value)}
            required
            className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: productModel ? 'var(--ink)' : 'var(--ink-muted)' }}
          >
            <option value="" disabled style={{ color: 'var(--ink-muted)' }}>
              Selecione o modelo...
            </option>
            {catalog.map((p) => (
              <option key={p.id} value={p.name} style={{ color: 'var(--ink)', background: 'var(--carbon-2)' }}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          DESCREVA A PEÇA FALTANTE
        </label>
        <textarea
          value={partDescription}
          onChange={(e) => setPartDescription(e.target.value)}
          required
          rows={3}
          placeholder="Ex: peça pequena cinza, formato de suporte, próxima ao eixo dianteiro esquerdo..."
          className="w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        />
      </div>

      <div>
        <label className="mb-3 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          COMO VOCÊ PREFERE RECEBER A REPOSIÇÃO?
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {replacementOptions.map((opt) => {
            const Icon = opt.icon
            const active = replacementType === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setReplacementType(opt.id)}
                className="rounded-xl border p-4 text-left transition"
                style={{
                  borderColor: active ? 'var(--gold)' : 'var(--hairline)',
                  background: active ? 'var(--gold-wash)' : 'var(--carbon-1)',
                }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: active ? 'var(--gold-bright)' : 'var(--ink-muted)' }} />
                <div className="mt-2 text-sm font-medium" style={{ color: active ? 'var(--gold-bright)' : 'var(--ink)' }}>
                  {opt.title}
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {opt.hint}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--gold-bright)' }}>
          As duas opções são 100% gratuitas — nunca cobramos pela reposição de peças.
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        {submitting ? 'Enviando...' : 'Enviar solicitação'}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
      />
    </div>
  )
}
