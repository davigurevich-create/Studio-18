import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Desenho técnico (blueprint) de um carro que se "monta" peça por peça
 * quando entra na tela — carroceria primeiro, depois rodas, depois os
 * detalhes/rebites — ecoando o tema do Manifesto ("cada peça encontra seu
 * lugar com precisão"). Roda uma vez (whileInView once) tanto no painel
 * fixo do desktop quanto na versão empilhada do mobile.
 */
export function ManifestoBlueprint() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <div ref={ref} className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl sm:aspect-square">
      {/* Fundo em grid, estilo planta técnica */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <motion.div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--gold-dim), transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.6 } : {}}
        transition={{ duration: 1.4, delay: 0.4 }}
      />

      <svg viewBox="0 0 600 260" className="relative z-10 w-[85%]" fill="none">
        {/* Linha de solo */}
        <motion.line
          x1="30"
          y1="212"
          x2="570"
          y2="212"
          stroke="var(--hairline-strong)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        />

        {/* Carroceria — traçado principal */}
        <motion.path
          d="M55,210 C55,196 68,186 90,183 L132,183 C152,138 200,104 262,98 L368,98 C412,98 448,112 474,138 L500,164 C522,170 542,180 554,192 C560,199 561,206 559,212"
          stroke="var(--gold-bright)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {/* Linha inferior / soleira */}
        <motion.path
          d="M55,212 L559,212"
          stroke="var(--gold-dim)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.1 }}
        />

        {/* Detalhes — linhas de painel */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.3 }}
          stroke="var(--ink-muted)"
          strokeWidth="1.2"
        >
          <line x1="150" y1="183" x2="185" y2="140" />
          <line x1="330" y1="98" x2="330" y2="183" />
          <line x1="474" y1="138" x2="474" y2="185" />
        </motion.g>

        {/* Rebites estilo Technic */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.5 }}
          style={{ transformOrigin: '300px 140px' }}
        >
          {[
            [185, 140],
            [262, 98],
            [330, 140],
            [400, 108],
            [460, 150],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="var(--gold)" />
          ))}
        </motion.g>

        {/* Rodas */}
        {[170, 460].map((cx, i) => (
          <motion.g
            key={cx}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.0 + i * 0.15, type: 'spring', stiffness: 140, damping: 14 }}
            style={{ transformOrigin: `${cx}px 212px` }}
          >
            <circle cx={cx} cy="212" r="34" stroke="var(--ink-secondary)" strokeWidth="2" />
            <circle cx={cx} cy="212" r="15" stroke="var(--gold-bright)" strokeWidth="2" />
            <circle cx={cx} cy="212" r="2.5" fill="var(--gold-bright)" />
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
