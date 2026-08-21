import { useRef } from 'react'
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
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(circle at center, black, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--gold-dim) 20%, var(--gold-dim) 80%, transparent)' }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{ background: 'var(--gold-bright)' }}
          />

          {phrases.map((phrase, i) => (
            <SpotlightPhrase key={i} text={phrase} index={i} total={phrases.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>

      {/* MOBILE — mesmo conceito de holofote, mas na rolagem vertical
          natural do dedo: a frase mais próxima do centro da tela fica em
          foco, as vizinhas desfocam acima e abaixo. */}
      <div className="flex flex-col px-6 pb-32 pt-8 lg:hidden">
        {phrases.map((phrase, i) => (
          <SpotlightLineMobile key={i} text={phrase} />
        ))}
      </div>
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

function SpotlightLineMobile({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'center center', 'end 0.15'] })
  const distance = useTransform(scrollYProgress, (v) => Math.abs(v - 0.5))

  const opacity = useTransform(distance, [0, 0.28, 0.5], [1, 0.9, 0.15])
  const blurAmount = useTransform(distance, [0, 0.28, 0.5], [0, 0, 6])
  const scale = useTransform(distance, [0, 0.5], [1, 0.9])
  const filter = useMotionTemplate`blur(${blurAmount}px)`

  return (
    <div ref={ref} className="flex min-h-[42svh] items-center justify-center text-center">
      <motion.p style={{ opacity, filter, scale }} className="text-[9vw] font-black uppercase leading-[1.05] tracking-tight">
        {renderWords(text).map(({ key, word, gold }) => (
          <span key={key} style={{ color: gold ? 'var(--gold-bright)' : 'var(--ink)' }}>
            {word}{' '}
          </span>
        ))}
      </motion.p>
    </div>
  )
}
