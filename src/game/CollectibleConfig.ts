export interface Collectible {
  id: string;
  type: 'coin' | 'gem'; // Тип предмета для сбора
  position: [number, number, number]; // x, y, z в мировых координатах
}

// Настройки каждого типа сборного предмета
export const COLLECTIBLE_CONFIGS = {
  coin: {
    type: 'coin',
    radius: 0.8,   // Радиус монетки
    height: 0.3,   // Высота (толщина)
    color: '#f1c40f', // Золотой цвет как у монет в Subway Surfers
    value: 50,     // Очки за сбор (монетка)
  },

  gem: {
    type: 'gem',
    radius: 0.6,   // Радиал кристалла
    height: 1,      // Высота (кристалл высокий)
    color: '#9b59b6', // Фиолетовый цвет как у драгоценных камней
    value: 200,     // Очки за сбор (кристалл ценнее монетки)
  },
};

// Визуальные эффекты для каждого типа предмета
export const COLLECTIBLE_VISUALS = {
  coin: [
    'coin-base',   // Основание монеты
    'coin-ring',   // Кольцо вокруг (золотой блеск)
    'coin-face-up', // Лицевая сторона с узором
    'coin-face-down', // Обратная сторона
  ],

  gem: [
    'gem-base',    // Основание кристалла
    'gem-main-facet', // Главная грань (свечение)
    'gem-side-facets', // Боковые грани
  ],
};

// Звуковые эффекты для каждого типа предмета
export const COLLECTIBLE_SOUNDS = {
  coin: [
    'pickup-coin',   // Звук подбора монеты
  ],

  gem: [
    'pickup-gem',     // Более громкий звук для кристалла
  ],
};
