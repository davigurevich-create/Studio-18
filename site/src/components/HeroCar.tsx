import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

import { isBlackFridayActive } from '@/lib/blackFriday'

// Durante a Black Friday, a imagem da hero troca sozinha pro banner da
// campanha — volta pra imagem normal automaticamente depois do prazo
// (ver isBlackFridayActive), sem precisar mexer aqui de novo.
const IMAGE_URL = isBlackFridayActive() ? '/hero-black-friday.webp' : '/hero-car.jpg'
// No mobile a Black Friday usa uma imagem própria (retrato, já composta pra
// caber na tela toda sem sobra em cima/embaixo) — troca via <picture> abaixo,
// olhando a largura da tela, não o dispositivo.
const IMAGE_URL_MOBILE = isBlackFridayActive() ? '/hero-black-friday-mobile.webp' : IMAGE_URL
const IMAGE_ALT = isBlackFridayActive()
  ? 'Black Friday Studio 18 — 25% OFF em supercarros de blocos de montar'
  : 'Supercarro dourado em blocos de montar da Studio 18 — Do nosso Studio ao seu'

export function HeroCar({ darken }: { darken: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const [hovering, setHovering] = useState(false)

  const tiltSpring = { stiffness: 55, damping: 18, mass: 0.6 }
  const glowSpring = { stiffness: 120, damping: 24, mass: 0.4 }

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), tiltSpring)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), tiltSpring)
  const translateX = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), tiltSpring)
  const translateY = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), tiltSpring)
  const scale = useSpring(hovering ? 1.035 : 1.0, tiltSpring)

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
      {/* O banner da Black Friday tem os selos de desconto (25%/30%) perto
          do topo da imagem — no desktop, a faixa fixa + header cobrem essa
          área, e um respiro ali precisa encolher a CAIXA da imagem (não a
          tag <img> em si: <img> é elemento substituído, e top+bottom com
          height:auto nela é ignorado pelo browser — ele usa a proporção
          intrínseca a partir da largura e ancora no topo, estourando por
          baixo e cortando o carro no overflow-hidden do container, em
          qualquer tamanho de tela). Por isso a caixa menor fica numa div
          comum (não substituída, top/bottom funcionam normal) por fora,
          e a <img> dentro continua com inset-0 + contain centralizado. */}
      {/* perspective precisa estar no PAI direto do elemento rotacionado em 3D
          (a <img>) — como ela agora mora dentro desta div, e não mais direto
          dentro do container, o tilt só funciona se a div também tiver. */}
      <div
        className={`absolute inset-x-0 bottom-0 top-0 ${isBlackFridayActive() ? 'sm:top-24' : ''}`}
        style={{ perspective: 1400 }}
      >
        <picture>
          {isBlackFridayActive() && <source media="(min-width: 640px)" srcSet={IMAGE_URL} />}
          <motion.img
            src={IMAGE_URL_MOBILE}
            alt={IMAGE_ALT}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ rotateX, rotateY, x: translateX, y: translateY, scale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </picture>
      </div>

      {/* Brilho dourado que acompanha o cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground, opacity: glowOpacity, mixBlendMode: 'screen' }}
      />

      {/* Vinheta lateral para fundir as bordas da foto com o carbono do site —
          as imagens da Black Friday já são compostas sobre fundo preto
          (igual ao --carbon-0 do site), então a vinheta não faz falta nelas
          e só atrapalhava a leitura dos selos de desconto; fica só pra
          imagem normal (fundo claro/estúdio, que precisa da fusão). */}
      {!isBlackFridayActive() && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 78% 65% at 50% 46%, transparent, var(--carbon-0) 100%)' }}
        />
      )}
      {/* Escurecimento progressivo conforme o scroll — chega a 100% preto ao fim da hero */}
      <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: darken }} />
    </div>
  )
}
