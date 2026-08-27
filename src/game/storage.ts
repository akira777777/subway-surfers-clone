import { GameStats } from './types';

const STORAGE_KEY = 'subway_surfers_clone_save_v1';

export const DEFAULT_STATS: GameStats = {
  score: 0,
  coins: 0,
  multiplier: 1,
  distance: 0,
  highScore: 0,
  totalCoins: 0,
  unlockedSkins: ['jake'],
  unlockedBoards: ['standard'],
  selectedSkin: 'jake',
  selectedBoard: 'standard',
  upgrades: {
    magnet: 1,
    multiplier: 1,
    jetpack: 1,
  },
};

export function loadGameStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      upgrades: {
        ...DEFAULT_STATS.upgrades,
        ...(parsed.upgrades || {}),
      },
    };
  } catch (e) {
    console.error('Failed to load game stats:', e);
    return DEFAULT_STATS;
  }
}

export function saveGameStats(stats: Partial<GameStats>): GameStats {
  try {
    const current = loadGameStats();
    const updated: GameStats = {
      ...current,
      ...stats,
      upgrades: {
        ...current.upgrades,
        ...(stats.upgrades || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save game stats:', e);
    return DEFAULT_STATS;
  }
}
