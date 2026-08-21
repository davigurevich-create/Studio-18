import { motion } from 'framer-motion'
import { RevealLine, type Word } from '@/components/RevealText'
import { ManifestoBlueprint } from '@/components/ManifestoBlueprint'

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
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pt-40 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
      <div className="lg:order-2 lg:sticky lg:top-32">
        <div className="mb-8 lg:mb-0">
          <ManifestoBlueprint />
        </div>
      </div>

      <div className="lg:order-1">
        <div className="pb-4 text-center lg:text-left">
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
            última linha terminar 100% nítida antes do fim da coluna. */}
        <div className="pb-[30svh] pt-8 text-center sm:pb-[36svh] lg:pb-24 lg:text-left">
          <div className="flex flex-col gap-2 sm:gap-4">
            {manifestoLines.map((line, i) => (
              <RevealLine key={i} words={line} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
