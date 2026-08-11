import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Camera } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const manifestoParagraphs = [
  'Somos Studio 18.',
  'Acreditamos que algumas experiências não podem ser apressadas. Cada peça encontra seu lugar com precisão. Cada encaixe desperta os sentidos. Cada etapa transforma a montagem em um ritual de contemplação, criatividade e propósito.',
  'Carros, motos e motores deixam de ser apenas máquinas. Tornam-se esculturas da engenharia, construídas pelas suas próprias mãos.',
  'Criamos o Studio 18 para tornar esse universo mais acessível, sem abrir mão da sofisticação, do design e da excelência em cada detalhe.',
  'Porque construir é mais do que montar. É dedicar tempo ao que inspira. É transformar precisão em arte. É fazer parte de uma comunidade que compartilha a mesma paixão por engenharia, design e experiências memoráveis.',
]

interface Word {
  text: string
  gold?: boolean
}

const linesOfText: Word[][] = [
  [{ text: 'Nascemos' }, { text: 'da' }, { text: 'paixão' }, { text: 'dos' }],
  [{ text: 'fundadores.' }, { text: '2', gold: true }, { text: 'amigos', gold: true }, { text: 'engenheiros', gold: true }],
  [{ text: 'e', gold: true }, { text: '1', gold: true }, { text: 'filho,', gold: true }, { text: 'amantes' }],
  [{ text: 'do' }, { text: 'universo' }, { text: 'de' }, { text: 'blocos' }],
  [{ text: 'de' }, { text: 'montar' }, { text: 'técnicos,' }, { text: 'e' }],
  [{ text: 'comprometidos' }, { text: 'a' }, { text: 'levar' }, { text: 'engenharia' }],
  [{ text: 'em' }, { text: 'forma' }, { text: 'de' }, { text: 'arte' }],
  [{ text: 'para' }, { text: 'o' }, { text: 'seu' }, { text: 'Studio.' }],
]

export function QuemSomos() {
  return (
    <div>
      {/* FOTO — placeholder ate a foto real do fundador em frente ao
          container ser enviada */}
      <div className="relative flex h-[70svh] min-h-[420px] items-center justify-center overflow-hidden sm:h-[85svh]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #14120d 0%, #1f1b13 35%, var(--gold-dim) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 6px)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--gold-dim)', background: 'rgba(6,6,6,0.4)' }}
          >
            <Camera size={26} style={{ color: 'var(--gold-bright)' }} strokeWidth={1.5} />
          </div>
          <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--ink-muted)' }}>
            FOTO EM BREVE
          </p>
          <p className="max-w-xs text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Fundador da Studio 18 em frente ao container com os sets recém-chegados
          </p>
        </div>
      </div>

      {/* TEXTO DE IMPACTO — revela linha por linha conforme a rolagem.
          O padding inferior generoso (em vh) garante espaço de rolagem
          suficiente para a ultima linha terminar 100% nitida antes do fim
          da pagina, em qualquer altura de tela. */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-[60svh] sm:pt-48 sm:pb-[65svh]">
        <div className="flex flex-col gap-2 sm:gap-4">
          {linesOfText.map((line, i) => (
            <RevealLine key={i} words={line} index={i} />
          ))}
        </div>
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

      {/* FLOW — verbete de dicionário para o conceito por trás do ritual de
          montagem: o estado de imersão que o Studio 18 vende junto com cada set. */}
      <section
        className="relative border-t px-6 py-28 sm:py-36"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl"
        >
          <p className="eyebrow mb-8 text-center">Conceito</p>

          <div className="mb-2 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
            <h2 className="text-4xl font-medium sm:text-5xl" style={{ color: 'var(--gold-bright)' }}>
              flow
            </h2>
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              /flou/ · substantivo
            </span>
          </div>

          <p className="mb-10 text-center text-lg sm:text-xl" style={{ color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
            Estado mental de imersão completa em uma atividade, no qual a percepção do tempo se dissolve e ação e
            consciência se fundem.
          </p>

          <div className="flex flex-col gap-6 text-center text-base sm:text-lg" style={{ color: 'var(--ink-secondary)', lineHeight: 1.7 }}>
            <p>
              É exatamente essa a experiência de montar um set Studio 18 — um ritual de desconexão do ruído do dia a
              dia. Cada peça encaixada silencia uma notificação.
            </p>
            <p>
              Cada hora investida desenvolve clareza, presença e a satisfação rara de construir algo com as
              próprias mãos.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function RevealLine({ words, index }: { words: Word[]; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.35'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0.08, 1])
  const y = useTransform(scrollYProgress, [0, 1], [70, 0])
  const xDirection = index % 2 === 0 ? 1 : -1
  const x = useTransform(scrollYProgress, [0, 1], [40 * xDirection, 0])
  const blurAmount = useTransform(scrollYProgress, [0, 1], [10, 0])
  const filter = useMotionTemplate`blur(${blurAmount}px)`

  return (
    <motion.p
      ref={ref}
      style={{
        opacity,
        y,
        x,
        filter,
        scaleY: 1.16,
        transformOrigin: 'bottom',
      }}
      className="text-[9vw] font-black uppercase leading-[0.95] tracking-tight sm:text-[6vw] lg:text-[4.25rem]"
    >
      {words.map((w, i) => (
        <span key={i} style={{ color: w.gold ? 'var(--gold-bright)' : 'var(--ink)' }}>
          {w.text}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.p>
  )
}
