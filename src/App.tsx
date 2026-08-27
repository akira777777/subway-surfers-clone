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
import './index.css';

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

  // Gameplay Live State for React rendering
  const [playerState, setPlayerState] = useState<PlayerState>({
    ...INITIAL_PLAYER_STATE,
    skin: stats.selectedSkin,
    board: stats.selectedBoard,
  });

  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Refs for 60FPS physics game loop (eliminates stale closures and render lag)
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const obstacleIdCounter = useRef(0);
  const collectibleIdCounter = useRef(0);
  const particleIdCounter = useRef(0);

  const playerRef = useRef(playerState);
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const collectiblesRef = useRef<CollectibleData[]>([]);
  const particlesRef = useRef<ParticleData[]>([]);
  const speedRef = useRef(BASE_SPEED);
  const distanceRef = useRef(0);
  const coinsRef = useRef(0);
  const scoreRef = useRef(0);
  const shakeRef = useRef(0);
  const gameStatusRef = useRef<GameStatus>('menu');
  const statsRef = useRef<GameStats>(stats);

  // Keep refs synced
  gameStatusRef.current = gameStatus;
  statsRef.current = stats;

  // Particle Spawner Helper
  const spawnSparkles = useCallback((x: number, y: number, z: number, color = '#fef08a', count = 6) => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: `p_${particleIdCounter.current++}`,
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 7 + 2,
        vz: (Math.random() - 0.5) * 8,
        color,
        life: 0.45,
        maxLife: 0.45,
        size: Math.random() * 0.18 + 0.09,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Helper to spawn obstacles and coin streams ahead in local coordinate space
  const spawnSegmentAtZ = useCallback((targetZ: number) => {
    const lanes: LaneIndex[] = [-1, 0, 1];
    const obsTypes: ObstacleType[] = ['barrier_low', 'barrier_high', 'train_low', 'train_tall'];

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

    // 50% chance to add a secondary hurdle in another lane
    if (Math.random() > 0.5) {
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
    const numCoins = Math.floor(Math.random() * 4) + 4;

    for (let c = 0; c < numCoins; c++) {
      newCols.push({
        id: `col_${collectibleIdCounter.current++}`,
        type: 'coin',
        lane: coinLane,
        z: targetZ + c * 3.5,
        y: coinY,
      });
    }

    // 22% chance to spawn a Power-Up ahead
    if (Math.random() < 0.22) {
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
        z: targetZ + (numCoins + 1) * 3.5,
        y: 1.5,
      });
    }

    obstaclesRef.current = [...obstaclesRef.current, ...newObs];
    collectiblesRef.current = [...collectiblesRef.current, ...newCols];
  }, []);

  // Controls Handlers
  const handleMoveLeft = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    playerRef.current = {
      ...playerRef.current,
      lane: Math.max(-1, playerRef.current.lane - 1) as LaneIndex,
    };
    setPlayerState(playerRef.current);
  }, []);

  const handleMoveRight = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    playerRef.current = {
      ...playerRef.current,
      lane: Math.min(1, playerRef.current.lane + 1) as LaneIndex,
    };
    setPlayerState(playerRef.current);
  }, []);

  const handleJump = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    const cur = playerRef.current;
    if (cur.y <= 0.1 || (cur.y >= 2.8 && cur.y <= 3.2)) {
      soundManager.playJump();
      playerRef.current = {
        ...cur,
        velocityY: JUMP_IMPULSE,
        isJumping: true,
        isRolling: false,
      };
      setPlayerState(playerRef.current);
    }
  }, []);

  const handleRoll = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    soundManager.playRoll();
    const cur = playerRef.current;
    playerRef.current = {
      ...cur,
      isRolling: true,
      rollTimer: ROLL_DURATION,
      velocityY: cur.y > 0.2 ? -JUMP_IMPULSE * 1.3 : cur.velocityY,
    };
    setPlayerState(playerRef.current);
  }, []);

  const handleActivateHoverboard = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    soundManager.playHoverboard();
    playerRef.current = {
      ...playerRef.current,
      activePowerups: {
        ...playerRef.current.activePowerups,
        hoverboard: true,
        hoverboardTimer: 15,
      },
    };
    setPlayerState(playerRef.current);
  }, []);

  // Start / Reset Game
  const startGame = () => {
    soundManager.startMusic();
    scoreRef.current = 0;
    coinsRef.current = 0;
    distanceRef.current = 0;
    speedRef.current = BASE_SPEED;
    shakeRef.current = 0;
    setIsNewHighScore(false);

    const initialPlayer: PlayerState = {
      ...INITIAL_PLAYER_STATE,
      skin: statsRef.current.selectedSkin,
      board: statsRef.current.selectedBoard,
    };

    playerRef.current = initialPlayer;
    setPlayerState(initialPlayer);

    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];

    // Pre-populate obstacles ahead from -40 down to -160
    for (let z = -40; z >= -160; z -= 35) {
      spawnSegmentAtZ(z);
    }

    setObstacles([...obstaclesRef.current]);
    setCollectibles([...collectiblesRef.current]);
    setParticles([]);
    setScore(0);
    setCoinsEarned(0);
    setDistance(0);
    setShakeIntensity(0);

    lastTimeRef.current = performance.now();
    gameStatusRef.current = 'playing';
    setGameStatus('playing');
  };

  const pauseGame = () => {
    if (gameStatusRef.current === 'playing') {
      soundManager.stopMusic();
      gameStatusRef.current = 'paused';
      setGameStatus('paused');
    } else if (gameStatusRef.current === 'paused') {
      soundManager.startMusic();
      lastTimeRef.current = performance.now();
      gameStatusRef.current = 'playing';
      setGameStatus('playing');
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Escape', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleMoveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleMoveRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (gameStatusRef.current === 'menu' || gameStatusRef.current === 'gameover') {
          startGame();
        } else {
          handleJump();
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleRoll();
      } else if (e.key === ' ') {
        if (gameStatusRef.current === 'menu' || gameStatusRef.current === 'gameover') {
          startGame();
        } else {
          handleActivateHoverboard();
        }
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMoveLeft, handleMoveRight, handleJump, handleRoll, handleActivateHoverboard]);

  // Main 60FPS Physics & Game Loop
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
        const newSpeed = Math.min(MAX_SPEED, curSpeed + delta * 0.2);
        speedRef.current = newSpeed;

        const distDelta = newSpeed * delta;
        distanceRef.current += distDelta;
        scoreRef.current += distDelta * multVal * 0.8;

        // 2. Camera Shake Fade
        if (shakeRef.current > 0) {
          shakeRef.current = Math.max(0, shakeRef.current - delta * 2.5);
          setShakeIntensity(shakeRef.current);
        }

        // 3. Player Lane Smooth Lerp (x)
        const targetX = LANE_X[curPlayer.lane];
        const newX = curPlayer.currentX + (targetX - curPlayer.currentX) * Math.min(1, delta * 18);

        // 4. Player Jump & Gravity Physics (y)
        let newY = curPlayer.y;
        let newVy = curPlayer.velocityY;

        if (isJetpack) {
          // Jetpack lifts player up to Y=12
          newY = curPlayer.y + (12 - curPlayer.y) * delta * 5;
          newVy = 0;
        } else {
          newVy += GRAVITY * delta;
          newY += newVy * delta;

          // Check landing on train roof (y = 3.0 for train_low, 5.0 for train_tall)
          let groundY = 0;
          for (const obs of obstaclesRef.current) {
            if (
              obs.type.includes('train') &&
              obs.lane === curPlayer.lane &&
              obs.z >= -7.0 &&
              obs.z <= 7.0
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
          if (updatedPowerups.hoverboardTimer <= 0) updatedPowerups.hoverboard = false;
        }

        const nextPlayerState: PlayerState = {
          ...curPlayer,
          currentX: newX,
          y: newY,
          velocityY: newVy,
          isJumping: newY > 0.1 && newY !== 3.0 && newY !== 5.0,
          isRolling,
          rollTimer: newRollTimer,
          activePowerups: updatedPowerups,
        };
        playerRef.current = nextPlayerState;

        // 7. Move Obstacles & Check Collisions
        const updatedObsList: ObstacleData[] = [];
        let hasCrashed = false;

        for (const obs of obstaclesRef.current) {
          const obsZ = obs.z + distDelta;
          const isTrain = obs.type.includes('train');
          const checkZRange = isTrain ? (obsZ >= -7.0 && obsZ <= 7.0) : (obsZ >= -1.2 && obsZ <= 1.2);

          // Check collision if obstacle overlaps player at Z=0
          if (checkZRange && obs.lane === nextPlayerState.lane && !isJetpack) {
            let collided = false;

            if (obs.type === 'barrier_low') {
              if (newY < 1.0) collided = true;
            } else if (obs.type === 'barrier_high') {
              if (!isRolling || newY > 0.6) collided = true;
            } else if (obs.type === 'train_low') {
              // Safe if running on top of train
              if (newY < 2.8) collided = true;
            } else if (obs.type === 'train_tall') {
              if (newY < 4.8) collided = true;
            }

            if (collided) {
              if (nextPlayerState.activePowerups.hoverboard) {
                // Hoverboard absorbs crash!
                soundManager.playCrash();
                shakeRef.current = 0.6;
                setShakeIntensity(0.6);
                spawnSparkles(newX, newY + 1, 0, '#38bdf8', 12);

                nextPlayerState.activePowerups.hoverboard = false;
                nextPlayerState.activePowerups.hoverboardTimer = 0;
                playerRef.current = nextPlayerState;
                continue; // Skip obstacle without gameover
              } else {
                hasCrashed = true;
              }
            }
          }

          // Keep obstacle if not passed far behind camera
          if (obsZ < 25) {
            updatedObsList.push({ ...obs, z: obsZ });
          }
        }
        obstaclesRef.current = updatedObsList;

        // Handle Crash
        if (hasCrashed) {
          soundManager.playCrash();
          soundManager.stopMusic();
          shakeRef.current = 1.2;
          setShakeIntensity(1.2);

          const finalScore = Math.floor(scoreRef.current);
          const finalCoins = coinsRef.current;
          const finalDist = distanceRef.current;

          const isNewRecord = finalScore > statsRef.current.highScore;
          setIsNewHighScore(isNewRecord);

          const updatedStats = saveGameStats({
            highScore: Math.max(statsRef.current.highScore, finalScore),
            totalCoins: statsRef.current.totalCoins + finalCoins,
          });

          setStats(updatedStats);
          setScore(finalScore);
          setCoinsEarned(finalCoins);
          setDistance(finalDist);
          gameStatusRef.current = 'gameover';
          setGameStatus('gameover');
          return;
        }

        // 8. Move Collectibles & Magnet Attraction
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

            if (distToPlayer < 16) {
              colX += dx * delta * 14;
              colY += dy * delta * 14;
              colZ += dz * delta * 14;
            }
          }

          // Check pickup collision
          const distToPlayer = Math.sqrt(
            Math.pow(newX - colX, 2) + Math.pow(newY + 1 - colY, 2) + Math.pow(0 - colZ, 2)
          );

          if (distToPlayer < 1.6 && !col.collected) {
            if (col.type === 'coin') {
              soundManager.playCoin();
              coinsRef.current += 1;
              scoreRef.current += 25;
              spawnSparkles(colX, colY, colZ, '#fef08a', 5);
            } else {
              soundManager.playPowerup();
              spawnSparkles(colX, colY, colZ, '#ec4899', 10);

              const upgLevels = statsRef.current.upgrades;
              const bonusDuration = (upgLevels[col.type as keyof typeof upgLevels] || 1) * 2;

              if (col.type === 'magnet') nextPlayerState.activePowerups.magnet = 8 + bonusDuration;
              if (col.type === 'multiplier') nextPlayerState.activePowerups.multiplier = 8 + bonusDuration;
              if (col.type === 'jetpack') nextPlayerState.activePowerups.jetpack = 8 + bonusDuration;
              if (col.type === 'hoverboard') {
                nextPlayerState.activePowerups.hoverboard = true;
                nextPlayerState.activePowerups.hoverboardTimer = 15;
              }
              playerRef.current = nextPlayerState;
            }
            continue; // Collected!
          }

          if (colZ < 20) {
            updatedColsList.push({ ...col, z: colZ, y: colY });
          }
        }
        collectiblesRef.current = updatedColsList;

        // 9. Update Particles
        particlesRef.current = particlesRef.current
          .map((p) => ({
            ...p,
            x: p.x + p.vx * delta,
            y: p.y + p.vy * delta,
            z: p.z + p.vz * delta,
            life: p.life - delta,
          }))
          .filter((p) => p.life > 0);

        // 10. Endless Track Spawner: Check farthest obstacle ahead
        const minZ = obstaclesRef.current.reduce((min, o) => Math.min(min, o.z), 0);
        if (minZ > -150) {
          spawnSegmentAtZ(minZ - 35);
        }

        // 11. Sync React State for 60FPS rendering
        setPlayerState(nextPlayerState);
        setObstacles([...obstaclesRef.current]);
        setCollectibles([...collectiblesRef.current]);
        setParticles([...particlesRef.current]);
        setDistance(distanceRef.current);
        setScore(scoreRef.current);
        setCoinsEarned(coinsRef.current);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [spawnSegmentAtZ, spawnSparkles]);

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
