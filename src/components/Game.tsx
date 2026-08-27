import { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../game/audio';

type Lane = -1 | 0 | 1;
type EntityKind = 'coin' | 'crate' | 'barrier' | 'train';
type Entity = {
  id: number;
  lane: Lane;
  z: number;
  kind: EntityKind;
};
type GamePhase = 'ready' | 'playing' | 'paused' | 'over';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

const SAVE_KEY = 'midnight-line-high-score';
const lanes: Lane[] = [-1, 0, 1];

const getBest = () => {
  try {
    return Number(localStorage.getItem(SAVE_KEY) || 0);
  } catch {
    return 0;
  }
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<GamePhase>('ready');
  const gameRef = useRef({
    lane: 0 as Lane,
    currentLane: 0,
    jump: 0,
    slide: 0,
    score: 0,
    coins: 0,
    distance: 0,
    entities: [] as Entity[],
    particles: [] as Particle[],
    nextId: 0,
    spawn: 0,
    last: 0,
    lastHud: 0,
    shake: 0,
  });

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [hud, setHud] = useState({ score: 0, coins: 0, best: getBest() });
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const setGamePhase = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const spawnCoinParticles = (x: number, y: number) => {
    const colors = ['#ffd454', '#fff0a2', '#facc15', '#ffffff'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const speed = Math.random() * 90 + 50;
      gameRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: 0.5,
      });
    }
  };

  const spawnCrashParticles = (x: number, y: number) => {
    const colors = ['#e85b50', '#f4d358', '#ffffff', '#31304d'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 40;
      gameRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 3,
        alpha: 1,
        life: 0.7,
      });
    }
  };

  const start = useCallback(() => {
    soundManager.startMusic();
    Object.assign(gameRef.current, {
      lane: 0,
      currentLane: 0,
      jump: 0,
      slide: 0,
      score: 0,
      coins: 0,
      distance: 0,
      entities: [],
      particles: [],
      spawn: 0.4,
      last: 0,
      lastHud: 0,
      shake: 0,
    });
    setHud((current) => ({ ...current, score: 0, coins: 0 }));
    setGamePhase('playing');
  }, [setGamePhase]);

  const end = useCallback(() => {
    const game = gameRef.current;
    soundManager.playCrash();
    soundManager.stopMusic();
    game.shake = 18;
    const best = Math.max(getBest(), game.score);
    try {
      localStorage.setItem(SAVE_KEY, String(best));
    } catch {
      /* storage fallback */
    }
    setHud({ score: game.score, coins: game.coins, best });
    setGamePhase('over');
  }, [setGamePhase]);

  const control = useCallback(
    (move: 'left' | 'right' | 'jump' | 'slide') => {
      if (phaseRef.current !== 'playing') return;
      const game = gameRef.current;

      if (move === 'left') {
        game.lane = Math.max(-1, game.lane - 1) as Lane;
      } else if (move === 'right') {
        game.lane = Math.min(1, game.lane + 1) as Lane;
      } else if (move === 'jump') {
        if (game.jump <= 0.08) {
          game.slide = 0;
          game.jump = 0.72;
          soundManager.playJump();
        }
      } else if (move === 'slide') {
        game.jump = 0; // fast fall to slide
        game.slide = 0.62;
        soundManager.playRoll();
      }
    },
    []
  );

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Escape', 'Enter'].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        if (phaseRef.current === 'playing') {
          soundManager.stopMusic();
          setGamePhase('paused');
        } else if (phaseRef.current === 'paused') {
          soundManager.startMusic();
          setGamePhase('playing');
        }
      } else if (event.key === ' ' || event.key === 'Enter') {
        if (phaseRef.current === 'ready' || phaseRef.current === 'over') {
          start();
        } else if (phaseRef.current === 'paused') {
          soundManager.startMusic();
          setGamePhase('playing');
        } else if (phaseRef.current === 'playing') {
          control('jump');
        }
      } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        control('left');
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        control('right');
      } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        control('jump');
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        control('slide');
      }
    };

    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [control, setGamePhase, start]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round((rect.width || 800) * dpr);
      canvas.height = Math.round((rect.height || 600) * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 600;
      const game = gameRef.current;

      const horizon = height * 0.29;
      const floor = height * 0.91;

      // Safe perspective math function (never NaN)
      const projectY = (z: number) => {
        const p = Math.max(0, 1 - z);
        return horizon + Math.pow(p, 1.62) * (floor - horizon);
      };

      const laneX = (lane: number, z: number) => {
        const p = Math.max(0, 1 - z);
        return width / 2 + lane * width * (0.075 + p * 0.19);
      };

      // Screen Shake
      ctx.save();
      if (game.shake > 0) {
        const shakeX = (Math.random() - 0.5) * game.shake;
        const shakeY = (Math.random() - 0.5) * game.shake;
        ctx.translate(shakeX, shakeY);
      }

      // Sky Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#151830');
      sky.addColorStop(0.33, '#4c3869');
      sky.addColorStop(0.62, '#ce6e68');
      sky.addColorStop(1, '#f5b36a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // City Skyline with glowing windows
      ctx.fillStyle = '#17172b';
      for (let i = -1; i < 12; i++) {
        const x = (i * width) / 10 + Math.sin(i * 41) * 24;
        const building = 28 + (((i * 37) % 72) + 72) % 72;
        ctx.fillRect(x, horizon - building, width / 9, building);

        ctx.fillStyle = 'rgba(255,205,108,.42)';
        for (let win = 0; win < 3; win++) {
          ctx.fillRect(x + 10 + win * 16, horizon - building + 13, 6, 4);
        }
        ctx.fillStyle = '#17172b';
      }

      // Subway Track Floor
      ctx.fillStyle = '#20213b';
      ctx.beginPath();
      ctx.moveTo(width * 0.22, horizon);
      ctx.lineTo(width * 0.78, horizon);
      ctx.lineTo(width, floor);
      ctx.lineTo(0, floor);
      ctx.closePath();
      ctx.fill();

      // Steel Rails (4 lines separating 3 lanes)
      ctx.strokeStyle = '#b9b9c1';
      ctx.lineWidth = 2;
      [-1.5, -0.5, 0.5, 1.5].forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(width / 2 + line * width * 0.034, horizon);
        ctx.lineTo(width / 2 + line * width * 0.255, floor);
        ctx.stroke();
      });

      // Animated Wooden Ties / Sleepers moving with distance
      const tieOffset = (game.distance * 0.008) % 0.075;
      for (let z = 0.98 - tieOffset; z > 0; z -= 0.075) {
        const y = projectY(z);
        const p = Math.max(0, 1 - z);
        ctx.fillStyle = 'rgba(21,17,34,.74)';
        ctx.fillRect(
          width / 2 - 20 - p * width * 0.29,
          y,
          40 + p * width * 0.58,
          3 + p * 10
        );
      }

      // Neon Metro Station Signs
      ctx.fillStyle = Math.sin(time / 420) > -0.4 ? '#f7d64a' : '#d05a88';
      ctx.fillRect(width * 0.08, horizon + 14, 76, 10);
      ctx.fillStyle = '#17172b';
      ctx.font = '800 9px system-ui';
      ctx.fillText('MIDNIGHT LINE', width * 0.09, horizon + 22);

      ctx.fillStyle = '#91e4ef';
      ctx.fillRect(width * 0.81, horizon + 28, 55, 7);

      // Render Entities (Sort by z descending so far entities render behind near ones)
      const sortedEntities = [...game.entities].sort((a, b) => b.z - a.z);

      sortedEntities.forEach((entity) => {
        if (entity.z > 1.2 || entity.z < -0.2) return;
        const p = Math.max(0, 1 - entity.z);
        const x = laneX(entity.lane, entity.z);
        const y = projectY(entity.z);
        const size = Math.max(8, 10 + p * 62);

        if (entity.kind === 'coin') {
          ctx.save();
          ctx.translate(x, y - size * 0.72);
          ctx.rotate(time / 300 + entity.id);
          ctx.fillStyle = '#ffd454';
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.34, size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff0a2';
          ctx.lineWidth = Math.max(1, size * 0.06);
          ctx.stroke();
          ctx.restore();
        } else if (entity.kind === 'crate') {
          // Low Crate (Jump over)
          ctx.fillStyle = '#643b42';
          ctx.fillRect(x - size * 0.48, y - size * 0.86, size * 0.96, size * 0.86);
          ctx.strokeStyle = '#f3a04e';
          ctx.lineWidth = Math.max(1, size * 0.06);
          ctx.strokeRect(x - size * 0.48, y - size * 0.86, size * 0.96, size * 0.86);
          ctx.beginPath();
          ctx.moveTo(x - size * 0.42, y - size * 0.78);
          ctx.lineTo(x + size * 0.42, y - size * 0.1);
          ctx.moveTo(x + size * 0.42, y - size * 0.78);
          ctx.lineTo(x - size * 0.42, y - size * 0.1);
          ctx.stroke();
        } else if (entity.kind === 'barrier') {
          // High Barrier / Signal Bar (Slide under)
          ctx.fillStyle = '#e85b50';
          ctx.fillRect(x - size * 0.65, y - size * 0.55, size * 1.3, size * 0.55);
          ctx.fillStyle = '#f4d358';
          for (let stripe = -1; stripe < 2; stripe++) {
            ctx.fillRect(
              x + stripe * size * 0.42 - size * 0.12,
              y - size * 0.48,
              size * 0.2,
              size * 0.18
            );
          }
          // High Overhead clearance bar
          ctx.fillStyle = '#31304d';
          ctx.fillRect(x - size * 0.5, y - size * 0.82, size, size * 0.2);
        } else if (entity.kind === 'train') {
          // Subway train carriage
          const trainH = size * 1.2;
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(x - size * 0.5, y - trainH, size, trainH);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x - size * 0.45, y - trainH * 0.4, size * 0.9, trainH * 0.3);
          // Headlight glow
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - size * 0.25, y - trainH * 0.25, size * 0.1, 0, Math.PI * 2);
          ctx.arc(x + size * 0.25, y - trainH * 0.25, size * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Dynamic Sparkle Particles
      game.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Player Character Position with smooth lane lerp
      const playerX = laneX(game.currentLane, 0);
      const bob =
        game.jump > 0
          ? Math.sin((game.jump / 0.72) * Math.PI) * height * 0.22
          : Math.sin(time / 90) * 3;
      const sliding = game.slide > 0;

      // Player Blob Shadow on ground
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(playerX, floor - 10, 20 * (1 - bob / (height * 0.5)), 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Player Character
      ctx.save();
      ctx.translate(playerX, floor - 20 - bob);

      // Head Glow & Head
      ctx.shadowColor = '#ffcc65';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#f8cb62';
      ctx.beginPath();
      ctx.arc(0, sliding ? -15 : -37, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cap Visor
      ctx.fillStyle = '#ee4f72';
      ctx.fillRect(0, sliding ? -20 : -42, 10, 4);

      // Torso / Jacket
      ctx.fillStyle = '#1d2246';
      ctx.fillRect(-12, sliding ? -17 : -27, 24, sliding ? 12 : 28);

      // Legs / Running animation
      const legOffset = game.jump > 0 || sliding ? 0 : Math.sin(time / 45) * 6;
      ctx.fillStyle = '#ee4f72';
      ctx.fillRect(-14, sliding ? -10 : 0, 9, sliding ? 10 : 26 + legOffset);
      ctx.fillRect(5, sliding ? -10 : 0, 9, sliding ? 10 : 26 - legOffset);

      // Shoes / Sneakers
      ctx.fillStyle = '#fcf5df';
      ctx.fillRect(-17, sliding ? -4 : 24 + legOffset, 12, 5);
      ctx.fillRect(5, sliding ? -4 : 24 - legOffset, 12, 5);

      ctx.restore();
      ctx.restore(); // Restore shake

      // Game Loop Update
      if (phaseRef.current === 'playing') {
        const delta = Math.min(0.04, (time - (game.last || time)) / 1000);
        game.last = time;

        // Smooth Lane Interpolation (Lerp)
        game.currentLane += (game.lane - game.currentLane) * Math.min(1, delta * 16);

        // Fade Shake
        if (game.shake > 0) game.shake = Math.max(0, game.shake - delta * 30);

        // Speed ramps up with distance
        const speed = 0.22 + Math.min(0.18, game.distance / 16000);
        game.distance += delta * 100;
        game.score = Math.floor(game.distance * 10 + game.coins * 25);
        game.jump = Math.max(0, game.jump - delta);
        game.slide = Math.max(0, game.slide - delta);
        game.spawn -= delta;

        // Spawn Entities ahead
        if (game.spawn <= 0) {
          const lane = lanes[Math.floor(Math.random() * lanes.length)];
          const isCoin = Math.random() < 0.6;
          const kind: EntityKind = isCoin
            ? 'coin'
            : Math.random() < 0.5
            ? 'crate'
            : 'barrier';

          game.entities.push({ id: ++game.nextId, lane, z: 1.0, kind });

          // Spawn coin chains
          if (isCoin && Math.random() < 0.45) {
            game.entities.push({ id: ++game.nextId, lane, z: 1.15, kind: 'coin' });
          }

          game.spawn = isCoin ? 0.35 + Math.random() * 0.25 : 0.65 + Math.random() * 0.45;
        }

        // Move entities
        game.entities.forEach((entity) => {
          entity.z -= delta * speed;
        });

        // Check Collisions
        const survivors: Entity[] = [];
        for (const entity of game.entities) {
          // Check collision range near player
          const reachesPlayer =
            entity.z < 0.14 && entity.z > -0.08 && entity.lane === game.lane;

          if (entity.kind === 'coin' && reachesPlayer) {
            game.coins += 1;
            soundManager.playCoin();
            spawnCoinParticles(laneX(entity.lane, entity.z), projectY(entity.z));
            continue; // Collected!
          }

          if (entity.kind !== 'coin' && reachesPlayer) {
            const isSafe =
              entity.kind === 'crate' ? game.jump > 0.08 : game.slide > 0.06;
            if (!isSafe) {
              spawnCrashParticles(playerX, floor - 40);
              end();
              continue;
            }
          }

          if (entity.z > -0.2) survivors.push(entity);
        }
        game.entities = survivors;

        // Update Particles
        game.particles = game.particles
          .map((pt) => ({
            ...pt,
            x: pt.x + pt.vx * delta,
            y: pt.y + pt.vy * delta,
            alpha: pt.alpha - delta / pt.life,
          }))
          .filter((pt) => pt.alpha > 0);

        // Periodic HUD state sync
        if (time - game.lastHud > 80) {
          setHud((current) => ({
            ...current,
            score: game.score,
            coins: game.coins,
          }));
          game.lastHud = time;
        }
      } else {
        game.last = time;
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [end]);

  // Touch & Swipe Event Handlers
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const startPoint = touchStart.current;
    if (!startPoint) return;

    if (phaseRef.current !== 'playing') {
      start();
      touchStart.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - startPoint.x;
    const dy = touch.clientY - startPoint.y;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      control('jump');
    } else if (Math.abs(dx) > Math.abs(dy)) {
      control(dx > 0 ? 'right' : 'left');
    } else {
      control(dy < 0 ? 'jump' : 'slide');
    }
    touchStart.current = null;
  };

  return (
    <main className="game-shell">
      <section className="game-frame" aria-label="Midnight Line endless runner">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {/* Top HUD Bar */}
        <div className="topbar" aria-live="polite">
          <div className="brand">
            <span>ML</span>
            <div>
              MIDNIGHT
              <br />
              LINE
            </div>
          </div>

          <div className="score">
            <small>SCORE</small>
            <strong>{hud.score.toLocaleString()}</strong>
          </div>

          <div className="coin-count" aria-label={`${hud.coins} coins collected`}>
            ◉ <b>{hud.coins}</b>
          </div>

          {/* Sound Toggle Button */}
          <button
            className="pause sound-btn"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Pause Button */}
          {phase === 'playing' && (
            <button
              className="pause"
              onClick={() => {
                soundManager.stopMusic();
                setGamePhase('paused');
              }}
              aria-label="Pause game"
            >
              Ⅱ
            </button>
          )}
        </div>

        {/* Overlays for Ready / Paused / Over */}
        {phase !== 'playing' && (
          <div className="panel">
            {phase === 'ready' && (
              <>
                <p className="eyebrow">ENDLESS NIGHT RUN · 01</p>
                <h1>
                  MAKE THE
                  <br />
                  <em>LAST TRAIN.</em>
                </h1>
                <p className="intro">
                  Run the closing line. Dodge the crates (jump), slide under the signal bars (down/slide), and collect coins.
                </p>
              </>
            )}

            {phase === 'paused' && (
              <>
                <p className="eyebrow">THE CITY IS WAITING</p>
                <h1>
                  RUN
                  <br />
                  <em>PAUSED.</em>
                </h1>
              </>
            )}

            {phase === 'over' && (
              <>
                <p className="eyebrow">END OF THE LINE</p>
                <h1>
                  {hud.score.toLocaleString()}
                  <br />
                  <em>POINTS.</em>
                </h1>
                <p className="intro">
                  New route, new chance. Your best ride is {hud.best.toLocaleString()}.
                </p>
              </>
            )}

            <button
              className="start"
              onClick={
                phase === 'paused'
                  ? () => {
                      soundManager.startMusic();
                      setGamePhase('playing');
                    }
                  : start
              }
            >
              {phase === 'paused'
                ? 'KEEP RUNNING'
                : phase === 'over'
                ? 'RUN AGAIN'
                : 'START THE RUN'}{' '}
              <span>→</span>
            </button>

            {phase === 'ready' && (
              <div className="controls">
                <span>← / → or A / D: change track</span>
                <span>↑ or W / Space: jump</span>
                <span>↓ or S: slide</span>
              </div>
            )}
          </div>
        )}

        {/* Metro Route Info Footer */}
        <div className="route-label">
          <span>LAST SERVICE</span>
          <b>METRO 07</b>
          <i>∞</i>
        </div>
      </section>
    </main>
  );
}
