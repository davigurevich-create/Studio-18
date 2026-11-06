import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`glass-card rounded-xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

/** Mini-gráfico de tendência — só decorativo, sem eixos nem tooltip. Usa
 * dados reais já calculados pela página (nunca inventa série histórica). */
export function Sparkline({ data, color = 'var(--series-1)' }: { data: number[]; color?: string }) {
  const gradientId = useId()
  if (data.length < 2) return null
  const width = 72
  const height = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const linePoints = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatTile({
  label,
  value,
  sub,
  status,
  trend,
}: {
  label: string
  value: string
  sub?: string
  status?: 'good' | 'warning' | 'critical'
  /** Série histórica opcional (ex: últimos 6 meses) pro mini-gráfico ao lado do valor. */
  trend?: number[]
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
        </div>
        {trend && trend.length > 1 && <Sparkline data={trend} color={statusColor ?? 'var(--series-1)'} />}
      </div>
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
