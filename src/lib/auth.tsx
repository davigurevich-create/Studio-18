import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  demo: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<string | null>
  updatePassword: (password: string) => Promise<string | null>
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

  const signIn = async (email: string, password: string) => {
    if (!supabase) return null
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return null

      const msg = error.message.toLowerCase()
      if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
      if (msg.includes('email not confirmed')) return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
      if (msg.includes('too many requests')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
      return error.message
    } catch {
      // Falha de rede/conexão com o Supabase — sem isso, o erro ficaria
      // silencioso e a tela de login parecia simplesmente não fazer nada.
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  // Envia o e-mail de recuperação de senha (link do Supabase que abre o
  // painel já com uma sessão temporária de recuperação, usada em seguida
  // por updatePassword para definir a senha nova).
  const requestPasswordReset = async (email: string) => {
    if (!supabase) return null
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) return error.message
      return null
    } catch {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
    }
  }

  // Define uma senha nova — funciona tanto vindo do link de recuperação
  // (sessão temporária) quanto já logado normalmente (trocar senha).
  const updatePassword = async (password: string) => {
    if (!supabase) return null
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return error.message
      return null
    } catch {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, demo: !isSupabaseConfigured, signIn, signOut, requestPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
