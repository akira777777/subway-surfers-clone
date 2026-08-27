export interface PlayerPhysics {
  position: [number, number, number]; // x, y, z
  velocityY: number;
  laneIndex: -1 | 0 | 1; // -1 (left), 0 (center), 1 (right)
}

export const PLAYER_CONFIG = {
  initialPosition: {
    position: [0, 0.5, 0],
    velocityY: 0,
    laneIndex: 0,
  },
  
  physics: {
    gravity: -30, // Сила гравитации
    jumpForce: 12, // Сила прыжка
    moveSpeedXZ: PLAYER_SPEED_BASE, // Скорость движения вперед
    laneSwitchCooldown: 0.25, // Задержка между сменой полосы (сек)
  },

  dimensions: {
    width: 0.8,
    height: 1.8,
    depth: 0.6,
  } as const,
};
