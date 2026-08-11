import { motion } from 'framer-motion'
import { RevealLine, type Word } from '@/components/RevealText'

const manifestoLines: Word[][] = [
  [{ text: 'Somos' }, { text: 'Studio', gold: true }, { text: '18.', gold: true }],
  [{ text: 'Acreditamos' }, { text: 'que' }, { text: 'algumas' }, { text: 'experiências' }],
  [{ text: 'não' }, { text: 'podem' }, { text: 'ser' }, { text: 'apressadas.' }],
  [{ text: 'Cada' }, { text: 'peça' }, { text: 'encontra' }, { text: 'seu' }, { text: 'lugar' }],
  [{ text: 'com' }, { text: 'precisão.', gold: true }],
  [{ text: 'Cada' }, { text: 'etapa' }, { text: 'transforma' }, { text: 'a' }, { text: 'montagem' }],
  [{ text: 'em' }, { text: 'um' }, { text: 'ritual', gold: true }, { text: 'de' }, { text: 'contemplação' }],
  [{ text: 'e' }, { text: 'propósito.' }],
  [{ text: 'Carros,' }, { text: 'motos' }, { text: 'e' }, { text: 'motores' }],
  [{ text: 'tornam-se' }, { text: 'esculturas', gold: true }, { text: 'da' }, { text: 'engenharia,', gold: true }],
  [{ text: 'construídas' }, { text: 'pelas' }, { text: 'suas' }, { text: 'próprias' }, { text: 'mãos.' }],
  [{ text: 'Criamos' }, { text: 'o' }, { text: 'Studio', gold: true }, { text: '18' }],
  [{ text: 'para' }, { text: 'tornar' }, { text: 'esse' }, { text: 'universo' }],
  [{ text: 'mais' }, { text: 'acessível,' }, { text: 'sem' }, { text: 'abrir' }, { text: 'mão' }],
  [{ text: 'da' }, { text: 'sofisticação.' }],
  [{ text: 'Porque' }, { text: 'construir' }, { text: 'é' }, { text: 'mais' }],
  [{ text: 'do' }, { text: 'que' }, { text: 'montar:' }],
  [{ text: 'é' }, { text: 'transformar' }, { text: 'precisão' }, { text: 'em' }, { text: 'arte.', gold: true }],
]

export function Manifesto() {
  return (
    <div>
      <div className="px-6 pb-4 pt-32 text-center sm:pt-40">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="eyebrow"
        >
          Manifesto
        </motion.p>
      </div>

      {/* Mesmo tratamento de leitura cinematográfica do texto de impacto em
          Quem Somos: cada linha revela nitidez, posição e cor conforme a
          rolagem. O padding inferior garante espaço suficiente para a
          última linha terminar 100% nítida antes do fim da página. */}
      <section className="mx-auto max-w-5xl px-6 pb-[38svh] pt-8 sm:pb-[44svh]">
        <div className="flex flex-col gap-2 sm:gap-4">
          {manifestoLines.map((line, i) => (
            <RevealLine key={i} words={line} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
