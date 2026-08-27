import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerState } from '../../game/types';

interface PlayerCharacterProps {
  playerState: PlayerState;
  skinId: string;
  boardId: string;
}

export function PlayerCharacter({ playerState, skinId, boardId }: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Skin styling configuration
  const skinStyles = {
    jake: { body: '#3b82f6', pants: '#1e3a8a', skin: '#fde047', cap: '#ef4444', accent: '#f97316' },
    tricky: { body: '#ec4899', pants: '#831843', skin: '#fed7aa', cap: '#f43f5e', accent: '#a855f7' },
    fresh: { body: '#22c55e', pants: '#15803d', skin: '#fef08a', cap: '#eab308', accent: '#06b6d4' },
    cyber: { body: '#0f172a', pants: '#1e293b', skin: '#38bdf8', cap: '#0284c7', accent: '#22d3ee' },
  }[skinId] || { body: '#3b82f6', pants: '#1e3a8a', skin: '#fde047', cap: '#ef4444', accent: '#f97316' };

  // Hoverboard styling configuration
  const boardStyles = {
    standard: { body: '#ef4444', stripe: '#ffffff', glow: '#ef4444' },
    flame: { body: '#f97316', stripe: '#facc15', glow: '#ff4500' },
    neon: { body: '#d946ef', stripe: '#06b6d4', glow: '#ec4899' },
    star: { body: '#eab308', stripe: '#ffffff', glow: '#fde047' },
  }[boardId] || { body: '#ef4444', stripe: '#ffffff', glow: '#ef4444' };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const isAirborne = playerState.isJumping || playerState.y > 0.1;
    const isJetpack = playerState.activePowerups.jetpack > 0;
    const isHoverboard = playerState.activePowerups.hoverboard;

    // Limb animations for running vs jumping vs hoverboard
    if (isJetpack) {
      // Upright floating pose
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -0.2;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.5;
    } else if (isHoverboard) {
      // Surfing stance
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.3;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -0.3;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.4;
    } else if (isAirborne) {
      // Jump pose
      if (leftLegRef.current) leftLegRef.current.rotation.x = -0.8;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 1.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.2;
    } else if (playerState.isRolling) {
      // Roll animation (tuck limbs)
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -1.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.5;
    } else {
      // Running swing cycle
      const swing = Math.sin(time * 20) * 0.9;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
    }
  });

  // Calculate local scale/rotation for rolling
  const rollScaleY = playerState.isRolling ? 0.5 : 1;
  const rollPosY = playerState.isRolling ? -0.4 : 0;

  return (
    <group
      ref={groupRef}
      position={[playerState.currentX, playerState.y, 0]}
    >
      <group scale={[1, rollScaleY, 1]} position={[0, rollPosY, 0]}>
        {/* Torso / Body */}
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.8, 0.4]} />
          <meshStandardMaterial color={skinStyles.body} roughness={0.5} />
        </mesh>

        {/* Head */}
        <group position={[0, 1.75, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={skinStyles.skin} roughness={0.6} />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 0.15, -0.05]} rotation={[-0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.34, 0.18, 16]} />
            <meshStandardMaterial color={skinStyles.cap} roughness={0.4} />
          </mesh>
          {/* Cap Visor */}
          <mesh position={[0, 0.08, 0.28]} rotation={[0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.36, 0.04, 0.22]} />
            <meshStandardMaterial color={skinStyles.cap} roughness={0.4} />
          </mesh>
        </group>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.45, 1.3, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={skinStyles.body} roughness={0.5} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.45, 1.3, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={skinStyles.body} roughness={0.5} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial color={skinStyles.pants} roughness={0.6} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.7, 0.08]} castShadow>
            <boxGeometry args={[0.28, 0.15, 0.4]} />
            <meshStandardMaterial color={skinStyles.accent} roughness={0.4} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial color={skinStyles.pants} roughness={0.6} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.7, 0.08]} castShadow>
            <boxGeometry args={[0.28, 0.15, 0.4]} />
            <meshStandardMaterial color={skinStyles.accent} roughness={0.4} />
          </mesh>
        </group>

        {/* Jetpack Model if Jetpack active */}
        {playerState.activePowerups.jetpack > 0 && (
          <group position={[0, 1.1, 0.35]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.7, 0.25]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-0.2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.8, 12]} />
              <meshStandardMaterial color="#f97316" metalness={0.9} />
            </mesh>
            <mesh position={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.8, 12]} />
              <meshStandardMaterial color="#f97316" metalness={0.9} />
            </mesh>
          </group>
        )}

        {/* Hoverboard Model if Hoverboard active */}
        {playerState.activePowerups.hoverboard && (
          <group position={[0, -0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.6, 0.12, 0.6]} />
              <meshStandardMaterial color={boardStyles.body} roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Center Stripe */}
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[1.4, 0.02, 0.2]} />
              <meshStandardMaterial color={boardStyles.stripe} />
            </mesh>
            {/* Thruster Glows */}
            <mesh position={[-0.7, -0.05, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
              <meshStandardMaterial color={boardStyles.glow} emissive={boardStyles.glow} emissiveIntensity={1} />
            </mesh>
            <mesh position={[0.7, -0.05, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
              <meshStandardMaterial color={boardStyles.glow} emissive={boardStyles.glow} emissiveIntensity={1} />
            </mesh>
          </group>
        )}
      </group>

      {/* Blob Shadow on ground */}
      <mesh
        position={[0, -playerState.y + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.2, 1.4]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={Math.max(0.05, 0.4 - playerState.y * 0.04)}
        />
      </mesh>
    </group>
  );
}
