import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const navLinks = [
  { href: '/#manifesto', label: 'Manifesto' },
  { href: '/#diferenciais', label: 'Diferenciais' },
  { href: '/#colecao', label: 'Coleção' },
]

export function Layout() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div style={{ background: 'var(--carbon-0)', color: 'var(--ink)', minHeight: '100vh' }}>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-colors"
        style={{
          background: scrolled || menuOpen ? 'rgba(6,6,6,0.85)' : 'transparent',
          borderBottom: scrolled || menuOpen ? '1px solid var(--hairline)' : '1px solid transparent',
          backdropFilter: scrolled || menuOpen ? 'blur(10px)' : 'none',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-[0.2em]" style={{ color: 'var(--ink)' }}>
            STUDIO <span style={{ color: 'var(--gold)' }}>18</span>
          </Link>
          <nav className="hidden gap-8 text-sm tracking-wide sm:flex" style={{ color: 'var(--ink-secondary)' }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[var(--gold)]">
                {l.label}
              </a>
            ))}
          </nav>
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
                  <a key={l.href} href={l.href} className="border-b py-3" style={{ borderColor: 'var(--hairline)' }}>
                    {l.label}
                  </a>
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
          <div className="text-sm tracking-[0.2em]" style={{ color: 'var(--ink)' }}>
            STUDIO <span style={{ color: 'var(--gold)' }}>18</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Do nosso Studio para o seu.
          </p>
        </div>
      </footer>
    </div>
  )
}
