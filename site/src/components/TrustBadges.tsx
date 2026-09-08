import { CreditCard, Lock, ShieldCheck } from 'lucide-react'

const badges = [
  { icon: Lock, label: 'Site seguro (SSL)' },
  { icon: ShieldCheck, label: 'Dados protegidos' },
  { icon: CreditCard, label: 'Pagamento processado pela Rede' },
]

/**
 * Selos de confiança do checkout — só afirma coisas verdadeiras sobre a
 * própria arquitetura (HTTPS de verdade via Vercel, dados de cartão que
 * nunca são salvos, cobrança processada pela Rede) em vez de simular um
 * selo de terceiro que a loja não tem de verdade.
 */
export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg border px-4 py-3" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          <Icon size={13} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} />
          {label}
        </div>
      ))}
    </div>
  )
}
