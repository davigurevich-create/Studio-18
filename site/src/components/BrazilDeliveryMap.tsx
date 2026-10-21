import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDeliveredStates } from '@/lib/api'
import { BRAZIL_MAP_HEIGHT, BRAZIL_MAP_WIDTH, STATE_PATHS } from '@/lib/brazilStatePaths'

export function BrazilDeliveryMap() {
  const [delivered, setDelivered] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getDeliveredStates()
      .then((states) => {
        setDelivered(new Set(states.map((s) => s.toUpperCase())))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (loaded && delivered.size === 0) return null

  return (
    <section className="px-6 py-20 sm:py-24" style={{ background: 'var(--carbon-0)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="eyebrow mb-2">Pronta entrega, de verdade</p>
        <h2 className="mb-10 text-2xl font-medium sm:text-3xl">
          Contribuindo com coleções em{' '}
          <span style={{ color: 'var(--gold-bright)' }}>{delivered.size} estado{delivered.size === 1 ? '' : 's'}</span>{' '}
          do Brasil
        </h2>

        <svg
          viewBox={`0 0 ${BRAZIL_MAP_WIDTH} ${BRAZIL_MAP_HEIGHT}`}
          className="mx-auto w-full"
          style={{ maxWidth: 360 }}
          role="img"
          aria-label="Mapa do Brasil com os estados já atendidos em destaque"
        >
          {Object.entries(STATE_PATHS).map(([uf, { name, d }]) => (
            <path
              key={uf}
              d={d}
              style={{
                fill: delivered.has(uf) ? 'var(--gold-bright)' : 'var(--carbon-2)',
                stroke: 'var(--carbon-0)',
                strokeWidth: 1.2,
              }}
            >
              <title>{name}</title>
            </path>
          ))}
        </svg>
      </motion.div>
    </section>
  )
}
