import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Wallet, Ship, Newspaper, Wrench, ScrollText, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { getBlogPosts, getPartRequests, getRestockWaitlist } from '@/lib/api'

const navItems = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/pecas-faltantes', label: 'Peças faltantes', icon: Wrench },
  { to: '/lista-espera', label: 'Lista de espera', icon: Bell },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/containers', label: 'Containers', icon: Ship },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/log-auditoria', label: 'Log de auditoria', icon: ScrollText },
]

export function Layout() {
  const { demo, signOut } = useAuth()
  const [pendingBlogDrafts, setPendingBlogDrafts] = useState(0)
  const [pendingPartRequests, setPendingPartRequests] = useState(0)
  const [pendingWaitlist, setPendingWaitlist] = useState(0)

  useEffect(() => {
    getBlogPosts()
      .then((posts) => setPendingBlogDrafts(posts.filter((p) => p.ai_generated && !p.published).length))
      .catch(() => {})
    getPartRequests()
      .then((requests) => setPendingPartRequests(requests.filter((r) => r.status === 'pendente').length))
      .catch(() => {})
    getRestockWaitlist()
      .then((entries) => setPendingWaitlist(entries.filter((e) => !e.notified).length))
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-plane)' }}>
      <aside
        className="flex w-60 shrink-0 flex-col border-r p-4"
        style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)' }}
      >
        <div className="mb-6 px-2">
          <div className="mb-2 inline-flex rounded-lg px-2 py-1.5" style={{ background: '#0c0c0c' }}>
            <img src="/logo-studio18.png" alt="Studio 18" className="h-14 w-auto" />
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Painel de gestão
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? '' : 'hover:opacity-80'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--series-1)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
              })}
            >
              <Icon size={16} />
              {label}
              {to === '/blog' && pendingBlogDrafts > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                  style={{ background: 'var(--status-warning)', color: '#3a2500' }}
                >
                  {pendingBlogDrafts}
                </span>
              )}
              {to === '/pecas-faltantes' && pendingPartRequests > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                  style={{ background: 'var(--status-warning)', color: '#3a2500' }}
                >
                  {pendingPartRequests}
                </span>
              )}
              {to === '/lista-espera' && pendingWaitlist > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                  style={{ background: 'var(--status-warning)', color: '#3a2500' }}
                >
                  {pendingWaitlist}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {demo && (
          <div
            className="mb-3 rounded-lg px-3 py-2 text-xs"
            style={{ background: 'rgba(250,178,25,0.16)', color: '#8a5b00' }}
          >
            Modo demonstração: dados salvos só neste navegador. Conecte o Supabase para dados reais.
          </div>
        )}

        {!demo && (
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={16} />
            Sair
          </button>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
