import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { BadgePercent, ChevronDown, PackageOpen, ShieldCheck, Warehouse } from 'lucide-react'

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

  // Navegação clicável entre capítulos — rola a janela até o meio do trecho
  // "preso" correspondente ao capítulo de destino, sem nunca ultrapassar o
  // ponto em que a sequência solta (senão o conteúdo fica escondido atrás
  // do rodapé da página).
  const goToChapter = (index: number) => {
    const el = pinRef.current
    if (!el) return
    const clampedIndex = Math.max(0, Math.min(diferenciais.length - 1, index))
    // O framer-motion mapeia o progresso 0→1 apenas até o ponto em que o
    // bloco solta da tela (scrollY = offsetTop + offsetHeight - viewport),
    // não até o fim da altura total do bloco — por isso o intervalo usado
    // aqui é (offsetHeight - viewport), não offsetHeight sozinho.
    const scrollRange = el.offsetHeight - window.innerHeight
    const targetProgress = (clampedIndex + 0.5) / diferenciais.length
    const targetY = el.offsetTop + targetProgress * scrollRange
    const maxPinnedY = el.offsetTop + scrollRange - 2
    window.scrollTo({ top: Math.min(Math.max(targetY, 0), maxPinnedY), behavior: 'smooth' })
  }

  return (
    <div>
      {/* Sequência presa na tela, do topo absoluto da página (por trás do
          menu e da logo, como no resto do site) até o fim dos 4 capítulos.
          Uma única foto de fundo cobre tudo — título, capítulos, marcas e
          CTA — sem nenhuma seção separada quebrando essa continuidade. */}
      <div ref={pinRef} className="relative" style={{ height: `${diferenciais.length * CHAPTER_HEIGHT_SVH}svh`, background: '#000' }}>
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'url(/hero-workshop.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(6,6,6,0.72)' }} />

          <div className="relative z-10 px-6 pb-4 pt-28 text-center sm:pt-32">
            <p className="eyebrow mb-2">Por que Studio 18</p>
            <h1 className="text-2xl sm:text-4xl">Sofisticação acessível</h1>
          </div>

          <div className="relative z-10 flex flex-1 items-center px-6">
            <div className="mx-auto flex w-full max-w-4xl items-center gap-8 sm:gap-14">
              <div className="hidden shrink-0 flex-col gap-5 sm:flex">
                {diferenciais.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir para o diferencial ${i + 1}`}
                    onClick={() => goToChapter(i)}
                    className="cursor-pointer py-1"
                  >
                    <span
                      className="block h-px transition-all duration-500"
                      style={{
                        width: i === active ? 36 : 16,
                        background: i === active ? 'var(--gold-bright)' : 'var(--hairline)',
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="min-h-[260px] flex-1 sm:min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -28 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <span
                      className="mb-4 block text-5xl font-black leading-none sm:text-7xl"
                      style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(230,199,120,0.4)' }}
                    >
                      {String(active + 1).padStart(2, '0')}
                    </span>
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: 'var(--gold-wash)', border: '1px solid var(--gold-dim)' }}
                    >
                      <ActiveIcon size={18} strokeWidth={1.75} style={{ color: 'var(--gold-bright)' }} />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold sm:text-3xl" style={{ color: 'var(--ink)' }}>
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

          {/* Seta clicável — deixa explícito que dá pra navegar clicando,
              não só rolando. */}
          <motion.button
            type="button"
            aria-label="Próximo diferencial"
            onClick={() => goToChapter(active + 1)}
            className="relative z-10 mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)', background: 'var(--gold-wash)' }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} strokeWidth={2} />
          </motion.button>

          {/* Marcas oficiais + CTA — fixos no rodapé do mesmo fundo, visíveis
              nos 4 capítulos (não é uma caixa separada: só um gradiente
              suave por trás para garantir leitura, sem cortar a foto). */}
          <div className="relative z-10 px-6 pb-8 pt-14 sm:pb-10">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 top-0"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(6,6,6,0.88) 55%)' }}
            />
            <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-4 sm:items-start">
                <p className="text-xs sm:text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  Representamos oficialmente as marcas mais respeitadas do segmento
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                  {officialBrands.map((brand) => (
                    <img
                      key={brand.name}
                      src={brand.logo}
                      alt={`${brand.name} — logo`}
                      className="h-10 opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-14"
                    />
                  ))}
                </div>
              </div>

              <a
                href="/#colecao"
                className="inline-block shrink-0 rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
                style={{ background: 'var(--gold)', color: '#0a0a0a' }}
              >
                Ver a coleção
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
