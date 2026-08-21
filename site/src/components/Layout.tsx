import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { User } from 'lucide-react'
import { ChatWidget } from '@/components/ChatWidget'
import { CartDrawer } from '@/components/CartDrawer'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'

const navLinks = [
  { href: '/#colecao', label: 'Coleção' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/diferenciais', label: 'Diferenciais' },
  { href: '/#pecas-faltantes', label: 'Peças faltantes' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
]

export function Layout() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { totalCount } = useCart()
  const { session } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)

    if (location.hash) {
      const id = location.hash.slice(1)
      const scrollToTarget = () => {
        const el = document.getElementById(id)
        if (el) {
          const headerOffset = 96
          const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
          window.scrollTo({ top, behavior: 'smooth' })
        }
      }
      // A seção alvo só existe no DOM depois que a nova rota termina de
      // renderizar (ex: vindo do /blog para "/"), então esperamos um
      // instante antes de rolar até ela. Repetimos a rolagem mais algumas
      // vezes depois disso porque o conteúdo acima da seção (ex: a grade de
      // produtos da Coleção, carregada de forma assíncrona) pode mudar de
      // altura e "empurrar" a seção-alvo para baixo — sem essas correções a
      // página fica presa na posição de antes desse carregamento terminar.
      const timers = [80, 400, 900].map((delay) => window.setTimeout(scrollToTarget, delay))
      return () => timers.forEach((timer) => window.clearTimeout(timer))
    }

    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

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
            <img src="/logo-studio18.png" alt="Studio 18" className="h-8 w-auto sm:h-10" />
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-8 text-sm tracking-wide sm:flex" style={{ color: 'var(--ink-secondary)' }}>
              {navLinks.map((l) => (
                <Link key={l.href} to={l.href} className="hover:text-[var(--gold)]">
                  {l.label}
                </Link>
              ))}
            </nav>

            <Link
              to="/conta"
              aria-label="Minha conta"
              className="relative flex h-9 w-9 items-center justify-center"
              style={{ color: 'var(--ink)' }}
            >
              <User size={20} strokeWidth={1.8} />
              {session && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full"
                  style={{ background: 'var(--gold)' }}
                />
              )}
            </Link>

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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round">
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
                {navLinks.map((l) => (
                  <Link key={l.href} to={l.href} className="border-b py-3" style={{ borderColor: 'var(--hairline)' }}>
                    {l.label}
                  </Link>
                ))}
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
          <img src="/logo-studio18.png" alt="Studio 18" className="h-11 w-auto sm:h-14" />
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
            <Link to="/conta" className="hover:text-[var(--gold)]">
              Rastrear pedido
            </Link>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <a
              href="https://open.spotify.com/user/31mkhw5bk65ulbf37ggk3fk3hpwa?si=cfa1e6d925a4411d"
              target="_blank"
              rel="noreferrer"
              aria-label="Playlists Studio 18 no Spotify"
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[var(--gold-dim)]"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24 0-.39-.06-.6-.18-1.68-1.02-3.821-1.56-6.24-1.56-1.32 0-2.76.18-4.021.48-.181.06-.421.12-.541.12-.36 0-.6-.28-.6-.6 0-.36.24-.54.541-.62 1.5-.34 2.941-.52 4.621-.52 2.641 0 4.921.58 6.781 1.7.24.14.361.32.361.62 0 .28-.24.56-.541.56zm1.44-3.021c-.301 0-.481-.12-.661-.24-1.921-1.14-4.62-1.8-7.68-1.8-1.5 0-2.881.2-3.981.48-.24.06-.361.06-.481.06-.42 0-.78-.36-.78-.78 0-.42.241-.72.66-.84 1.32-.36 2.821-.6 4.581-.6 3.36 0 6.301.72 8.581 2.1.301.18.481.42.481.84 0 .42-.36.78-.72.78zm1.62-3.541c-.301 0-.481-.06-.72-.2-2.281-1.36-6.001-2.16-9.181-2.16-1.68 0-3.24.2-4.801.6-.181.06-.421.12-.601.12-.481 0-.9-.42-.9-.9 0-.48.301-.84.72-.96 1.62-.44 3.36-.66 5.581-.66 3.541 0 7.681.9 10.321 2.5.301.18.541.5.541.96 0 .48-.42.9-.96.9z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/studio18_bricks/"
              target="_blank"
              rel="noreferrer"
              aria-label="Studio 18 no Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-[var(--gold-dim)]"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ChatWidget />
    </div>
  )
}
