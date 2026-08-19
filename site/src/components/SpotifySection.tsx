import { motion } from 'framer-motion'

const SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/31mkhw5bk65ulbf37ggk3fk3hpwa?si=cfa1e6d925a4411d'

const playlists = [
  { cover: '/SpotifyCover2-hiphopmix.png', label: 'Hip Hop Mix', position: 'left' as const },
  { cover: '/SpotifyCover1-jazz&bluesmix.png', label: 'Jazz & Blues Mix', position: 'center' as const },
  { cover: '/SpotifyCover3-whiskey&charutomix.png', label: 'Whiskey & Charuto Mix', position: 'right' as const },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

/**
 * Playlists curadas pelo Studio 18 para o momento da montagem, ligadas ao
 * conceito de flow — usado na página Quem Somos (versão full-bleed) e na
 * confirmação de compra (versão `compact`, encaixada numa coluna estreita
 * ao lado do resto da confirmação, em vez de uma seção de página inteira).
 */
export function SpotifySection({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-center">
        <p className="eyebrow mb-3">Trilha sonora do flow</p>
        <h2 className="text-2xl" style={{ color: 'var(--ink)' }}>
          Playlists <span style={{ color: 'var(--gold-bright)' }}>Studio 18</span> no Spotify
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Curadoria de música para você entrar no flow enquanto encaixa cada peça.
        </p>

        <div className="relative z-10 mx-auto mt-12 flex max-w-[300px] items-end justify-center">
          {playlists.map((p) => (
            <div
              key={p.cover}
              className={
                'relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl border' +
                (p.position === 'left' ? ' -mr-3' : p.position === 'right' ? ' -ml-3' : ' mx-1.5')
              }
              style={{
                borderColor: 'var(--hairline-strong)',
                boxShadow:
                  p.position === 'center'
                    ? '0 26px 50px -14px rgba(0,0,0,0.85), 0 0 0 1px var(--gold-dim)'
                    : '0 20px 36px -16px rgba(0,0,0,0.7)',
                transform:
                  p.position === 'left'
                    ? 'rotate(-7deg) translateY(6px)'
                    : p.position === 'right'
                      ? 'rotate(7deg) translateY(6px)'
                      : 'translateY(-6px) scale(1.06)',
                zIndex: p.position === 'center' ? 2 : 1,
              }}
            >
              <img src={p.cover} alt={p.label} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <a
          href={SPOTIFY_PROFILE_URL}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 mt-12 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          <SpotifyIcon size={15} />
          Ouvir no Spotify
        </a>
      </div>
    )
  }

  return (
    <section
      className="relative overflow-hidden border-t px-6 py-28 text-center sm:py-32"
      style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-0)' }}
    >
      <div
        className="pointer-events-none absolute -right-40 -top-32 h-[560px] w-[560px] rounded-full opacity-35"
        style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
      />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="relative z-10"
      >
        <p className="eyebrow mb-4">Trilha sonora do flow</p>
        <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl" style={{ color: 'var(--ink)' }}>
          Playlists <span style={{ color: 'var(--gold-bright)' }}>Studio 18</span> no Spotify
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm sm:text-base" style={{ color: 'var(--ink-secondary)' }}>
          Curadoria de música pensada para o momento da montagem — climas diferentes para você entrar no flow
          enquanto encaixa cada peça.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mx-auto mt-16 flex max-w-xl items-end justify-center"
      >
        {playlists.map((p) => (
          <div
            key={p.cover}
            className={
              'relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl border sm:w-56' +
              (p.position === 'left' ? ' -mr-3 sm:-mr-8' : p.position === 'right' ? ' -ml-3 sm:-ml-8' : ' mx-1 sm:mx-2')
            }
            style={{
              borderColor: 'var(--hairline-strong)',
              boxShadow:
                p.position === 'center'
                  ? '0 40px 80px -18px rgba(0,0,0,0.85), 0 0 0 1px var(--gold-dim)'
                  : '0 30px 60px -20px rgba(0,0,0,0.7)',
              transform:
                p.position === 'left'
                  ? 'rotate(-7deg) translateY(6px)'
                  : p.position === 'right'
                    ? 'rotate(7deg) translateY(6px)'
                    : 'translateY(-8px) scale(1.06)',
              zIndex: p.position === 'center' ? 2 : 1,
            }}
          >
            <img src={p.cover} alt={p.label} className="h-full w-full object-cover" />
            <div
              className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-6 text-left text-[11px] sm:text-xs"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', color: 'var(--ink)' }}
            >
              {p.label}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.a
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.15 }}
        href={SPOTIFY_PROFILE_URL}
        target="_blank"
        rel="noreferrer"
        className="relative z-10 mt-14 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        <SpotifyIcon size={16} />
        Ouvir no Spotify
      </motion.a>
    </section>
  )
}

function SpotifyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24 0-.39-.06-.6-.18-1.68-1.02-3.821-1.56-6.24-1.56-1.32 0-2.76.18-4.021.48-.181.06-.421.12-.541.12-.36 0-.6-.28-.6-.6 0-.36.24-.54.541-.62 1.5-.34 2.941-.52 4.621-.52 2.641 0 4.921.58 6.781 1.7.24.14.361.32.361.62 0 .28-.24.56-.541.56zm1.44-3.021c-.301 0-.481-.12-.661-.24-1.921-1.14-4.62-1.8-7.68-1.8-1.5 0-2.881.2-3.981.48-.24.06-.361.06-.481.06-.42 0-.78-.36-.78-.78 0-.42.241-.72.66-.84 1.32-.36 2.821-.6 4.581-.6 3.36 0 6.301.72 8.581 2.1.301.18.481.42.481.84 0 .42-.36.78-.72.78zm1.62-3.541c-.301 0-.481-.06-.72-.2-2.281-1.36-6.001-2.16-9.181-2.16-1.68 0-3.24.2-4.801.6-.181.06-.421.12-.601.12-.481 0-.9-.42-.9-.9 0-.48.301-.84.72-.96 1.62-.44 3.36-.66 5.581-.66 3.541 0 7.681.9 10.321 2.5.301.18.541.5.541.96 0 .48-.42.9-.96.9z" />
    </svg>
  )
}
