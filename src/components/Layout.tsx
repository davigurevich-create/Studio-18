import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Wallet, Ship, Newspaper, Wrench, ScrollText, LogOut, Bell, Megaphone, Menu, X } from 'lucide-react'
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
  { to: '/social-media', label: 'Social Media', icon: Megaphone },
  { to: '/log-auditoria', label: 'Log de auditoria', icon: ScrollText },
]

export function Layout() {
  const { demo, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-plane)' }}>
      {/* Barra superior — só no mobile, com o botão de abrir/fechar o menu.
          No desktop a sidebar já fica sempre visível, então isso some. */}
      <header
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b px-4 py-2.5 sm:hidden"
        style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)' }}
      >
        <div className="inline-flex rounded-lg px-2 py-1" style={{ background: '#0c0c0c' }}>
          <img src="/logo-studio18.png" alt="Studio 18" className="h-8 w-auto" />
        </div>
        <button
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ color: 'var(--text-primary)' }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Fundo escurecido atrás da sidebar quando aberta no mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r p-4 transition-transform duration-200 sm:static sm:z-auto sm:w-60 sm:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pt-20 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
