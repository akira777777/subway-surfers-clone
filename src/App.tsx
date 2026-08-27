import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BASE_SPEED,
  CollectibleData,
  GRAVITY,
  GameStats,
  GameStatus,
  JUMP_IMPULSE,
  LANE_X,
  LaneIndex,
  MAX_SPEED,
  ObstacleData,
  ObstacleType,
  ParticleData,
  PlayerState,
  ROLL_DURATION,
} from './game/types';
import { loadGameStats, saveGameStats } from './game/storage';
import { soundManager } from './game/audio';
import { GameScene } from './components/3d/GameScene';
import { HUD } from './components/ui/HUD';
import { StartMenu } from './components/ui/StartMenu';
import { GameOverModal } from './components/ui/GameOverModal';
import { ShopModal } from './components/ui/ShopModal';
import { TouchControls } from './components/ui/TouchControls';
import './App.css';

const INITIAL_PLAYER_STATE: PlayerState = {
  lane: 0,
  currentX: 0,
  y: 0,
  velocityY: 0,
  isJumping: false,
  isRolling: false,
  rollTimer: 0,
  skin: 'jake',
  board: 'standard',
  activePowerups: {
    magnet: 0,
    multiplier: 0,
    jetpack: 0,
    hoverboard: false,
    hoverboardTimer: 0,
  },
};

export default function App() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [stats, setStats] = useState<GameStats>(() => loadGameStats());
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Gameplay Live State
  const [playerState, setPlayerState] = useState<PlayerState>({
    ...INITIAL_PLAYER_STATE,
    skin: stats.selectedSkin,
    board: stats.selectedBoard,
  });

  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Refs for animation loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const obstacleIdCounter = useRef(0);
  const collectibleIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const nextSpawnZ = useRef<number>(-50);

  // Keep player state ref in sync for loop
  const playerRef = useRef(playerState);
  playerRef.current = playerState;

  const obstaclesRef = useRef(obstacles);
  obstaclesRef.current = obstacles;

  const collectiblesRef = useRef(collectibles);
  collectiblesRef.current = collectibles;

  const particlesRef = useRef(particles);
  particlesRef.current = particles;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const distanceRef = useRef(distance);
  distanceRef.current = distance;

  const coinsRef = useRef(coinsEarned);
  coinsRef.current = coinsEarned;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const gameStatusRef = useRef(gameStatus);
  gameStatusRef.current = gameStatus;

  const statsRef = useRef(stats);
  statsRef.current = stats;

  // Particle Spawner Helper
  const spawnSparkles = (x: number, y: number, z: number, color = '#fef08a', count = 5) => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `p_${particleIdCounter.current++}`,
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        vz: (Math.random() - 0.5) * 6,
        color,
        life: 0.4,
        maxLife: 0.4,
        size: Math.random() * 0.15 + 0.08,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Helper to spawn obstacles and coin streams ahead
  const generateSegment = useCallback((targetZ: number) => {
    const lanes: LaneIndex[] = [-1, 0, 1];
    const obsTypes: ObstacleType[] = ['barrier_low', 'barrier_high', 'train_low', 'train_tall'];

    // Select 1 or 2 obstacle lanes
    const primaryLane = lanes[Math.floor(Math.random() * lanes.length)];
    const primaryType = obsTypes[Math.floor(Math.random() * obsTypes.length)];

    const newObs: ObstacleData[] = [
      {
        id: `obs_${obstacleIdCounter.current++}`,
        type: primaryType,
        lane: primaryLane,
        z: targetZ,
        depth: primaryType.includes('train') ? 14 : 0.8,
      },
    ];

    // Optionally add a second obstacle in a different lane
    if (Math.random() > 0.4) {
      const otherLanes = lanes.filter((l) => l !== primaryLane);
      const secondLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      const secondType: ObstacleType = Math.random() > 0.5 ? 'barrier_low' : 'barrier_high';

      newObs.push({
        id: `obs_${obstacleIdCounter.current++}`,
        type: secondType,
        lane: secondLane,
        z: targetZ,
        depth: 0.8,
      });
    }

    // Spawn coin lines in open lanes or on top of low trains
    const openLanes = lanes.filter((l) => !newObs.some((o) => o.lane === l));
    const coinLane = openLanes.length > 0 ? openLanes[0] : primaryLane;
    const isTrainCoin = primaryType === 'train_low' && coinLane === primaryLane;
    const coinY = isTrainCoin ? 3.8 : 1.2;

    const newCols: CollectibleData[] = [];
    const numCoins = Math.floor(Math.random() * 5) + 4;

    for (let c = 0; c < numCoins; c++) {
      newCols.push({
        id: `col_${collectibleIdCounter.current++}`,
        type: 'coin',
        lane: coinLane,
        z: targetZ + c * 3.5,
        y: coinY,
      });
    }

    // 15% chance to spawn a Power-Up ahead
    if (Math.random() < 0.18) {
      const pTypes: ('magnet' | 'multiplier' | 'jetpack' | 'hoverboard')[] = [
        'magnet',
        'multiplier',
        'jetpack',
        'hoverboard',
      ];
      const selectedPType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pLane = openLanes.length > 0 ? openLanes[Math.floor(Math.random() * openLanes.length)] : 0;

      newCols.push({
        id: `col_${collectibleIdCounter.current++}`,
        type: selectedPType,
        lane: pLane,
        z: targetZ + (numCoins + 2) * 3.5,
        y: 1.5,
      });
    }

    setObstacles((prev) => [...prev, ...newObs]);
    setCollectibles((prev) => [...prev, ...newCols]);
  }, []);

  // Controls Handlers
  const handleMoveLeft = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    setPlayerState((prev) => ({
      ...prev,
      lane: Math.max(-1, prev.lane - 1) as LaneIndex,
    }));
  }, []);

  const handleMoveRight = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    setPlayerState((prev) => ({
      ...prev,
      lane: Math.min(1, prev.lane + 1) as LaneIndex,
    }));
  }, []);

  const handleJump = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    setPlayerState((prev) => {
      // Allow jump if on ground or on train roof
      if (prev.y <= 0.1 || (prev.y >= 2.9 && prev.y <= 3.1)) {
        soundManager.playJump();
        return {
          ...prev,
          velocityY: JUMP_IMPULSE,
          isJumping: true,
          isRolling: false,
        };
      }
      return prev;
    });
  }, []);

  const handleRoll = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    soundManager.playRoll();
    setPlayerState((prev) => ({
      ...prev,
      isRolling: true,
      rollTimer: ROLL_DURATION,
      // Fast fall impulse if airborne
      velocityY: prev.y > 0.2 ? -JUMP_IMPULSE * 1.2 : prev.velocityY,
    }));
  }, []);

  const handleActivateHoverboard = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    soundManager.playHoverboard();
    setPlayerState((prev) => ({
      ...prev,
      activePowerups: {
        ...prev.activePowerups,
        hoverboard: true,
        hoverboardTimer: 10,
      },
    }));
  }, []);

  // Start / Reset Game
  const startGame = () => {
    soundManager.startMusic();
    setScore(0);
    setCoinsEarned(0);
    setDistance(0);
    setSpeed(BASE_SPEED);
    setIsNewHighScore(false);
    nextSpawnZ.current = -50;

    setPlayerState({
      ...INITIAL_PLAYER_STATE,
      skin: statsRef.current.selectedSkin,
      board: statsRef.current.selectedBoard,
    });

    setObstacles([]);
    setCollectibles([]);
    setParticles([]);

    // Populate initial segment ahead
    for (let i = 0; i < 4; i++) {
      generateSegment(nextSpawnZ.current);
      nextSpawnZ.current -= 35;
    }

    setGameStatus('playing');
  };

  const pauseGame = () => {
    if (gameStatus === 'playing') {
      soundManager.stopMusic();
      setGameStatus('paused');
    } else if (gameStatus === 'paused') {
      soundManager.startMusic();
      setGameStatus('playing');
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleMoveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleMoveRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleJump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleRoll();
      } else if (e.key === ' ') {
        handleActivateHoverboard();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMoveLeft, handleMoveRight, handleJump, handleRoll, handleActivateHoverboard]);

  // Main Physics & Game Loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const gameLoop = (now: number) => {
      const delta = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStatusRef.current === 'playing') {
        const curPlayer = playerRef.current;
        const curSpeed = speedRef.current;
        const isJetpack = curPlayer.activePowerups.jetpack > 0;
        const isMagnet = curPlayer.activePowerups.magnet > 0;
        const multVal = curPlayer.activePowerups.multiplier > 0 ? 2 : 1;

        // 1. Ramp Speed & Distance
        const newSpeed = Math.min(MAX_SPEED, curSpeed + delta * 0.15);
        setSpeed(newSpeed);

        const distDelta = newSpeed * delta;
        const newDistance = distanceRef.current + distDelta;
        setDistance(newDistance);

        const newScore = scoreRef.current + distDelta * multVal * 0.5;
        setScore(newScore);

        // 2. Camera Shake Fade
        setShakeIntensity((s) => Math.max(0, s - delta * 2));

        // 3. Player Lane Smooth Lerp (x)
        const targetX = LANE_X[curPlayer.lane];
        const newX = curPlayer.currentX + (targetX - curPlayer.currentX) * delta * 18;

        // 4. Player Jump & Gravity Physics (y)
        let newY = curPlayer.y;
        let newVy = curPlayer.velocityY;

        if (isJetpack) {
          // Hover high up during jetpack
          newY = curPlayer.y + (12 - curPlayer.y) * delta * 5;
          newVy = 0;
        } else {
          newVy += GRAVITY * delta;
          newY += newVy * delta;

          // Check landing on train roofs (y = 3.0) or ground (y = 0)
          let groundY = 0;
          for (const obs of obstaclesRef.current) {
            if (
              obs.type.includes('train') &&
              obs.lane === curPlayer.lane &&
              obs.z >= -3.5 &&
              obs.z <= 3.5
            ) {
              groundY = obs.type === 'train_low' ? 3.0 : 5.0;
              break;
            }
          }

          if (newY <= groundY) {
            newY = groundY;
            newVy = 0;
          }
        }

        // 5. Update Roll Timer
        let newRollTimer = curPlayer.rollTimer;
        let isRolling = curPlayer.isRolling;
        if (isRolling) {
          newRollTimer -= delta;
          if (newRollTimer <= 0) {
            isRolling = false;
            newRollTimer = 0;
          }
        }

        // 6. Update Power-Up Timers
        const updatedPowerups = { ...curPlayer.activePowerups };
        if (updatedPowerups.magnet > 0) updatedPowerups.magnet = Math.max(0, updatedPowerups.magnet - delta);
        if (updatedPowerups.multiplier > 0) updatedPowerups.multiplier = Math.max(0, updatedPowerups.multiplier - delta);
        if (updatedPowerups.jetpack > 0) updatedPowerups.jetpack = Math.max(0, updatedPowerups.jetpack - delta);
        if (updatedPowerups.hoverboardTimer > 0) {
          updatedPowerups.hoverboardTimer = Math.max(0, updatedPowerups.hoverboardTimer - delta);
          if (updatedPowerups.hoverboardTimer === 0) updatedPowerups.hoverboard = false;
        }

        setPlayerState({
          ...curPlayer,
          currentX: newX,
          y: newY,
          velocityY: newVy,
          isJumping: newY > 0.1 && newY !== 3.0 && newY !== 5.0,
          isRolling,
          rollTimer: newRollTimer,
          activePowerups: updatedPowerups,
        });

        // 7. Move Obstacles & Check Collisions
        const updatedObsList: ObstacleData[] = [];
        let hasCrashed = false;

        for (const obs of obstaclesRef.current) {
          const obsZ = obs.z + distDelta;

          // Check collision if obstacle is near player Z=0
          if (obsZ >= -1.4 && obsZ <= 1.4 && obs.lane === curPlayer.lane && !isJetpack) {
            let collided = false;

            if (obs.type === 'barrier_low') {
              if (newY < 1.0) collided = true;
            } else if (obs.type === 'barrier_high') {
              if (!isRolling || newY > 0.6) collided = true;
            } else if (obs.type === 'train_low') {
              if (newY < 2.8) collided = true;
            } else if (obs.type === 'train_tall') {
              if (newY < 4.8) collided = true;
            }

            if (collided) {
              if (curPlayer.activePowerups.hoverboard) {
                // Hoverboard saves player from crash!
                soundManager.playCrash();
                setShakeIntensity(0.6);
                spawnSparkles(newX, newY + 1, 0, '#38bdf8', 12);

                setPlayerState((prev) => ({
                  ...prev,
                  activePowerups: {
                    ...prev.activePowerups,
                    hoverboard: false,
                  },
                }));
                // Skip obstacle
                continue;
              } else {
                hasCrashed = true;
              }
            }
          }

          // Keep obstacle if not passed behind camera
          if (obsZ < 15) {
            updatedObsList.push({ ...obs, z: obsZ });
          }
        }
        setObstacles(updatedObsList);

        // Handle Crash
        if (hasCrashed) {
          soundManager.playCrash();
          soundManager.stopMusic();
          setShakeIntensity(1.2);

          const finalScore = Math.floor(scoreRef.current);
          const finalCoins = coinsRef.current;

          const isNewRecord = finalScore > statsRef.current.highScore;
          setIsNewHighScore(isNewRecord);

          const updatedStats = saveGameStats({
            highScore: Math.max(statsRef.current.highScore, finalScore),
            totalCoins: statsRef.current.totalCoins + finalCoins,
          });

          setStats(updatedStats);
          setGameStatus('gameover');
          return;
        }

        // 8. Move Collectibles & Handle Magnet / Pickups
        const updatedColsList: CollectibleData[] = [];

        for (const col of collectiblesRef.current) {
          let colZ = col.z + distDelta;
          let colX = LANE_X[col.lane];
          let colY = col.y;

          // Magnet Attraction Logic
          if (isMagnet && col.type === 'coin' && !col.collected) {
            const dx = newX - colX;
            const dy = newY + 1 - colY;
            const dz = 0 - colZ;
            const distToPlayer = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distToPlayer < 12) {
              colX += dx * delta * 12;
              colY += dy * delta * 12;
              colZ += dz * delta * 12;
            }
          }

          // Check pickup collision
          const distToPlayer = Math.sqrt(
            Math.pow(newX - colX, 2) + Math.pow(newY + 1 - colY, 2) + Math.pow(0 - colZ, 2)
          );

          if (distToPlayer < 1.4 && !col.collected) {
            if (col.type === 'coin') {
              soundManager.playCoin();
              setCoinsEarned((c) => c + 1);
              setScore((s) => s + 20);
              spawnSparkles(colX, colY, colZ, '#fef08a', 4);
            } else {
              soundManager.playPowerup();
              spawnSparkles(colX, colY, colZ, '#ec4899', 8);

              const upgLevels = statsRef.current.upgrades;
              const bonusDuration = (upgLevels[col.type as keyof typeof upgLevels] || 1) * 2;

              setPlayerState((prev) => {
                const p = { ...prev.activePowerups };
                if (col.type === 'magnet') p.magnet = 8 + bonusDuration;
                if (col.type === 'multiplier') p.multiplier = 8 + bonusDuration;
                if (col.type === 'jetpack') p.jetpack = 8 + bonusDuration;
                if (col.type === 'hoverboard') p.hoverboard = true;
                return { ...prev, activePowerups: p };
              });
            }
            continue; // Collected!
          }

          if (colZ < 15) {
            updatedColsList.push({ ...col, z: colZ, y: colY });
          }
        }
        setCollectibles(updatedColsList);

        // 9. Update Particles
        setParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx * delta,
              y: p.y + p.vy * delta,
              z: p.z + p.vz * delta,
              life: p.life - delta,
            }))
            .filter((p) => p.life > 0)
        );

        // 10. Procedurally spawn new track segment ahead
        if (nextSpawnZ.current + newDistance > -140) {
          generateSegment(nextSpawnZ.current);
          nextSpawnZ.current -= 35;
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [generateSegment]);

  return (
    <div className="game-app-container">
      {/* 3D Canvas Scene */}
      <GameScene
        playerState={playerState}
        obstacles={obstacles}
        collectibles={collectibles}
        particles={particles}
        distance={distance}
        shakeIntensity={shakeIntensity}
      />

      {/* Touch / Virtual Controls */}
      {gameStatus === 'playing' && (
        <TouchControls
          onLeft={handleMoveLeft}
          onRight={handleMoveRight}
          onJump={handleJump}
          onRoll={handleRoll}
        />
      )}

      {/* Live HUD */}
      {gameStatus === 'playing' && (
        <HUD
          score={score}
          coins={coinsEarned}
          multiplier={playerState.activePowerups.multiplier > 0 ? 2 : 1}
          distance={distance}
          playerState={playerState}
          onPause={pauseGame}
          onActivateHoverboard={handleActivateHoverboard}
        />
      )}

      {/* Start Menu Overlay */}
      {gameStatus === 'menu' && !isShopOpen && (
        <StartMenu
          highScore={stats.highScore}
          totalCoins={stats.totalCoins}
          onStartGame={startGame}
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {/* Pause Screen Overlay */}
      {gameStatus === 'paused' && (
        <div className="overlay-menu-container">
          <div className="start-menu-card glass-panel">
            <h1 className="game-title">PAUSED</h1>
            <div className="menu-action-stack">
              <button className="primary-btn pulse-glow" onClick={pauseGame}>
                ▶ RESUME GAME
              </button>
              <button className="secondary-btn" onClick={startGame}>
                🔄 RESTART
              </button>
              <button className="outline-btn" onClick={() => setGameStatus('menu')}>
                🏠 MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameStatus === 'gameover' && !isShopOpen && (
        <GameOverModal
          score={score}
          coinsEarned={coinsEarned}
          distance={distance}
          highScore={stats.highScore}
          isNewHighScore={isNewHighScore}
          onRestart={startGame}
          onOpenShop={() => setIsShopOpen(true)}
          onMenu={() => setGameStatus('menu')}
        />
      )}

      {/* Shop & Upgrades Modal */}
      {isShopOpen && (
        <ShopModal
          stats={stats}
          onUpdateStats={(newStats) => {
            setStats(newStats);
            setPlayerState((prev) => ({
              ...prev,
              skin: newStats.selectedSkin,
              board: newStats.selectedBoard,
            }));
          }}
          onClose={() => setIsShopOpen(false)}
        />
      )}
    </div>
  );
}
