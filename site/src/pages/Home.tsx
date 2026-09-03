import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { HeroCar } from '@/components/HeroCar'
import { CategoryBanner } from '@/components/CategoryBanner'
import { ProductCard } from '@/components/ProductCard'
import { ProductRail } from '@/components/ProductRail'
import { SpotifySection } from '@/components/SpotifySection'
import { categories } from '@/lib/categories'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

type SortKey = 'nome' | 'preco-asc' | 'preco-desc' | 'pecas-asc' | 'pecas-desc'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'preco-asc', label: 'Preço: menor primeiro' },
  { value: 'preco-desc', label: 'Preço: maior primeiro' },
  { value: 'pecas-asc', label: 'Peças: menos primeiro' },
  { value: 'pecas-desc', label: 'Peças: mais primeiro' },
]

export function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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

  // com busca/ordenação ativas não dá pra manter os trilhos por categoria
  // (deixariam de bater com o filtro), então nesse caso a vitrine vira uma
  // grade única com todos os modelos que combinam
  const hasActiveFilter = search.trim() !== '' || sortBy !== 'nome'

  const filteredProducts = useMemo(() => {
    let list = products
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
  }, [products, search, sortBy])

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
              className="text-xs tracking-[0.3em]"
              style={{ color: 'var(--ink-muted)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              ROLE PARA EXPLORAR A COLEÇÃO
            </motion.div>
            <motion.div
              className="mt-2"
              animate={{ y: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={18} strokeWidth={2.5} style={{ color: '#ffffff' }} />
            </motion.div>
          </section>
          {/* espaçador — distância fixa de rolagem (imune a variações de svh
              mobile) para o escurecimento terminar em preto total antes do
              bloco seguinte aparecer */}
          <div className="h-[110px]" />
        </div>
      </div>

      {/* COLEÇÃO / MARKETPLACE — vem direto depois da hero, sem bloco de
          transição intermediário. Fundo 100% preto (igual à hero) até o
          fim da seção — só depois dela volta pro carbon-0 levemente mais
          claro do resto do site. */}
      <section id="colecao" style={{ background: '#000000' }}>
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-24">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-3 text-center">
            Esculturas de engenharia, pelas suas próprias mãos.
          </motion.p>
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center text-xl sm:text-4xl"
          >
            Os melhores sets técnicos em escala 1:8, selecionados para entusiastas e colecionadores, a pronta
            entrega no Brasil.
          </motion.h2>

          {!hasActiveFilter && (
            <motion.nav
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/#${cat.slug}`}
                  className="glass-pill px-6 py-3 text-xs font-bold uppercase tracking-wide hover:text-[var(--gold-bright)]"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  <span className="relative z-10">{cat.title}</span>
                </Link>
              ))}
            </motion.nav>
          )}

          {/* busca + ordenação — discreto, sem caixas/bordas pesadas, só um
              traço embaixo de cada campo */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8"
          >
            <div className="relative">
              <Search
                size={13}
                strokeWidth={2}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-muted)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou fabricante"
                className="w-52 border-b bg-transparent py-1.5 pl-5 text-sm outline-none sm:w-64"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border-b bg-transparent py-1.5 text-sm outline-none"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value} style={{ background: '#0a0a0a' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </motion.div>
        </div>

        {loading ? (
          <p className="pb-24 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando coleção...
          </p>
        ) : hasActiveFilter ? (
          filteredProducts.length === 0 ? (
            <p className="pb-24 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              Nenhum modelo encontrado com esses filtros.
            </p>
          ) : (
            <div className="mx-auto max-w-6xl px-6 pb-20">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-16 pb-20">
            {categories.map((cat) => {
              const catProducts = products
                .filter((p) => cat.skus.includes(p.sku))
                .sort((a, b) => a.name.localeCompare(b.name))
              if (catProducts.length === 0) return null
              return (
                <div key={cat.slug} id={cat.slug}>
                  <CategoryBanner category={cat} count={catProducts.length} />
                  <div className="mx-auto max-w-6xl px-6 pt-8">
                    <ProductRail products={catProducts} />
                  </div>
                </div>
              )
            })}
          </div>
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

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="flex justify-center"
          >
            <Link
              to="/conta"
              className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Entrar para solicitar
            </Link>
          </motion.div>
        </div>
      </section>

      <SpotifySection />
    </div>
  )
}

