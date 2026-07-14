import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Hero3D } from '@/components/Hero3D'
import { ProductCard } from '@/components/ProductCard'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const diferenciais = [
  {
    title: 'Pronta entrega no Brasil',
    text: 'Sem esperar meses por uma importação individual — seu set chega rápido, direto do nosso estoque no Brasil.',
  },
  {
    title: 'Valor mais acessível',
    text: 'Importamos em escala, com toda a logística resolvida — o que se traduz em um preço mais justo do que importar sozinho em qualquer site.',
  },
  {
    title: 'Experiência completa',
    text: 'Caixa oficial, manual completo e detalhado. Cada set chega como deveria: pronto para o ritual da montagem.',
  },
  {
    title: 'Curadoria de sofisticação',
    text: 'Cada modelo é selecionado a dedo — carros, motos e motores que se tornam esculturas de engenharia na sua estante.',
  },
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

  useEffect(() => {
    getCatalog().then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative flex h-[100svh] min-h-[640px] items-center justify-center overflow-hidden">
        <Hero3D />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, transparent, var(--carbon-0) 85%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="eyebrow mb-5">Boutique de sets técnicos importados · escala 1:8</p>
            <h1 className="text-5xl leading-[1.05] sm:text-7xl">
              Construir é mais
              <br />
              do que montar.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
              Do nosso Studio para o seu: carros, motos e motores que se tornam esculturas de engenharia,
              construídas pelas suas próprias mãos.
            </p>
            <a
              href="#colecao"
              className="mt-10 inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Ver a coleção
            </a>
          </motion.div>
        </div>
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em]"
          style={{ color: 'var(--ink-muted)' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          ROLE PARA EXPLORAR
        </motion.div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto" className="mx-auto max-w-3xl px-6 py-28 sm:py-36">
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

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="border-y px-6 py-24" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <div className="mx-auto max-w-6xl">
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
              <motion.div
                key={d.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
              >
                <div className="mb-4 h-px w-8" style={{ background: 'var(--gold)' }} />
                <h3 className="mb-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
                  {d.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  {d.text}
                </p>
              </motion.div>
            ))}
          </div>
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
          17 modelos, direto da China para você
        </motion.h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Reserve o seu — cada set é uma peça de coleção em escala 1:8, com pronta entrega assim que o
          container desembarcar no Brasil.
        </p>

        {loading ? (
          <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando coleção...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
