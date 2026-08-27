import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface CoinProps {
  position: [number, number, number]; // x, y, z в мировых координатах
}

export function Coin({ position }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((delta, time) => {
    if (meshRef.current) {
      // Вращение монетки вокруг оси X для эффекта "подпрыгивания"
      meshRef.current.rotation.x += delta * 10;
      
      // Мерцающий эффект свечения
      const pulse = Math.sin(time * 5) * 0.2 + 0.8;
      if (meshRef.current.material) {
        (meshRef.current.material as any).emissiveIntensity = pulse / 4;
      }
    }
  });

  return (
    <group position={position}>
      {/* Основание монеты */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.8, 1, 0.3, 32]} />
        
        <meshStandardMaterial 
          color="#f1c40f" // Золотой цвет (как у монет Subway Surfers)
          roughness={0.3}
          metalness={0.9}
          emissive="#e6ac00"
          emissiveIntensity={0.5}
        />

      </mesh>

      {/* Кольцо вокруг */}
      <mesh position={[1, 0, -0.4]}>
        <torusGeometry args={[0.82, 0.06, 32, 32]} />
        
        <meshStandardMaterial 
          color="#f5c70e" // Светло-золотой (блики)
          roughness={0.1}
          metalness={0.95}
        />

      </mesh>

      {/* Лицевая сторона с узором */}
      <group position={[0, 0, -0.4]}>
        <mesh rotation={[Math.PI * 0.32, Math.PI / 2 + time * 1.5, 0]}>
          <circleGeometry args={0.68} />
          
          <meshStandardMaterial 
            color="#d4ac0d" // Темно-золотой (узор)
            roughness={0.7}
            metalness={0.3}
          />

        </mesh>

      </group>

      {/* Светящиеся блики */}
      <pointLight 
        position={[1, 2, -5]}
        distance={6}
        intensity={8}
        color="#ffffaa" // Желтоватый свет (блик)
      />

    </group>
  );
}
