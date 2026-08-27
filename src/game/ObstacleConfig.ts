export interface Obstacle {
  id: string;
  type: 'train' | 'barrier' | 'debris'; // Тип препятствия
  position: [number, number, number]; // x, y, z (позиция в мировых координатах)
  rotation?: THREE.Euler; // Вращение для некоторых типов
}

export interface ObstacleConfig {
  type: 'train' | 'barrier';
  width: number;
  height: number;
  depth: number;
  color: string;
}

// Конфигурация каждого типа препятствия
export const OBSTACLE_CONFIGS = {
  train: {
    type: 'train',
    width: 2.5,   // Ширина по X (широкий поезд)
    height: 6,     // Высота
    depth: 30,    // Длина по Z
    color: '#e74c3c', // Красный поезд
  },

  barrier: {
    type: 'barrier',
    width: LANE_WIDTH - 1.5,   // Ширина чуть меньше полосы (чтобы можно было пройти)
    height: 2,     // Высота барьера
    depth: 0.8,    // Небольшая глубина
    color: '#f39c12', // Оранжевый барьер
  },

  debris: {
    type: 'debris',
    width: LANE_WIDTH - 0.5,   // Различные размеры мусора
    height: Math.random() * 1 + 0.5, // Случайная высота от 0.5 до 1.5
    depth: LANE_WIDTH / 2,      // Размер по Z
    color: '#95a5a6', // Серый мусор
  },
};

// Визуальные эффекты для каждого типа препятствия
export const OBSTACLE_VISUALS = {
  train: [
    'engine-front',   // Лобовое стекло и фары
    'carriage-body',  // Корпус вагона
    'roof-ventilation', // Вентиляция на крыше
  ],

  barrier: ['warning-sign', 'base-poles'],

  debris: [
    'metal-scrap',     // Металлический мусор
    'wood-plank',      // Деревянная доска
    'plastic-piece',   // Пластиковый кусок
  ],
};
