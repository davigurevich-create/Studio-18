import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Lock, Truck } from 'lucide-react'
import { SpotifySection } from '@/components/SpotifySection'
import {
  createPayment,
  getCatalog,
  getMyAddresses,
  getMyOrders,
  getMyProfile,
  getShippingOptions,
  isDemoMode,
  validateCoupon,
  type CreatePaymentResult,
} from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { INSTALLMENT_SURCHARGE_FROM, installmentTotal, installmentValue, pixPrice, unitPriceWithMotor } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useTurnstile } from '@/lib/useTurnstile'
import type { CatalogProduct, PaymentMethod, ShippingOption } from '@/types/catalog'

const methods: { id: PaymentMethod; label: string; hint: string; badge?: string }[] = [
  { id: 'cartao', label: 'Cartão', hint: 'Crédito, em até 12x' },
  { id: 'pix', label: 'PIX', hint: 'Aprovação em minutos', badge: '-10%' },
]

export function Checkout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { lines, clear } = useCart()
  const [catalog, setCatalog] = useState<CatalogProduct[] | undefined>(undefined)
  const [method, setMethod] = useState<PaymentMethod>('cartao')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepNotFound, setCepNotFound] = useState(false)
  const streetNumberRef = useRef<HTMLInputElement>(null)
  const [streetName, setStreetName] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [federalUnit, setFederalUnit] = useState('')
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CreatePaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<'order' | 'pix' | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number } | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingMessage, setShippingMessage] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)
  const { containerRef: turnstileRef, getToken: getTurnstileToken } = useTurnstile()

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
        if (profile.cpf) setCpf(formatCPF(profile.cpf))

        const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0]
        if (defaultAddress) {
          setZipCode(formatCEP(defaultAddress.zip_code))
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
        if (last.shipping_zip_code) setZipCode(formatCEP(last.shipping_zip_code))
        if (last.shipping_street_name) setStreetName(last.shipping_street_name)
        if (last.shipping_street_number) setStreetNumber(last.shipping_street_number)
        if (last.shipping_complement) setComplement(last.shipping_complement)
        if (last.shipping_neighborhood) setNeighborhood(last.shipping_neighborhood)
        if (last.shipping_city) setCity(last.shipping_city)
        if (last.shipping_federal_unit) setFederalUnit(last.shipping_federal_unit)
      })
      .catch(() => {})
  }, [session])

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: catalog?.find((p) => p.id === l.productId) }))
        .filter((i): i is { line: typeof lines[number]; product: CatalogProduct } => Boolean(i.product)),
    [lines, catalog],
  )

  const subtotal = items.reduce((t, i) => t + unitPriceWithMotor(i.product, Boolean(i.line.withMotor)) * i.line.quantity, 0)
  const priceBeforeCoupon = method === 'pix' ? pixPrice(subtotal) : subtotal
  const productsTotal = appliedCoupon
    ? Math.round(priceBeforeCoupon * (1 - appliedCoupon.discountPct / 100) * 100) / 100
    : priceBeforeCoupon
  const total = Math.round((productsTotal + (selectedShipping?.price ?? 0)) * 100) / 100
  const cardTotal = method === 'cartao' ? installmentTotal(total, cardInstallments) : total

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
    () => items.map((i) => ({ productId: i.product.id, quantity: i.line.quantity, withMotor: Boolean(i.line.withMotor) })),
    [items],
  )

  // busca endereço (ViaCEP) e cota o frete (Melhor Envio) em paralelo, assim
  // que o CEP completa 8 dígitos — nenhuma das duas depende de clique
  const lookupAddressAndShipping = useCallback(
    async (cep: string) => {
      const digits = cep.replace(/\D/g, '')
      if (digits.length !== 8) return
      setCepLoading(true)
      setCepNotFound(false)
      setShippingLoading(true)
      setShippingMessage(null)
      setShippingOptions(null)
      setSelectedShipping(null)

      const [viaCepResult, shippingResult] = await Promise.allSettled([
        fetch(`https://viacep.com.br/ws/${digits}/json/`).then((r) => r.json()),
        getShippingOptions(cep, checkoutItems),
      ])

      if (viaCepResult.status === 'fulfilled' && !viaCepResult.value.erro) {
        const data = viaCepResult.value
        setStreetName(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setFederalUnit(data.uf || '')
        streetNumberRef.current?.focus()
      } else {
        setCepNotFound(true)
      }

      if (shippingResult.status === 'fulfilled') {
        setShippingOptions(shippingResult.value.options)
        if (shippingResult.value.options.length === 0) {
          setShippingMessage(shippingResult.value.message ?? 'Nenhuma opção de frete disponível para este CEP.')
        } else if (shippingResult.value.options.length === 1) {
          setSelectedShipping(shippingResult.value.options[0])
        }
      } else {
        setShippingOptions([])
        setShippingMessage('Não foi possível calcular o frete agora. Tente novamente.')
      }

      setCepLoading(false)
      setShippingLoading(false)
    },
    [checkoutItems],
  )

  // Se o CEP mudar, o endereço/frete anteriores não valem mais — limpa e,
  // assim que os 8 dígitos estiverem completos, dispara a busca sozinha.
  useEffect(() => {
    setShippingOptions(null)
    setSelectedShipping(null)
    setShippingMessage(null)
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepNotFound(false)
      return
    }
    lookupAddressAndShipping(zipCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCode])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('Informe um CPF válido (11 dígitos).')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um telefone válido, com DDD.')
      return
    }
    if (!zipCode || !streetName || !streetNumber || !neighborhood || !city || !federalUnit) {
      setError('Preencha o endereço de entrega completo.')
      return
    }
    if (!selectedShipping) {
      setError('Calcule e escolha uma opção de frete antes de continuar.')
      return
    }

    let card: { number: string; holderName: string; expirationMonth: number; expirationYear: number; securityCode: string } | undefined
    if (method === 'cartao') {
      const [expMonthStr, expYearStr] = cardExpiry.split('/').map((v) => v.trim())
      const expirationMonth = Number(expMonthStr)
      const expirationYear = Number(expYearStr?.length === 2 ? `20${expYearStr}` : expYearStr)
      if (!cardNumber.replace(/\D/g, '') || !cardHolderName || !expirationMonth || !expirationYear || !cardCvv) {
        setError('Preencha todos os dados do cartão.')
        return
      }
      card = { number: cardNumber.replace(/\D/g, ''), holderName: cardHolderName, expirationMonth, expirationYear, securityCode: cardCvv }
    }

    setError(null)
    setSubmitting(true)
    try {
      const turnstileToken = await getTurnstileToken()
      const res = await createPayment({
        items: checkoutItems,
        customerName: name,
        customerEmail: email,
        customerCpf: cpf,
        customerPhone: phone,
        paymentMethod: method,
        card,
        device:
          method === 'cartao'
            ? {
                colorDepth: window.screen.colorDepth,
                javaEnabled: typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false,
                language: navigator.language || 'pt-BR',
                screenHeight: window.screen.height,
                screenWidth: window.screen.width,
                // getTimezoneOffset() é minutos A OESTE de UTC (Brasil = 180);
                // a Rede espera o oposto (Brasil = -3), por isso o sinal invertido
                timeZoneOffset: -(new Date().getTimezoneOffset() / 60),
                userAgent: navigator.userAgent,
              }
            : undefined,
        installments: method === 'cartao' ? cardInstallments : undefined,
        address: { zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit },
        couponCode: appliedCoupon?.code,
        shipping: selectedShipping,
        turnstileToken,
      })
      setResult(res)
      setStep('done')
      clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar seu pedido agora. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])

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

  if (step === 'done' && result && result.status === 'cancelado') {
    return (
      <div className="mx-auto max-w-lg px-6 py-40 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
        </motion.div>
      </div>
    )
  }

  if (step === 'done' && result) {
    // Split em duas colunas no desktop: confirmação + card de conta à
    // esquerda, playlists do Spotify à direita (ocupando a altura das
    // duas). No mobile tudo empilha, mas o Spotify entra logo depois da
    // confirmação principal — antes do card de conta — pra não ficar
    // escondido lá embaixo, depois de tudo.
    return (
      <div className="mx-auto max-w-4xl px-6 py-32 text-center lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12 lg:py-40 lg:text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-start-1 lg:row-start-1"
        >
          <div className="mb-5 text-4xl" style={{ color: 'var(--gold)' }}>✓</div>
          <h1 className="mb-3 text-2xl">
            {result.status === 'pago' ? 'Pagamento aprovado' : 'Pedido registrado'}
          </h1>
          <p className="mb-3 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Recebemos seu pedido via{' '}
            <strong style={{ color: 'var(--ink)' }}>{methods.find((m) => m.id === method)?.label}</strong>.
          </p>

          <div
            className="mb-6 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs lg:justify-start"
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

          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Assim que o pagamento for confirmado, nossa equipe já recebe o aviso automaticamente. Guarde o número
            do pedido acima e o e-mail usado na compra.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:flex lg:h-full lg:flex-col lg:justify-center lg:self-stretch lg:border-l lg:pl-10"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <SpotifySection compact />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10 lg:col-start-1 lg:row-start-2 lg:mt-8"
        >
          <div
            className="mb-6 rounded-2xl border p-6 text-left"
            style={{ borderColor: 'var(--gold-dim)', background: 'var(--gold-wash)' }}
          >
            <p className="mb-4 text-sm font-medium" style={{ color: 'var(--ink)' }}>
              Entre na sua área da conta com o e-mail <strong style={{ color: 'var(--gold-bright)' }}>{email}</strong> para:
            </p>
            <ul className="mb-5 flex flex-col gap-3 text-sm" style={{ color: 'var(--ink-secondary)' }}>
              <li className="flex items-start gap-2.5">
                <Truck size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                Acompanhar o rastreio do seu pedido em tempo real
              </li>
              <li className="flex items-start gap-2.5">
                <Gift size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                Pegar seu cupom de indicação — 5% pra você e pra quem indicar
              </li>
            </ul>
            <button
              type="button"
              onClick={() => navigate('/conta')}
              className="w-full rounded-full px-6 py-2.5 text-sm font-medium"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Entrar na área da conta
            </button>
          </div>

          <Link
            to="/"
            className="inline-block rounded-full border px-6 py-2.5 text-sm font-medium"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
          >
            Voltar para a coleção
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
      <div ref={turnstileRef} />
      <button onClick={() => navigate(-1)} className="mb-8 text-sm" style={{ color: 'var(--ink-muted)' }}>
        ← Voltar
      </button>

      <h1 className="mb-8 text-3xl">Finalizar pedido</h1>

      {isDemoMode && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-xs"
          style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
        >
          Modo demonstração: o pagamento não será processado de verdade (conecte o Supabase para cobrar pedidos
          reais).
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_1px_380px] lg:items-start lg:gap-x-10">
        <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8 lg:col-start-1 lg:row-start-1">
          <section className="flex flex-col gap-6">
            <SectionLabel>Dados pessoais</SectionLabel>
            <Field label="Nome completo" value={name} onChange={setName} required autoComplete="name" />
            <Field label="E-mail" value={email} onChange={setEmail} type="email" required autoComplete="email" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF" value={cpf} onChange={(v) => setCpf(formatCPF(v))} required placeholder="000.000.000-00" />
              <Field
                label="Telefone (com DDD)"
                value={phone}
                onChange={(v) => setPhone(formatPhone(v))}
                required
                placeholder="(11) 98100-8013"
                autoComplete="tel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="CEP"
                value={zipCode}
                onChange={(v) => setZipCode(formatCEP(v))}
                required
                placeholder="00000-000"
                autoComplete="postal-code"
                hint={cepLoading ? 'Buscando endereço e frete...' : cepNotFound ? 'CEP não encontrado — preencha manualmente.' : undefined}
              />
              <Field label="Número" value={streetNumber} onChange={setStreetNumber} required ref={streetNumberRef} />
              <div className="col-span-2">
                <Field label="Rua" value={streetName} onChange={setStreetName} required autoComplete="address-line1" />
              </div>
              <div className="col-span-2">
                <Field
                  label="Complemento (opcional)"
                  value={complement}
                  onChange={setComplement}
                  placeholder="Apto, bloco, casa..."
                  autoComplete="address-line2"
                />
              </div>
              <Field label="Bairro" value={neighborhood} onChange={setNeighborhood} required />
              <Field label="Cidade" value={city} onChange={setCity} required autoComplete="address-level2" />
              <Field
                label="Estado (UF)"
                value={federalUnit}
                onChange={setFederalUnit}
                required
                placeholder="SP"
                autoComplete="address-level1"
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel>Forma de pagamento</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
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

            <AnimatePresence initial={false}>
              {method === 'cartao' && (
                <motion.div
                  key="card-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
                    <div>
                      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                        NÚMERO DO CARTÃO
                      </label>
                      <div className="relative">
                        <input
                          required={method === 'cartao'}
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full rounded-lg border bg-transparent px-4 py-2.5 pr-16 text-sm outline-none"
                          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                        />
                        {cardBrand && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CardBrandIcon brand={cardBrand} />
                          </span>
                        )}
                      </div>
                    </div>
                    <Field
                      label="Nome impresso no cartão"
                      value={cardHolderName}
                      onChange={setCardHolderName}
                      required={method === 'cartao'}
                      autoComplete="cc-name"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Validade (MM/AA)"
                        value={cardExpiry}
                        onChange={(v) => setCardExpiry(formatCardExpiry(v))}
                        required={method === 'cartao'}
                        placeholder="12/28"
                        autoComplete="cc-exp"
                      />
                      <Field
                        label="CVV"
                        value={cardCvv}
                        onChange={(v) => setCardCvv(v.replace(/\D/g, '').slice(0, 4))}
                        required={method === 'cartao'}
                        placeholder="123"
                        autoComplete="cc-csc"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                        PARCELAS
                      </label>
                      <select
                        value={cardInstallments}
                        onChange={(e) => setCardInstallments(Number(e.target.value))}
                        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
                        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n} style={{ background: '#0a0a0a' }}>
                            {n}x de {formatBRL(installmentValue(total, n))}
                            {n === 1 ? ' à vista' : n >= INSTALLMENT_SURCHARGE_FROM ? ' com juros' : ' sem juros'}
                          </option>
                        ))}
                      </select>
                      {cardInstallments >= INSTALLMENT_SURCHARGE_FROM && (
                        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Parcelamento em {cardInstallments}x tem acréscimo — total de {formatBRL(cardTotal)}.
                        </p>
                      )}
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      <Lock size={11} strokeWidth={2} />
                      Pagamento processado com segurança pela Rede — seus dados de cartão nunca ficam salvos aqui.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {method === 'pix' && (
              <PaymentNote text={`Após confirmar, geramos o QR Code / código PIX copia-e-cola para pagamento — com 10% de desconto já aplicado (${formatBRL(total)}).`} />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Frete</SectionLabel>

            {!zipCode && <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Informe o CEP acima pra calcular o frete.</p>}

            {shippingLoading && (
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Calculando frete...
              </p>
            )}

            {shippingMessage && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs" style={{ color: '#e88b8b' }}>
                  {shippingMessage}
                </p>
                <button
                  type="button"
                  onClick={() => lookupAddressAndShipping(zipCode)}
                  className="shrink-0 text-xs underline"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {shippingOptions && shippingOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                {shippingOptions.map((opt) => (
                  <button
                    key={`${opt.company}-${opt.service}`}
                    type="button"
                    onClick={() => setSelectedShipping(opt)}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition"
                    style={{
                      borderColor: selectedShipping === opt ? 'var(--gold)' : 'var(--hairline)',
                      background: selectedShipping === opt ? 'var(--gold-wash)' : 'var(--carbon-2)',
                    }}
                  >
                    <div>
                      <div style={{ color: selectedShipping === opt ? 'var(--gold-bright)' : 'var(--ink)' }}>
                        {opt.company} {opt.service}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        Até {opt.deliveryDays} dias úteis
                      </div>
                    </div>
                    <div className="tabular shrink-0 font-medium" style={{ color: 'var(--gold-bright)' }}>
                      {formatBRL(opt.price)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

        </form>

        <div
          className="hidden lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:block lg:h-full lg:w-px"
          style={{ background: 'var(--hairline)' }}
        />

        <div
          className="mt-10 flex flex-col gap-3 rounded-xl border p-4 lg:sticky lg:top-28 lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:mt-0"
          style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            Resumo do pedido
          </h2>
          {items.map(({ line, product }) => (
            <div key={product.id} className="flex items-center gap-3">
              <div
                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                style={{ background: 'var(--carbon-1)' }}
              >
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 items-center justify-between gap-3">
                <div>
                  <div className="text-sm" style={{ color: 'var(--ink)' }}>
                    {line.quantity}x {product.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {product.manufacturer} · {product.scale}
                    {line.withMotor && ' · com motor funcional'}
                  </div>
                </div>
                <div className="tabular shrink-0 text-sm font-medium" style={{ color: 'var(--gold-bright)' }}>
                  {formatBRL(unitPriceWithMotor(product, Boolean(line.withMotor)) * line.quantity)}
                </div>
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

          {selectedShipping && (
            <div className="flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}>
              <span>
                Frete — {selectedShipping.company} {selectedShipping.service}
              </span>
              <span className="tabular">{formatBRL(selectedShipping.price)}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            <span className="text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              {method === 'pix' ? 'TOTAL À VISTA NO PIX' : 'TOTAL'}
            </span>
            <div className="flex items-baseline gap-2">
              {method === 'cartao' && cardTotal !== total ? (
                <span className="tabular text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {formatBRL(total)} + acréscimo
                </span>
              ) : (
                (method === 'pix' || appliedCoupon) && (
                  <span className="tabular text-xs line-through" style={{ color: 'var(--ink-muted)' }}>
                    {formatBRL(subtotal)}
                  </span>
                )
              )}
              <span className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
                {formatBRL(method === 'cartao' ? cardTotal : total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:col-start-1 lg:row-start-2 lg:mt-8">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            {submitting
              ? 'Processando pedido...'
              : method === 'cartao'
                ? `Pagar ${formatBRL(cardTotal)}`
                : `Confirmar pedido — ${formatBRL(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
      {children}
    </h2>
  )
}

function PaymentNote({ text }: { text: string }) {
  return (
    <p className="rounded-lg border px-4 py-3 text-xs" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}>
      {text}
    </p>
  )
}

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners'

// deteccao por faixa de BIN (primeiros digitos) — cobre as bandeiras mais
// comuns no Brasil; nao e uma lista exaustiva (Elo em especial tem
// dezenas de faixas), mas cobre o caso comum de dar um feedback visual
// enquanto a pessoa digita
function detectCardBrand(cardNumber: string): CardBrand | null {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits) return null

  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^(606282|3841)/.test(digits)) return 'hipercard'
  if (/^(30[0-5]|3[68])/.test(digits)) return 'diners'
  if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509\d|6277|6362|6363|6504|6505|6506|6507|6509|6516|6550)/.test(digits)) {
    return 'elo'
  }
  return null
}

// desenhos simplificados das marcas, em vez de só um texto colorido —
// o da Mastercard em particular precisa dos dois círculos sobrepostos
// pra ser reconhecível, um selo de texto não lembra a marca de verdade
function CardBrandIcon({ brand }: { brand: CardBrand }) {
  if (brand === 'mastercard') {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Mastercard">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <circle cx="15" cy="12" r="7" fill="#EB001B" />
        <circle cx="23" cy="12" r="7" fill="#F79E1B" />
        <path d="M19 6.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11Z" fill="#FF5F00" />
      </svg>
    )
  }
  if (brand === 'visa') {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Visa">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <text x="19" y="16.5" textAnchor="middle" fontStyle="italic" fontWeight="800" fontSize="11" fill="#1434CB" fontFamily="Arial, sans-serif">
          VISA
        </text>
      </svg>
    )
  }
  if (brand === 'amex') {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24" aria-label="American Express">
        <rect width="38" height="24" rx="4" fill="#006FCF" />
        <text x="19" y="15.5" textAnchor="middle" fontWeight="700" fontSize="8" fill="#fff" fontFamily="Arial, sans-serif">
          AMEX
        </text>
      </svg>
    )
  }
  if (brand === 'elo') {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Elo">
        <rect width="38" height="24" rx="4" fill="#000" />
        <text x="19" y="15.5" textAnchor="middle" fontWeight="800" fontSize="10" fill="#FFCB05" fontFamily="Arial, sans-serif">
          elo
        </text>
      </svg>
    )
  }
  if (brand === 'hipercard') {
    return (
      <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Hipercard">
        <rect width="38" height="24" rx="4" fill="#AF1F24" />
        <text x="19" y="15" textAnchor="middle" fontWeight="700" fontSize="6.5" fill="#fff" fontFamily="Arial, sans-serif">
          hipercard
        </text>
      </svg>
    )
  }
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Diners Club">
      <rect width="38" height="24" rx="4" fill="#004A97" />
      <circle cx="19" cy="12" r="7" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

const Field = forwardRef<
  HTMLInputElement,
  {
    label: string
    value: string
    onChange: (v: string) => void
    required?: boolean
    type?: string
    placeholder?: string
    hint?: string
    autoComplete?: string
  }
>(function Field({ label, value, onChange, required, type = 'text', placeholder, hint, autoComplete }, ref) {
  return (
    <div>
      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </label>
      <input
        ref={ref}
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
      />
      {hint && (
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
})
