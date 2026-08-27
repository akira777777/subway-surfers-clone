export const LANE_WIDTH = 3; // Ширина полосы движения
export const ROAD_WIDTH = 20; // Общая ширина дороги

// Типы препятствий и предметов
export type ObstacleType = 'train' | 'barrier' | 'debris';
export type CollectibleType = 'coin' | 'gem' | 'battery';

export interface Lane {
  id: number;
  xPosition: number; // X позиция центра полосы (-3, 0, 3)
}

// Позиции полос движения (визуальные границы и дорожки)
export const LANES = [
  { id: -1 as const, xPosition: -LANE_WIDTH },   // Левая полоса
  { id: 0 as const, xPosition: 0 },             // Центральная полоса
  { id: 1 as const, xPosition: LANE_WIDTH },    // Правая полоса
];

export interface RoadConfig {
  laneCount: number;        // Количество полос (3)
  totalWidth: number;       // Общая ширина дороги
}

// Настройки генерации уровня
export const LEVEL_CONFIG = {
  road: {
    width: ROAD_WIDTH,
    segmentsPerSection: 50,   // Длина одного сегмента дороги
    sectionLength: 100,        // Длина одной секции (для бесконечности)
  },

  obstacles: {
    spawnRate: OBSTACLE_SPAWN_RATE, // Частота спавна (секунды между препятствиями)
    initialSpawnDistance: 200,      // Начальное расстояние до первого препятствия
    types: ['train', 'barrier'] as const,
  },

  collectibles: {
    spawnRate: 4.0,        // Частота спавна предметов (секунды)
    initialSpawnDistance: 250,
    types: ['coin', 'gem'] as const,
  },
};
