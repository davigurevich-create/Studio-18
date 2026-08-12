import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
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

// Cada capítulo ocupa esse tanto de rolagem "presa" na tela (em svh) antes
// de passar para o próximo — controla o ritmo da sequência.
const CHAPTER_HEIGHT_SVH = 90

export function Diferenciais() {
  const pinRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(diferenciais.length - 1, Math.max(0, Math.floor(v * diferenciais.length)))
    setActive(idx)
  })

  const ActiveIcon = diferenciais[active].icon

  return (
    <div>
      <section
        className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40"
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
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3">
            Por que Studio 18
          </motion.p>
          <motion.h1 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl sm:text-4xl">
            Sofisticação acessível
          </motion.h1>
        </div>
      </section>

      {/* Sequência presa na tela: cada diferencial ocupa a tela inteira por
          um trecho da rolagem, trocando de conteúdo — mais impacto que os 4
          cards lado a lado, sem alongar demais a página (altura total fixa,
          não soma 4 seções inteiras). */}
      <div ref={pinRef} className="relative" style={{ height: `${diferenciais.length * CHAPTER_HEIGHT_SVH}svh`, background: 'var(--carbon-1)' }}>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'url(/hero-workshop.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.85)' }} />

          <div className="relative z-10 mx-auto flex w-full max-w-4xl items-center gap-8 sm:gap-14">
            <div className="hidden shrink-0 flex-col gap-5 sm:flex">
              {diferenciais.map((_, i) => (
                <div
                  key={i}
                  className="h-px transition-all duration-500"
                  style={{
                    width: i === active ? 36 : 16,
                    background: i === active ? 'var(--gold-bright)' : 'var(--hairline)',
                  }}
                />
              ))}
            </div>

            <div className="min-h-[280px] flex-1 sm:min-h-[240px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -28 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <span
                    className="mb-5 block text-6xl font-black leading-none sm:text-8xl"
                    style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(230,199,120,0.4)' }}
                  >
                    {String(active + 1).padStart(2, '0')}
                  </span>
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: 'var(--gold-wash)', border: '1px solid var(--gold-dim)' }}
                  >
                    <ActiveIcon size={18} strokeWidth={1.75} style={{ color: 'var(--gold-bright)' }} />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--ink)' }}>
                    {diferenciais[active].title}
                  </h3>
                  <p className="max-w-lg text-sm sm:text-base" style={{ color: 'var(--ink-secondary)' }}>
                    {diferenciais[active].text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="hidden shrink-0 text-xs tracking-widest sm:block" style={{ color: 'var(--ink-muted)' }}>
              {String(active + 1).padStart(2, '0')} / {String(diferenciais.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <section className="px-6 pb-24 pt-4" style={{ background: 'var(--carbon-1)' }}>
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col items-center gap-8 sm:flex-row sm:items-center"
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
