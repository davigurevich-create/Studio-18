import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Overview } from '@/pages/Overview'
import { Estoque } from '@/pages/Estoque'
import { Vendas } from '@/pages/Vendas'
import { Financeiro } from '@/pages/Financeiro'
import { Cupons } from '@/pages/Cupons'
import { Containers } from '@/pages/Containers'
import { Blog } from '@/pages/Blog'
import { PecasFaltantes } from '@/pages/PecasFaltantes'
import { ListaEspera } from '@/pages/ListaEspera'
import { SocialMedia } from '@/pages/SocialMedia'
import { AuditLog } from '@/pages/AuditLog'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, demo } = useAuth()
  if (demo) return <>{children}</>
  if (loading) return <div style={{ padding: 32 }}>Carregando...</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Overview />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/cupons" element={<Cupons />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/pecas-faltantes" element={<PecasFaltantes />} />
            <Route path="/lista-espera" element={<ListaEspera />} />
            <Route path="/social-media" element={<SocialMedia />} />
            <Route path="/log-auditoria" element={<AuditLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
