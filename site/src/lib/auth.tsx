import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  demo: boolean
  requestCode: (email: string) => Promise<string | null>
  verifyCode: (email: string, code: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  /**
   * Dispara o código de 6 dígitos por e-mail (Supabase Auth nativo — sem
   * senha). Se for a primeira vez desse e-mail, a conta é criada
   * automaticamente no momento em que o código for confirmado.
   */
  const requestCode = async (email: string) => {
    if (!supabase) return 'Modo demonstração: conecte o Supabase para testar o login de verdade.'
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
      if (!error) return null

      const msg = error.message.toLowerCase()
      if (msg.includes('too many requests') || msg.includes('rate limit')) {
        return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
      }
      return error.message
    } catch {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
    }
  }

  const verifyCode = async (email: string, code: string) => {
    if (!supabase) return 'Modo demonstração: conecte o Supabase para testar o login de verdade.'
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      if (!error) return null

      const msg = error.message.toLowerCase()
      if (msg.includes('expired') || msg.includes('invalid')) return 'Código inválido ou expirado. Peça um novo código.'
      return error.message
    } catch {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, loading, demo: !isSupabaseConfigured, requestCode, verifyCode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
