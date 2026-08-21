import { useRef, useState, type MouseEvent } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'framer-motion'

const phrases = [
  'Somos Studio 18.',
  'Algumas experiências não podem ser apressadas.',
  'Cada peça encontra seu lugar com precisão.',
  'Cada etapa transforma a montagem em ritual.',
  'De contemplação e propósito.',
  'Carros, motos e motores',
  'Tornam-se esculturas da engenharia.',
  'Construídas pelas suas próprias mãos.',
  'Criamos o Studio 18',
  'Para tornar esse universo mais acessível.',
  'Sem abrir mão da sofisticação.',
  'Porque construir é mais do que montar:',
  'É transformar precisão em arte.',
]

const GOLD_WORDS = new Set(['studio', '18', 'precisão', 'ritual', 'esculturas', 'engenharia', 'arte'])

function renderWords(text: string) {
  return text.split(' ').map((word, i) => {
    const clean = word.replace(/[.,:]/g, '').toLowerCase()
    return { key: i, word, gold: GOLD_WORDS.has(clean) }
  })
}

// Quanto de rolagem (em svh) fica "preso" na tela pra cada frase passar
// pelo centro — controla a velocidade do holofote no desktop.
const SLICE_SVH = 60

export function Manifesto() {
  const pinRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ['start start', 'end end'] })

  return (
    <div>
      <div className="px-6 pb-4 pt-32 text-center sm:pt-40">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="eyebrow"
        >
          Manifesto
        </motion.p>
      </div>

      {/* DESKTOP — holofote de leitura: as frases deslizam na horizontal
          enquanto a página fica presa numa rolagem longa; uma marca fixa no
          centro da tela mantém em foco total só a frase que está passando
          por ali, como uma agulha de vitrola sobre o texto. */}
      <div
        ref={pinRef}
        className="relative hidden lg:block"
        style={{ height: `${phrases.length * SLICE_SVH}svh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden" style={{ background: '#000' }}>
          {/* Luz dourada fixa vindo de cima — não acompanha a rolagem, é o
              "holofote" físico da cena, sempre no mesmo lugar. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-full"
            style={{ background: 'radial-gradient(ellipse 55% 60% at 50% -10%, rgba(205,164,77,0.28), transparent 65%)' }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[45%]"
            style={{ background: 'linear-gradient(to bottom, rgba(205,164,77,0.10), transparent)' }}
          />

          {phrases.map((phrase, i) => (
            <SpotlightPhrase key={i} text={phrase} index={i} total={phrases.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>

      {/* MOBILE — formato "stories": cada frase é um cartão em tela cheia,
          navegado por deslize horizontal (swipe nativo) ou toque nas
          laterais, com barra de progresso no topo. Rolagem vertical sutil
          não funcionava bem no toque — isso dá um gesto de leitura ativo,
          bem mais vivo. */}
      <div className="lg:hidden">
        <ManifestoStories />
      </div>
    </div>
  )
}

function ManifestoStories() {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(phrases.length - 1, i))
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActive(Math.round(track.scrollLeft / track.clientWidth))
  }

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tapX = e.clientX - rect.left
    scrollToIndex(tapX < rect.width / 2 ? active - 1 : active + 1)
  }

  return (
    <div className="relative" style={{ background: '#000' }}>
      {/* Luz dourada fixa vindo de cima, mesmo conceito do desktop. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[72svh]"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -12%, rgba(205,164,77,0.3), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[35%]"
        style={{ background: 'linear-gradient(to bottom, rgba(205,164,77,0.12), transparent)' }}
      />

      <div className="relative z-10 flex gap-1.5 px-4 pt-3">
        {phrases.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hairline-strong)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: i <= active ? '100%' : '0%', background: 'var(--gold)' }}
            />
          </div>
        ))}
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        onClick={handleTap}
        className="relative z-10 mt-4 flex h-[72svh] snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {phrases.map((phrase, i) => (
          <div key={i} className="flex w-full shrink-0 snap-center items-center justify-center px-8 text-center">
            <motion.p
              animate={{
                opacity: active === i ? 1 : 0.25,
                scale: active === i ? 1 : 0.88,
                textShadow: active === i ? '0 12px 40px rgba(230, 199, 120, 0.5)' : '0 0px 0px rgba(230, 199, 120, 0)',
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-[10vw] font-black uppercase leading-[1.05] tracking-tight"
            >
              {renderWords(phrase).map(({ key, word, gold }) => (
                <span key={key} style={{ color: gold ? 'var(--gold-bright)' : 'var(--ink)' }}>
                  {word}{' '}
                </span>
              ))}
            </motion.p>
          </div>
        ))}
      </div>

      <p className="relative z-10 pb-16 pt-5 text-center text-[11px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        TOQUE NAS LATERAIS OU DESLIZE PARA NAVEGAR
      </p>
    </div>
  )
}

function SpotlightPhrase({
  text,
  index,
  total,
  progress,
}: {
  text: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const center = (index + 0.5) / total
  const distance = useTransform(progress, (v) => Math.abs(v - center))
  const window = 0.28 / total

  const x = useTransform(progress, (v) => (center - v) * 6200)
  const opacity = useTransform(distance, [0, window, window * 1.8], [1, 1, 0.05])
  const blurAmount = useTransform(distance, [0, window, window * 1.8], [0, 0, 14])
  const scale = useTransform(distance, [0, window, window * 1.8], [1.06, 1, 0.72])
  const filter = useMotionTemplate`blur(${blurAmount}px)`

  // Sombra dourada projetada pra baixo — só aparece quando a frase está
  // 100% nítida e centralizada, como se a luz de cima a estivesse
  // iluminando por completo.
  const glowOpacity = useTransform(distance, [0, window], [0.55, 0])
  const textShadow = useMotionTemplate`0 14px 46px rgba(230, 199, 120, ${glowOpacity})`

  // Frases curtas ganham letra bem grande; frases longas encolhem o
  // suficiente pra caber inteiras na tela sem quebrar linha.
  const remSize = Math.max(1.9, Math.min(4.6, 1750 / text.length / 16))

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-10" style={{ x, opacity, filter, scale, textShadow }}>
      <p
        className="whitespace-nowrap text-center font-black uppercase leading-none tracking-tight"
        style={{ color: 'var(--ink)', fontSize: `${remSize}rem` }}
      >
        {renderWords(text).map(({ key, word, gold }) => (
          <span key={key} style={{ color: gold ? 'var(--gold-bright)' : 'var(--ink)' }}>
            {word}{' '}
          </span>
        ))}
      </p>
    </motion.div>
  )
}
