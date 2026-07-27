import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { BadgePercent, Hand, PackageOpen, ShieldCheck, Warehouse } from 'lucide-react'
import { PartRequestForm } from '@/components/PartRequestForm'
import { HeroCar } from '@/components/HeroCar'
import { ProductCard } from '@/components/ProductCard'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

type SortKey = 'nome' | 'preco-asc' | 'preco-desc' | 'pecas-asc' | 'pecas-desc'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'preco-asc', label: 'Investimento (menor primeiro)' },
  { value: 'preco-desc', label: 'Investimento (maior primeiro)' },
  { value: 'pecas-asc', label: 'Peças (menos primeiro)' },
  { value: 'pecas-desc', label: 'Peças (mais primeiro)' },
]

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

const manifestoParagraphs = [
  'Somos Studio 18.',
  'Acreditamos que algumas experiências não podem ser apressadas. Cada peça encontra seu lugar com precisão. Cada encaixe desperta os sentidos. Cada etapa transforma a montagem em um ritual de contemplação, criatividade e propósito.',
  'Carros, motos e motores deixam de ser apenas máquinas. Tornam-se esculturas da engenharia, construídas pelas suas próprias mãos.',
  'Criamos o Studio 18 para tornar esse universo mais acessível, sem abrir mão da sofisticação, do design e da excelência em cada detalhe.',
  'Porque construir é mais do que montar. É dedicar tempo ao que inspira. É transformar precisão em arte. É fazer parte de uma comunidade que compartilha a mesma paixão por engenharia, design e experiências memoráveis.',
]

export function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<SortKey>('nome')

  const heroWrapRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroDarken } = useScroll({
    target: heroWrapRef,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    getCatalog().then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }, [])

  const tags = useMemo(() => {
    const present = new Set(products.map((p) => p.collection_tag).filter((t): t is string => Boolean(t)))
    return ['todos', ...Array.from(present).sort()]
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = products
    if (tag !== 'todos') list = list.filter((p) => p.collection_tag === tag)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.manufacturer?.toLowerCase().includes(q))
    }
    const sorted = [...list]
    switch (sortBy) {
      case 'preco-asc':
        sorted.sort((a, b) => a.sale_price_brl - b.sale_price_brl)
        break
      case 'preco-desc':
        sorted.sort((a, b) => b.sale_price_brl - a.sale_price_brl)
        break
      case 'pecas-asc':
        sorted.sort((a, b) => (a.piece_count ?? 0) - (b.piece_count ?? 0))
        break
      case 'pecas-desc':
        sorted.sort((a, b) => (b.piece_count ?? 0) - (a.piece_count ?? 0))
        break
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
    return sorted
  }, [products, tag, search, sortBy])

  return (
    <div>
      {/* HERO — o carro fica fixo como fundo, escurecendo progressivamente
          até ficar 100% preto ao final desta seção */}
      <div ref={heroWrapRef} className="relative">
        <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden">
          <HeroCar darken={heroDarken} />
        </div>

        <div className="mt-[calc(-1*max(100svh,560px))]">
          <section className="relative z-10 flex h-[100svh] min-h-[560px] flex-col items-center justify-end pb-8 sm:pb-10">
            <motion.div
              className="mb-3"
              animate={{ y: [0, 10, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Hand size={22} style={{ color: 'var(--ink-muted)' }} strokeWidth={1.6} />
            </motion.div>
            <motion.div
              className="text-xs tracking-[0.3em]"
              style={{ color: 'var(--ink-muted)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              ROLE PARA EXPLORAR
            </motion.div>
          </section>
          {/* espaçador — distância fixa de rolagem (imune a variações de svh
              mobile) para o escurecimento terminar em preto total antes do
              bloco seguinte aparecer */}
          <div className="h-[220px]" />
        </div>
      </div>

      {/* BLOCO DE ABERTURA — textura de fibra de carbono e dourado */}
      <section
        className="relative overflow-hidden px-6 pb-16 pt-28 text-center sm:pb-20 sm:pt-36"
        style={{
          backgroundImage: 'url(/Section2-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.6)' }} />
        <motion.div
          className="relative z-10 mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="eyebrow mb-4" style={{ fontSize: '15px', fontWeight: 700, textTransform: 'none' }}>
            Importamos os mais sofisticados sets técnicos de blocos de montar em escala 1:8. Possuímos grande
            estoque e fazemos pronta entrega para todo o Brasil.
          </p>
          <p className="mx-auto max-w-xl text-base sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Carros, motos e motores que se tornam esculturas de engenharia, pelas suas próprias mãos.
          </p>
          <a
            href="#colecao"
            className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Ver a coleção
          </a>
        </motion.div>

        <motion.div
          className="relative z-10 mt-16 text-xs tracking-[0.3em] sm:mt-24"
          style={{ color: 'var(--ink-muted)' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          CONTINUE ROLANDO PARA EXPLORAR
        </motion.div>
      </section>

      {/* MANIFESTO */}
      <div className="relative" style={{ background: 'var(--carbon-0)' }}>
        <section id="manifesto" className="relative z-10 mx-auto max-w-3xl px-6 py-28 sm:py-36">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-8 text-center">
            Manifesto
          </motion.p>
          <div className="flex flex-col gap-8">
            {manifestoParagraphs.map((p, i) => (
              <motion.p
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className={i === 0 ? 'text-center text-2xl font-medium sm:text-3xl' : 'text-center text-lg sm:text-xl'}
                style={{ color: i === 0 ? 'var(--gold-bright)' : 'var(--ink-secondary)', lineHeight: 1.6 }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </section>
      </div>

      {/* DIFERENCIAIS */}
      <section
        id="diferenciais"
        className="relative overflow-hidden border-y px-6 py-24"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/hero-workshop.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'rgba(6,6,6,0.72)' }}
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
            Por que Studio 18
          </motion.p>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-16 text-center text-3xl sm:text-4xl"
          >
            Sofisticação acessível
          </motion.h2>
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
        </div>
      </section>

      {/* COLEÇÃO / MARKETPLACE */}
      <section id="colecao" className="mx-auto max-w-6xl px-6 py-24">
        <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
          Primeiro container
        </motion.p>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-4 text-center text-3xl sm:text-4xl"
        >
          Uma curadoria inicial de 17 modelos para você
        </motion.h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Dê o seu primeiro passo nesse universo. Colecione. Presenteie parentes e amigos. Faça parte da
          comunidade Studio 18.
        </p>

        {loading ? (
          <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando coleção...
          </p>
        ) : (
          <>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className="rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition"
                    style={{
                      borderColor: tag === t ? 'var(--gold)' : 'var(--hairline)',
                      background: tag === t ? 'var(--gold-wash)' : 'transparent',
                      color: tag === t ? 'var(--gold-bright)' : 'var(--ink-secondary)',
                    }}
                  >
                    {t === 'todos' ? 'Todos' : t.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou fabricante..."
                  className="w-full rounded-lg border bg-transparent px-4 py-2 text-sm outline-none sm:w-64"
                  style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-lg border px-4 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)', color: 'var(--ink)' }}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                Nenhum modelo encontrado com esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* PEÇAS FALTANTES */}
      <section
        id="pecas-faltantes"
        className="relative overflow-hidden border-t px-6 py-24"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/part-request-background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.78)' }} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
            Suporte pós-venda
          </motion.p>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mb-4 text-center text-3xl sm:text-4xl"
          >
            Faltou uma peça? A gente resolve.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-2xl text-center text-sm"
            style={{ color: 'var(--ink-muted)' }}
          >
            Somos os únicos com impressora 3D própria para produzir peças provisórias em tempo recorde. Conte pra
            gente qual peça faltou no seu set e escolha como prefere recebê-la — sempre sem nenhum custo.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
            <PartRequestForm />
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
