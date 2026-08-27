import { useMemo } from 'react';
import { LANE_X } from '../../game/types';

interface SubwayEnvironmentProps {
  distance: number;
}

export function SubwayEnvironment({ distance }: SubwayEnvironmentProps) {
  // Generate repeating track segment positions
  const segmentLength = 40;
  const numSegments = 8;
  const offset = (distance % segmentLength);

  const segments = useMemo(() => {
    return Array.from({ length: numSegments }, (_, i) => -i * segmentLength + 20);
  }, [numSegments, segmentLength]);

  return (
    <group>
      {/* Ground / Gravel Bed */}
      <mesh position={[0, -0.2, -100]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 400]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Repeating Track Segments */}
      {segments.map((baseZ, idx) => {
        const zPos = baseZ + offset;
        return (
          <group key={idx} position={[0, 0, zPos]}>
            {/* Railroad Track Rails for 3 Lanes */}
            {([-1, 0, 1] as const).map((lane) => {
              const laneX = LANE_X[lane];
              return (
                <group key={lane} position={[laneX, 0, 0]}>
                  {/* Left steel rail */}
                  <mesh position={[-0.8, 0.05, 0]}>
                    <boxGeometry args={[0.08, 0.1, segmentLength]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                  </mesh>
                  {/* Right steel rail */}
                  <mesh position={[0.8, 0.05, 0]}>
                    <boxGeometry args={[0.08, 0.1, segmentLength]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                  </mesh>

                  {/* Wooden ties every 2 units */}
                  {Array.from({ length: Math.floor(segmentLength / 2) }).map((_, tieIdx) => (
                    <mesh
                      key={tieIdx}
                      position={[0, 0.01, -segmentLength / 2 + tieIdx * 2]}
                    >
                      <boxGeometry args={[2.0, 0.06, 0.4]} />
                      <meshStandardMaterial color="#451a03" roughness={0.8} />
                    </mesh>
                  ))}
                </group>
              );
            })}

            {/* Subway Support Archways & Light Poles */}
            <group position={[0, 0, 0]}>
              {/* Left Column */}
              <mesh position={[-7.5, 4, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.5} />
              </mesh>
              {/* Right Column */}
              <mesh position={[7.5, 4, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 8, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.5} />
              </mesh>
              {/* Arch Top Beam */}
              <mesh position={[0, 7.8, 0]}>
                <boxGeometry args={[15.6, 0.4, 0.4]} />
                <meshStandardMaterial color="#475569" metalness={0.6} />
              </mesh>
              {/* Warning Signal Light */}
              <mesh position={[0, 7.2, 0]}>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={1.5}
                />
              </mesh>
            </group>

            {/* Side Tunnel Walls & Neon Advertising Signs */}
            <mesh position={[-8.5, 5, 0]}>
              <boxGeometry args={[0.4, 10, segmentLength]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
            <mesh position={[8.5, 5, 0]}>
              <boxGeometry args={[0.4, 10, segmentLength]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>

            {/* Neon Sign on side walls */}
            {idx % 2 === 0 && (
              <group position={[8.25, 4, 0]}>
                <mesh rotation={[0, -Math.PI / 2, 0]}>
                  <planeGeometry args={[6, 2]} />
                  <meshStandardMaterial
                    color="#06b6d4"
                    emissive="#06b6d4"
                    emissiveIntensity={2}
                  />
                </mesh>
              </group>
            )}
            {idx % 2 === 1 && (
              <group position={[-8.25, 4, 0]}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[6, 2]} />
                  <meshStandardMaterial
                    color="#ec4899"
                    emissive="#ec4899"
                    emissiveIntensity={2}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
