export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

export type LaneIndex = -1 | 0 | 1;

export const LANE_X: Record<LaneIndex, number> = {
  [-1]: -3.2,
  [0]: 0,
  [1]: 3.2,
};

export const LANE_WIDTH = 3.2;
export const BASE_SPEED = 18;
export const MAX_SPEED = 38;
export const GRAVITY = -45;
export const JUMP_IMPULSE = 16;
export const ROLL_DURATION = 0.8;

export interface PlayerState {
  lane: LaneIndex;
  currentX: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isRolling: boolean;
  rollTimer: number;
  skin: string;
  board: string;
  activePowerups: {
    magnet: number; // seconds remaining
    multiplier: number; // seconds remaining
    jetpack: number; // seconds remaining
    hoverboard: boolean;
    hoverboardTimer: number;
  };
}

export type ObstacleType = 
  | 'train_low' 
  | 'train_tall' 
  | 'barrier_low' 
  | 'barrier_high'
  | 'moving_train';

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  lane: LaneIndex;
  z: number;
  depth?: number;
  speedZ?: number; // for moving trains
  duckable?: boolean;
  jumpable?: boolean;
}

export type CollectibleType = 'coin' | 'magnet' | 'multiplier' | 'jetpack' | 'hoverboard';

export interface CollectibleData {
  id: string;
  type: CollectibleType;
  lane: LaneIndex;
  z: number;
  y: number;
  collected?: boolean;
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'board' | 'upgrade';
  upgradeKey?: 'magnet' | 'multiplier' | 'jetpack';
  price: number;
  unlocked: boolean;
  level?: number;
  maxLevel?: number;
  icon: string;
  color: string;
  description: string;
}

export interface GameStats {
  score: number;
  coins: number;
  multiplier: number;
  distance: number;
  highScore: number;
  totalCoins: number;
  unlockedSkins: string[];
  unlockedBoards: string[];
  selectedSkin: string;
  selectedBoard: string;
  upgrades: {
    magnet: number; // level 1-5
    multiplier: number;
    jetpack: number;
  };
}
