import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
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
  heroTitleDesktop: '/banner-hero-badges-desktop.png',
  heroTitleMobile: '/banner-hero-badges-mobile.png',
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

/**
 * Banner do título da hero com o mesmo efeito de inclinação 3D do carro
 * da hero principal do site (HeroCar.tsx): segue o cursor no desktop, e
 * segue o giroscópio/tilt do aparelho no mobile (com o pedido de
 * permissão do iOS disparado no primeiro toque, já que o navegador exige
 * um gesto do usuário pra liberar o sensor).
 */
function TiltHeroBanner({
  desktopSrc,
  mobileSrc,
  alt,
  onError,
}: {
  desktopSrc: string
  mobileSrc: string
  alt: string
  onError: () => void
}) {
  const tiltSpring = { stiffness: 60, damping: 16, mass: 0.5 }

  // Desktop — segue o mouse, igual ao carro da hero principal.
  const desktopRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateXDesktop = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), tiltSpring)
  const rotateYDesktop = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), tiltSpring)

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const rect = desktopRef.current?.getBoundingClientRect()
      if (!rect) return
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
      if (!inside) {
        mx.set(0)
        my.set(0)
        return
      }
      mx.set((e.clientX - rect.left) / rect.width - 0.5)
      my.set((e.clientY - rect.top) / rect.height - 0.5)
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [mx, my])

  // Mobile — segue o tilt do aparelho (giroscópio).
  const gamma = useMotionValue(0)
  const beta = useMotionValue(0)
  const rotateXMobile = useSpring(useTransform(beta, [-20, 20], [7, -7]), tiltSpring)
  const rotateYMobile = useSpring(useTransform(gamma, [-20, 20], [-9, 9]), tiltSpring)

  useEffect(() => {
    let baseline: { beta: number; gamma: number } | null = null
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      if (!baseline) baseline = { beta: e.beta, gamma: e.gamma }
      gamma.set(Math.max(-20, Math.min(20, e.gamma - baseline.gamma)))
      beta.set(Math.max(-20, Math.min(20, e.beta - baseline.beta)))
    }
    const enable = () => window.addEventListener('deviceorientation', handleOrientation)

    type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventWithPermission | undefined
    if (DOE?.requestPermission) {
      const onFirstTouch = () => {
        DOE.requestPermission?.()
          .then((result) => {
            if (result === 'granted') enable()
          })
          .catch(() => {})
        window.removeEventListener('touchstart', onFirstTouch)
      }
      window.addEventListener('touchstart', onFirstTouch, { once: true })
      return () => window.removeEventListener('touchstart', onFirstTouch)
    }
    if (DOE) enable()
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [beta, gamma])

  return (
    <>
      <div ref={desktopRef} className="mx-auto hidden sm:block" style={{ perspective: 1000 }}>
        <motion.img
          src={desktopSrc}
          alt={alt}
          onError={onError}
          className="mx-auto h-auto w-full max-w-[640px]"
          style={{ rotateX: rotateXDesktop, rotateY: rotateYDesktop }}
        />
      </div>
      <div className="mx-auto sm:hidden" style={{ perspective: 800 }}>
        <motion.img
          src={mobileSrc}
          alt={alt}
          onError={onError}
          className="mx-auto h-auto w-full max-w-[340px]"
          style={{ rotateX: rotateXMobile, rotateY: rotateYMobile }}
        />
      </div>
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

// Quebra um parágrafo em palavras, marcando como "gold" as que caem
// dentro de uma frase de destaque (goldPhrase) — mesma ideia do Word[]
// do RevealText.tsx, só que derivada de uma frase corrida em vez de um
// array escrito à mão.
function splitWords(text: string, goldPhrase?: string): { text: string; gold?: boolean }[] {
  const idx = goldPhrase ? text.indexOf(goldPhrase) : -1
  if (idx === -1) return text.split(' ').map((w) => ({ text: w }))
  const before = text.slice(0, idx).trim()
  const after = text.slice(idx + goldPhrase!.length).trim()
  const words: { text: string; gold?: boolean }[] = []
  if (before) words.push(...before.split(' ').map((w) => ({ text: w })))
  words.push(...goldPhrase!.split(' ').map((w) => ({ text: w, gold: true })))
  if (after) words.push(...after.split(' ').map((w) => ({ text: w })))
  // Pontuação colada direto na frase de destaque (ex: "Badge," ou
  // "reconhecida.") vira um token isolado — gruda de volta na palavra
  // anterior em vez de aparecer separada por um espaço indevido.
  for (let i = words.length - 1; i > 0; i--) {
    if (/^[.,;:!?)]+$/.test(words[i].text)) {
      words[i - 1] = { ...words[i - 1], text: words[i - 1].text + words[i].text }
      words.splice(i, 1)
    }
  }
  return words
}

function BlurWord({
  text,
  gold,
  progress,
  index,
  total,
}: {
  text: string
  gold?: boolean
  progress: MotionValue<number>
  index: number
  total: number
}) {
  // Janelas de revelação bem largas e sobrepostas entre palavras vizinhas
  // — várias palavras ficam "em trânsito" ao mesmo tempo, o que suaviza o
  // efeito (em vez de cada palavra "estalar" nítida uma de cada vez).
  const span = 1 / total
  const start = index * span * 0.55
  const end = Math.min(1, start + span * 7)
  const opacity = useTransform(progress, [start, end], [0.25, 1])
  const blurAmount = useTransform(progress, [start, end], [5, 0])
  const filter = useMotionTemplate`blur(${blurAmount}px)`

  return (
    <motion.span style={{ opacity, filter, color: gold ? 'var(--gold-bright)' : undefined, display: 'inline-block' }}>
      {text}
    </motion.span>
  )
}

/**
 * Parágrafo que revela palavra por palavra conforme a rolagem — cada
 * palavra nasce suavemente borrada e semi-transparente, ganhando nitidez
 * conforme a seção entra em foco (em vez do bloco inteiro aparecer de
 * uma vez com fadeUp).
 */
function BlurRevealParagraph({
  text,
  goldPhrase,
  className,
  style,
}: {
  text: string
  goldPhrase?: string
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'start 0.35'] })
  const words = useMemo(() => splitWords(text, goldPhrase), [text, goldPhrase])

  return (
    <p ref={ref} className={className} style={style}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <BlurWord text={w.text} gold={w.gold} progress={scrollYProgress} index={i} total={words.length} />
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </p>
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

  // Luzes douradas da seção "o que é uma medalha digital" — derivam
  // (drift) verticalmente em direções opostas e respiram em brilho
  // conforme a rolagem passa pela seção, só enquanto ela está em cena.
  const whatIsRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: whatIsProgress } = useScroll({ target: whatIsRef, offset: ['start end', 'end start'] })
  const blobLeftY = useTransform(whatIsProgress, [0, 1], [-70, 70])
  const blobRightY = useTransform(whatIsProgress, [0, 1], [70, -70])
  const blobOpacity = useTransform(whatIsProgress, [0, 0.5, 1], [0.5, 1, 0.5])
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
        className="relative flex min-h-[88svh] flex-col overflow-hidden px-6 pt-36 text-center sm:min-h-[92svh] sm:pt-40"
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
            <TiltHeroBanner
              desktopSrc={BANNERS.heroTitleDesktop}
              mobileSrc={BANNERS.heroTitleMobile}
              alt="Uma comunidade baseada em Medalhas Digitais"
              onError={() => setHeroBannerFailed(true)}
            />
          )}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="relative z-10 mx-auto mt-10 grid max-w-sm grid-cols-3 items-start justify-center gap-x-2 sm:mt-12 sm:flex sm:max-w-none sm:items-center sm:gap-x-20"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center justify-center sm:gap-x-20">
              {i > 0 && <span className="hidden h-10 w-px sm:block" style={{ background: 'var(--hairline)' }} />}
              <div className="text-center">
                <div className="tabular text-xl font-semibold sm:text-4xl" style={{ color: 'var(--gold-bright)' }}>
                  <CountUp value={stat.value} prefix={stat.prefix} />
                </div>
                <div className="mt-2 text-[9px] leading-tight tracking-wide sm:whitespace-nowrap sm:text-xs sm:tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-auto pt-8">
          <ScrollCue label="Role para conhecer" />
        </div>
      </section>

      {/* O QUE É UMA MEDALHA DIGITAL */}
      <section
        ref={whatIsRef}
        className="relative overflow-hidden px-6 pb-16 pt-24 sm:pt-32"
        style={{ background: '#000' }}
      >
        <motion.div
          className="pointer-events-none absolute -left-24 top-1/4 h-[380px] w-[380px] rounded-full sm:-left-32 sm:h-[460px] sm:w-[460px]"
          style={{ background: 'radial-gradient(circle, rgba(205,164,77,0.55), transparent 70%)', y: blobLeftY, opacity: blobOpacity }}
        />
        <motion.div
          className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full sm:-right-32 sm:h-[460px] sm:w-[460px]"
          style={{ background: 'radial-gradient(circle, rgba(205,164,77,0.55), transparent 70%)', y: blobRightY, opacity: blobOpacity }}
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
          <BlurRevealParagraph
            className="mb-6 text-base leading-relaxed sm:text-lg"
            style={{ color: 'var(--ink-secondary)' }}
            goldPhrase="BOB — Brasil Open Badge"
            text="Open Badge é o padrão internacional de credenciais digitais (Open Badge Specification, criado pela Mozilla Foundation) — um certificado à prova de falsificação, que carrega os critérios exatos de quem, como e por que foi conquistado. As Medalhas Digitais da Studio 18 são emitidas em parceria com a BOB — Brasil Open Badge, a maior plataforma do Brasil no formato, dentro de um portal 100% personalizado da Studio 18."
          />
          <BlurRevealParagraph
            className="mb-8 text-lg font-medium sm:text-xl"
            style={{ color: 'var(--ink)' }}
            goldPhrase="uma conquista que merece ser reconhecida"
            text="Porque cada set montado é uma conquista que merece ser reconhecida."
          />
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

        <div className="mt-20 sm:mt-28">
          <ScrollCue label="Ver como funciona" />
        </div>
      </section>

      {/* COMO FUNCIONA — timeline vertical em zigue-zague: os passos
          revelam normalmente conforme a rolagem (1 e 2 já visíveis ao
          entrar na seção, 3 e 4 aparecem rolando mais), com uma linha
          dourada que "desenha" pra baixo acompanhando o progresso. */}
      <section className="px-6 py-24 sm:py-32" style={{ background: '#000' }}>
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
      <div className="relative h-[52svh] min-h-[300px] overflow-hidden sm:h-[70svh]" style={{ background: 'linear-gradient(120deg, #14120d, var(--gold-dim))' }}>
        <BannerBackground desktop={BANNERS.flowDesktop} mobile={BANNERS.flowMobile} />
      </div>

      {/* GAMIFICAÇÃO */}
      <section className="px-6 py-24 text-center sm:py-32" style={{ background: '#000' }}>
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
        className="relative overflow-hidden px-6 py-24 text-center sm:py-32"
        style={{ background: 'linear-gradient(160deg, #14120d 0%, #1f1b13 45%, var(--gold-dim) 130%)' }}
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
