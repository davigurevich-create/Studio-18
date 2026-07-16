import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Camera } from 'lucide-react'

interface Word {
  text: string
  gold?: boolean
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
          O padding inferior generoso (em vh) garante espaço de rolagem
          suficiente para a ultima linha terminar 100% nitida antes do fim
          da pagina, em qualquer altura de tela. */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-[60svh] sm:pt-48 sm:pb-[65svh]">
        <div className="flex flex-col gap-2 sm:gap-4">
          {linesOfText.map((line, i) => (
            <RevealLine key={i} words={line} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RevealLine({ words, index }: { words: Word[]; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.35'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0.08, 1])
  const y = useTransform(scrollYProgress, [0, 1], [70, 0])
  const xDirection = index % 2 === 0 ? 1 : -1
  const x = useTransform(scrollYProgress, [0, 1], [40 * xDirection, 0])
  const blurAmount = useTransform(scrollYProgress, [0, 1], [10, 0])
  const filter = useMotionTemplate`blur(${blurAmount}px)`

  return (
    <motion.p
      ref={ref}
      style={{
        opacity,
        y,
        x,
        filter,
        scaleY: 1.16,
        transformOrigin: 'bottom',
      }}
      className="text-[9vw] font-black uppercase leading-[0.95] tracking-tight sm:text-[6vw] lg:text-[4.25rem]"
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: w.gold ? 'var(--gold-bright)' : 'var(--ink)' }}>
          {w.text}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.p>
  )
}
