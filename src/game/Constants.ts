export const LANE_WIDTH = 3; // Ширина полосы движения
export const PLAYER_SPEED_BASE = 15; // Базовая скорость игрока (по оси Z)
export const OBSTACLE_SPAWN_RATE = 2.0; // Интервал спавна препятствий в секундах

export interface GameState {
  isPlaying: boolean;
  score: number;
  distanceTraveled: number;
}

export const INITIAL_STATE: GameState = {
  isPlaying: false,
  score: 0,
  distanceTraveled: 0,
};
