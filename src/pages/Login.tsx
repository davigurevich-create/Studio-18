import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--page-plane)' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="mb-3 inline-flex rounded-lg px-3 py-2" style={{ background: '#060606' }}>
          <img src="/logo-studio18.png" alt="Studio 18" className="h-7 w-auto" />
        </div>
        <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Painel de gestão — entre com sua conta
        </p>

        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />

        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />

        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(208,59,59,0.1)', color: 'var(--status-critical)' }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
