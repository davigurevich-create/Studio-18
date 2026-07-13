import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border-hairline)' }}
    >
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  sub,
  status,
}: {
  label: string
  value: string
  sub?: string
  status?: 'good' | 'warning' | 'critical'
}) {
  const statusColor =
    status === 'good'
      ? 'var(--status-good)'
      : status === 'warning'
        ? 'var(--status-warning)'
        : status === 'critical'
          ? 'var(--status-critical)'
          : undefined

  return (
    <Card>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="tabular mt-1 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-sm" style={{ color: statusColor ?? 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </Card>
  )
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'good' | 'warning' | 'critical' | 'info' }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    muted: { bg: 'rgba(137,135,129,0.15)', fg: 'var(--text-secondary)' },
    good: { bg: 'rgba(12,163,12,0.12)', fg: 'var(--status-good)' },
    warning: { bg: 'rgba(250,178,25,0.16)', fg: '#8a5b00' },
    critical: { bg: 'rgba(208,59,59,0.12)', fg: 'var(--status-critical)' },
    info: { bg: 'rgba(42,120,214,0.12)', fg: 'var(--series-1)' },
  }
  const c = colors[tone]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const base = 'rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50'
  const style =
    variant === 'primary'
      ? { background: 'var(--series-1)', color: '#fff' }
      : { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-hairline)' }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base} style={style}>
      {children}
    </button>
  )
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
