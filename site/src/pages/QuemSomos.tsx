import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Camera } from 'lucide-react'

const linesOfText = [
  'Nascemos da paixão dos',
  'fundadores. 2 amigos engenheiros',
  'e 1 filho, amantes',
  'do universo de blocos',
  'de montar técnicos, e',
  'comprometidos a levar engenharia',
  'em forma de arte',
  'para o seu Studio.',
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

      {/* TEXTO DE IMPACTO — revela linha por linha conforme a rolagem */}
      <section className="mx-auto max-w-5xl px-6 py-32 sm:py-48">
        <div className="flex flex-col gap-2 sm:gap-4">
          {linesOfText.map((line, i) => (
            <RevealLine key={i} text={line} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RevealLine({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'start 0.4'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0.1, 1])
  const y = useTransform(scrollYProgress, [0, 1], [28, 0])

  return (
    <motion.p
      ref={ref}
      style={{
        opacity,
        y,
        scaleY: 1.16,
        transformOrigin: 'bottom',
        color: 'var(--ink)',
      }}
      className="text-[9vw] font-black uppercase leading-[0.95] tracking-tight sm:text-[6vw] lg:text-[4.25rem]"
    >
      {text}
    </motion.p>
  )
}
