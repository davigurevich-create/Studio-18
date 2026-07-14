import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function Layout() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div style={{ background: 'var(--carbon-0)', color: 'var(--ink)', minHeight: '100vh' }}>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-colors"
        style={{
          background: scrolled ? 'rgba(6,6,6,0.85)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--hairline)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-[0.2em]" style={{ color: 'var(--ink)' }}>
            STUDIO <span style={{ color: 'var(--gold)' }}>18</span>
          </Link>
          <nav className="hidden gap-8 text-sm tracking-wide sm:flex" style={{ color: 'var(--ink-secondary)' }}>
            <a href="/#manifesto" className="hover:text-[var(--gold)]">
              Manifesto
            </a>
            <a href="/#diferenciais" className="hover:text-[var(--gold)]">
              Diferenciais
            </a>
            <a href="/#colecao" className="hover:text-[var(--gold)]">
              Coleção
            </a>
          </nav>
        </div>
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
