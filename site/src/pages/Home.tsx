import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll } from 'framer-motion'
import { HeroCar } from '@/components/HeroCar'
import { CategoryBanner } from '@/components/CategoryBanner'
import { ProductRail } from '@/components/ProductRail'
import { SpotifySection } from '@/components/SpotifySection'
import { categories } from '@/lib/categories'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

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
            {/* Linha condutora, em duas partes:
                1) a "pontinha" — fica no fluxo normal, sempre visível dentro
                   da hero junto do texto, sinalizando com clareza que dá
                   pra rolar.
                2) a extensão — sai de fora do fluxo a partir do fim da
                   pontinha e se estende para além da hero, entrando na zona
                   de transição até quase encostar na Coleção. */}
            <motion.div
              className="relative mt-2 h-4 w-px"
              style={{ background: 'linear-gradient(to bottom, #ffffff, rgba(255,255,255,0.35))' }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className="absolute left-1/2 top-full h-[264px] w-px -translate-x-1/2 sm:h-[186px]"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)' }}
              />
            </motion.div>
          </section>
          {/* espaçador — distância fixa de rolagem (imune a variações de svh
              mobile) para o escurecimento terminar em preto total antes do
              bloco seguinte aparecer */}
          <div className="h-[220px]" />
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
            className="mx-auto mb-4 max-w-3xl text-center text-3xl sm:text-4xl"
          >
            Curadoria de sets técnicos de blocos de montar em escala 1:8, a pronta entrega no Brasil.
          </motion.h2>
          <p className="mx-auto max-w-xl text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Dê o seu primeiro passo nesse universo. Colecione. Presenteie parentes e amigos. Faça parte da
            comunidade Studio 18.
          </p>
        </div>

        {loading ? (
          <p className="pb-24 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando coleção...
          </p>
        ) : (
          <div className="flex flex-col gap-16 pb-20">
            {categories.map((cat) => {
              const catProducts = products
                .filter((p) => cat.skus.includes(p.sku))
                .sort((a, b) => a.name.localeCompare(b.name))
              if (catProducts.length === 0) return null
              return (
                <div key={cat.slug}>
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

