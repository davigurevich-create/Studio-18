import { useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { BadgePercent, Hand, PackageOpen, ShieldCheck, Warehouse } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const diferenciais = [
  {
    icon: Warehouse,
    title: 'Grande estoque físico no Brasil',
    text: 'Somos importadores oficiais de sets técnicos em escala 1:8 direto dos maiores fabricantes do mundo, com grande estoque físico em território nacional. Nada de esperar um container do outro lado do oceano: o seu já está aqui.',
  },
  {
    icon: BadgePercent,
    title: 'Preço competitivo, entrega em dias',
    text: 'Importar em escala elimina os intermediários e os custos que encarecem uma importação individual. O resultado: um preço muito mais justo e pronta entrega em apenas 2 a 5 dias úteis em todo o Brasil.',
  },
  {
    icon: PackageOpen,
    title: 'Experiência oficial, do início ao fim',
    text: 'Cada set chega na caixa original do fabricante, com manual extremamente detalhado — a mesma experiência de quem importa direto, sem abrir mão de nenhum detalhe do ritual de montagem.',
  },
  {
    icon: ShieldCheck,
    title: 'Testado pelos próprios fundadores',
    text: 'Nenhum modelo entra no nosso catálogo sem antes ser montado, peça por peça, pelos fundadores do Studio 18. Só chega ao seu Studio o que já provamos ser excepcional.',
  },
]

const officialBrands = [
  { name: 'CaDA', logo: '/brands/cada.png' },
  { name: 'GULY', logo: '/brands/guly.png' },
  { name: 'REOBRIX', logo: '/brands/reobrix.png' },
  // CBOX entra assim que o logo for enviado para site/public/brands/cbox.png
  { name: 'KBOX', logo: '/brands/kbox.png' },
]

export function Diferenciais() {
  return (
    <div>
      <section
        className="relative overflow-hidden px-6 pb-24 pt-32 sm:pt-40"
        style={{ background: 'var(--carbon-1)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/hero-workshop.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.72)' }} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
            Por que Studio 18
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-16 text-center text-3xl sm:text-4xl"
          >
            Sofisticação acessível
          </motion.h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {diferenciais.map((d, i) => (
              <DiferencialCard key={d.title} {...d} index={i} />
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-20 flex flex-col items-center gap-8 sm:flex-row sm:items-center"
          >
            <p className="max-w-xs shrink-0 text-left text-lg sm:text-xl" style={{ color: 'var(--ink)' }}>
              Representamos oficialmente as marcas mais respeitadas do segmento
            </p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6 sm:ml-12">
              {officialBrands.map((brand) => (
                <img
                  key={brand.name}
                  src={brand.logo}
                  alt={`${brand.name} — logo`}
                  className="h-14 opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-20"
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-20 flex flex-col items-center gap-4 text-center"
          >
            <Hand size={22} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.6} />
            <p className="max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
              Pronto para começar sua coleção?
            </p>
            <a
              href="/#colecao"
              className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Ver a coleção
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function DiferencialCard({
  icon: Icon,
  title,
  text,
  index,
}: {
  icon: typeof Warehouse
  title: string
  text: string
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const [hovering, setHovering] = useState(false)

  const tiltSpring = { stiffness: 200, damping: 20, mass: 0.5 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), tiltSpring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), tiltSpring)
  const lift = useSpring(hovering ? -6 : 0, tiltSpring)

  const glowX = useTransform(mx, [-0.5, 0.5], ['0%', '100%'])
  const glowY = useTransform(my, [-0.5, 0.5], ['0%', '100%'])
  const glowOpacity = useSpring(hovering ? 1 : 0, { stiffness: 120, damping: 22 })
  const glowBackground = useMotionTemplate`radial-gradient(220px circle at ${glowX} ${glowY}, rgba(230, 199, 120, 0.16), transparent 70%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="group relative overflow-hidden rounded-xl border p-6 transition-colors duration-300"
      style={{
        borderColor: hovering ? 'var(--gold-dim)' : 'var(--hairline)',
        background: 'var(--carbon-2)',
        perspective: 800,
        rotateX,
        rotateY,
        y: lift,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: glowOpacity }}
      />

      <motion.div
        className="relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: 'var(--gold-wash)', border: '1px solid var(--gold-dim)' }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.25 }}
      >
        <Icon size={18} strokeWidth={1.75} style={{ color: 'var(--gold-bright)' }} />
      </motion.div>

      <div className="relative z-10 mb-3 h-px w-8 origin-left scale-x-100 transition-transform duration-500 group-hover:scale-x-[1.6]" style={{ background: 'var(--gold)' }} />

      <h3 className="relative z-10 mb-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
        {title}
      </h3>
      <p className="relative z-10 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        {text}
      </p>
    </motion.div>
  )
}
