import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'

export interface Word {
  text: string
  gold?: boolean
}

/**
 * Uma linha de texto grande que revela nitidez, posição e cor conforme o
 * usuário rola a página — usada no texto de impacto de Quem Somos e no
 * Manifesto, para o mesmo efeito de leitura cinematográfica.
 */
export function RevealLine({ words, index }: { words: Word[]; index: number }) {
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
