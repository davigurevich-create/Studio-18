import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { getApprovedTestimonials, type Testimonial } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      className="flex h-full w-[82vw] shrink-0 snap-center flex-col rounded-2xl border p-6 sm:w-[360px]"
      style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
    >
      {t.photo_url && (
        <img src={t.photo_url} alt={`Set montado por ${t.customer_name}`} className="mb-4 h-40 w-full rounded-xl object-cover" />
      )}
      <div className="mb-3 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={14} fill={t.rating >= n ? 'var(--gold-bright)' : 'transparent'} style={{ color: t.rating >= n ? 'var(--gold-bright)' : 'var(--hairline-strong)' }} />
        ))}
      </div>
      <p className="mb-4 flex-1 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
        "{t.message}"
      </p>
      <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--ink)' }}>
        — {t.customer_name}
      </p>
    </div>
  )
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getApprovedTestimonials()
      .then(setTestimonials)
      .catch(() => {})
  }, [])

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[0] as HTMLElement | undefined
    const step = (card?.offsetWidth ?? 360) + 16
    track.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  // Sem depoimentos aprovados ainda: a seção simplesmente não existe, em vez
  // de aparecer vazia ou com espaço reservado sem nada dentro.
  if (testimonials.length === 0) return null

  return (
    <section className="px-6 py-24 sm:py-28" style={{ background: '#000' }}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="mx-auto mb-10 flex max-w-6xl items-end justify-between"
      >
        <div>
          <p className="eyebrow mb-2">Quem já montou</p>
          <h2 className="text-3xl font-medium sm:text-4xl">O que os nossos colecionadores dizem</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scroll(-1)}
            className="glass-pill flex h-9 w-9 items-center justify-center"
          >
            <ChevronLeft size={16} strokeWidth={2.5} className="relative z-10" style={{ color: 'var(--ink-secondary)' }} />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scroll(1)}
            className="glass-pill flex h-9 w-9 items-center justify-center"
          >
            <ChevronRight size={16} strokeWidth={2.5} className="relative z-10" style={{ color: 'var(--ink-secondary)' }} />
          </button>
        </div>
      </motion.div>

      <div
        ref={trackRef}
        className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {testimonials.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>
    </section>
  )
}
