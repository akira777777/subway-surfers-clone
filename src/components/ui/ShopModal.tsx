import React, { useState } from 'react';
import { GameStats, ShopItem } from '../../game/types';
import { saveGameStats } from '../../game/storage';

interface ShopModalProps {
  stats: GameStats;
  onUpdateStats: (newStats: GameStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  onUpdateStats,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'boards' | 'upgrades'>('skins');

  const skins: ShopItem[] = [
    {
      id: 'jake',
      name: 'Jake Classic',
      type: 'skin',
      price: 0,
      unlocked: true,
      icon: '🧢',
      color: '#3b82f6',
      description: 'The iconic subway runner hero in classic blue & red.',
    },
    {
      id: 'tricky',
      name: 'Tricky Pink',
      type: 'skin',
      price: 200,
      unlocked: stats.unlockedSkins.includes('tricky'),
      icon: '🎀',
      color: '#ec4899',
      description: 'Bold pink style with purple running shoes.',
    },
    {
      id: 'fresh',
      name: 'Fresh Retro',
      type: 'skin',
      price: 500,
      unlocked: stats.unlockedSkins.includes('fresh'),
      icon: '🕶️',
      color: '#22c55e',
      description: '80s retro neon green jacket & yellow visor.',
    },
    {
      id: 'cyber',
      name: 'Cyber Runner',
      type: 'skin',
      price: 1000,
      unlocked: stats.unlockedSkins.includes('cyber'),
      icon: '🤖',
      color: '#06b6d4',
      description: 'Futuristic metallic armor with glowing cyan energy.',
    },
  ];

  const boards: ShopItem[] = [
    {
      id: 'standard',
      name: 'Standard Board',
      type: 'board',
      price: 0,
      unlocked: true,
      icon: '🛹',
      color: '#ef4444',
      description: 'Reliable red hoverboard with dual thrusters.',
    },
    {
      id: 'flame',
      name: 'Flame Board',
      type: 'board',
      price: 150,
      unlocked: stats.unlockedBoards.includes('flame'),
      icon: '🔥',
      color: '#f97316',
      description: 'Fiery orange board with burning thruster trails.',
    },
    {
      id: 'neon',
      name: 'Neon Cyber',
      type: 'board',
      price: 400,
      unlocked: stats.unlockedBoards.includes('neon'),
      icon: '⚡',
      color: '#d946ef',
      description: 'Cyberpunk pink & cyan board with anti-grav glow.',
    },
    {
      id: 'star',
      name: 'Star Board',
      type: 'board',
      price: 800,
      unlocked: stats.unlockedBoards.includes('star'),
      icon: '⭐',
      color: '#eab308',
      description: 'Golden star hoverboard with maximum speed aesthetic.',
    },
  ];

  const upgrades = [
    {
      id: 'magnet_upgrade',
      name: 'Magnet Duration',
      key: 'magnet' as const,
      icon: '🧲',
      level: stats.upgrades.magnet,
      maxLevel: 5,
      cost: stats.upgrades.magnet * 150,
      description: 'Increases Magnet duration by +2s per level.',
    },
    {
      id: 'multiplier_upgrade',
      name: '2X Multiplier Duration',
      key: 'multiplier' as const,
      icon: '✨',
      level: stats.upgrades.multiplier,
      maxLevel: 5,
      cost: stats.upgrades.multiplier * 150,
      description: 'Increases 2X Multiplier duration by +2s per level.',
    },
    {
      id: 'jetpack_upgrade',
      name: 'Jetpack Duration',
      key: 'jetpack' as const,
      icon: '🚀',
      level: stats.upgrades.jetpack,
      maxLevel: 5,
      cost: stats.upgrades.jetpack * 200,
      description: 'Increases Jetpack flight duration by +2s per level.',
    },
  ];

  const handleBuySkin = (item: ShopItem) => {
    if (item.unlocked) {
      const updated = saveGameStats({ selectedSkin: item.id });
      onUpdateStats(updated);
    } else if (stats.totalCoins >= item.price) {
      const newUnlocked = [...stats.unlockedSkins, item.id];
      const newCoins = stats.totalCoins - item.price;
      const updated = saveGameStats({
        totalCoins: newCoins,
        unlockedSkins: newUnlocked,
        selectedSkin: item.id,
      });
      onUpdateStats(updated);
    }
  };

  const handleBuyBoard = (item: ShopItem) => {
    if (item.unlocked) {
      const updated = saveGameStats({ selectedBoard: item.id });
      onUpdateStats(updated);
    } else if (stats.totalCoins >= item.price) {
      const newUnlocked = [...stats.unlockedBoards, item.id];
      const newCoins = stats.totalCoins - item.price;
      const updated = saveGameStats({
        totalCoins: newCoins,
        unlockedBoards: newUnlocked,
        selectedBoard: item.id,
      });
      onUpdateStats(updated);
    }
  };

  const handleUpgradePowerup = (upgrade: typeof upgrades[0]) => {
    if (upgrade.level >= upgrade.maxLevel) return;
    if (stats.totalCoins >= upgrade.cost) {
      const newCoins = stats.totalCoins - upgrade.cost;
      const newUpgrades = {
        ...stats.upgrades,
        [upgrade.key]: upgrade.level + 1,
      };
      const updated = saveGameStats({
        totalCoins: newCoins,
        upgrades: newUpgrades,
      });
      onUpdateStats(updated);
    }
  };

  return (
    <div className="overlay-menu-container">
      <div className="shop-modal-card glass-panel">
        {/* Header */}
        <div className="shop-header">
          <h2>🛍️ SURFER SHOP</h2>
          <div className="hud-stat-pill gold">
            <span>🪙</span>
            <span>{stats.totalCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="shop-tabs">
          <button
            className={`tab-btn ${activeTab === 'skins' ? 'active' : ''}`}
            onClick={() => setActiveTab('skins')}
          >
            🧢 SKINS
          </button>
          <button
            className={`tab-btn ${activeTab === 'boards' ? 'active' : ''}`}
            onClick={() => setActiveTab('boards')}
          >
            🛹 BOARDS
          </button>
          <button
            className={`tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
            onClick={() => setActiveTab('upgrades')}
          >
            ⚡ UPGRADES
          </button>
        </div>

        {/* Content Panel */}
        <div className="shop-grid">
          {activeTab === 'skins' &&
            skins.map((item) => {
              const isSelected = stats.selectedSkin === item.id;
              return (
                <div key={item.id} className={`shop-item-card ${isSelected ? 'selected' : ''}`}>
                  <div className="item-icon-box" style={{ background: item.color }}>
                    <span className="icon">{item.icon}</span>
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                  </div>
                  <div className="item-action">
                    {isSelected ? (
                      <button className="badge-btn active" disabled>
                        EQUIPPED
                      </button>
                    ) : item.unlocked ? (
                      <button className="secondary-btn small" onClick={() => handleBuySkin(item)}>
                        EQUIP
                      </button>
                    ) : (
                      <button
                        className="primary-btn small"
                        disabled={stats.totalCoins < item.price}
                        onClick={() => handleBuySkin(item)}
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {activeTab === 'boards' &&
            boards.map((item) => {
              const isSelected = stats.selectedBoard === item.id;
              return (
                <div key={item.id} className={`shop-item-card ${isSelected ? 'selected' : ''}`}>
                  <div className="item-icon-box" style={{ background: item.color }}>
                    <span className="icon">{item.icon}</span>
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                  </div>
                  <div className="item-action">
                    {isSelected ? (
                      <button className="badge-btn active" disabled>
                        EQUIPPED
                      </button>
                    ) : item.unlocked ? (
                      <button className="secondary-btn small" onClick={() => handleBuyBoard(item)}>
                        EQUIP
                      </button>
                    ) : (
                      <button
                        className="primary-btn small"
                        disabled={stats.totalCoins < item.price}
                        onClick={() => handleBuyBoard(item)}
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {activeTab === 'upgrades' &&
            upgrades.map((upg) => {
              const isMax = upg.level >= upg.maxLevel;
              return (
                <div key={upg.id} className="shop-item-card">
                  <div className="item-icon-box" style={{ background: '#7c3aed' }}>
                    <span className="icon">{upg.icon}</span>
                  </div>
                  <div className="item-details">
                    <h4>
                      {upg.name} (LVL {upg.level}/{upg.maxLevel})
                    </h4>
                    <p>{upg.description}</p>
                  </div>
                  <div className="item-action">
                    {isMax ? (
                      <button className="badge-btn max" disabled>
                        MAXED
                      </button>
                    ) : (
                      <button
                        className="primary-btn small"
                        disabled={stats.totalCoins < upg.cost}
                        onClick={() => handleUpgradePowerup(upg)}
                      >
                        🪙 {upg.cost}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <button className="primary-btn full-width mt-4" onClick={onClose}>
          BACK TO MENU
        </button>
      </div>
    </div>
  );
};
