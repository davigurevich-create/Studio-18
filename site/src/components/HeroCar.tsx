import { useRef, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function HeroCar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const spring = { stiffness: 60, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [3, -3]), spring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), spring)
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), spring)
  const translateY = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), spring)

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
      className="absolute inset-0"
      style={{ perspective: 1400 }}
    >
      <motion.img
        src="/car-front.jpg"
        alt="Supercarro Studio 18 em blocos de montar, dourado e azul-marinho, escala 1:8"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ rotateX, rotateY, x: translateX, y: translateY, scale: 1.1 }}
        initial={{ opacity: 0, scale: 1.18 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* Faixa escura no topo/rodapé para legibilidade do texto, mantendo o carro visível no meio */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,6,6,0.8) 0%, rgba(6,6,6,0.2) 34%, rgba(6,6,6,0.32) 58%, rgba(6,6,6,0.94) 100%)',
        }}
      />
      {/* Vinheta lateral para fundir as bordas da foto com o carbono do site */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 78% 65% at 50% 46%, transparent, var(--carbon-0) 100%)' }}
      />
    </div>
  )
}
