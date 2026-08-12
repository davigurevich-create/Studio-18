import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Gift, Heart, IdCard, LogOut, Package, PackageX, Wrench } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import {
  getMyOrders,
  getMyPartRequests,
  getMyWaitlist,
  leaveWaitlist,
  getReferralCode,
  getMyRewardCoupons,
  getMyProfile,
  saveMyProfile,
  getMyAddresses,
  addMyAddress,
  deleteMyAddress,
  setDefaultAddress,
  getMyNotificationPrefs,
  saveMyNotificationPrefs,
  type MyOrder,
  type MyPartRequest,
  type MyWaitlistEntry,
  type ReferralInfo,
  type MyRewardCoupon,
  type MyAddress,
  type NotificationPrefs,
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

type Tab = 'pedidos' | 'pecas' | 'espera' | 'favoritos' | 'indicacao' | 'dados' | 'notificacoes'

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
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'indicacao', label: 'Indicação de amigos', icon: Gift },
    { id: 'dados', label: 'Meus dados', icon: IdCard },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
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

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
        {/* Mobile: grade de 2 colunas — compacta, sem barra de rolagem
            horizontal colada no conteúdo. */}
        <nav className="grid grid-cols-2 gap-2 sm:hidden">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition"
                style={{
                  borderColor: active ? 'var(--gold)' : 'var(--hairline)',
                  background: active ? 'var(--gold-wash)' : 'transparent',
                  color: active ? 'var(--gold-bright)' : 'var(--ink-secondary)',
                }}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Desktop: menu lateral fixo, sem rolagem — padrão de área de
            conta (Amazon/Mercado Livre) em vez de abas horizontais. */}
        <nav className="hidden shrink-0 flex-col gap-1 sm:flex sm:w-60">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition"
                style={{
                  background: active ? 'var(--gold-wash)' : 'transparent',
                  color: active ? 'var(--gold-bright)' : 'var(--ink-secondary)',
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                }}
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1 border-t pt-8 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0" style={{ borderColor: 'var(--hairline)' }}>
          {loading ? (
            <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              Carregando...
            </p>
          ) : (
            <>
              {tab === 'pedidos' && <OrdersTab orders={orders} />}
              {tab === 'pecas' && <PartRequestsTab orders={orders} requests={partRequests} onSubmitted={reload} />}
              {tab === 'espera' && <WaitlistTab entries={waitlist} onChange={reload} />}
              {tab === 'favoritos' && <FavoritesTab />}
              {tab === 'indicacao' && <ReferralTab />}
              {tab === 'dados' && <ProfileTab />}
              {tab === 'notificacoes' && <NotificationsTab />}
            </>
          )}
        </div>
      </div>
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

function FavoritesTab() {
  const { favorites, loading, toggleFavorite } = useFavorites()

  if (loading) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Carregando...
      </p>
    )
  }

  if (favorites.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Você ainda não favoritou nenhum modelo. Clique no coração em qualquer produto da coleção para salvá-lo aqui.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {favorites.map((f) => (
        <div
          key={f.id}
          className="flex items-center justify-between gap-4 rounded-xl border p-4"
          style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        >
          <Link to={`/produto/${f.product_id}`} className="flex items-center gap-3">
            {f.product?.image_url && (
              <img src={f.product.image_url} alt={f.product.name} className="h-12 w-12 rounded-lg object-cover" />
            )}
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {f.product?.name ?? 'Produto'}
              </div>
              {f.product && (
                <div className="text-xs" style={{ color: 'var(--gold-bright)' }}>
                  {formatBRL(f.product.sale_price_brl)}
                </div>
              )}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => toggleFavorite(f.product_id)}
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

function ReferralTab() {
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [rewards, setRewards] = useState<MyRewardCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getReferralCode(), getMyRewardCoupons()]).then(([i, r]) => {
      setInfo(i)
      setRewards(r)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Carregando...
      </p>
    )
  }

  const copyCode = () => {
    if (!info) return
    navigator.clipboard.writeText(info.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
        <p className="mb-4 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Compartilhe seu código com um amigo — ele ganha {info?.discountPct}% de desconto na primeira compra, e
          você ganha um cupom de {info?.discountPct}% assim que o pedido dele for registrado.
        </p>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3" style={{ borderColor: 'var(--hairline)' }}>
          <code className="flex-1 text-sm font-semibold tracking-wide" style={{ color: 'var(--gold-bright)' }}>
            {info?.code}
          </code>
          <button
            type="button"
            onClick={copyCode}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: copied ? '#3f7f4f' : 'var(--gold)',
              color: copied ? '#f3f1ec' : '#0a0a0a',
            }}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Cupons ganhos por indicação
        </h3>
        {rewards.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Ainda nenhum amigo comprou com o seu código.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rewards.map((r) => {
              const used = r.uses_count > 0
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: 'var(--hairline)' }}
                >
                  <code style={{ color: used ? 'var(--ink-muted)' : 'var(--gold-bright)' }}>{r.code}</code>
                  <span style={{ color: used ? 'var(--ink-muted)' : '#8fce8f' }}>
                    {used ? 'Já usado' : `${r.discount_pct}% disponível`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileTab() {
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [addresses, setAddresses] = useState<MyAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const reload = () => {
    Promise.all([getMyProfile(), getMyAddresses()]).then(([p, a]) => {
      setFullName(p.fullName)
      setCpf(p.cpf)
      setAddresses(a)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await saveMyProfile({ fullName, cpf })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Carregando...
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={saveProfile} className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Dados pessoais
        </h3>
        <Field label="Nome completo" value={fullName} onChange={setFullName} />
        <Field label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar dados'}
        </button>
      </form>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Endereços salvos
          </h3>
          {!showAddressForm && (
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="text-xs"
              style={{ color: 'var(--gold-bright)' }}
            >
              + Novo endereço
            </button>
          )}
        </div>

        {addresses.length === 0 && !showAddressForm && (
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Nenhum endereço salvo ainda.
          </p>
        )}

        {addresses.length > 0 && (
          <div className="flex flex-col gap-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 rounded-xl border p-4"
                style={{
                  borderColor: a.is_default ? 'var(--gold-dim)' : 'var(--hairline)',
                  background: 'var(--carbon-2)',
                }}
              >
                <div className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  {a.is_default && (
                    <span className="mb-1 block text-[10px] font-semibold tracking-widest" style={{ color: 'var(--gold-bright)' }}>
                      PADRÃO
                    </span>
                  )}
                  {a.street_name}, {a.street_number}
                  {a.complement ? ` — ${a.complement}` : ''}
                  <br />
                  {a.neighborhood}, {a.city}/{a.federal_unit} — {a.zip_code}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                  {!a.is_default && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(a.id).then(reload)}
                      style={{ color: 'var(--gold-bright)' }}
                    >
                      Tornar padrão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMyAddress(a.id).then(reload)}
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddressForm && (
          <AddressForm
            isFirst={addresses.length === 0}
            onCancel={() => setShowAddressForm(false)}
            onSaved={() => {
              setShowAddressForm(false)
              reload()
            }}
          />
        )}
      </div>
    </div>
  )
}

function AddressForm({
  isFirst,
  onCancel,
  onSaved,
}: {
  isFirst: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const [zipCode, setZipCode] = useState('')
  const [streetName, setStreetName] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [federalUnit, setFederalUnit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await addMyAddress({
      label: null,
      zip_code: zipCode,
      street_name: streetName,
      street_number: streetNumber,
      complement: complement || null,
      neighborhood,
      city,
      federal_unit: federalUnit,
      is_default: isFirst,
    })
    setSubmitting(false)
    onSaved()
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)' }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CEP" value={zipCode} onChange={setZipCode} required placeholder="00000-000" />
        <Field label="Número" value={streetNumber} onChange={setStreetNumber} required />
        <div className="col-span-2">
          <Field label="Rua" value={streetName} onChange={setStreetName} required />
        </div>
        <div className="col-span-2">
          <Field label="Complemento (opcional)" value={complement} onChange={setComplement} />
        </div>
        <Field label="Bairro" value={neighborhood} onChange={setNeighborhood} required />
        <Field label="Cidade" value={city} onChange={setCity} required />
        <Field label="Estado (UF)" value={federalUnit} onChange={setFederalUnit} required placeholder="SP" />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {submitting ? 'Salvando...' : 'Salvar endereço'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)

  useEffect(() => {
    getMyNotificationPrefs().then(setPrefs)
  }, [])

  const update = (patch: Partial<NotificationPrefs>) => {
    if (!prefs) return
    const next = { ...prefs, ...patch }
    setPrefs(next)
    saveMyNotificationPrefs(next)
  }

  if (!prefs) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Carregando...
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleRow
        label="Avisos de reposição de estoque"
        description="Receber e-mail quando um produto da sua lista de espera voltar a ter estoque."
        checked={prefs.restockAlerts}
        onChange={(v) => update({ restockAlerts: v })}
      />
      <ToggleRow
        label="Novidades do Studio 18"
        description="Lançamentos, promoções e conteúdo por e-mail."
        checked={prefs.newsUpdates}
        onChange={(v) => update({ newsUpdates: v })}
      />
      <p className="mt-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
        E-mails de confirmação e status do seu pedido são sempre enviados, independente destas preferências.
      </p>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border p-4"
      style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          {description}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-label={label}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? 'var(--gold)' : 'var(--carbon-3)' }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
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
