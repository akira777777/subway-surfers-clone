import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BoxProps } from '@react-three/drei'
import { PLAYER_CONFIG } from './PlayerConfig'

interface PlayerState extends ReturnType<typeof PLAYER_CONFIG.initialPosition> {}

export function Player() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Состояние игрока с запоминанием между рендерами
  const [state, setState] = useState<PlayerState>(() => 
    JSON.parse(JSON.stringify(PLAYER_CONFIG.initialPosition)) as PlayerState
  )

  useFrame((delta) => {
    if (!meshRef.current || !state.isPlaying) return;

    // Применяем гравитацию
    state.velocityY += PLAYER_CONFIG.physics.gravity * delta;
    
    // Двигаем вперед по Z
    const forwardSpeed = PLAYER_CONFIG.physics.moveSpeedXZ;
    const currentLaneWidth = LANE_WIDTH / 2;
    
    // Плавное движение между полосами (Lerp)
    if (state.laneIndex !== -1 && state.laneIndex !== 1) {
      meshRef.current.position.x += 
        (TARGET_X[state.laneIndex] - meshRef.current.position.x) * delta * 5;
    }

    // Применяем вертикальное движение
    const currentPosition = meshRef.current.position.clone();
    currentState.velocityY += PLAYER_CONFIG.physics.gravity * delta;
    
    if (currentPosition.y < state.height / 2 + 0.3) {
      currentPosition.y += state.velocityY * delta;
      
      // Отскок от земли
      if (currentPosition.y <= -state.height / 2 + 0.3 && 
          currentState.velocityY > PLAYER_CONFIG.physics.jumpForce) {
        currentPosition.y = -state.height / 2 + 0.3;
        state.velocityY = 0;
      }
    } else {
      // Возврат на землю
      if (currentPosition.y < -state.height / 2) {
        currentPosition.y = -state.height / 2;
        state.velocityY = 0;
      }
    }

    meshRef.current.position.copy(currentPosition);
  });

  return (
    <>
      {/* Основное тело игрока */}
      <mesh 
        ref={meshRef} 
        position={[TARGET_X[state.laneIndex], state.height / 2 + 0.3, -state.zDistance]}
        rotation={[Math.PI * 0.5, Math.PI, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={PLAYER_CONFIG.dimensions.width, PLAYER_CONFIG.dimensions.height, PLAYER_CONFIG.dimensions.depth} />
        <meshStandardMaterial 
          color="#ff6b35" // Оранжевый как у героя Subway Surfers
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Голова */}
      <mesh 
        position={[0, PLAYER_CONFIG.dimensions.height * 0.6 + state.height / 2 - 0.3, 0]}
        castShadow
      >
        <sphereGeometry args={PLAYER_CONFIG.dimensions.width * 0.45} />
        <meshStandardMaterial color="#ffccaa" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Шлем */}
      <mesh 
        position={[0, PLAYER_CONFIG.dimensions.height * 0.6 + state.height / 2 - 0.3, 0]}
        castShadow
      >
        <sphereGeometry args={PLAYER_CONFIG.dimensions.width * 0.47} />
        <meshStandardMaterial color="#ff9500" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Анимация "бега" */}
      {state.isPlaying && (
        <group attach="runningAnimation">
          <mesh position={[0, -PLAYER_CONFIG.dimensions.height / 2 + 0.3, PLAYER_CONFIG.dimensions.depth * 0.5]}>
            <sphereGeometry args={0.15} />
            <meshStandardMaterial color="#ff6b35" />
          </mesh>
        </group>
      )}

      {/* Подсвечивающая линия */}
      <line 
        position={[0, -PLAYER_CONFIG.dimensions.height / 2 + 1.8, PLAYER_CONFIG.dimensions.depth * 0.4]}
        rotation={[Math.PI * 0.5, Math.PI, 0]}
      >
        <circleGeometry args={[PLAYER_CONFIG.dimensions.width / 2, 32]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </line>

      {/* Тень */}
      {state.isPlaying && (
        <mesh 
          position={[TARGET_X[state.laneIndex], -PLAYER_CONFIG.dimensions.height / 2 + 0.3, meshRef.current.position.z]}
          rotation={[Math.PI * 0.5]}
        >
          <circleGeometry args={PLAYER_CONFIG.dimensions.width * 1.2} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
      )}
    </>
  );
}
