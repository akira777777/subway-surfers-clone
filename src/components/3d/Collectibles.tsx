import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CollectibleData, LANE_X } from '../../game/types';

interface CollectiblesProps {
  collectibles: CollectibleData[];
}

export function Collectibles({ collectibles }: CollectiblesProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Rotate all collectibles for dynamic spinning effect
    groupRef.current.children.forEach((child) => {
      child.rotation.y += delta * 3;
    });
  });

  return (
    <group ref={groupRef}>
      {collectibles.map((item) => {
        if (item.collected) return null;
        const x = LANE_X[item.lane];
        const y = item.y;
        const z = item.z;

        if (item.type === 'coin') {
          return (
            <group key={item.id} position={[x, y, z]}>
              {/* Coin Outer Ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.45, 0.1, 20]} />
                <meshStandardMaterial
                  color="#eab308"
                  emissive="#ca8a04"
                  emissiveIntensity={0.8}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
              {/* Coin Inner Star Relief */}
              <mesh position={[0, 0, 0.06]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.2, 0.5, 0.02]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1} />
              </mesh>
            </group>
          );
        }

        if (item.type === 'magnet') {
          return (
            <group key={item.id} position={[x, y, z]}>
              <mesh castShadow>
                <torusGeometry args={[0.45, 0.15, 12, 24, Math.PI]} />
                <meshStandardMaterial
                  color="#ec4899"
                  emissive="#ec4899"
                  emissiveIntensity={1}
                  metalness={0.6}
                />
              </mesh>
            </group>
          );
        }

        if (item.type === 'multiplier') {
          return (
            <group key={item.id} position={[x, y, z]}>
              <mesh castShadow>
                <octahedronGeometry args={[0.55]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#a855f7"
                  emissiveIntensity={1.2}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        }

        if (item.type === 'jetpack') {
          return (
            <group key={item.id} position={[x, y, z]}>
              <mesh castShadow>
                <boxGeometry args={[0.5, 0.7, 0.3]} />
                <meshStandardMaterial
                  color="#f97316"
                  emissive="#ff4500"
                  emissiveIntensity={1.2}
                />
              </mesh>
            </group>
          );
        }

        if (item.type === 'hoverboard') {
          return (
            <group key={item.id} position={[x, y, z]}>
              <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
                <boxGeometry args={[0.9, 0.1, 0.35]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#38bdf8"
                  emissiveIntensity={1}
                />
              </mesh>
            </group>
          );
        }

        return null;
      })}
    </group>
  );
}
