import { useMemo } from 'react'
import * as THREE from 'three'

interface BarrierProps {
  position: [number, number, number]; // x, y, z в мировых координатах
}

export function Barrier({ position }: BarrierProps) {
  const material = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: '#f39c12',   // Оранжевый предупреждающий цвет
      roughness: 0.7,
      metalness: 0.3,
    }), []);

  return (
    <group position={position}>
      {/* Основное тело барьера */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[LANE_WIDTH - 1.5, 2, 0.8]} />
        
        <meshStandardMaterial 
          color="#e67e22" // Темно-оранжевый основной цвет барьера
          roughness={0.7}
          metalness={0.3}
        />

      </mesh>

      {/* Желтые полосы предупреждения */}
      {[...Array(15)].map((_, i) => (
        <mesh 
          key={`stripe-${i}`}
          position={[
            0, 
            -0.6 + Math.sin(i * 2.34) * 1.8, // Волнистые полосы
            0
          ]}
          rotation={[-Math.PI / 2 + (i % 2 === 0 ? 0 : Math.PI), 0, 0]}
        >
          <boxGeometry args={[LANE_WIDTH - 1.45, 0.6, 0.7]} />
          
          <meshStandardMaterial 
            color={i % 2 === 0 ? '#f1c40f' : '#ffffff'} // Желто-белые полосы
            roughness={0.8}
            metalness={0.3}
          />

        </mesh>
      ))}

      {/* Отражающие элементы (светящиеся точки) */}
      {[...Array(5)].map((_, i) => (
        <pointLight 
          key={`light-${i}`}
          position={[
            -0.4, 
            1 + Math.sin(i * 3.2 + Date.now() * 0.001) * 0.5, // Мерцающий свет
            0
          ]}
          distance={8}
          intensity={i % 2 === 0 ? 6 : 4}
          color="#ffffaa" // Желтоватый свет
        />
      ))}

    </group>
  );
}
