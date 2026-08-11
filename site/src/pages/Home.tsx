import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll } from 'framer-motion'
import { Hand } from 'lucide-react'
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
              ROLE PARA EXPLORAR A COLEÇÃO
            </motion.div>
          </section>
          {/* espaçador — distância fixa de rolagem (imune a variações de svh
              mobile) para o escurecimento terminar em preto total antes do
              bloco seguinte aparecer */}
          <div className="h-[220px]" />
        </div>
      </div>

      {/* COLEÇÃO / MARKETPLACE — vem direto depois da hero, sem bloco de
          transição intermediário. */}
      <section id="colecao" className="mx-auto max-w-6xl px-6 py-24">
        <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
          Carros, motos e motores que se tornam esculturas de engenharia, pelas suas próprias mãos.
        </motion.p>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mb-4 max-w-3xl text-center text-3xl sm:text-4xl"
        >
          Importamos os mais sofisticados sets técnicos de blocos de montar em escala 1:8. Possuímos grande
          estoque e fazemos pronta entrega para todo o Brasil.
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

