import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Gift, Truck } from 'lucide-react'
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
import { pixPrice, unitPriceWithMotor } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useTurnstile } from '@/lib/useTurnstile'
import type { CatalogProduct, PaymentMethod, ShippingOption } from '@/types/catalog'

const methods: { id: PaymentMethod; label: string; hint: string; badge?: string }[] = [
  { id: 'pix', label: 'PIX', hint: 'Aprovação em minutos', badge: '-10%' },
  { id: 'cartao', label: 'Cartão', hint: 'Crédito, em até 12x' },
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
  const [step, setStep] = useState<'form' | 'card' | 'done'>('form')
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
  const cardNumberRef = useRef<HTMLInputElement>(null)
  const { containerRef: turnstileRef, getToken: getTurnstileToken } = useTurnstile()

  // ao entrar na tela de cartão, a rolagem ficava onde a pessoa parou no
  // formulário anterior (às vezes lá embaixo) — sobe pro topo e já foca no
  // primeiro campo, como se fosse uma tela nova de verdade
  useEffect(() => {
    if (step !== 'card') return
    window.scrollTo({ top: 0, behavior: 'auto' })
    cardNumberRef.current?.focus()
  }, [step])

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

  const calculateShipping = useCallback(async () => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8 || checkoutItems.length === 0) return
    setShippingLoading(true)
    setShippingMessage(null)
    setSelectedShipping(null)
    setShippingOptions(null)
    try {
      const res = await getShippingOptions(zipCode, checkoutItems)
      setShippingOptions(res.options)
      if (res.options.length === 0) setShippingMessage(res.message ?? 'Nenhuma opção de frete disponível para este CEP.')
      else if (res.options.length === 1) setSelectedShipping(res.options[0])
    } catch {
      setShippingOptions([])
      setShippingMessage('Não foi possível calcular o frete agora. Tente novamente.')
    } finally {
      setShippingLoading(false)
    }
  }, [zipCode, checkoutItems])

  // Se o CEP mudar depois de já ter calculado, o frete anterior não vale
  // mais — obriga a recalcular antes de conseguir prosseguir.
  useEffect(() => {
    setShippingOptions(null)
    setSelectedShipping(null)
    setShippingMessage(null)
  }, [zipCode])

  // Preenche rua, bairro, cidade e estado automaticamente a partir do CEP
  // (ViaCEP, gratuito e sem chave de API) assim que os 8 dígitos forem
  // digitados — depois só falta o número, que o CEP não tem como saber.
  useEffect(() => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepNotFound(false)
      return
    }
    let cancelled = false
    setCepLoading(true)
    setCepNotFound(false)
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.erro) {
          setCepNotFound(true)
          return
        }
        setStreetName(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setFederalUnit(data.uf || '')
        streetNumberRef.current?.focus()
      })
      .catch(() => {
        if (!cancelled) setCepNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [zipCode])

  const handleContactSubmit = async (e: FormEvent) => {
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
    setError(null)

    if (method === 'cartao') {
      setStep('card')
      return
    }

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
        address: { zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit },
        couponCode: appliedCoupon?.code,
        shipping: selectedShipping,
        turnstileToken,
      })
      setResult(res)
      setStep('done')
      clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o pedido agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCardSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (checkoutItems.length === 0 || !selectedShipping) return
      const [expMonthStr, expYearStr] = cardExpiry.split('/').map((v) => v.trim())
      const expirationMonth = Number(expMonthStr)
      const expirationYear = Number(expYearStr?.length === 2 ? `20${expYearStr}` : expYearStr)
      if (!cardNumber.replace(/\D/g, '') || !cardHolderName || !expirationMonth || !expirationYear || !cardCvv) {
        setError('Preencha todos os dados do cartão.')
        return
      }
      setSubmitting(true)
      setError(null)
      try {
        const turnstileToken = await getTurnstileToken()
        const res = await createPayment({
          items: checkoutItems,
          customerName: name,
          customerEmail: email,
          customerCpf: cpf,
          customerPhone: phone,
          paymentMethod: 'cartao',
          card: {
            number: cardNumber.replace(/\D/g, ''),
            holderName: cardHolderName,
            expirationMonth,
            expirationYear,
            securityCode: cardCvv,
          },
          device: {
            colorDepth: window.screen.colorDepth,
            javaEnabled: typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false,
            language: navigator.language || 'pt-BR',
            screenHeight: window.screen.height,
            screenWidth: window.screen.width,
            // getTimezoneOffset() é minutos A OESTE de UTC (Brasil = 180);
            // a Rede espera o oposto (Brasil = -3), por isso o sinal invertido
            timeZoneOffset: -(new Date().getTimezoneOffset() / 60),
            userAgent: navigator.userAgent,
          },
          installments: cardInstallments,
          address: { zipCode, streetName, streetNumber, complement, neighborhood, city, federalUnit },
          couponCode: appliedCoupon?.code,
          shipping: selectedShipping,
          turnstileToken,
        })
        setResult(res)
        setStep('done')
        clear()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível processar o pagamento agora. Tente novamente.')
      } finally {
        setSubmitting(false)
      }
    },
    [
      checkoutItems,
      name,
      email,
      cpf,
      phone,
      zipCode,
      streetName,
      streetNumber,
      complement,
      neighborhood,
      city,
      federalUnit,
      clear,
      appliedCoupon,
      selectedShipping,
      getTurnstileToken,
      cardNumber,
      cardHolderName,
      cardExpiry,
      cardCvv,
      cardInstallments,
    ],
  )

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
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
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

      <div className="mb-8 flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
        {items.map(({ line, product }) => (
          <div key={product.id} className="flex items-center justify-between gap-4">
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
          <Field label="Telefone (com DDD)" value={phone} onChange={setPhone} required placeholder="(11) 98100-8013" />

          <div>
            <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              ENDEREÇO DE ENTREGA
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="CEP"
                value={zipCode}
                onChange={setZipCode}
                required
                placeholder="00000-000"
                hint={cepLoading ? 'Buscando endereço...' : cepNotFound ? 'CEP não encontrado — preencha manualmente.' : undefined}
              />
              <Field label="Número" value={streetNumber} onChange={setStreetNumber} required ref={streetNumberRef} />
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

          <div>
            <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              FRETE
            </label>
            <button
              type="button"
              onClick={calculateShipping}
              disabled={shippingLoading || zipCode.replace(/\D/g, '').length !== 8}
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
            >
              {shippingLoading ? 'Calculando frete...' : 'Calcular frete'}
            </button>

            {shippingMessage && (
              <p className="mt-2 text-xs" style={{ color: '#e88b8b' }}>
                {shippingMessage}
              </p>
            )}

            {shippingOptions && shippingOptions.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
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
          </div>

          {method === 'pix' && (
            <PaymentNote text={`Após confirmar, geramos o QR Code / código PIX copia-e-cola para pagamento — com 10% de desconto já aplicado (${formatBRL(total)}).`} />
          )}
          {method === 'cartao' && <PaymentNote text="Após confirmar, você preenche os dados do cartão na próxima tela." />}

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
        <form onSubmit={handleCardSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              NÚMERO DO CARTÃO
            </label>
            <div className="relative">
              <input
                ref={cardNumberRef}
                required
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full rounded-lg border bg-transparent px-4 py-2.5 pr-16 text-sm outline-none"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              />
              {cardBrand && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] font-bold tracking-wide"
                  style={{ background: cardBrand.color, color: cardBrand.textColor }}
                >
                  {cardBrand.label}
                </span>
              )}
            </div>
          </div>
          <Field label="Nome impresso no cartão" value={cardHolderName} onChange={setCardHolderName} required />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Validade (MM/AA)"
              value={cardExpiry}
              onChange={(v) => setCardExpiry(formatCardExpiry(v))}
              required
              placeholder="12/28"
            />
            <Field
              label="CVV"
              value={cardCvv}
              onChange={(v) => setCardCvv(v.replace(/\D/g, '').slice(0, 4))}
              required
              placeholder="123"
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
                  {n}x de {formatBRL(total / n)}
                  {n === 1 ? ' à vista' : ''}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Seus dados de cartão são enviados direto e com segurança para o processamento do pagamento — nunca
            ficam salvos em nossos servidores.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            {submitting ? 'Processando pagamento...' : `Pagar ${formatBRL(total)}`}
          </button>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="text-sm"
            style={{ color: 'var(--ink-muted)' }}
          >
            ← Voltar
          </button>
        </form>
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

interface CardBrand {
  label: string
  color: string
  textColor: string
}

// deteccao por faixa de BIN (primeiros digitos) — cobre as bandeiras mais
// comuns no Brasil; nao e uma lista exaustiva (Elo em especial tem
// dezenas de faixas), mas cobre o caso comum de dar um feedback visual
// enquanto a pessoa digita
function detectCardBrand(cardNumber: string): CardBrand | null {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits) return null

  if (/^4/.test(digits)) return { label: 'VISA', color: '#1a1f71', textColor: '#fff' }
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(digits)) {
    return { label: 'MASTERCARD', color: '#eb001b', textColor: '#fff' }
  }
  if (/^3[47]/.test(digits)) return { label: 'AMEX', color: '#2e77bc', textColor: '#fff' }
  if (/^(606282|3841)/.test(digits)) return { label: 'HIPERCARD', color: '#af1f24', textColor: '#fff' }
  if (/^(30[0-5]|3[68])/.test(digits)) return { label: 'DINERS', color: '#004a97', textColor: '#fff' }
  if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509\d|6277|6362|6363|6504|6505|6506|6507|6509|6516|6550)/.test(digits)) {
    return { label: 'ELO', color: '#000', textColor: '#ffcb05' }
  }
  return null
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
  }
>(function Field({ label, value, onChange, required, type = 'text', placeholder, hint }, ref) {
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
