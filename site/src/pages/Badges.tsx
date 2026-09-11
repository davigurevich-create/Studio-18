import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Award, ChevronDown, Trophy, Wrench } from 'lucide-react'
import { SpotifySection } from '@/components/SpotifySection'

const BOB_URL = 'https://brasilopenbadge.com.br/partner/studio-18'

// lucide-react não exporta mais um ícone de Instagram (marca registrada) —
// mesmo desenho simples usado no rodapé (Layout.tsx).
function InstagramIcon({ size = 18, strokeWidth = 1.75, style }: { size?: number; strokeWidth?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} style={style} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

// Banner — enquanto o arquivo não existir em site/public/, o
// background-image simplesmente não carrega e o gradiente do próprio
// elemento (definido abaixo) segue visível no lugar, sem erro nenhum.
const BANNERS = {
  heroTitleDesktop: '/badges-hero-title-desktop.png',
  heroTitleMobile: '/badges-hero-title-mobile.png',
  flowDesktop: '/badges-flow-desktop.jpg',
  flowMobile: '/badges-flow-mobile.jpg',
}

function BannerBackground({ desktop, mobile }: { desktop: string; mobile: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{ backgroundImage: `url(${desktop})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div
        className="pointer-events-none absolute inset-0 sm:hidden"
        style={{ backgroundImage: `url(${mobile})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    </>
  )
}

// Medalhas circulares por modelo — mostradas na vitrine do CTA final.
// Mesma lógica de "sobe o arquivo com esse nome e ele aparece sozinho":
// se a imagem não existir ainda, a própria tag <img> se esconde (onError),
// sem ícone quebrado nem espaço vazio na fileira.
const MEDALS = [
  '/badges-medal-01.jpg',
  '/badges-medal-02.jpg',
  '/badges-medal-03.jpg',
  '/badges-medal-04.jpg',
  '/badges-medal-05.jpg',
  '/badges-medal-06.jpg',
]

/**
 * Texto grande "espelhado" — mesmo esticamento vertical (scaleY) já usado
 * no texto de impacto de Quem Somos/Manifesto (RevealText.tsx), com uma
 * cópia espelhada por baixo que desaparece em degradê, dando o efeito de
 * reflexo premium do design de referência.
 */
function MirrorText({ children, className }: { children: ReactNode; className: string }) {
  const style: CSSProperties = { transform: 'scaleY(1.16)', transformOrigin: 'bottom' }
  return (
    <div className="relative">
      <p className={className} style={style}>
        {children}
      </p>
      <p
        aria-hidden="true"
        className={`${className} pointer-events-none absolute inset-x-0 top-full select-none`}
        style={{
          transform: 'scaleY(-1.16)',
          transformOrigin: 'top',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 70%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 70%)',
          opacity: 0.5,
        }}
      >
        {children}
      </p>
    </div>
  )
}

function ScrollCue({ label }: { label: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2 pb-10 pt-4">
      <span className="text-[11px] tracking-[0.3em]" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
        <ChevronDown size={16} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} />
      </motion.div>
    </div>
  )
}

const stats = [
  { value: 52000, prefix: '+', label: 'peças montadas' },
  { value: 18, prefix: '+', label: 'medalhas emitidas' },
  { value: 80, prefix: '+', label: 'colecionadores' },
]

function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true)
      },
      { rootMargin: '-40px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const duration = 1200
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, value])

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('pt-BR')}
    </span>
  )
}

const steps = [
  {
    icon: Wrench,
    title: 'Monte seu set',
    text: 'Termine a montagem de qualquer set Studio 18 — do primeiro carro à moto mais complexa do catálogo.',
  },
  {
    icon: InstagramIcon,
    title: 'Poste no Instagram',
    text: 'Compartilhe uma foto ou vídeo do set montado, marcando @studio18bricks no Instagram.',
  },
  {
    icon: Award,
    title: 'Receba seu Badge',
    text: 'Sua conquista vira uma credencial digital verificável, emitida pela BOB e guardada na sua mochila digital.',
  },
  {
    icon: Trophy,
    title: 'Suba no ranking',
    text: 'Cada badge vale pontos — o mesmo número de peças do set. Acumule pontos e ganhe benefícios exclusivos.',
  },
]

const marcos = [
  {
    image: '/mestre-construtor.png',
    title: 'Badge: Mestre Construtor',
    criteria: '3 sets distintos concluídos',
  },
  {
    image: '/clube-10k.png',
    title: 'Badge: Clube 10K — Engenheiro Chefe',
    criteria: '10.000 pontos acumulados',
  },
]

export function Badges() {
  const stepsListRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: lineProgress } = useScroll({ target: stepsListRef, offset: ['start 0.75', 'end 0.4'] })
  const lineScale = useTransform(lineProgress, [0, 1], [0, 1])
  // Enquanto o banner (arte pronta feita no Canva) não existir em
  // site/public/, a tag <img> mostraria um ícone de imagem quebrada — ao
  // invés disso, escondemos a tag e mostramos um título simples no lugar,
  // que some sozinho assim que o arquivo certo for enviado.
  const [heroBannerFailed, setHeroBannerFailed] = useState(false)

  return (
    <div>
      {/* HERO — fundo 100% preto, sem foto; o título vem de um banner
          pronto (arte feita no Canva, com o efeito de reflexo já
          embutido), não de tipografia gerada em código. */}
      <section
        className="relative flex min-h-[88svh] flex-col overflow-hidden px-6 pb-10 pt-40 text-center sm:min-h-[100svh] sm:pt-52"
        style={{ background: '#000' }}
      >
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          {heroBannerFailed ? (
            <div>
              <p className="eyebrow mb-4">Uma comunidade baseada em</p>
              <p className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl" style={{ color: 'var(--ink)' }}>
                Medalhas Digitais
              </p>
            </div>
          ) : (
            <>
              <img
                src={BANNERS.heroTitleDesktop}
                alt="Uma comunidade baseada em Medalhas Digitais"
                className="mx-auto hidden h-auto w-full max-w-[640px] sm:block"
                onError={() => setHeroBannerFailed(true)}
              />
              <img
                src={BANNERS.heroTitleMobile}
                alt="Uma comunidade baseada em Medalhas Digitais"
                className="mx-auto h-auto w-full max-w-[340px] sm:hidden"
                onError={() => setHeroBannerFailed(true)}
              />
            </>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="relative z-10 mx-auto mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:mt-20 sm:gap-x-20"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-x-8 sm:gap-x-20">
              {i > 0 && <span className="hidden h-10 w-px sm:block" style={{ background: 'var(--hairline)' }} />}
              <div className="text-center">
                <div className="tabular text-2xl font-semibold sm:text-4xl" style={{ color: 'var(--gold-bright)' }}>
                  <CountUp value={stat.value} prefix={stat.prefix} />
                </div>
                <div className="mt-2 whitespace-nowrap text-[10px] tracking-widest sm:text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-auto pt-16">
          <ScrollCue label="Role para conhecer" />
        </div>
      </section>

      {/* O QUE É UMA MEDALHA DIGITAL */}
      <section className="relative overflow-hidden border-t px-6 pb-16 pt-24 sm:pt-32" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <div
          className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Studio 18 × BOB Brasil Open Badge</p>
          <h2 className="mb-6 text-3xl font-medium sm:text-4xl">O que é uma Medalha Digital (Open Badge)?</h2>
          <p className="mb-6 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Open Badge é o padrão internacional de credenciais digitais (Open Badge Specification, criado pela
            Mozilla Foundation) — um certificado à prova de falsificação, que carrega os critérios exatos de quem,
            como e por que foi conquistado. As Medalhas Digitais da Studio 18 são emitidas em parceria com a{' '}
            <span style={{ color: 'var(--gold-bright)' }}>BOB — Brasil Open Badge</span>, a maior plataforma do
            Brasil no formato, dentro de um portal 100% personalizado da Studio 18.
          </p>
          <p className="mb-8 text-lg font-medium sm:text-xl" style={{ color: 'var(--ink)' }}>
            Porque cada set montado é{' '}
            <span style={{ color: 'var(--gold-bright)' }}>uma conquista que merece ser reconhecida</span>.
          </p>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition hover:scale-[1.03]"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Acessar o portal de medalhas
          </a>
        </motion.div>

        <ScrollCue label="Ver como funciona" />
      </section>

      {/* COMO FUNCIONA — timeline vertical em zigue-zague: os passos
          revelam normalmente conforme a rolagem (1 e 2 já visíveis ao
          entrar na seção, 3 e 4 aparecem rolando mais), com uma linha
          dourada que "desenha" pra baixo acompanhando o progresso. */}
      <section className="border-t px-6 py-24 sm:py-32" style={{ borderColor: 'var(--hairline)', background: '#000' }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-20 max-w-2xl text-center sm:mb-28"
        >
          <p className="eyebrow mb-2">Como funciona</p>
          <h2 className="text-3xl font-medium sm:text-4xl">Da montagem ao Badge</h2>
        </motion.div>

        <div ref={stepsListRef} className="relative mx-auto max-w-3xl">
          {/* trilho da linha (fraco, sempre visível até o fim) */}
          <div className="absolute inset-y-0 left-6 w-px sm:left-1/2" style={{ background: 'var(--hairline)' }} />
          {/* preenchimento dourado, "desenhado" conforme a rolagem */}
          <motion.div
            className="absolute left-6 top-0 w-px sm:left-1/2"
            style={{ height: '100%', background: 'var(--gold-bright)', scaleY: lineScale, transformOrigin: 'top' }}
          />

          <div className="flex flex-col gap-16 sm:gap-24">
            {steps.map((step, i) => {
              const Icon = step.icon
              const alignRight = i % 2 === 0
              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-100px' }}
                  className={`relative flex pl-14 sm:pl-0 ${alignRight ? 'sm:justify-start' : 'sm:justify-end'}`}
                >
                  <span
                    className="absolute left-6 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 sm:left-1/2"
                    style={{ background: 'var(--carbon-0)', borderColor: 'var(--gold-bright)' }}
                  />
                  <div className={`w-full sm:max-w-[46%] ${alignRight ? 'sm:pr-12 sm:text-right' : 'sm:pl-12 sm:text-left'}`}>
                    <div className={`mb-3 flex items-center gap-3 ${alignRight ? 'sm:flex-row-reverse' : ''}`}>
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{ background: 'var(--gold-wash)', border: '1px solid var(--gold-dim)' }}
                      >
                        <Icon size={17} strokeWidth={1.75} style={{ color: 'var(--gold-bright)' }} />
                      </div>
                      <span className="text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold sm:text-2xl" style={{ color: 'var(--ink)' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base" style={{ color: 'var(--ink-secondary)' }}>
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <ScrollCue label="Continuar explorando" />
      </section>

      {/* RESPIRO — foto real dos colecionadores contemplando os sets. */}
      <div className="relative h-[52svh] min-h-[300px] overflow-hidden border-t sm:h-[70svh]" style={{ borderColor: 'var(--hairline)', background: 'linear-gradient(120deg, #14120d, var(--gold-dim))' }}>
        <BannerBackground desktop={BANNERS.flowDesktop} mobile={BANNERS.flowMobile} />
      </div>

      {/* GAMIFICAÇÃO */}
      <section className="border-t px-6 py-24 text-center sm:py-32" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <p className="eyebrow mb-4">A gamificação</p>
          <MirrorText className="mb-16 text-[10vw] font-black uppercase leading-[0.9] tracking-tight sm:mb-20 sm:text-5xl lg:text-6xl">
            1 peça = 1 ponto
          </MirrorText>
        </motion.div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8">
          {marcos.map((marco, i) => (
            <motion.div
              key={marco.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col items-center"
            >
              <div className="relative mb-5 flex h-32 w-32 items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: 'radial-gradient(circle, var(--gold-bright), transparent 70%)' }}
                />
                <img
                  src={marco.image}
                  alt={marco.title}
                  className="relative h-32 w-32 object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-1 text-base font-medium" style={{ color: 'var(--ink)' }}>
                {marco.title}
              </h3>
              <p className="text-xs tracking-widest" style={{ color: 'var(--gold-bright)' }}>
                {marco.criteria.toUpperCase()}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ delay: 0.15 }}
          className="mt-20 sm:mt-28"
        >
          <p className="mb-4 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            As duas medalhas de marco também liberam
          </p>
          <MirrorText className="text-[13vw] font-black uppercase leading-[0.88] tracking-tight sm:text-7xl lg:text-8xl">
            =10% desconto
          </MirrorText>
          <p className="mt-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
            no seu próximo set, revelado na página da sua medalha dentro do portal BOB.
          </p>
        </motion.div>
      </section>

      {/* CTA FINAL — fundo dourado sólido (sem foto), com a vitrine de
          medalhas dos modelos abaixo do botão. */}
      <section
        className="relative overflow-hidden border-t px-6 py-24 text-center sm:py-32"
        style={{ borderColor: 'var(--hairline)', background: 'linear-gradient(160deg, #14120d 0%, #1f1b13 45%, var(--gold-dim) 130%)' }}
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative z-10"
        >
          <h2 className="mx-auto mb-8 max-w-xl text-3xl font-medium sm:text-4xl">Faça parte da nossa comunidade!</h2>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full px-10 py-4 text-sm font-medium tracking-wide transition hover:scale-[1.03]"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Acessar o portal de medalhas →
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ delay: 0.15 }}
          className="relative z-10 mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-6 sm:mt-20 sm:gap-8"
        >
          {MEDALS.map((src) => (
            <motion.div
              key={src}
              whileHover={{ scale: 1.1, y: -8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="group relative h-20 w-20 shrink-0 sm:h-24 sm:w-24"
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-70"
                style={{ background: 'radial-gradient(circle, var(--gold-bright), transparent 70%)' }}
              />
              <img
                src={src}
                alt="Medalha de modelo Studio 18"
                className="relative h-full w-full rounded-full object-cover shadow-lg transition-shadow duration-300"
                style={{ border: '2px solid rgba(10,9,7,0.6)' }}
                onError={(e) => {
                  e.currentTarget.closest('.group')?.setAttribute('style', 'display:none')
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <SpotifySection />
    </div>
  )
}
