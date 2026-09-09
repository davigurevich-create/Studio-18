import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Award, Layers, Sparkles, Trophy, Wrench } from 'lucide-react'
import { SpotifySection } from '@/components/SpotifySection'

const BOB_URL = 'https://brasilopenbadge.com.br/partner/studio-18'

// lucide-react não exporta mais um ícone de Instagram (marca registrada) —
// mesmo desenho simples usado no rodapé (Layout.tsx).
function InstagramIcon({ size = 18, strokeWidth = 1.75, style }: { size?: number; strokeWidth?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} style={style} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const steps = [
  {
    icon: Wrench,
    title: 'Monte seu set',
    text: 'Termine a montagem de qualquer set Studio 18 — do primeiro carro à moto mais complexa do catálogo.',
  },
  {
    icon: InstagramIcon,
    title: 'Poste no Instagram',
    text: 'Compartilhe uma foto ou vídeo do set montado, marcando @studio18 no Instagram.',
  },
  {
    icon: Award,
    title: 'Receba seu Open Badge',
    text: 'Sua conquista vira uma credencial digital verificável, emitida pela BOB e guardada na sua mochila digital.',
  },
  {
    icon: Trophy,
    title: 'Suba no ranking',
    text: 'Cada badge vale pontos — o mesmo número de peças do set. Acumule pontos e apareça entre os melhores.',
  },
]

const marcos = [
  {
    image: '/mestre-construtor.png',
    title: 'Mestre Construtor',
    criteria: '3 sets distintos concluídos',
    text: 'O primeiro grande marco de quem leva a coleção a sério: três sets diferentes, três badges conquistados.',
  },
  {
    image: '/clube-10k.png',
    title: 'Clube 10K — Engenheiro Chefe',
    criteria: '10.000 pontos acumulados',
    text: 'Reservado para quem já somou 10 mil pontos na plataforma — o mesmo que dizer: milhares de peças, dezenas de horas, uma coleção de verdade.',
  },
]

export function Badges() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 sm:pb-28 sm:pt-44">
        <div
          className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-4">Studio 18 × BOB Brasil Open Badge</p>
          <h1 className="text-4xl font-medium leading-tight sm:text-6xl">
            Cada set montado é uma <span style={{ color: 'var(--gold-bright)' }}>conquista real</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Transforme sua coleção em uma jornada reconhecida. Monte, compartilhe, e receba credenciais digitais
            verificáveis por cada set que você concluir.
          </p>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Conhecer meus Badges →
          </a>
        </div>
      </section>

      {/* O QUE SÃO OPEN BADGES */}
      <section className="border-t px-6 py-20 sm:py-28" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">O que são Open Badges</p>
          <h2 className="mb-6 text-3xl font-medium sm:text-4xl">
            Credenciais digitais, <span style={{ color: 'var(--gold-bright)' }}>seguras e verificáveis</span>
          </h2>
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            Open Badge é um padrão internacional de credenciais digitais (Open Badge Specification, criado pela
            Mozilla Foundation) — como um certificado à prova de falsificação, que carrega os critérios exatos de
            quem, como e por que foi conquistado. A emissão é feita pela{' '}
            <span style={{ color: 'var(--gold-bright)' }}>BOB — Brasil Open Badge</span>, a maior plataforma do
            Brasil no formato, dentro de um portal 100% personalizado da Studio 18.
          </p>
        </motion.div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Como funciona</p>
          <h2 className="text-3xl font-medium sm:text-4xl">Da montagem ao badge</h2>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border p-6"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--gold-wash)' }}
              >
                <step.icon size={18} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              </div>
              <div className="mb-2 text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                PASSO {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-medium" style={{ color: 'var(--ink)' }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GAMIFICAÇÃO */}
      <section className="border-t px-6 py-20 sm:py-28" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <p className="eyebrow mb-4">A gamificação</p>
            <h2 className="mb-6 text-3xl font-medium sm:text-4xl">
              Peças viram <span style={{ color: 'var(--gold-bright)' }}>pontos</span>
            </h2>
            <p className="mb-4 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
              Cada badge conquistado vale pontos — exatamente o número de peças do set que você montou. Sets maiores,
              mais pontos. Os pontos se somam no ranking geral de colecionadores da Studio 18.
            </p>
            <p className="text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
              E tudo fica guardado na sua{' '}
              <span style={{ color: 'var(--gold-bright)' }}>mochila digital</span> — uma área logada só sua, com o
              histórico completo de tudo o que você já conquistou.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4 rounded-xl border p-6"
            style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
          >
            <div className="flex items-center gap-3">
              <Layers size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                1 badge conquistado = pontos iguais ao nº de peças do set
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                Pontos acumulados definem sua posição no ranking
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles size={20} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.75} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                Badges de marco reconhecem os colecionadores mais dedicados
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BADGES DE MARCO */}
      <section className="px-6 py-20 sm:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Badges de marco</p>
          <h2 className="text-3xl font-medium sm:text-4xl">Os grandes reconhecimentos</h2>
        </motion.div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          {marcos.map((marco, i) => (
            <motion.div
              key={marco.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center rounded-xl border p-8 text-center"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <img src={marco.image} alt={marco.title} className="mb-6 h-40 w-40 object-contain" />
              <h3 className="mb-1 text-xl font-medium" style={{ color: 'var(--ink)' }}>
                {marco.title}
              </h3>
              <p className="mb-4 text-xs tracking-widest" style={{ color: 'var(--gold-bright)' }}>
                {marco.criteria.toUpperCase()}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                {marco.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RANKING TEASER */}
      <section className="border-t px-6 py-20 sm:py-28" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow mb-4">Ranking de colecionadores</p>
          <h2 className="mb-6 text-3xl font-medium sm:text-4xl">Quem está no topo?</h2>
          <p className="mb-10 text-base leading-relaxed sm:text-lg" style={{ color: 'var(--ink-secondary)' }}>
            A comunidade Studio 18 está só começando — os primeiros colecionadores já estão montando sets e
            conquistando seus badges. O ranking completo, atualizado em tempo real, vive no portal oficial.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto flex max-w-md flex-col gap-3"
        >
          {['🥇', '🥈', '🥉'].map((medal, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-5 py-4"
              style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{medal}</span>
                <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  Seu nome aqui?
                </span>
              </div>
              <span className="tabular text-sm" style={{ color: 'var(--gold-bright)' }}>
                — pts
              </span>
            </div>
          ))}
        </motion.div>

        <div className="mt-10 text-center">
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
            style={{ color: 'var(--gold-bright)' }}
          >
            Ver ranking completo no portal →
          </a>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-24 text-center sm:py-32">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <h2 className="mx-auto mb-6 max-w-xl text-3xl font-medium sm:text-4xl">
            Sua mochila digital <span style={{ color: 'var(--gold-bright)' }}>já pode te esperar</span>
          </h2>
          <a
            href={BOB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide"
            style={{ background: 'var(--gold)', color: '#0a0a0a' }}
          >
            Acessar o portal de Badges →
          </a>
        </motion.div>
      </section>

      <SpotifySection />
    </div>
  )
}
