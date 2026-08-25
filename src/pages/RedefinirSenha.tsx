import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui'

export function RedefinirSenha() {
  const { session, loading: authLoading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não são iguais.')
      return
    }
    setLoading(true)
    const err = await updatePassword(password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/', { replace: true }), 1200)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/login-background.jpg)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="mb-3 inline-flex px-3 py-2">
          <img src="/logo-studio18-light.png" alt="Studio 18" className="brand-logo-light h-16 w-auto" />
          <img src="/logo-studio18-dark.png" alt="Studio 18" className="brand-logo-dark h-16 w-auto" />
        </div>

        {authLoading ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Verificando...
          </p>
        ) : !session ? (
          <>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Esse link de recuperação é inválido ou já expirou. Solicite um novo.
            </p>
            <Link to="/esqueci-senha" className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>
              ← Pedir novo link
            </Link>
          </>
        ) : success ? (
          <p className="text-sm" style={{ color: '#3f7f4f' }}>
            ✓ Senha atualizada! Entrando no painel...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Defina sua senha nova.
            </p>

            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Senha nova
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />

            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Confirmar senha nova
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />

            {error && (
              <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(208,59,59,0.1)', color: 'var(--status-critical)' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar senha nova'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
