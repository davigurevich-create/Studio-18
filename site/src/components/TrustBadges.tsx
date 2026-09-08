import { Lock, ShieldCheck, type LucideIcon } from 'lucide-react'

type Badge =
  | { kind: 'icon'; icon: LucideIcon; label: string }
  | { kind: 'image'; src: string; alt: string; label: string }

const badges: Badge[] = [
  { kind: 'icon', icon: Lock, label: 'Site seguro (SSL)' },
  { kind: 'icon', icon: ShieldCheck, label: 'Dados protegidos' },
  { kind: 'image', src: '/rede-itau-logo.webp', alt: 'Rede Itaú', label: 'Pagamento processado pela Rede' },
]

/**
 * Selos de confiança do checkout — só afirma coisas verdadeiras sobre a
 * própria arquitetura (HTTPS de verdade via Vercel, dados de cartão que
 * nunca são salvos) em vez de simular um selo de terceiro que a loja não
 * tem de verdade. O logo da Rede é o arquivo oficial que o usuário subiu.
 * Separados só por uma linha vertical discreta, sem card em volta.
 */
export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-y-3 py-1">
      {badges.map((badge, i) => (
        <div
          key={badge.label}
          className="flex items-center gap-1.5 px-4 text-[11px] first:pl-0 last:pr-0"
          style={{ color: 'var(--ink-muted)', borderLeft: i > 0 ? '1px solid var(--hairline)' : undefined }}
        >
          {badge.kind === 'icon' ? (
            <badge.icon size={13} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} />
          ) : (
            <img src={badge.src} alt={badge.alt} className="h-4 w-auto" />
          )}
          {badge.label}
        </div>
      ))}
    </div>
  )
}
