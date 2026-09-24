import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { submitLead } from '@/lib/api'
import { markWelcomeConverted, markWelcomeDismissed, shouldShowWelcomePopup, WELCOME_COUPON_CODE } from '@/lib/welcomeOffer'

const TRIGGER_DELAY_MS = 18000
// Enquanto o arquivo não existir em site/public/, a tag <img> some sozinha
// (onError) e o pop-up segue normalmente sem o banner — mesmo esquema já
// usado nos banners da página de Selos Digitais.
const BANNER_SRC = '/welcome-popup-banner.jpg'

export function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<'locked' | 'revealed'>('locked')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerFailed, setBannerFailed] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!shouldShowWelcomePopup()) return
    timerRef.current = window.setTimeout(() => setOpen(true), TRIGGER_DELAY_MS)
    return () => window.clearTimeout(timerRef.current)
  }, [])

  const close = () => {
    setOpen(false)
    if (state !== 'revealed') markWelcomeDismissed()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await submitLead(email)
      markWelcomeConverted()
      setState('revealed')
    } catch {
      setError('Não foi possível registrar seu e-mail agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  const [copied, setCopied] = useState(false)
  const copyCode = () => {
    navigator.clipboard?.writeText(WELCOME_COUPON_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(6,6,6,0.72)', backdropFilter: 'blur(3px)' }}
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-6"
            onClick={close}
          >
            <div
              className="relative w-full max-w-[400px] overflow-hidden rounded-2xl"
              style={{ background: 'var(--carbon-1)', border: '1px solid var(--hairline-strong)', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {!bannerFailed && (
                <img
                  src={BANNER_SRC}
                  alt=""
                  className="h-36 w-full object-cover"
                  onError={() => setBannerFailed(true)}
                />
              )}

              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ border: '1px solid var(--hairline)', background: 'rgba(6,6,6,0.5)', color: 'var(--ink-muted)' }}
              >
                ✕
              </button>

              <div className="px-7 pb-6 pt-8">
                <p className="eyebrow mb-2.5 text-center">Oferta de boas-vindas</p>
                <h2 className="mb-2.5 text-center text-2xl font-extrabold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>
                  Ganhe <span style={{ color: 'var(--gold-bright)' }}>10% off</span>
                  <br />na sua primeira compra
                </h2>
                <p className="mb-5 text-center text-[13px]" style={{ color: 'var(--ink-muted)' }}>
                  Entre pra nossa lista e receba o cupom agora — fique por dentro dos lançamentos e novidades do Studio 18.
                </p>

                <div
                  className="relative mb-4 overflow-hidden rounded-xl px-4 py-4 text-center"
                  style={{
                    background: 'linear-gradient(160deg, var(--carbon-2), var(--carbon-3))',
                    border: '1px solid var(--gold-dim)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -14px rgba(205,164,77,0.4)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(230,199,120,0.14), transparent 70%)' }}
                  />
                  <div className="relative flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                      SEU CUPOM DE 10%
                    </span>
                    {state === 'locked' && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                        style={{ background: 'var(--carbon-1)', border: '1px solid var(--hairline)', color: 'var(--ink-muted)' }}
                      >
                        🔒 revelar abaixo
                      </span>
                    )}
                  </div>
                  <div
                    className="relative mt-1.5 font-mono text-2xl font-bold tracking-[0.08em]"
                    style={{ color: 'var(--gold-bright)', filter: state === 'locked' ? 'blur(6px)' : 'none', userSelect: state === 'locked' ? 'none' : 'auto' }}
                  >
                    {WELCOME_COUPON_CODE}
                  </div>
                  {state === 'revealed' && (
                    <button
                      type="button"
                      onClick={copyCode}
                      className="relative mt-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{ border: '1px solid var(--gold-dim)', color: 'var(--gold-bright)' }}
                    >
                      {copied ? 'Copiado!' : 'Copiar código'}
                    </button>
                  )}
                </div>

                {state === 'locked' ? (
                  <form onSubmit={submit} className="flex flex-col gap-2.5">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu melhor e-mail"
                      className="w-full rounded-lg border bg-transparent px-3.5 py-3 text-sm outline-none"
                      style={{ borderColor: 'var(--hairline-strong)', color: 'var(--ink)' }}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg py-3 text-sm font-bold disabled:opacity-60"
                      style={{ background: 'var(--gold)', color: 'var(--carbon-0)' }}
                    >
                      {submitting ? 'Enviando...' : 'Quero meu cupom'}
                    </button>
                    {error && (
                      <p className="text-center text-xs" style={{ color: '#e88b8b' }}>
                        {error}
                      </p>
                    )}
                  </form>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-secondary)' }}>
                    <span style={{ color: 'var(--gold-bright)' }}>✓</span> Cupom enviado pro seu e-mail também
                  </p>
                )}

                {state === 'locked' && (
                  <button
                    type="button"
                    onClick={close}
                    className="mx-auto mt-3.5 block text-xs underline"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    Agora não, obrigado
                  </button>
                )}

                <p className="mt-4 border-t pt-3.5 text-center text-[10.5px] leading-relaxed" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}>
                  Um cupom por pedido. Já tem um código de algum parceiro do Studio 18? Use ele no checkout — os dois não acumulam.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
