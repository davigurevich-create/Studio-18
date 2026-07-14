import { useRef, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

const IMAGE_URL = '/hero-workshop.jpg'

export function HeroCar({ darken }: { darken: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const spring = { stiffness: 60, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [3, -3]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), spring)
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), spring)
  const translateY = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), spring)

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
      <motion.img
        src={IMAGE_URL}
        alt="Fundador da Studio 18 montando o supercarro dourado em blocos de montar, em seu escritório"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ rotateX, rotateY, x: translateX, y: translateY, scale: 1.12 }}
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1.12 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Escurecimento de base — mais forte no topo/rodapé (texto) e presente também no meio,
          para garantir contraste contra a foto */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,6,6,0.88) 0%, rgba(6,6,6,0.5) 30%, rgba(6,6,6,0.55) 60%, rgba(6,6,6,0.96) 100%)',
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
