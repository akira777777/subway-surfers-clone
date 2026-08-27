import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface RoadProps {
  playerZPosition: number; // Позиция игрока по Z для бесконечного скроллинга
}

export function Road({ playerZPosition }: RoadProps) {
  const roadRef = useRef<THREE.Group>(null);

  useFrame((delta, time) => {
    if (roadRef.current) {
      // Плавное вращение дороги для визуального эффекта
      roadRef.current.rotation.y += delta * 0.1;
      
      // Анимация "парения"
      const floatOffset = Math.sin(time * 2) * 0.5;
      roadRef.current.position.y = -9 + floatOffset;
    }
  });

  return (
    <group ref={roadRef}>
      {/* Основное тело дороги */}
      <mesh 
        position={[0, -8.99, playerZPosition]} // Слегка ниже земли для отбрасывания теней
        rotation={[Math.PI * 0.1, Math.PI / 2 + time * 0.1, 0]}
      >
        {/* Дорожная поверхность */}
        <boxGeometry args={45, 1, 800} />
        
        {/* Текстура дороги с полосами */}
        const roadMaterial = useMemo(() => {
          return new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1,
            map: null, // Можно добавить текстуру дороги здесь
          });
        }, []);

      <mesh 
        position={[0, -8.995, playerZPosition]} 
        rotation={[Math.PI * 0.1, Math.PI / 2 + time * 0.1, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={40, 1, 600} />
        
        {/* Материал дороги */}
        <meshStandardMaterial 
          color="#3a3a3a" 
          roughness={0.85} 
          metalness={0.15}
          side={THREE.DoubleSide} // Двусторонняя рендеринг для корректного отображения на спине
        />

      </mesh>

      {/* Разделительные полосы (пунктирные линии) */}
      {[...Array(8)].map((_, i) => (
        <group key={i}>
          {[-1, 0].map(laneOffset => (
            <line 
              key={`${i}-${laneOffset}`}
              position={[LANE_WIDTH * laneOffset + LANE_WIDTH / 4, -9.5, playerZPosition]}
              rotation={[Math.PI / 2, Math.PI / 2 + time * 0.1, 0]}
            >
              <pointsGeometry>
                {Array.from({ length: 6 }).map((_, j) => (
                  new THREE.Vector3(
                    LANE_WIDTH * laneOffset + LANE_WIDTH / 4, 
                    -9.5, 
                    playerZPosition - i * LANE_WIDTH * 2.1 - j * 0.8
                  )
                ))}
              </pointsGeometry>
              
              <lineBasicMaterial color="#ffffff" linewidth={1} transparent opacity={0.7} />
            </line>
          ))}
        </group>
      ))}

      {/* Дорожные разметки — белые линии по краям */}
      {[...Array(2)].map((_, i) => (
        <mesh 
          key={`road-edge-${i}`}
          position={[
            i === 0 ? -LANE_WIDTH / 1.5 : LANE_WIDTH + LANE_WIDTH / 4, 
            -9.8, 
            playerZPosition
          ]}
          rotation={[-Math.PI * 0.267, Math.PI / 2 + time * 0.1, 0]} // Угол для правильного отображения разметки
        >
          <boxGeometry args={[LANE_WIDTH * 0.35, 0.15, 800]} />
          
          <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.9} 
            metalness={0.1} 
            side={THREE.DoubleSide}
          />

        </mesh>
      ))}

      {/* Центральный разделитель (широкая полоса) */}
      <mesh 
        position={[0, -8.75, playerZPosition]}
        rotation={[Math.PI / 2 + time * 0.1, Math.PI * 0.1, 0]}
      >
        <boxGeometry args={[LANE_WIDTH * 3.4, 0.06, 800]} />
        
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.95} 
          metalness={0.1} 
          side={THREE.DoubleSide}
          transparent 
          opacity={0.9}
        />

      </mesh>
    </group>
  );
}
