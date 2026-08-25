import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui'

export function EsqueciSenha() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await requestPasswordReset(email)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    setSent(true)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/login-background.jpg)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="mb-3 inline-flex px-3 py-2">
          <img src="/logo-studio18-light.png" alt="Studio 18" className="brand-logo-light h-16 w-auto" />
          <img src="/logo-studio18-dark.png" alt="Studio 18" className="brand-logo-dark h-16 w-auto" />
        </div>

        {sent ? (
          <>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Se esse e-mail tiver uma conta no painel, enviamos um link pra redefinir a senha. Confira sua caixa de
              entrada (e o spam).
            </p>
            <Link to="/login" className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>
              ← Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Informe o e-mail da sua conta que enviamos um link pra você criar uma senha nova.
            </p>

            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />

            {error && (
              <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(208,59,59,0.1)', color: 'var(--status-critical)' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            <Link to="/login" className="mt-3 block text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>
              ← Voltar para o login
            </Link>
          </>
        )}
      </form>
    </div>
  )
}
