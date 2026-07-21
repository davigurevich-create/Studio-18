import { useState, type FormEvent } from 'react'
import { joinRestockWaitlist } from '@/lib/api'

export function RestockWaitlistForm({
  productId,
  compact = false,
}: {
  productId: string
  compact?: boolean
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await joinRestockWaitlist({ productId, customerName: name || undefined, customerEmail: email })
      setDone(true)
    } catch {
      setError('Não foi possível registrar seu e-mail agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="text-sm" style={{ color: 'var(--gold-bright)' }}>
        ✓ Pronto! Avisaremos {email} assim que chegar.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {!compact && (
        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          Este modelo esgotou no lote atual. Deixe seu e-mail e avisamos assim que chegar no próximo container.
        </p>
      )}
      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-2 sm:flex-row'}>
        {!compact && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome (opcional)"
            className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-medium tracking-wide disabled:opacity-60"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          {submitting ? 'Enviando...' : 'Avise-me'}
        </button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: '#e88b8b' }}>
          {error}
        </p>
      )}
    </form>
  )
}
