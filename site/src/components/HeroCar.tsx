import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { motion, type MotionValue } from 'framer-motion'
import * as THREE from 'three'

const MODEL_URL = '/models/car.glb'
const TOTAL_TURNS = 1.15 // quantas voltas completas o carro dá do início do hero ao fim do manifesto

// Decodificador Draco hospedado localmente (em vez do CDN padrão do Google),
// para não depender de um serviço externo em produção.
useGLTF.setDecoderPath('/draco/')

function Car({ darken }: { darken: MotionValue<number> }) {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(model)
    const dimensions = new THREE.Vector3()
    box.getSize(dimensions)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z) || 1
    const scale = 3.6 / maxDim
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    model.scale.setScalar(scale)

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })
  }, [model])

  useEffect(() => {
    const handlePointerMove = (e: globalThis.PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    current.current.x += (target.current.x - current.current.x) * Math.min(delta * 3, 1)
    current.current.y += (target.current.y - current.current.y) * Math.min(delta * 3, 1)

    const progress = darken.get()
    groupRef.current.rotation.y = 0.5 + progress * Math.PI * 2 * TOTAL_TURNS + current.current.x * 0.25
    groupRef.current.rotation.x = 0.08 + current.current.y * 0.08
    groupRef.current.position.y = Math.sin(progress * 6) * 0.02
  })

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 5, 4]} intensity={4} color="#f0d48a" />
      <directionalLight position={[-4, 3, -2]} intensity={2} color="#fff2d0" />
      <directionalLight position={[0, -2, 3]} intensity={1.5} color="#cda44d" />
      <pointLight position={[-3, 1.5, 3]} intensity={30} color="#ffffff" />
      <pointLight position={[3, -1, -2]} intensity={20} color="#8a6d2a" />
    </>
  )
}

export function HeroCar({ darken }: { darken: MotionValue<number> }) {
  const [ready, setReady] = useState(false)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <Canvas
          camera={{ position: [0, 0.3, 4.6], fov: 32 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          onCreated={() => setReady(true)}
        >
          <Lights />
          <Suspense fallback={null}>
            <Car darken={darken} />
          </Suspense>
        </Canvas>
      </motion.div>

      {/* Escurecimento de base — mais forte no topo/rodapé (texto) e presente também no meio,
          para garantir contraste contra o dourado/reflexos do modelo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,6,6,0.88) 0%, rgba(6,6,6,0.48) 30%, rgba(6,6,6,0.55) 60%, rgba(6,6,6,0.96) 100%)',
        }}
      />
      {/* Vinheta lateral para fundir as bordas da cena com o carbono do site */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 78% 65% at 50% 46%, transparent, var(--carbon-0) 100%)' }}
      />
      {/* Escurecimento progressivo conforme o scroll — chega a 100% preto ao fim do manifesto */}
      <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: darken }} />
    </div>
  )
}

useGLTF.preload(MODEL_URL)
