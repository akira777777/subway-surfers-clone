import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CollectibleData, ObstacleData, ParticleData, PlayerState } from '../../game/types';
import { SubwayEnvironment } from './SubwayEnvironment';
import { PlayerCharacter } from './PlayerCharacter';
import { Obstacles } from './Obstacles';
import { Collectibles } from './Collectibles';
import { ParticleEffects } from './ParticleEffects';

interface CameraRigProps {
  playerState: PlayerState;
  shakeIntensity: number;
}

function CameraRig({ playerState, shakeIntensity }: CameraRigProps) {
  const isJetpack = playerState.activePowerups.jetpack > 0;

  useFrame(({ camera }) => {
    // Target camera position offset relative to player height and lane
    const targetCamX = playerState.currentX * 0.35;
    const targetCamY = isJetpack ? playerState.y + 4.5 : Math.max(3.2, playerState.y + 2.6);
    const targetCamZ = isJetpack ? 9.5 : 6.8;

    // Apply camera shake if any
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX + shakeX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY + shakeY, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);

    // Look at target down the subway track ahead of player
    const lookAtX = playerState.currentX * 0.5;
    const lookAtY = isJetpack ? playerState.y + 1.5 : Math.max(1.2, playerState.y + 0.8);
    camera.lookAt(lookAtX, lookAtY, -20);
  });

  return null;
}

interface GameSceneProps {
  playerState: PlayerState;
  obstacles: ObstacleData[];
  collectibles: CollectibleData[];
  particles: ParticleData[];
  distance: number;
  shakeIntensity: number;
}

export function GameScene({
  playerState,
  obstacles,
  collectibles,
  particles,
  distance,
  shakeIntensity,
}: GameSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 7], fov: 60, near: 0.1, far: 250 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0b1329']} />
        <fog attach="fog" args={['#0b1329', 40, 160]} />

        {/* Camera movement controller */}
        <CameraRig playerState={playerState} shakeIntensity={shakeIntensity} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[15, 25, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[0, 10, -30]} intensity={1.5} color="#06b6d4" />

        {/* Subway Environment Track */}
        <SubwayEnvironment distance={distance} />

        {/* Player Runner Character */}
        <PlayerCharacter
          playerState={playerState}
          skinId={playerState.skin}
          boardId={playerState.board}
        />

        {/* Active Obstacles */}
        <Obstacles obstacles={obstacles} />

        {/* Active Collectibles */}
        <Collectibles collectibles={collectibles} />

        {/* Particle Effects */}
        <ParticleEffects
          particles={particles}
          playerPos={[playerState.currentX, playerState.y, 0]}
          isJetpack={playerState.activePowerups.jetpack > 0}
          isMagnet={playerState.activePowerups.magnet > 0}
          isHoverboard={playerState.activePowerups.hoverboard}
        />
      </Canvas>
    </div>
  );
}
