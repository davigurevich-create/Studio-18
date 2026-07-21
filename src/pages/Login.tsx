import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui'

export function Login() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Cobre tanto o redirecionamento logo após o login quanto o caso de o
  // usuário já estar autenticado e cair nesta tela (ex: botão "voltar").
  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const err = await signIn(email, password)
      if (err) {
        setError(err)
        setLoading(false)
        return
      }
      setSuccess(true)
      // O useEffect acima já redireciona assim que a sessão chegar — este
      // timeout só garante a mensagem de sucesso ficando visível um instante.
      setTimeout(() => navigate('/', { replace: true }), 400)
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--page-plane)' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-hairline)' }}
      >
        <div className="mb-3 inline-flex rounded-lg px-3 py-2" style={{ background: '#0c0c0c' }}>
          <img src="/logo-studio18.png" alt="Studio 18" className="h-16 w-auto" />
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

        {success && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(63,127,79,0.12)', color: '#3f7f4f' }}>
            ✓ Login realizado! Entrando no painel...
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(208,59,59,0.1)', color: 'var(--status-critical)' }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || success}>
          {success ? 'Entrando no painel...' : loading ? 'Verificando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
