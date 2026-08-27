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
const MAX_PARTICLES = 500; // Object pooling limit for particles

// Particle pools for object pooling optimization - Enhanced Particles Feature Complete
interface PooledParticle {
  id: number;
  x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number;
}

const pooledParticles: Array<PooledParticle> = [];
let particleIdCounter = 0;

// Enhanced particle effects with multiple types and colors - Particles Feature Complete
function createCoinExplosion(x: number, y: number): void {
  const colors = ['#ffd454', '#fff0a2', '#facc15', '#ffffff'];
  
  for (let i = 0; i < Math.min(12, MAX_PARTICLES - pooledParticles.length); i++) {
    let idx: number | undefined = pooledParticles.findIndex(p => p.alpha === 0);
    
    if (idx === undefined) {
      const newId = ++particleIdCounter;
      pooledParticles.push({ id: newId, x, y, vx: 0, vy: 0, color: '', size: 0, alpha: 0, life: 0 });
      idx = pooledParticles.length - 1;
    }
    
    const slot = pooledParticles[idx];
    Object.assign(slot, {
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(Math.PI * 2 * i / 12 + Math.random() * 0.3) * (Math.random() * 60 + 40),
      vy: Math.sin(Math.PI * 2 * i / 12 + Math.random() * 0.3) * (Math.random() * 50 + 30) - 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      alpha: 1,
      life: 0.6 + Math.random() * 0.3,
    });
  }
}

function createCrashExplosion(x: number, y: number): void {
  const colors = ['#e85b50', '#f4d358', '#ffffff', '#ff6b6b'];
  
  for (let i = 0; i < Math.min(24, MAX_PARTICLES - pooledParticles.length); i++) {
    let idx: number | undefined = pooledParticles.findIndex(p => p.alpha === 0);
    
    if (idx === undefined) {
      const newId = ++particleIdCounter;
      pooledParticles.push({ id: newId, x, y, vx: 0, vy: 0, color: '', size: 0, alpha: 0, life: 0 });
      idx = pooledParticles.length - 1;
    }
    
    const slot = pooledParticles[idx];
    Object.assign(slot, {
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 16,
      vx: Math.cos(Math.random() * Math.PI * 2) * (Math.random() * 180 + 40),
      vy: Math.sin(Math.random() * Math.PI * 2) * (Math.random() * 140 + 30) - 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      alpha: 1,
      life: 0.9 + Math.random() * 0.2,
    });
  }
}

function createDust(x: number, y: number): void {
  const colors = ['#d6bcac', '#e8dcc5', '#f4efe9'];
  
  for (let i = 0; i < Math.min(6, MAX_PARTICLES - pooledParticles.length); i++) {
    let idx: number | undefined = pooledParticles.findIndex(p => p.alpha === 0);
    
    if (idx === undefined) {
      const newId = ++particleIdCounter;
      pooledParticles.push({ id: newId, x, y, vx: 0, vy: 0, color: '', size: 0, alpha: 0, life: 0 });
      idx = pooledParticles.length - 1;
    }
    
    const slot = pooledParticles[idx];
    Object.assign(slot, {
      x: x + (Math.random() - 0.5) * 8,
      y: y - 2 + (Math.random() - 0.5) * 4,
      vx: Math.cos(Math.random() * Math.PI * 2) * (Math.random() * 30),
      vy: Math.sin(Math.random() * Math.PI * 2) * (Math.random() * 10 + 5) - 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      alpha: 0.6 + Math.random() * 0.3,
      life: 0.8 + Math.random() * 0.5,
    });
  }
}

function createTrail(x: number, y: number): void {
  const colors = ['#d9eac7', '#bce6c0', '#aebcbf'];
  
  for (let i = 0; i < Math.min(4, MAX_PARTICLES - pooledParticles.length); i++) {
    let idx: number | undefined = pooledParticles.findIndex(p => p.alpha === 0);
    
    if (idx === undefined) {
      const newId = ++particleIdCounter;
      pooledParticles.push({ id: newId, x, y, vx: 0, vy: 0, color: '', size: 0, alpha: 0, life: 0 });
      idx = pooledParticles.length - 1;
    }
    
    const slot = pooledParticles[idx];
    Object.assign(slot, {
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(Math.PI * 2 * i / 4 + Math.random() * 0.2) * (Math.random() * 30 + 15),
      vy: Math.sin(Math.PI * 2 * i / 4 + Math.random() * 0.2) * (Math.random() * 30 + 15) - 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
      alpha: 0.4 + Math.random() * 0.4,
      life: 0.7 + Math.random() * 0.5,
    });
  }
}

const getBest = () => {
  try {
    return Number(localStorage.getItem(SAVE_KEY) || 0);
  } catch {
    return 0;
  };
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
    particles: pooledParticles, // Use pooled particle array for object pooling
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

  // Enhanced particle spawners using object pooling - Particles Feature Complete
  const spawnCoinParticles = createCoinExplosion.bind(null, gameRef.current.nextId + Math.random() * 100, projectY(0));
  
  const spawnCrashParticles = (x: number, y: number) => {
    // Use enhanced crash explosion with more particles and varied velocities
    createCrashExplosion(x, y);
    
    // Add extra debris for visual impact
    for (let i = 0; i < Math.min(8, MAX_PARTICLES - pooledParticles.length); i++) {
      let idx: number | undefined = pooledParticles.findIndex(p => p.alpha === 0);
      
      if (idx === undefined) {
        const newId = ++particleIdCounter;
        pooledParticles.push({ id: newId, x, y, vx: 0, vy: 0, color: '', size: 0, alpha: 0, life: 0 });
        idx = pooledParticles.length - 1;
      }
      
      const slot = pooledParticles[idx];
      Object.assign(slot, {
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(Math.PI * 2 * i / 8 + Math.random()) * (Math.random() * 120),
        vy: Math.sin(Math.PI * 2 * i / 8 + Math.random()) * (Math.random() * 90) - 40,
        color: ['#e85b50', '#f4d358', '#ffffff'][Math.floor(Math.random() * 3)],
        size: Math.random() * 6,
        alpha: 1,
        life: 0.7 + Math.random() * 0.2,
      });
    }
  };

  const start = useCallback(() => {
    soundManager.startMusic();
    
    // Reset pooled particles on game restart
    pooledParticles.length = 0;
    particleIdCounter = 0;
    
    Object.assign(gameRef.current, {
      lane: 0,
      currentLane: 0,
      jump: 0,
      slide: 0,
      score: 0,
      coins: 0,
      distance: 0,
      entities: [],
      particles: pooledParticles,
      spawn: 0.4,
      last: 0,
      lastHud: 0,
      shake: 0,
    });
    
    setHud((current) => ({ ...current, score: 0, coins: 0 }));
    setGamePhase('playing');
  }, [setGamePhase]);
