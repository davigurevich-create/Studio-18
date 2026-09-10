import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll } from 'framer-motion'
import { Award, ChevronDown, Gift, Layers, Sparkles, Trophy, Wrench } from 'lucide-react'
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

// Banners — enquanto os arquivos não existirem em site/public/, o
// background-image simplesmente não carrega e o gradiente do próprio
// elemento (definido abaixo) segue visível no lugar, sem erro nenhum.
// Assim que o arquivo certo for enviado com esse nome, a imagem substitui
// o gradiente sozinha, sem precisar mexer em código.
const BANNERS = {
  heroDesktop: '/badges-hero-desktop.jpg',
  heroMobile: '/badges-hero-mobile.jpg',
  flowDesktop: '/badges-flow-desktop.jpg',
  flowMobile: '/badges-flow-mobile.jpg',
  ctaDesktop: '/badges-cta-desktop.jpg',
  ctaMobile: '/badges-cta-mobile.jpg',
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

const stats = [
  { value: 17, suffix: '', label: 'sets prontos para colecionar' },
  { value: 2, suffix: '', label: 'badges de marco a conquistar' },
  { value: 10000, suffix: '', label: 'pontos até o Clube 10K' },
]

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
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
  }, [inView, value])

  return (
    <span ref={ref}>
      {display.toLocaleString('pt-BR')}
      {suffix}
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
    text: 'Compartilhe uma foto ou vídeo do set montado, marcando @studio18 no Instagram.',
  },
  {
    icon: Award,
    title: 'Receba seu Open Badge',
    text: 'Sua conquista vira uma credencial digital verificável, emitida pela BOB e guardada na sua mochila digital.',
  },
  {
    icon: Trophy,
    title: 'Suba no ranking',
    text: 'Cada badge vale pontos — o mesmo número de peças do set. Acumule pontos e apareça entre os melhores.',
  },
]

// Quanto de rolagem (em svh) fica "preso" na tela pra cada passo passar
// pelo centro — mesmo mecanismo usado em Diferenciais.tsx, só que mais
// compacto (4 passos curtos não precisam do mesmo fôlego de 90svh).
const STEP_HEIGHT_SVH = 70

const marcos = [
  {
    image: '/mestre-construtor.png',
    title: 'Mestre Construtor',
    criteria: '3 sets distintos concluídos',
    text: 'O primeiro grande marco de quem leva a coleção a sério: três sets diferentes, três badges conquistados.',
  },
  {
    image: '/clube-10k.png',
    title: 'Clube 10K — Engenheiro Chefe',
    criteria: '10.000 pontos acumulados',
    text: 'Reservado para quem já somou 10 mil pontos na plataforma — o mesmo que dizer: milhares de peças, dezenas de horas, uma coleção de verdade.',
  },
]

// Os dois badges de marco também dão direito a um cupom de 10% — revelado
// só pra quem conquistou, dentro da própria página do badge no portal BOB.
const MARCO_PERK = '10% de desconto no seu próximo set, revelado na página do seu badge'

// Prévia do ranking — barras com larguras fixas só pra dar a linguagem
// visual de "placar"; os nomes reais aparecem assim que os primeiros
// colecionadores completarem badges (dado ao vivo mora no portal BOB).
const rankingPreview = [
  { medal: '🥇', width: 100 },
  { medal: '🥈', width: 70 },
  { medal: '🥉', width: 45 },
]

export function Badges() {
  const stepsPinRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const { scrollYProgress: stepsProgress } = useScroll({ target: stepsPinRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(stepsProgress, 'change', (v) => {
    const idx = Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length)))
    setActiveStep(idx)
  })

  const goToStep = (index: number) => {
    const el = stepsPinRef.current
    if (!el) return
    const clampedIndex = Math.max(0, Math.min(steps.length - 1, index))
    const scrollRange = el.offsetHeight - window.innerHeight
    const targetProgress = (clampedIndex + 0.5) / steps.length
    const targetY = el.offsetTop + targetProgress * scrollRange
    const maxPinnedY = el.offsetTop + scrollRange - 2
    window.scrollTo({ top: Math.min(Math.max(targetY, 0), maxPinnedY), behavior: 'smooth' })
  }

  const ActiveStepIcon = steps[activeStep].icon

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-28 pt-32 sm:pb-36 sm:pt-44" style={{ background: 'linear-gradient(160deg, #14120d 0%, #1f1b13 45%, var(--gold-dim) 130%)' }}>
        <BannerBackground desktop={BANNERS.heroDesktop} mobile={BANNERS.heroMobile} />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.55)' }} />
        <div
          className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow mb-4">Studio 18 × BOB Brasil Open Badge</p>
          <h1 className="text-4xl font-medium leading-tight sm:text-6xl">
            Cada set montado é uma <span style={{ color: 'var(--gold-bright)' }}>conquista real</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Transforme sua coleção em uma jornada reconhecida. Monte, compartilhe, e receba credenciais digitais
            verificáveis por cada set que você concluir.
          </p>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition hover:scale-[1.03]"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Conhecer meus Badges →
          </a>
        </motion.div>

        {/* Faixa de números — sobrepõe a borda inferior do hero, dando
            continuidade visual com a seção seguinte. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="relative z-10 mx-auto -mb-40 mt-16 grid max-w-3xl grid-cols-3 gap-4 rounded-2xl border px-6 py-8 sm:-mb-24 sm:px-10"
          style={{ borderColor: 'var(--gold-dim)', background: 'rgba(10,9,7,0.82)', backdropFilter: 'blur(6px)' }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="tabular text-2xl font-semibold sm:text-4xl" style={{ color: 'var(--gold-bright)' }}>
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-[11px] leading-tight sm:text-xs" style={{ color: 'var(--ink-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* O QUE SÃO OPEN BADGES */}
      <section className="border-t px-6 pb-20 pt-32 sm:pb-28 sm:pt-36" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">O que são Open Badges</p>
          <h2 className="mb-6 text-3xl font-medium sm:text-4xl">
            Credenciais digitais, <span style={{ color: 'var(--gold-bright)' }}>seguras e verificáveis</span>
          </h2>
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Open Badge é um padrão internacional de credenciais digitais (Open Badge Specification, criado pela
            Mozilla Foundation) — como um certificado à prova de falsificação, que carrega os critérios exatos de
            quem, como e por que foi conquistado. A emissão é feita pela{' '}
            <span style={{ color: 'var(--gold-bright)' }}>BOB — Brasil Open Badge</span>, a maior plataforma do
            Brasil no formato, dentro de um portal 100% personalizado da Studio 18.
          </p>
        </motion.div>
      </section>

      {/* COMO FUNCIONA — sequência presa na tela, navegável por rolagem
          ou clicando nos indicadores/setas (mesmo mecanismo de
          Diferenciais.tsx, só mais compacto). */}
      <div ref={stepsPinRef} className="relative" style={{ height: `${steps.length * STEP_HEIGHT_SVH}svh`, background: '#000' }}>
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
          <div className="relative z-10 px-6 pb-2 pt-28 text-center sm:pt-32">
            <p className="eyebrow mb-2">Como funciona</p>
            <h2 className="text-2xl sm:text-4xl">Da montagem ao badge</h2>
          </div>

          <div className="relative z-10 flex flex-1 items-center px-6">
            <div className="mx-auto flex w-full max-w-4xl items-center gap-8 sm:gap-14">
              <div className="hidden shrink-0 flex-col gap-5 sm:flex">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir para o passo ${i + 1}`}
                    onClick={() => goToStep(i)}
                    className="cursor-pointer py-1"
                  >
                    <span
                      className="block h-px transition-all duration-500"
                      style={{
                        width: i === activeStep ? 36 : 16,
                        background: i === activeStep ? 'var(--gold-bright)' : 'var(--hairline)',
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="min-h-[280px] flex-1 sm:min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -28 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <span
                      className="mb-4 block text-5xl font-black leading-none sm:text-7xl"
                      style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(230,199,120,0.4)' }}
                    >
                      {String(activeStep + 1).padStart(2, '0')}
                    </span>
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: 'var(--gold-wash)', border: '1px solid var(--gold-dim)' }}
                    >
                      <ActiveStepIcon size={18} strokeWidth={1.75} style={{ color: 'var(--gold-bright)' }} />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold sm:text-3xl" style={{ color: 'var(--ink)' }}>
                      {steps[activeStep].title}
                    </h3>
                    <p className="max-w-lg text-sm sm:text-base" style={{ color: 'var(--ink-secondary)' }}>
                      {steps[activeStep].text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="hidden shrink-0 text-xs tracking-widest sm:block" style={{ color: 'var(--ink-muted)' }}>
                {String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            aria-label="Próximo passo"
            onClick={() => goToStep(activeStep + 1)}
            className="relative z-10 mx-auto mb-10 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)', background: 'var(--gold-wash)' }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} strokeWidth={2} />
          </motion.button>
        </div>
      </div>

      {/* RESPIRO — banner full-bleed pra quebrar o ritmo de texto. */}
      <div className="relative h-[46svh] min-h-[260px] overflow-hidden border-t sm:h-[54svh]" style={{ borderColor: 'var(--hairline)', background: 'linear-gradient(120deg, #14120d, var(--gold-dim))' }}>
        <BannerBackground desktop={BANNERS.flowDesktop} mobile={BANNERS.flowMobile} />
      </div>

      {/* GAMIFICAÇÃO */}
      <section className="border-t px-6 py-20 sm:py-28" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <p className="eyebrow mb-4">A gamificação</p>
            <h2 className="mb-6 text-3xl font-medium sm:text-4xl">
              Peças viram <span style={{ color: 'var(--gold-bright)' }}>pontos</span>
            </h2>
            <p className="mb-4 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
              Cada badge conquistado vale pontos — exatamente o número de peças do set que você montou. Sets maiores,
              mais pontos. Os pontos se somam no ranking geral de colecionadores da Studio 18.
            </p>
            <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
              E tudo fica guardado na sua{' '}
              <span style={{ color: 'var(--gold-bright)' }}>mochila digital</span> — uma área logada só sua, com o
              histórico completo de tudo o que você já conquistou.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4 rounded-xl border p-6"
            style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
          >
            <div className="flex items-center gap-3">
              <Layers size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                1 badge conquistado = pontos iguais ao nº de peças do set
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                Pontos acumulados definem sua posição no ranking
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                Badges de marco reconhecem os colecionadores mais dedicados
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BADGES DE MARCO */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Badges de marco</p>
          <h2 className="text-3xl font-medium sm:text-4xl">Os grandes reconhecimentos</h2>
        </motion.div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          {marcos.map((marco, i) => (
            <motion.div
              key={marco.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col items-center rounded-xl border p-8 text-center transition-shadow duration-300"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: 'radial-gradient(circle, var(--gold-bright), transparent 70%)' }}
                />
                <img
                  src={marco.image}
                  alt={marco.title}
                  className="relative h-40 w-40 object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-1 text-xl font-medium" style={{ color: 'var(--ink)' }}>
                {marco.title}
              </h3>
              <p className="mb-4 text-xs tracking-widest" style={{ color: 'var(--gold-bright)' }}>
                {marco.criteria.toUpperCase()}
              </p>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                {marco.text}
              </p>
              <div
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs"
                style={{ borderColor: 'var(--gold-dim)', background: 'var(--gold-wash)', color: 'var(--gold-bright)' }}
              >
                <Gift size={13} strokeWidth={1.75} />
                {MARCO_PERK}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GALERIA DE BADGES */}
      <section className="border-t px-6 py-20 sm:py-28" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Vitrine de badges</p>
          <h2 className="mb-4 text-3xl font-medium sm:text-4xl">Uma coleção inteira para completar</h2>
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Além dos marcos, cada set do catálogo tem seu próprio badge — a vitrine completa cresce a cada novo
            container que chega.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-5 sm:grid-cols-4">
          {[marcos[0].image, marcos[1].image, null, null, null, null, null, null].map((image, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06 }}
              className="flex aspect-square items-center justify-center rounded-xl border p-4"
              style={{
                borderColor: image ? 'var(--gold-dim)' : 'var(--hairline)',
                borderStyle: image ? 'solid' : 'dashed',
                background: 'var(--carbon-2)',
              }}
            >
              {image ? (
                <img src={image} alt="Badge Studio 18" className="h-full w-full object-contain" />
              ) : (
                <span className="text-center text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  BADGE
                  <br />
                  EM BREVE
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* RANKING TEASER */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Ranking de colecionadores</p>
          <h2 className="mb-6 text-3xl font-medium sm:text-4xl">Quem está no topo?</h2>
          <p className="mb-10 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            A comunidade Studio 18 está só começando — os primeiros colecionadores já estão montando sets e
            conquistando seus badges. O ranking completo, atualizado em tempo real, vive no portal oficial.
          </p>
        </motion.div>

        <div className="mx-auto flex max-w-md flex-col gap-3">
          {rankingPreview.map((row, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-lg border px-5 py-4"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <motion.div
                variants={{ hidden: { width: '0%' }, show: { width: `${row.width}%`, transition: { duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.1 } } }}
                className="pointer-events-none absolute inset-y-0 left-0"
                style={{ background: 'var(--gold-wash)' }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xl">{row.medal}</span>
                  <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                    Seu nome aqui?
                  </span>
                </div>
                <span className="tabular text-sm" style={{ color: 'var(--gold-bright)' }}>
                  — pts
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
            style={{ color: 'var(--gold-bright)' }}
          >
            Ver ranking completo no portal →
          </a>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t px-6 py-24 text-center sm:py-32" style={{ borderColor: 'var(--hairline)', background: 'linear-gradient(160deg, #14120d 0%, #1f1b13 45%, var(--gold-dim) 130%)' }}>
        <BannerBackground desktop={BANNERS.ctaDesktop} mobile={BANNERS.ctaMobile} />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.6)' }} />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative z-10"
        >
          <h2 className="mx-auto mb-6 max-w-xl text-3xl font-medium sm:text-4xl">
            Sua mochila digital <span style={{ color: 'var(--gold-bright)' }}>já pode te esperar</span>
          </h2>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full px-10 py-4 text-sm font-medium tracking-wide transition hover:scale-[1.03]"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Acessar o portal de Badges →
          </a>
        </motion.div>
      </section>

      <SpotifySection />
    </div>
  )
}
