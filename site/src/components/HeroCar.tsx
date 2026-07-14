import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

// Sequência que dá a impressão do carro girando lentamente enquanto o
// visitante lê o manifesto: de frente, passando pelo perfil, até a traseira.
const SEQUENCE = ['/car-front.jpg', '/car-side.jpg', '/car-side-angle.jpg', '/car-rear-2.jpg', '/car-rear-1.jpg']

function useCrossfade(progress: MotionValue<number>, index: number, total: number) {
  const step = 1 / (total - 1)
  const center = index * step
  if (index === 0) {
    return useTransform(progress, [center, center + step], [1, 0])
  }
  if (index === total - 1) {
    return useTransform(progress, [center - step, center], [0, 1])
  }
  return useTransform(progress, [center - step, center, center + step], [0, 1, 0])
}

export function HeroCar({ darken }: { darken: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const [ready, setReady] = useState(false)

  // Pré-carrega os 5 ângulos antes de revelar a cena — evita o "pipocar"
  // de imagem chegando atrasada durante a animação de scroll.
  useEffect(() => {
    let cancelled = false
    Promise.all(
      SEQUENCE.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.decoding = 'sync'
            img.onload = () => resolve()
            img.onerror = () => resolve()
            img.src = src
          }),
      ),
    ).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const spring = { stiffness: 60, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [3, -3]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), spring)
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), spring)
  const translateY = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), spring)

  const opacities = [
    useCrossfade(darken, 0, SEQUENCE.length),
    useCrossfade(darken, 1, SEQUENCE.length),
    useCrossfade(darken, 2, SEQUENCE.length),
    useCrossfade(darken, 3, SEQUENCE.length),
    useCrossfade(darken, 4, SEQUENCE.length),
  ]

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1400 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ rotateX, rotateY, x: translateX, y: translateY, scale: 1.12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {SEQUENCE.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt="Supercarro Studio 18 em blocos de montar, dourado e azul-marinho, escala 1:8, em diferentes ângulos"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: opacities[i] }}
          />
        ))}
      </motion.div>

      {/* Escurecimento de base — mais forte no topo/rodapé (texto) e presente também no meio,
          para garantir contraste contra o dourado/reflexos da foto */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,6,6,0.88) 0%, rgba(6,6,6,0.48) 30%, rgba(6,6,6,0.55) 60%, rgba(6,6,6,0.96) 100%)',
        }}
      />
      {/* Vinheta lateral para fundir as bordas da foto com o carbono do site */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 78% 65% at 50% 46%, transparent, var(--carbon-0) 100%)' }}
      />
      {/* Escurecimento progressivo conforme o scroll — chega a 100% preto ao fim do manifesto */}
      <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: darken }} />
    </div>
  )
}
