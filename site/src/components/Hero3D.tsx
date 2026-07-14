import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Group } from 'three'

const GOLD = '#cda44d'
const GOLD_BRIGHT = '#f0d48a'
const CARBON = '#141414'

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.18, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* Pneu — borracha fosca, sem brilho de metal */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 24]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0} roughness={0.95} />
      </mesh>
      {/* Aro dourado */}
      <mesh position={[0, 0, 0.001]}>
        <cylinderGeometry args={[0.11, 0.11, 0.155, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  )
}

function SuperCar() {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.14
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04
    }
  })

  return (
    <group ref={groupRef} rotation={[0.08, Math.PI * 0.32, 0]} scale={1.35}>
      {/* Chassi / corpo baixo */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.0, 0.28, 2.3]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.05, 0]} scale={1.012}>
        <boxGeometry args={[1.0, 0.28, 2.3]} />
        <meshStandardMaterial color={GOLD_BRIGHT} metalness={1} roughness={0.15} wireframe transparent opacity={0.55} />
      </mesh>

      {/* Cabine / greenhouse (mais estreita, para tras) */}
      <mesh position={[0, 0.2, -0.2]}>
        <boxGeometry args={[0.72, 0.22, 1.0]} />
        <meshStandardMaterial color={CARBON} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.2, -0.2]} scale={1.02}>
        <boxGeometry args={[0.72, 0.22, 1.0]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} wireframe />
      </mesh>

      {/* Frente em cunha, encostada no corpo */}
      <mesh position={[0, -0.04, 1.18]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.94, 0.14, 0.32]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Aerofolio traseiro, apoiado direto no corpo (sem gap) */}
      <mesh position={[0, 0.12, -1.14]}>
        <boxGeometry args={[0.9, 0.045, 0.2]} />
        <meshStandardMaterial color={GOLD_BRIGHT} metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Faroletes */}
      <mesh position={[-0.32, 0.0, 1.32]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD_BRIGHT} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.32, 0.0, 1.32]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD_BRIGHT} emissiveIntensity={1.2} />
      </mesh>

      <Wheel x={-0.52} z={0.78} />
      <Wheel x={0.52} z={0.78} />
      <Wheel x={-0.52} z={-0.78} />
      <Wheel x={0.52} z={-0.78} />
    </group>
  )
}

export function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.7, 6.5], fov: 32 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 3, 5]} intensity={85} color="#f0d48a" />
      <pointLight position={[-4, 2, -3]} intensity={40} color="#8a6d2a" />
      <pointLight position={[0, -2, 2]} intensity={20} color="#cda44d" />
      <Suspense fallback={null}>
        <SuperCar />
        <Sparkles count={60} scale={[8, 5, 4]} size={1.5} speed={0.25} color="#cda44d" opacity={0.5} />
      </Suspense>
    </Canvas>
  )
}
