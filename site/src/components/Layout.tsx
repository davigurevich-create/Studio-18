import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatWidget } from '@/components/ChatWidget'
import { CartDrawer } from '@/components/CartDrawer'
import { useCart } from '@/lib/cart'

const navLinks = [
  { href: '/#manifesto', label: 'Manifesto' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/#diferenciais', label: 'Diferenciais' },
  { href: '/#colecao', label: 'Coleção' },
  { href: '/#pecas-faltantes', label: 'Peças faltantes' },
  { href: '/blog', label: 'Blog' },
  { href: '/rastreio', label: 'Rastreio' },
  { href: '/faq', label: 'FAQ' },
]

export function Layout() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { totalCount } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [location.pathname])

  // Paginas de leitura de artigo tem fundo branco — o cabecalho precisa
  // ficar sempre escuro ali, senao fica ilegivel (texto claro sobre branco)
  // no topo da pagina, antes do usuario rolar.
  const forceDarkHeader = location.pathname.startsWith('/blog/')
  const showDarkHeader = scrolled || menuOpen || forceDarkHeader

  return (
    <div style={{ background: 'var(--carbon-0)', color: 'var(--ink)', minHeight: '100vh' }}>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-colors"
        style={{
          background: showDarkHeader ? 'rgba(6,6,6,0.85)' : 'transparent',
          borderBottom: showDarkHeader ? '1px solid var(--hairline)' : '1px solid transparent',
          backdropFilter: showDarkHeader ? 'blur(10px)' : 'none',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <img src="/logo-studio18.png" alt="Studio 18" className="h-12 w-auto sm:h-16" />
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-8 text-sm tracking-wide sm:flex" style={{ color: 'var(--ink-secondary)' }}>
              {navLinks.map((l) =>
                l.href.startsWith('/#') ? (
                  <a key={l.href} href={l.href} className="hover:text-[var(--gold)]">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} to={l.href} className="hover:text-[var(--gold)]">
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            <button
              type="button"
              aria-label="Abrir carrinho"
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center"
              style={{ color: 'var(--ink)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                >
                  {totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center sm:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={'var(--ink)'} strokeWidth="1.8" strokeLinecap="round">
                {menuOpen ? (
                  <>
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden sm:hidden"
              style={{ borderTop: '1px solid var(--hairline)' }}
            >
              <div className="flex flex-col px-6 py-2 text-base" style={{ color: 'var(--ink-secondary)' }}>
                {navLinks.map((l) =>
                  l.href.startsWith('/#') ? (
                    <a key={l.href} href={l.href} className="border-b py-3" style={{ borderColor: 'var(--hairline)' }}>
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.href} to={l.href} className="border-b py-3" style={{ borderColor: 'var(--hairline)' }}>
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t px-6 py-10" style={{ borderColor: 'var(--hairline)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
          <img src="/logo-studio18.png" alt="Studio 18" className="h-16 w-auto sm:h-20" />
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Do nosso Studio para o seu.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--ink-muted)' }}>
            <Link to="/blog" className="hover:text-[var(--gold)]">
              Blog
            </Link>
            <Link to="/faq" className="hover:text-[var(--gold)]">
              FAQ
            </Link>
            <Link to="/politica-de-devolucao" className="hover:text-[var(--gold)]">
              Política de devolução
            </Link>
            <Link to="/rastreio" className="hover:text-[var(--gold)]">
              Rastrear pedido
            </Link>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ChatWidget />
    </div>
  )
}
