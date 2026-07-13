import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Wallet, Ship, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const navItems = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/containers', label: 'Containers', icon: Ship },
]

export function Layout() {
  const { demo, signOut } = useAuth()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--page-plane)' }}>
      <aside
        className="flex w-60 shrink-0 flex-col border-r p-4"
        style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)' }}
      >
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Studio 18
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
