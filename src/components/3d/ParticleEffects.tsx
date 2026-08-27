import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleData } from '../../game/types';

interface ParticleEffectsProps {
  particles: ParticleData[];
  playerPos: [number, number, number];
  isJetpack: boolean;
  isMagnet: boolean;
  isHoverboard: boolean;
}

export function ParticleEffects({
  particles,
  playerPos,
  isJetpack,
  isMagnet,
  isHoverboard,
}: ParticleEffectsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const boardAuraRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Rotate magnet aura if present
    if (auraRef.current) {
      auraRef.current.rotation.y += delta * 4;
      auraRef.current.rotation.z += delta * 2;
    }
    if (boardAuraRef.current) {
      boardAuraRef.current.rotation.y += delta * 6;
    }
  });

  return (
    <group>
      {/* Dynamic particle explosions (coin bursts, dust) */}
      {particles.map((p) => {
        const opacity = Math.max(0, p.life / p.maxLife);
        return (
          <mesh key={p.id} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[p.size, 8, 8]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {/* Magnet Ring Effect around player */}
      {isMagnet && (
        <mesh
          ref={auraRef}
          position={[playerPos[0], playerPos[1] + 0.9, playerPos[2]]}
        >
          <torusGeometry args={[1.3, 0.08, 16, 32]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={1}
            wireframe
          />
        </mesh>
      )}

      {/* Hoverboard Shield Aura */}
      {isHoverboard && (
        <mesh
          ref={boardAuraRef}
          position={[playerPos[0], playerPos[1] + 0.8, playerPos[2]]}
        >
          <cylinderGeometry args={[1.5, 1.5, 2.2, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      {/* Jetpack Smoke & Fire Exhaust */}
      {isJetpack && (
        <group position={[playerPos[0], playerPos[1] + 0.8, playerPos[2] + 0.4]}>
          {/* Flame left */}
          <mesh position={[-0.3, -0.8, 0]}>
            <coneGeometry args={[0.2, 0.8, 8]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ff4500"
              emissiveIntensity={2}
            />
          </mesh>
          {/* Flame right */}
          <mesh position={[0.3, -0.8, 0]}>
            <coneGeometry args={[0.2, 0.8, 8]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ff4500"
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
