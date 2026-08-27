import { useMemo } from 'react'
import * as THREE from 'three'
import { BoxProps, Line } from '@react-three/drei'

interface TrainProps {
  position: [number, number, number]; // x, y, z в мировых координатах
}

export function Train({ position }: TrainProps) {
  const material = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: '#e74c3c',   // Красный поезд как у Metro
      roughness: 0.6,
      metalness: 0.4,
    }), []);

  return (
    <group position={position}>
      {/* Основной корпус поезда */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 6, 30]} />
        <meshStandardMaterial 
          color="#c0392b" // Темно-красный основной цвет
          roughness={0.7}
          metalness={0.5}
        />
      </mesh>

      {/* Боковые панели */}
      <mesh position={[1.2, 0, -8]}>
        <boxGeometry args={[0.3, 6, 0.8]} rotation={[Math.PI * 0.5, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Окна */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={`window-${i}`}
          position={[0, 2 + Math.sin(i * 1.5) * 3, -4]}
          rotation={[-Math.PI / 6, 0, 0]}
        >
          <planeGeometry args={[1.8, 2.5]} />
          <meshStandardMaterial 
            color="#ecf0f1" // Светло-серые окна (стекло)
            roughness={0.05}
            metalness={0.9}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Фары */}
      <group position={[1, 2, -3]}>
        <mesh castShadow>
          <sphereGeometry args={0.4} />
          <meshBasicMaterial color="#f1c40f" emissive="#f1c40f" toneMapped={false} />
        </mesh>

        {/* Свет от фары */}
        <pointLight position={[1, 2, -3]} distance={50} intensity={80} castShadow color="#ffffaa" />
      </group>

      {/* Второй вагон (прицеп) */}
      <mesh position={[0.6, 0, 15]}>
        <boxGeometry args={[2, 4, 30]} />
        <meshStandardMaterial 
          color="#95a5a6" // Серый второй вагон
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>

      {/* Детали второго вагона */}
      <group position={[1, 2, -4]}>
        <mesh castShadow>
          <sphereGeometry args={0.5} />
          <meshBasicMaterial color="#f39c12" emissive="#e67e22" toneMapped={false} />
        </mesh>

        {/* Второй фарный свет */}
        <pointLight position={[1, 2, -4]} distance={50} intensity={80} castShadow color="#ffffaa" />
      </group>

    </group>
  );
}
