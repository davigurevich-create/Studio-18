import { useEffect, useRef } from 'react'

/**
 * Luz dourada ambiente que segue o mouse no desktop e o tilt do
 * aparelho no mobile — dá dinamismo a uma página estática, sem
 * competir com o conteúdo (blend "screen", opacidade baixa, movimento
 * suavizado por interpolação em vez de seguir o cursor 1:1).
 */
export function GoldLight() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = { x: 0.5, y: 0.32 }
    const pos = { x: 0.5, y: 0.32 }

    const onMouseMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth
      target.y = e.clientY / window.innerHeight
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0 // inclinação esquerda/direita: -90..90
      const beta = e.beta ?? 0 // inclinação frente/trás: -180..180
      target.x = Math.min(1, Math.max(0, 0.5 + gamma / 90))
      target.y = Math.min(1, Math.max(0, 0.5 + (beta - 40) / 90))
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
        DeviceOrientationEventTyped.requestPermission().then((state) => {
          if (state === 'granted') enableTilt()
        }).catch(() => {})
      } else {
        enableTilt()
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchstart', requestTiltPermission, { once: true })

    let raf = 0
    const animate = () => {
      pos.x += (target.x - pos.x) * 0.05
      pos.y += (target.y - pos.y) * 0.05
      glowRef.current?.style.setProperty('--gx', `${pos.x * 100}%`)
      glowRef.current?.style.setProperty('--gy', `${pos.y * 100}%`)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchstart', requestTiltPermission)
      window.removeEventListener('deviceorientation', onOrientation)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(640px circle at var(--gx, 50%) var(--gy, 32%), rgba(230, 199, 120, 0.22), rgba(205, 164, 77, 0.08) 38%, transparent 65%)',
        mixBlendMode: 'screen',
      }}
    />
  )
}
