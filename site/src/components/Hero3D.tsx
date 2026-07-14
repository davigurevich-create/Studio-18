import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Mesh } from 'three'

function GoldEmblem() {
  const outerRef = useRef<Mesh>(null)
  const innerRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.12
    if (outerRef.current) outerRef.current.rotation.x += delta * 0.03
    if (innerRef.current) innerRef.current.rotation.y -= delta * 0.2
  })

  return (
    <group>
      <mesh ref={outerRef}>
        <torusKnotGeometry args={[1.4, 0.045, 220, 20, 2, 3]} />
        <meshStandardMaterial color="#cda44d" metalness={0.9} roughness={0.25} wireframe />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#e6c778" metalness={0.85} roughness={0.3} wireframe />
      </mesh>
    </group>
  )
}

export function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 3, 5]} intensity={120} color="#e6c778" />
      <pointLight position={[-4, -2, -3]} intensity={40} color="#8a6d2a" />
      <Suspense fallback={null}>
        <GoldEmblem />
        <Sparkles count={60} scale={[8, 5, 4]} size={1.5} speed={0.25} color="#cda44d" opacity={0.5} />
      </Suspense>
    </Canvas>
  )
}
