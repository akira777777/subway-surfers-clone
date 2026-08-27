import { LANE_X, ObstacleData } from '../../game/types';

interface ObstaclesProps {
  obstacles: ObstacleData[];
}

export function Obstacles({ obstacles }: ObstaclesProps) {
  return (
    <group>
      {obstacles.map((obs) => {
        const x = LANE_X[obs.lane];
        const z = obs.z;

        if (obs.type === 'train_low') {
          return (
            <group key={obs.id} position={[x, 0, z]}>
              {/* Main Train Body */}
              <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.6, 3, 14]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.6} />
              </mesh>
              {/* Front Buffer / Bumper */}
              <mesh position={[0, 0.6, 6.8]} castShadow>
                <boxGeometry args={[2.7, 1.2, 0.5]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
              {/* Headlights */}
              <mesh position={[-0.9, 1.2, 7.05]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
              </mesh>
              <mesh position={[0.9, 1.2, 7.05]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
              </mesh>
              {/* Windows */}
              <mesh position={[0, 2.2, 0]}>
                <boxGeometry args={[2.64, 0.8, 12]} />
                <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
              </mesh>
              {/* Ramp on front (so player can jump up onto train roof from front if timing is right) */}
              <mesh position={[0, 1.5, 6.8]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[2.4, 0.1, 1.2]} />
                <meshStandardMaterial color="#991b1b" />
              </mesh>
            </group>
          );
        }

        if (obs.type === 'train_tall') {
          return (
            <group key={obs.id} position={[x, 0, z]}>
              {/* High Train Body */}
              <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.6, 5, 16]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.3} metalness={0.6} />
              </mesh>
              {/* Yellow Front Grill */}
              <mesh position={[0, 2.0, 7.85]} castShadow>
                <boxGeometry args={[2.62, 3.8, 0.3]} />
                <meshStandardMaterial color="#eab308" metalness={0.5} />
              </mesh>
              {/* Headlights */}
              <mesh position={[-0.9, 1.5, 8.02]}>
                <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
              </mesh>
              <mesh position={[0.9, 1.5, 8.02]}>
                <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
              </mesh>
            </group>
          );
        }

        if (obs.type === 'barrier_low') {
          return (
            <group key={obs.id} position={[x, 0, z]}>
              {/* Left Post */}
              <mesh position={[-1.2, 0.6, 0]} castShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              {/* Right Post */}
              <mesh position={[1.2, 0.6, 0]} castShadow>
                <boxGeometry args={[0.2, 1.2, 0.2]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>
              {/* Low Crossbar (Jump over!) */}
              <mesh position={[0, 0.8, 0]} castShadow>
                <boxGeometry args={[2.6, 0.4, 0.15]} />
                <meshStandardMaterial color="#facc15" roughness={0.4} />
              </mesh>
              {/* Red Stripes on Crossbar */}
              <mesh position={[0, 0.8, 0.08]}>
                <boxGeometry args={[2.4, 0.25, 0.02]} />
                <meshStandardMaterial color="#dc2626" />
              </mesh>
            </group>
          );
        }

        if (obs.type === 'barrier_high') {
          return (
            <group key={obs.id} position={[x, 0, z]}>
              {/* Tall Left Post */}
              <mesh position={[-1.2, 1.8, 0]} castShadow>
                <boxGeometry args={[0.2, 3.6, 0.2]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
              {/* Tall Right Post */}
              <mesh position={[1.2, 1.8, 0]} castShadow>
                <boxGeometry args={[0.2, 3.6, 0.2]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
              {/* High Overhead Banner Bar (Duck/Roll under!) */}
              <mesh position={[0, 2.7, 0]} castShadow>
                <boxGeometry args={[2.6, 1.4, 0.15]} />
                <meshStandardMaterial color="#0284c7" roughness={0.4} />
              </mesh>
              {/* Warning Sign Symbol */}
              <mesh position={[0, 2.7, 0.09]}>
                <boxGeometry args={[2.2, 1.0, 0.02]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        }

        return null;
      })}
    </group>
  );
}
