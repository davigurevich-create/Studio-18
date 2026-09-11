import { motion } from 'framer-motion'
import { RevealLine, type Word } from '@/components/RevealText'
import { SpotifySection } from '@/components/SpotifySection'
import { ManifestoSection } from '@/pages/Manifesto'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
    <div style={{ background: '#000' }}>
      {/* TEXTO DE IMPACTO — primeira coisa que a página mostra agora.
          Revela linha por linha conforme a rolagem. O padding inferior (em
          vh) garante espaço de rolagem suficiente para a ultima linha
          terminar 100% nitida antes do fim da pagina, em qualquer altura de
          tela. */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-[32svh] sm:pt-48 sm:pb-[38svh]" style={{ background: '#000' }}>
        <div className="flex flex-col gap-2 sm:gap-4">
          {linesOfText.map((line, i) => (
            <RevealLine key={i} words={line} index={i} />
          ))}
        </div>
      </section>

      {/* RESPIRO VISUAL — imagem full-bleed antes do FLOW, para quebrar a
          sequência de blocos de texto puro. Degradê pro preto só no topo,
          pra fundir com o texto de impacto logo acima. */}
      <div
        className="relative h-[46svh] min-h-[280px] overflow-hidden bg-cover bg-center sm:h-[62svh]"
        style={{
          backgroundColor: '#14120d',
          backgroundImage: 'url(/quem-somos-flow.jpg)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32"
          style={{ background: 'linear-gradient(to bottom, #000, transparent)' }}
        />
      </div>

      {/* MANIFESTO — incorporado como seção da página Quem Somos, entre a
          imagem de respiro e a seção do conceito flow, pra aliviar o menu
          superior do site (que estava com uma página própria pra isso). */}
      <ManifestoSection />

      {/* FLOW — verbete de dicionário para o conceito por trás do ritual de
          montagem: o estado de imersão que o Studio 18 vende junto com cada
          set. Layout em split (palavra de um lado, texto do outro). Todo o
          texto descritivo em branco e no mesmo tamanho, com destaques em
          dourado só nas frases mais impactantes. */}
      <section
        className="relative overflow-hidden px-6 py-24 sm:py-32"
        style={{ background: '#000' }}
      >
        <div
          className="pointer-events-none absolute -left-32 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        />
        <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center md:text-left"
          >
            <p className="eyebrow mb-4">Conceito</p>
            <h2 className="text-6xl font-medium sm:text-7xl" style={{ color: 'var(--gold-bright)' }}>
              flow
            </h2>
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              /flou/ · substantivo
            </span>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-5 text-center text-lg sm:text-xl md:text-left"
            style={{ color: 'var(--ink)', lineHeight: 1.7 }}
          >
            <p>
              Estado mental de imersão completa em uma atividade, no qual{' '}
              <span style={{ color: 'var(--gold-bright)' }}>a percepção do tempo se dissolve e ação e consciência se fundem</span>.
            </p>
            <p>
              É exatamente essa a experiência de montar um set Studio 18 — um ritual de desconexão do ruído do dia a
              dia.{' '}
              <span style={{ color: 'var(--gold-bright)' }}>Cada peça encaixada silencia uma notificação.</span>
            </p>
            <p>
              Cada hora investida desenvolve clareza, presença e{' '}
              <span style={{ color: 'var(--gold-bright)' }}>
                a satisfação rara de construir algo com as próprias mãos
              </span>
              .
            </p>
          </motion.div>
        </div>
      </section>

      <SpotifySection />
    </div>
  )
}
