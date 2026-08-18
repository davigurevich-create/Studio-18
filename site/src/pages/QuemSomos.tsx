import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { RevealLine, type Word } from '@/components/RevealText'

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

const linesOfText: Word[][] = [
  [{ text: 'Nascemos' }, { text: 'da' }, { text: 'paixão' }, { text: 'dos' }],
  [{ text: 'fundadores.' }, { text: '2', gold: true }, { text: 'amigos', gold: true }, { text: 'engenheiros', gold: true }],
  [{ text: 'e', gold: true }, { text: '1', gold: true }, { text: 'filho,', gold: true }, { text: 'amantes' }],
  [{ text: 'do' }, { text: 'universo' }, { text: 'de' }, { text: 'blocos' }],
  [{ text: 'de' }, { text: 'montar' }, { text: 'técnicos,' }, { text: 'e' }],
  [{ text: 'comprometidos' }, { text: 'a' }, { text: 'levar' }, { text: 'engenharia' }],
  [{ text: 'em' }, { text: 'forma' }, { text: 'de' }, { text: 'arte' }],
  [{ text: 'para' }, { text: 'o' }, { text: 'seu' }, { text: 'Studio.' }],
]

export function QuemSomos() {
  return (
    <div>
      {/* FOTO — placeholder ate a foto real do fundador em frente ao
          container ser enviada */}
      <div className="relative flex h-[70svh] min-h-[420px] items-center justify-center overflow-hidden sm:h-[85svh]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #14120d 0%, #1f1b13 35%, var(--gold-dim) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 6px)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--gold-dim)', background: 'rgba(6,6,6,0.4)' }}
          >
            <Camera size={26} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.5} />
          </div>
          <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--ink-muted)' }}>
            FOTO EM BREVE
          </p>
          <p className="max-w-xs text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Fundador da Studio 18 em frente ao container com os sets recém-chegados
          </p>
        </div>
      </div>

      {/* TEXTO DE IMPACTO — revela linha por linha conforme a rolagem.
          O padding inferior (em vh) garante espaço de rolagem suficiente
          para a ultima linha terminar 100% nitida antes do fim da pagina,
          em qualquer altura de tela. */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-[32svh] sm:pt-48 sm:pb-[38svh]">
        <div className="flex flex-col gap-2 sm:gap-4">
          {linesOfText.map((line, i) => (
            <RevealLine key={i} words={line} index={i} />
          ))}
        </div>
      </section>

      {/* RESPIRO VISUAL — imagem full-bleed antes do FLOW, para quebrar a
          sequência de blocos de texto puro. */}
      <div
        className="h-[46svh] min-h-[280px] border-t bg-cover bg-center sm:h-[62svh]"
        style={{
          borderColor: 'var(--hairline)',
          backgroundColor: '#14120d',
          backgroundImage: 'url(/quem-somos-flow.jpg)',
        }}
      />

      {/* FLOW — verbete de dicionário para o conceito por trás do ritual de
          montagem: o estado de imersão que o Studio 18 vende junto com cada
          set. Layout em split (palavra de um lado, texto do outro). Todo o
          texto descritivo em branco e no mesmo tamanho, com destaques em
          dourado só nas frases mais impactantes. */}
      <section
        className="relative overflow-hidden border-t px-6 py-24 sm:py-32"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
      >
        <div
          className="pointer-events-none absolute -left-32 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center md:text-left"
          >
            <p className="eyebrow mb-4">Conceito</p>
            <h2 className="text-6xl font-medium sm:text-7xl" style={{ color: 'var(--gold-bright)' }}>
              flow
            </h2>
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              /flou/ · substantivo
            </span>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-5 text-center text-lg sm:text-xl md:text-left"
            style={{ color: 'var(--ink)', lineHeight: 1.7 }}
          >
            <p>
              Estado mental de imersão completa em uma atividade, no qual{' '}
              <span style={{ color: 'var(--gold-bright)' }}>a percepção do tempo se dissolve e ação e consciência se fundem</span>.
            </p>
            <p>
              É exatamente essa a experiência de montar um set Studio 18 — um ritual de desconexão do ruído do dia a
              dia.{' '}
              <span style={{ color: 'var(--gold-bright)' }}>Cada peça encaixada silencia uma notificação.</span>
            </p>
            <p>
              Cada hora investida desenvolve clareza, presença e{' '}
              <span style={{ color: 'var(--gold-bright)' }}>
                a satisfação rara de construir algo com as próprias mãos
              </span>
              .
            </p>
          </motion.div>
        </div>
      </section>

      {/* SPOTIFY — playlists curadas pelo Studio 18 para o momento da
          montagem, ligadas diretamente ao conceito de flow acima. */}
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
              className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-xl border sm:w-56"
              style={{
                borderColor: 'var(--hairline-strong)',
                boxShadow:
                  p.position === 'center'
                    ? '0 40px 80px -18px rgba(0,0,0,0.85), 0 0 0 1px var(--gold-dim)'
                    : '0 30px 60px -20px rgba(0,0,0,0.7)',
                transform:
                  p.position === 'left'
                    ? 'rotate(-7deg) translate(14px, 10px)'
                    : p.position === 'right'
                      ? 'rotate(7deg) translate(-14px, 10px)'
                      : 'translateY(-10px) scale(1.06)',
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
    </div>
  )
}

function SpotifyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24 0-.39-.06-.6-.18-1.68-1.02-3.821-1.56-6.24-1.56-1.32 0-2.76.18-4.021.48-.181.06-.421.12-.541.12-.36 0-.6-.28-.6-.6 0-.36.24-.54.541-.62 1.5-.34 2.941-.52 4.621-.52 2.641 0 4.921.58 6.781 1.7.24.14.361.32.361.62 0 .28-.24.56-.541.56zm1.44-3.021c-.301 0-.481-.12-.661-.24-1.921-1.14-4.62-1.8-7.68-1.8-1.5 0-2.881.2-3.981.48-.24.06-.361.06-.481.06-.42 0-.78-.36-.78-.78 0-.42.241-.72.66-.84 1.32-.36 2.821-.6 4.581-.6 3.36 0 6.301.72 8.581 2.1.301.18.481.42.481.84 0 .42-.36.78-.72.78zm1.62-3.541c-.301 0-.481-.06-.72-.2-2.281-1.36-6.001-2.16-9.181-2.16-1.68 0-3.24.2-4.801.6-.181.06-.421.12-.601.12-.481 0-.9-.42-.9-.9 0-.48.301-.84.72-.96 1.62-.44 3.36-.66 5.581-.66 3.541 0 7.681.9 10.321 2.5.301.18.541.5.541.96 0 .48-.42.9-.96.9z" />
    </svg>
  )
}
