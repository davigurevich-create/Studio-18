import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BLACK_FRIDAY_COUPON_CODE, BLACK_FRIDAY_END, BLACK_FRIDAY_PIX_TOTAL_PCT, isBlackFridayActive } from '@/lib/blackFriday'

function getRemaining() {
  const diff = Math.max(0, BLACK_FRIDAY_END.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function BlackFridayCountdown() {
  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(getRemaining()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Some sozinho depois do prazo — sem precisar remover o componente
  // manualmente do Home.tsx quando a campanha acabar.
  if (!isBlackFridayActive()) return null

  const units: { label: string; value: number }[] = [
    { label: 'dias', value: remaining.days },
    { label: 'horas', value: remaining.hours },
    { label: 'min', value: remaining.minutes },
    { label: 'seg', value: remaining.seconds },
  ]

  return (
    <section
      className="relative overflow-hidden px-6 py-16 sm:py-20"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.82)), url(/Login-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Halo dourado ambiente, mesma receita do mapa de entregas */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{ background: 'radial-gradient(ellipse, rgba(205,164,77,0.18), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <p className="eyebrow mb-2" style={{ color: 'var(--gold-bright)' }}>
          Oferta por tempo limitado
        </p>
        <h2 className="mb-2 text-2xl font-medium sm:text-3xl">A Black Friday Studio 18 termina em:</h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          25% OFF em até 6x sem juros, ou {BLACK_FRIDAY_PIX_TOTAL_PCT}% OFF à vista no Pix.
        </p>

        <div className="flex items-stretch justify-center gap-3 sm:gap-5">
          {units.map((u) => (
            <div
              key={u.label}
              className="flex w-[72px] flex-col items-center justify-center rounded-2xl py-5 sm:w-28 sm:py-7"
              style={{
                background: 'rgba(205,164,77,0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(205,164,77,0.35)',
                boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <span className="tabular text-3xl font-bold sm:text-5xl" style={{ color: 'var(--gold-bright)' }}>
                {pad(u.value)}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-widest sm:text-xs" style={{ color: 'var(--ink-muted)' }}>
                {u.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Use o cupom{' '}
          <strong className="font-mono" style={{ color: 'var(--gold-bright)' }}>
            {BLACK_FRIDAY_COUPON_CODE}
          </strong>{' '}
          no checkout.
        </p>
      </motion.div>
    </section>
  )
}
