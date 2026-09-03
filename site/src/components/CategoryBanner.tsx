import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { CategoryDef } from '@/lib/categories'

export function CategoryBanner({ category, count }: { category: CategoryDef; count: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start end', 'end start'] })
  // parallax: a imagem se move um pouco mais devagar que a rolagem da página
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <Link to={`/colecao/${category.slug}`} className="group block">
      <motion.div
        ref={wrapRef}
        whileTap={{ scale: 0.985 }}
        className="relative aspect-[1080/560] w-full overflow-hidden sm:aspect-[2400/500]"
      >
        {/* faixa baixa (banner "abertura de seção", não mais tela cheia) —
            mobile e desktop usam a mesma imagem esticada por object-cover,
            já que a proporção do container é bem próxima da dos arquivos */}
        <picture>
          <source media="(max-width: 639px)" srcSet={category.bannerMobile} />
          <motion.img
            src={category.banner}
            alt={category.title}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ y: parallaxY }}
          />
        </picture>

        {/* escurecimento extra sutil no hover, reforça que o banner é clicável */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%)' }}
        />

        {/* sweep de luz — roda uma vez quando o banner entra na tela, principal
            affordance de "isso é clicável" no mobile (sem hover) */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 sm:hidden"
          style={{
            background: 'linear-gradient(75deg, transparent, rgba(230,199,120,0.22), transparent)',
          }}
          initial={{ x: '-40%' }}
          whileInView={{ x: '340%' }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
        />

        <span
          className="absolute left-6 top-6 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] backdrop-blur-sm sm:bottom-10 sm:left-10 sm:top-auto"
          style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
        >
          {count} {count === 1 ? 'MODELO' : 'MODELOS'}
        </span>
      </motion.div>
    </Link>
  )
}
