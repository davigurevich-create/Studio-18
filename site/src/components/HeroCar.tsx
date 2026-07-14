import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

const IMAGE_URL = '/hero-workshop.jpg'

export function HeroCar({ darken }: { darken: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const [hovering, setHovering] = useState(false)

  const tiltSpring = { stiffness: 55, damping: 18, mass: 0.6 }
  const glowSpring = { stiffness: 120, damping: 24, mass: 0.4 }

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), tiltSpring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), tiltSpring)
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [-28, 28]), tiltSpring)
  const translateY = useSpring(useTransform(my, [-0.5, 0.5], [-16, 16]), tiltSpring)
  const scale = useSpring(hovering ? 1.16 : 1.12, tiltSpring)

  // Brilho dourado que segue o cursor, como se fosse a luz do abajur reagindo ao mouse.
  const glowX = useSpring(useTransform(mx, [-0.5, 0.5], ['12%', '88%']), glowSpring)
  const glowY = useSpring(useTransform(my, [-0.5, 0.5], ['12%', '88%']), glowSpring)
  const glowOpacity = useSpring(hovering ? 1 : 0, { stiffness: 90, damping: 20 })
  const glowBackground = useMotionTemplate`radial-gradient(560px circle at ${glowX} ${glowY}, rgba(230, 199, 120, 0.35), rgba(230, 199, 120, 0.08) 45%, transparent 70%)`

  // Escuta o mouse na janela inteira: a seção de texto do hero fica por cima
  // (mesmo transparente, ela intercepta eventos de mouse), então um listener
  // preso só nesta div nunca disparava enquanto o cursor estivesse sobre o texto.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const inside = e.clientY >= rect.top && e.clientY <= rect.bottom
      setHovering(inside)
      if (!inside) return
      mx.set((e.clientX - rect.left) / rect.width - 0.5)
      my.set((e.clientY - rect.top) / rect.height - 0.5)
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [mx, my])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ perspective: 1400 }}>
      <motion.img
        src={IMAGE_URL}
        alt="Fundador da Studio 18 montando o supercarro dourado em blocos de montar, em seu escritório"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ rotateX, rotateY, x: translateX, y: translateY, scale }}
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1 }}
        transition={{ opacity: { duration: 1.4, ease: 'easeOut' } }}
      />

      {/* Brilho dourado que acompanha o cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: glowOpacity, mixBlendMode: 'screen' }}
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
