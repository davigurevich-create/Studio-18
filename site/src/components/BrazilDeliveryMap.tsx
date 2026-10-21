import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDeliveredStates } from '@/lib/api'

// Mapa estilizado em grade (cartograma) do Brasil — cada estado vira uma
// célula numa grade lógica que preserva a posição relativa real (norte em
// cima, sul embaixo, nordeste à direita), em vez de um contorno geográfico
// fiel. É o mesmo tipo de visualização usada em infográficos de dados por
// estado: mais limpo, mais legível em telas pequenas, e não depende de um
// arquivo de geometria SVG pesado.
const GRID: { uf: string; row: number; col: number }[] = [
  { uf: 'RR', row: 0, col: 4 },
  { uf: 'AP', row: 0, col: 6 },
  { uf: 'AM', row: 1, col: 3 },
  { uf: 'PA', row: 1, col: 6 },
  { uf: 'MA', row: 1, col: 8 },
  { uf: 'CE', row: 1, col: 10 },
  { uf: 'AC', row: 2, col: 1 },
  { uf: 'RO', row: 2, col: 2 },
  { uf: 'TO', row: 2, col: 6 },
  { uf: 'PI', row: 2, col: 8 },
  { uf: 'RN', row: 2, col: 10 },
  { uf: 'MT', row: 3, col: 3 },
  { uf: 'PB', row: 3, col: 10 },
  { uf: 'GO', row: 4, col: 5 },
  { uf: 'BA', row: 4, col: 8 },
  { uf: 'PE', row: 4, col: 10 },
  { uf: 'MS', row: 5, col: 3 },
  { uf: 'DF', row: 5, col: 5 },
  { uf: 'MG', row: 5, col: 7 },
  { uf: 'ES', row: 5, col: 9 },
  { uf: 'AL', row: 5, col: 10 },
  { uf: 'SP', row: 6, col: 7 },
  { uf: 'RJ', row: 6, col: 8 },
  { uf: 'SE', row: 6, col: 10 },
  { uf: 'PR', row: 7, col: 7 },
  { uf: 'SC', row: 8, col: 7 },
  { uf: 'RS', row: 9, col: 6 },
]

const ROWS = 10
const COLS = 11

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

        <div
          className="mx-auto grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: '5px',
            maxWidth: 420,
            aspectRatio: `${COLS} / ${ROWS}`,
          }}
        >
          {GRID.map(({ uf, row, col }) => {
            const active = delivered.has(uf)
            return (
              <div
                key={uf}
                title={uf}
                style={{
                  gridRowStart: row + 1,
                  gridColumnStart: col + 1,
                  borderRadius: 3,
                  background: active ? 'var(--gold-bright)' : 'transparent',
                  border: active ? 'none' : '1px solid var(--hairline)',
                  transition: 'background 0.3s ease',
                }}
              />
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
