import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CardPayment } from '@mercadopago/sdk-react'
import {
  createPayment,
  getCatalog,
  getMyAddresses,
  getMyOrders,
  getMyProfile,
  isDemoMode,
  validateCoupon,
  type CreatePaymentResult,
} from '@/lib/api'
import { ensureMercadoPagoInit, isMercadoPagoConfigured } from '@/lib/mercadopago'
import { formatBRL } from '@/lib/format'
import { pixPrice } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import type { CatalogProduct, PaymentMethod } from '@/types/catalog'

const methods: { id: PaymentMethod; label: string; hint: string; badge?: string }[] = [
  { id: 'pix', label: 'PIX', hint: 'Aprovação em minutos', badge: '-10%' },
  { id: 'cartao', label: 'Cartão', hint: 'Crédito, em até 12x' },
  { id: 'boleto', label: 'Boleto', hint: 'Compensação em até 3 dias úteis' },
]

export function Checkout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { lines, clear } = useCart()
  const [catalog, setCatalog] = useState<CatalogProduct[] | undefined>(undefined)
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [streetName, setStreetName] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [federalUnit, setFederalUnit] = useState('')
  const [step, setStep] = useState<'form' | 'card' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CreatePaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<'order' | 'pix' | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number } | null>(null)

  const copyToClipboard = useCallback((field: 'order' | 'pix', text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000)
  }, [])

  useEffect(() => {
    getCatalog().then(setCatalog)
  }, [])

  useEffect(() => {
    // Se o cliente já estiver logado, pré-preenche com o e-mail da sessão,
    // nome/CPF salvos em "Meus dados" e o endereço marcado como padrão —
    // com o endereço do pedido mais recente como reserva, caso ele ainda
    // não tenha salvo nenhum endereço. Só agiliza, nunca é obrigatório
    // estar logado para comprar.
    if (!session?.user.email) return
    setEmail(session.user.email)
    Promise.all([getMyProfile(), getMyAddresses(), getMyOrders()])
      .then(([profile, addresses, orders]) => {
        if (profile.fullName) setName(profile.fullName)
        if (profile.cpf) setCpf(profile.cpf)

        const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0]
        if (defaultAddress) {
          setZipCode(defaultAddress.zip_code)
          setStreetName(defaultAddress.street_name)
          setStreetNumber(defaultAddress.street_number)
          setComplement(defaultAddress.complement ?? '')
          setNeighborhood(defaultAddress.neighborhood)
          setCity(defaultAddress.city)
          setFederalUnit(defaultAddress.federal_unit)
          return
        }

        const last = orders[0]
        if (!last) return
        if (!profile.fullName && last.customer_name) setName(last.customer_name)
        if (last.shipping_zip_code) setZipCode(last.shipping_zip_code)
        if (last.shipping_street_name) setStreetName(last.shipping_street_name)
        if (last.shipping_street_number) setStreetNumber(last.shipping_street_number)
        if (last.shipping_complement) setComplement(last.shipping_complement)
        if (last.shipping_neighborhood) setNeighborhood(last.shipping_neighborhood)
        if (last.shipping_city) setCity(last.shipping_city)
        if (last.shipping_federal_unit) setFederalUnit(last.shipping_federal_unit)
      })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    if (method === 'cartao') ensureMercadoPagoInit()
  }, [method])

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: catalog?.find((p) => p.id === l.productId) }))
        .filter((i): i is { line: typeof lines[number]; product: CatalogProduct } => Boolean(i.product)),
    [lines, catalog],
  )

  const subtotal = items.reduce((t, i) => t + i.product.sale_price_brl * i.line.quantity, 0)
  const priceBeforeCoupon = method === 'pix' ? pixPrice(subtotal) : subtotal
  const total = appliedCoupon
    ? Math.round(priceBeforeCoupon * (1 - appliedCoupon.discountPct / 100) * 100) / 100
    : priceBeforeCoupon

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim()
    if (!code) return
    setCouponStatus('checking')
    try {
      const res = await validateCoupon(code)
      if (res.valid) {
        setAppliedCoupon({ code: code.toUpperCase(), discountPct: res.discountPct })
        setCouponStatus('valid')
      } else {
        setAppliedCoupon(null)
        setCouponStatus('invalid')
      }
    } catch {
      setAppliedCoupon(null)
      setCouponStatus('invalid')
    }
  }, [couponInput])

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null)
    setCouponStatus('idle')
    setCouponInput('')
  }, [])

  const checkoutItems = useMemo(
    () => items.map((i) => ({ productId: i.product.id, quantity: i.line.quantity })),
    [items],
  )

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('Informe um CPF válido (11 dígitos).')
      return
    }
    if (!zipCode || !streetName || !streetNumber || !neighborhood || !city || !federalUnit) {
      setError('Preencha o endereço de entrega completo.')
      return
    }
    setError(null)

    if (method === 'cartao') {
      setStep('card')
      return
    }

    setSubmitting(true)
    try {
      const res = await createPayment({
        items: checkoutItems,
        customerName: name,
        customerEmail: email,
        customerCpf: cpf,
        paymentMethod: method,
        address: { zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit },
        couponCode: appliedCoupon?.code,
      })
      setResult(res)
      setStep('done')
      clear()
    } catch {
      setError('Não foi possível registrar o pedido agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCardSubmit = useCallback(
    async (formData: { token: string; installments: number; payment_method_id: string }) => {
      if (checkoutItems.length === 0) return
      try {
        const res = await createPayment({
          items: checkoutItems,
          customerName: name,
          customerEmail: email,
          customerCpf: cpf,
          paymentMethod: 'cartao',
          cardToken: formData.token,
          cardPaymentMethodId: formData.payment_method_id,
          installments: formData.installments,
          address: { zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit },
          couponCode: appliedCoupon?.code,
        })
        setResult(res)
        setStep('done')
        clear()
      } catch {
        setError('Não foi possível processar o pagamento agora. Tente novamente.')
        throw new Error('payment_failed')
      }
    },
    [checkoutItems, name, email, cpf, zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit, clear, appliedCoupon],
  )

  const handleCardError = useCallback(() => {
    setError('Não foi possível validar os dados do cartão.')
  }, [])

  const cardInitialization = useMemo(() => ({ amount: total }), [total])

  if (catalog === undefined) {
    return <div className="px-6 py-40 text-center" style={{ color: 'var(--ink-muted)' }}>Carregando...</div>
  }

  if (step !== 'done' && items.length === 0) {
    return (
      <div className="px-6 py-40 text-center">
        <p style={{ color: 'var(--ink-muted)' }}>Seu carrinho está vazio.</p>
        <Link to="/" className="mt-4 inline-block text-sm" style={{ color: 'var(--gold)' }}>
          Voltar para a coleção
        </Link>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div className="mx-auto max-w-lg px-6 py-40 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          {result.status === 'cancelado' ? (
            <>
              <div className="mb-5 text-4xl" style={{ color: '#e88b8b' }}>✕</div>
              <h1 className="mb-3 text-2xl">Pagamento não aprovado</h1>
              <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                O pagamento do seu pedido não foi aprovado. Você pode tentar novamente com outro cartão ou forma de
                pagamento.
              </p>
              <button
                onClick={() => {
                  setStep('form')
                  setResult(null)
                }}
                className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-medium"
                style={{ background: 'var(--gold)', color: '#0a0a0a' }}
              >
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <div className="mb-5 text-4xl" style={{ color: 'var(--gold)' }}>✓</div>
              <h1 className="mb-3 text-2xl">
                {result.status === 'pago' ? 'Pagamento aprovado' : 'Pedido registrado'}
              </h1>
              <p className="mb-3 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                Recebemos seu pedido via{' '}
                <strong style={{ color: 'var(--ink)' }}>{methods.find((m) => m.id === method)?.label}</strong>.
              </p>

              <div
                className="mb-6 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs"
                style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)', color: 'var(--ink-muted)' }}
              >
                <span>Número do pedido:</span>
                <code style={{ color: 'var(--gold-bright)' }}>{result.orderId}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('order', result.orderId)}
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: copiedField === 'order' ? '#3f7f4f' : 'var(--gold)',
                    color: copiedField === 'order' ? '#f3f1ec' : '#0a0a0a',
                  }}
                >
                  {copiedField === 'order' ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>

              {method === 'pix' && result.pix?.qrCodeBase64 && (
                <div className="mb-6 rounded-xl border p-5" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
                  <img
                    src={`data:image/png;base64,${result.pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="mx-auto mb-4 h-48 w-48 rounded-lg bg-white p-2"
                  />
                  <p className="mb-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    PIX copia e cola
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--hairline)' }}>
                    <code className="flex-1 truncate text-left text-[11px]" style={{ color: 'var(--ink-secondary)' }}>
                      {result.pix.qrCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('pix', result.pix?.qrCode ?? '')}
                      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                      style={{
                        background: copiedField === 'pix' ? '#3f7f4f' : 'var(--gold)',
                        color: copiedField === 'pix' ? '#f3f1ec' : '#0a0a0a',
                      }}
                    >
                      {copiedField === 'pix' ? '✓ Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {method === 'boleto' && result.boleto?.ticketUrl && (
                <div className="mb-6 rounded-xl border p-5" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
                  <a
                    href={result.boleto.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full px-6 py-2.5 text-sm font-medium"
                    style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                  >
                    Ver boleto para pagamento
                  </a>
                </div>
              )}

              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Assim que o pagamento for confirmado, nossa equipe já recebe o aviso automaticamente. Guarde o
                número do pedido acima e o e-mail usado na compra para acompanhar o status a qualquer momento em{' '}
                <Link to="/rastreio" style={{ color: 'var(--gold)' }}>
                  /rastreio
                </Link>
                .
              </p>
              <Link
                to="/"
                className="mt-8 inline-block rounded-full border px-6 py-2.5 text-sm font-medium"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              >
                Voltar para a coleção
              </Link>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <button onClick={() => navigate(-1)} className="mb-8 text-sm" style={{ color: 'var(--ink-muted)' }}>
        ← Voltar
      </button>

      <h1 className="mb-8 text-3xl">Finalizar pedido</h1>

      {(isDemoMode || !isMercadoPagoConfigured) && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-xs"
          style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
        >
          Modo demonstração: o pagamento não será processado de verdade (conecte o Supabase e o Mercado Pago para
          cobrar pedidos reais).
        </div>
      )}

      <div className="mb-8 flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
        {items.map(({ line, product }) => (
          <div key={product.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm" style={{ color: 'var(--ink)' }}>
                {line.quantity}x {product.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {product.manufacturer} · {product.scale}
              </div>
            </div>
            <div className="tabular shrink-0 text-sm font-medium" style={{ color: 'var(--gold-bright)' }}>
              {formatBRL(product.sale_price_brl * line.quantity)}
            </div>
          </div>
        ))}
        <div className="border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            CUPOM DE DESCONTO
          </label>
          {appliedCoupon ? (
            <div
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: 'rgba(143,206,143,0.1)', border: '1px solid rgba(143,206,143,0.3)', color: '#8fce8f' }}
            >
              <span>
                ✓ Cupom <strong>{appliedCoupon.code}</strong> aplicado — {appliedCoupon.discountPct}% de desconto
              </span>
              <button type="button" onClick={removeCoupon} className="underline" style={{ color: '#8fce8f' }}>
                Remover
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase())
                  if (couponStatus === 'invalid') setCouponStatus('idle')
                }}
                placeholder="Ex: GARAGEM8"
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm uppercase outline-none"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponStatus === 'checking' || !couponInput.trim()}
                className="shrink-0 rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              >
                {couponStatus === 'checking' ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
          )}
          {couponStatus === 'invalid' && (
            <p className="mt-2 text-xs" style={{ color: '#e88b8b' }}>
              Cupom inválido, expirado ou esgotado.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
          <span className="text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            {method === 'pix' ? 'TOTAL À VISTA NO PIX' : 'TOTAL'}
          </span>
          <div className="flex items-baseline gap-2">
            {(method === 'pix' || appliedCoupon) && (
              <span className="tabular text-xs line-through" style={{ color: 'var(--ink-muted)' }}>
                {formatBRL(subtotal)}
              </span>
            )}
            <span className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
              {formatBRL(total)}
            </span>
          </div>
        </div>
      </div>

      {step === 'form' && (
        <form onSubmit={handleContactSubmit} className="flex flex-col gap-6">
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
                  className="relative rounded-lg border p-3 text-left transition"
                  style={{
                    borderColor: method === m.id ? 'var(--gold)' : 'var(--hairline)',
                    background: method === m.id ? 'var(--gold-wash)' : 'var(--carbon-2)',
                  }}
                >
                  {m.badge && (
                    <span
                      className="absolute -top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                    >
                      {m.badge}
                    </span>
                  )}
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
          <Field label="E-mail" value={email} onChange={setEmail} type="email" required />
          <Field label="CPF" value={cpf} onChange={setCpf} required placeholder="000.000.000-00" />

          <div>
            <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              ENDEREÇO DE ENTREGA
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CEP" value={zipCode} onChange={setZipCode} required placeholder="00000-000" />
              <Field label="Número" value={streetNumber} onChange={setStreetNumber} required />
              <div className="col-span-2">
                <Field label="Rua" value={streetName} onChange={setStreetName} required />
              </div>
              <div className="col-span-2">
                <Field
                  label="Complemento (opcional)"
                  value={complement}
                  onChange={setComplement}
                  placeholder="Apto, bloco, casa..."
                />
              </div>
              <Field label="Bairro" value={neighborhood} onChange={setNeighborhood} required />
              <Field label="Cidade" value={city} onChange={setCity} required />
              <Field label="Estado (UF)" value={federalUnit} onChange={setFederalUnit} required placeholder="SP" />
            </div>
          </div>

          {method === 'pix' && (
            <PaymentNote text={`Após confirmar, geramos o QR Code / código PIX copia-e-cola para pagamento — com 10% de desconto já aplicado (${formatBRL(total)}).`} />
          )}
          {method === 'cartao' && (
            <PaymentNote text="Após confirmar, você preenche os dados do cartão numa tela segura do Mercado Pago." />
          )}
          {method === 'boleto' && (
            <PaymentNote text="Após confirmar, o boleto é gerado com link para visualizar e pagar." />
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
            {submitting
              ? 'Registrando pedido...'
              : method === 'cartao'
                ? 'Continuar para pagamento'
                : `Confirmar pedido — ${formatBRL(total)}`}
          </button>
        </form>
      )}

      {step === 'card' && (
        <div className="flex flex-col gap-6">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
              {error}
            </div>
          )}
          {isMercadoPagoConfigured ? (
            <CardPayment
              initialization={cardInitialization}
              onSubmit={handleCardSubmit}
              onError={handleCardError}
            />
          ) : (
            <PaymentNote text="Mercado Pago ainda não configurado (VITE_MP_PUBLIC_KEY ausente)." />
          )}
          <button
            type="button"
            onClick={() => setStep('form')}
            className="text-sm"
            style={{ color: 'var(--ink-muted)' }}
          >
            ← Voltar
          </button>
        </div>
      )}
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
