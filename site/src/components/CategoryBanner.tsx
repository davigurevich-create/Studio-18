import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { CategoryDef } from '@/lib/categories'

export function CategoryBanner({ category, count }: { category: CategoryDef; count: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  // parallax: a imagem desliza um pouco mais devagar que a página enquanto
  // o banner atravessa a tela. O deslocamento é pequeno de propósito — o
  // título da categoria faz parte da própria imagem, e mais que isso
  // cortaria as letras na borda (a imagem fica 6% ampliada pra ter sobra).
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-2.5%', '2.5%'])

  return (
    <div ref={ref} className="relative aspect-[1080/560] w-full overflow-hidden sm:aspect-[2400/500]">
      {/* faixa baixa — só um cabeçalho visual pra seção; os produtos da
          categoria já vêm logo abaixo, sem precisar clicar */}
      <picture>
        <source media="(max-width: 639px)" srcSet={category.bannerMobile} />
        <motion.img
          src={category.banner}
          alt={category.title}
          className="absolute inset-0 h-full w-full object-cover"
          style={reducedMotion ? undefined : { y, scale: 1.06 }}
        />
      </picture>

      {/* varredura de luz dourada — passa uma vez quando o banner entra na tela */}
      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 35%, rgba(230,199,120,0.34) 50%, transparent 65%)',
            mixBlendMode: 'screen',
          }}
          initial={{ x: '-110%' }}
          whileInView={{ x: '110%' }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 1.3, ease: [0.3, 0, 0.2, 1], delay: 0.15 }}
        />
      )}

      <motion.span
        className="absolute left-6 top-6 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] backdrop-blur-sm sm:bottom-10 sm:left-10 sm:top-auto"
        style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.55 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {count} {count === 1 ? 'MODELO' : 'MODELOS'}
      </motion.span>
    </div>
  )
}
