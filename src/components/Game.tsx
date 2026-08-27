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

// Particle pools for object pooling optimization
interface PooledParticle {
  id: number;
  x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number;
}

const pooledParticles: Array<PooledParticle> = [];
let particleIdCounter = 0;

// Enhanced particle effects with multiple types and colors
function createCoinExplosion(x: number, y: number): void {
  const colors = ['#ffd454', '#fff0a2', '#facc15', '#ffffff'];
  
  for (let i = 0; i < Math.min(12, MAX_PARTICLES - pooledParticles.length); i++) {
    // Find next available particle slot or create new one
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
