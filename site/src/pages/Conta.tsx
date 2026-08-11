import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Package, PackageX, Wrench } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  getMyOrders,
  getMyPartRequests,
  getMyWaitlist,
  leaveWaitlist,
  type MyOrder,
  type MyPartRequest,
  type MyWaitlistEntry,
} from '@/lib/api'
import { PartRequestForm, formatOrderTotal } from '@/components/PartRequestForm'
import { formatBRL } from '@/lib/format'

const statusLabel: Record<string, string> = {
  pendente: 'Pedido registrado',
  pago: 'Pagamento confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const statusColor: Record<string, string> = {
  pendente: 'var(--ink-muted)',
  pago: 'var(--gold-bright)',
  enviado: 'var(--gold-bright)',
  entregue: '#8fce8f',
  cancelado: '#e88b8b',
}

const partStatusLabel: Record<string, string> = {
  pendente: 'Recebida',
  em_producao: 'Em produção',
  enviado: 'Enviada',
  concluido: 'Concluída',
}

type Tab = 'pedidos' | 'pecas' | 'espera'

export function Conta() {
  const { session, loading, demo, requestCode, verifyCode, signOut } = useAuth()
  const [previewingDemo, setPreviewingDemo] = useState(false)

  if (loading) {
    return <div className="px-6 py-40 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>Carregando...</div>
  }

  if (!session && !previewingDemo) {
    return <LoginForm demo={demo} requestCode={requestCode} verifyCode={verifyCode} onPreviewDemo={() => setPreviewingDemo(true)} />
  }

  return (
    <AccountDashboard
      onSignOut={async () => {
        await signOut()
        setPreviewingDemo(false)
      }}
    />
  )
}

function LoginForm({
  demo,
  requestCode,
  verifyCode,
  onPreviewDemo,
}: {
  demo: boolean
  requestCode: (email: string) => Promise<string | null>
  verifyCode: (email: string, code: string) => Promise<string | null>
  onPreviewDemo: () => void
}) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await requestCode(email.trim())
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setStep('code')
    setResendCooldown(30)
  }

  const confirmCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await verifyCode(email.trim(), code.trim())
    setSubmitting(false)
    if (err) setError(err)
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Minha conta</h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Acompanhe seus pedidos, solicite peças faltantes e gerencie sua lista de espera — sem senha, só com um
        código enviado ao seu e-mail.
      </p>

      {demo && (
        <div
          className="mb-6 flex flex-col gap-2 rounded-lg px-4 py-3 text-xs"
          style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
        >
          <span>Modo demonstração: conecte o Supabase para enviar códigos de verdade.</span>
          <button type="button" onClick={onPreviewDemo} className="self-start underline">
            Ver exemplo da área logada
          </button>
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-6">
          <Field label="E-mail" value={email} onChange={setEmail} type="email" required placeholder="seu@email.com" />
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            {submitting ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmCode} className="flex flex-col gap-6">
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Enviamos um código de 6 dígitos para <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
          </p>
          <Field label="Código" value={code} onChange={setCode} required placeholder="000000" />
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            {submitting ? 'Confirmando...' : 'Confirmar código'}
          </button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={resendCooldown > 0}
            className="text-xs disabled:opacity-50"
            style={{ color: 'var(--ink-muted)' }}
          >
            {resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Reenviar código'}
          </button>
        </form>
      )}
    </div>
  )
}

function AccountDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('pedidos')
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [partRequests, setPartRequests] = useState<MyPartRequest[]>([])
  const [waitlist, setWaitlist] = useState<MyWaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = () => {
    Promise.all([getMyOrders(), getMyPartRequests(), getMyWaitlist()]).then(([o, p, w]) => {
      setOrders(o)
      setPartRequests(p)
      setWaitlist(w)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'pedidos', label: 'Meus pedidos', icon: Package },
    { id: 'pecas', label: 'Peças faltantes', icon: Wrench },
    { id: 'espera', label: 'Lista de espera', icon: PackageX },
  ]

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl">Minha conta</h1>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition"
              style={{
                borderColor: active ? 'var(--gold)' : 'var(--hairline)',
                background: active ? 'var(--gold-wash)' : 'transparent',
                color: active ? 'var(--gold-bright)' : 'var(--ink-secondary)',
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Carregando...
        </p>
      ) : (
        <>
          {tab === 'pedidos' && <OrdersTab orders={orders} />}
          {tab === 'pecas' && <PartRequestsTab orders={orders} requests={partRequests} onSubmitted={reload} />}
          {tab === 'espera' && <WaitlistTab entries={waitlist} onChange={reload} />}
        </>
      )}
    </div>
  )
}

function OrdersTab({ orders }: { orders: MyOrder[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Você ainda não fez nenhum pedido.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((o) => (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                PEDIDO #{o.id.slice(0, 8)} · {new Date(o.sale_date).toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm font-medium" style={{ color: statusColor[o.status] ?? 'var(--ink)' }}>
                {statusLabel[o.status] ?? o.status}
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--gold-bright)' }}>
              {formatOrderTotal(o)}
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            {o.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--ink-secondary)' }}>
                  {item.quantity}x {item.product_name}
                </span>
                <span style={{ color: 'var(--ink-muted)' }}>{formatBRL(item.unit_price_brl * item.quantity)}</span>
              </div>
            ))}
          </div>
          {o.shipping_city && (
            <p className="mt-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
              Entrega: {o.shipping_street_name}, {o.shipping_street_number} — {o.shipping_neighborhood},{' '}
              {o.shipping_city}/{o.shipping_federal_unit}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function PartRequestsTab({
  orders,
  requests,
  onSubmitted,
}: {
  orders: MyOrder[]
  requests: MyPartRequest[]
  onSubmitted: () => void
}) {
  const [showForm, setShowForm] = useState(requests.length === 0)

  return (
    <div className="flex flex-col gap-6">
      {requests.length > 0 && (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {r.product_model}
                </span>
                <span className="text-xs" style={{ color: 'var(--gold-bright)' }}>
                  {partStatusLabel[r.status] ?? r.status}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {r.part_description}
              </p>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                {new Date(r.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <PartRequestForm
          orders={orders}
          onSubmitted={() => {
            setShowForm(false)
            onSubmitted()
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start rounded-full border px-6 py-2.5 text-sm font-medium"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        >
          + Nova solicitação
        </button>
      )}
    </div>
  )
}

function WaitlistTab({ entries, onChange }: { entries: MyWaitlistEntry[]; onChange: () => void }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Você não está na lista de espera de nenhum produto no momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between gap-4 rounded-xl border p-4"
          style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        >
          <div className="flex items-center gap-3">
            {e.product?.image_url && (
              <img src={e.product.image_url} alt={e.product.name} className="h-12 w-12 rounded-lg object-cover" />
            )}
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {e.product?.name ?? 'Produto'}
              </div>
              <div className="text-xs" style={{ color: e.notified ? '#8fce8f' : 'var(--ink-muted)' }}>
                {e.notified ? 'Você já foi avisado' : 'Aguardando reposição'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => leaveWaitlist(e.id).then(onChange)}
            className="text-xs"
            style={{ color: 'var(--ink-muted)' }}
          >
            Remover
          </button>
        </div>
      ))}
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
