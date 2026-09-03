import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * Envelope que dá ao fundo preto da página um brilho dourado ambiente,
 * embutido no próprio background (não uma camada fixa por cima) — a
 * mesma técnica do spotlight do carro na Hero, só que cobrindo a seção
 * inteira e sempre visível (não é um efeito de hover). Segue o mouse
 * no desktop e o tilt do aparelho no mobile.
 */
export function GoldLight({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.32)

  const glowSpring = { stiffness: 45, damping: 20, mass: 0.6 }
  const glowX = useSpring(useTransform(mx, (v) => `${v * 100}%`), glowSpring)
  const glowY = useSpring(useTransform(my, (v) => `${v * 100}%`), glowSpring)
  const glowBackground = useMotionTemplate`radial-gradient(900px circle at ${glowX} ${glowY}, rgba(230, 199, 120, 0.16), rgba(205, 164, 77, 0.05) 45%, transparent 72%)`

  useEffect(() => {
    const setFromPoint = (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      mx.set(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)))
      my.set(Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)))
    }

    const onMouseMove = (e: MouseEvent) => setFromPoint(e.clientX, e.clientY)

    const onOrientation = (e: DeviceOrientationEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const gamma = e.gamma ?? 0 // inclinação esquerda/direita: -90..90
      const beta = e.beta ?? 0 // inclinação frente/trás: -180..180
      setFromPoint(
        rect.left + rect.width * Math.min(1, Math.max(0, 0.5 + gamma / 90)),
        rect.top + rect.height * Math.min(1, Math.max(0, 0.5 + (beta - 40) / 90)),
      )
    }

    let tiltEnabled = false
    const enableTilt = () => {
      if (tiltEnabled) return
      tiltEnabled = true
      window.addEventListener('deviceorientation', onOrientation)
    }
    const requestTiltPermission = () => {
      const DeviceOrientationEventTyped = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
      if (typeof DeviceOrientationEventTyped?.requestPermission === 'function') {
        DeviceOrientationEventTyped.requestPermission()
          .then((state) => {
            if (state === 'granted') enableTilt()
          })
          .catch(() => {})
      } else {
        enableTilt()
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchstart', requestTiltPermission, { once: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchstart', requestTiltPermission)
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [mx, my])

  return (
    <div ref={containerRef} className="relative min-h-screen">
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: glowBackground, mixBlendMode: 'screen' }} />
      <div className="relative">{children}</div>
    </div>
  )
}
