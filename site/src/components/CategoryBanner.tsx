import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
        className="relative h-[62vh] min-h-[380px] w-full overflow-hidden sm:h-[75vh] sm:min-h-[520px]"
        style={{ maxHeight: 720 }}
      >
        <motion.img
          src={category.banner}
          alt={category.title}
          className="pointer-events-none absolute inset-0 h-[120%] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ top: '-10%', y: parallaxY }}
        />

        {/* escurecimento extra sutil no hover, pra dar contraste ao CTA que desliza pra dentro */}
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

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-10">
          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] backdrop-blur-sm"
            style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
          >
            {count} {count === 1 ? 'MODELO' : 'MODELOS'}
          </span>

          <span
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-sm transition-all duration-400 ease-out sm:translate-x-2 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Explorar coleção
            <ArrowRight size={14} strokeWidth={2.5} />
          </span>
        </div>
      </motion.div>
    </Link>
  )
}
