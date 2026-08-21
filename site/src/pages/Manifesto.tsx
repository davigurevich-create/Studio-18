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
    <div style={{ background: '#000' }}>
      {/* Luz dourada fixa vindo do topo absoluto da página — fica atrás do
          header/logo desde o primeiro frame, não acompanha a rolagem, dá a
          sensação de amplitude de um holofote real iluminando a cena
          inteira, não só o texto. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-screen" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-x-0 top-0 h-full"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% -12%, rgba(205,164,77,0.32), transparent 62%)' }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[38%]"
          style={{ background: 'linear-gradient(to bottom, rgba(205,164,77,0.14), transparent)' }}
        />
      </div>

      {/* DESKTOP — holofote de leitura: as frases deslizam na horizontal
          enquanto a página fica presa numa rolagem longa; uma marca fixa no
          centro da tela mantém em foco total só a frase que está passando
          por ali, como uma agulha de vitrola sobre o texto. O título
          "Manifesto" fica fixo no topo da cena presa, visível o tempo todo
          junto com as frases. */}
      <div ref={pinRef} className="relative z-10 hidden lg:block" style={{ height: `${phrases.length * SLICE_SVH}svh` }}>
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          <div className="px-6 pt-32 text-center">
            <p className="eyebrow">Manifesto</p>
          </div>

          <div className="relative flex-1">
            {phrases.map((phrase, i) => (
              <SpotlightPhrase key={i} text={phrase} index={i} total={phrases.length} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE — formato "stories": cada frase é um cartão em tela cheia,
          navegado por deslize horizontal (swipe nativo) ou toque nas
          laterais, com barra de progresso no topo. Rolagem vertical sutil
          não funcionava bem no toque — isso dá um gesto de leitura ativo,
          bem mais vivo. */}
      <div className="relative z-10 lg:hidden">
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
    <div className="relative">
      <div className="px-6 pb-2 pt-32 text-center">
        <p className="eyebrow">Manifesto</p>
      </div>

      <div className="flex gap-1.5 px-4 pt-3">
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
        className="mt-4 flex h-[65svh] snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {phrases.map((phrase, i) => (
          <div key={i} className="flex w-full shrink-0 snap-center items-center justify-center px-8 text-center">
            <motion.p
              animate={{ opacity: active === i ? 1 : 0.25, scale: active === i ? 1 : 0.88 }}
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

      <p className="pb-16 pt-5 text-center text-[11px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
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

  // Frases curtas ganham letra bem grande; frases longas encolhem o
  // suficiente pra caber inteiras na tela sem quebrar linha.
  const remSize = Math.max(1.9, Math.min(4.6, 1750 / text.length / 16))

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-10" style={{ x, opacity, filter, scale }}>
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
