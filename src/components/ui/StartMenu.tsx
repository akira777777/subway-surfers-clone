import React, { useState } from 'react';
import { soundManager } from '../../game/audio';

interface StartMenuProps {
  highScore: number;
  totalCoins: number;
  onStartGame: () => void;
  onOpenShop: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  highScore,
  totalCoins,
  onStartGame,
  onOpenShop,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="overlay-menu-container">
      <div className="start-menu-card glass-panel">
        {/* Title Logo */}
        <h1 className="game-title">
          SUBWAY<br />
          <span className="gradient-text">RUNNER 3D</span>
        </h1>

        {/* Stats Summary */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">HIGH SCORE</span>
            <span className="stat-val text-amber">{highScore.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">TOTAL COINS</span>
            <span className="stat-val text-yellow">🪙 {totalCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="menu-action-stack">
          <button className="primary-btn pulse-glow" onClick={onStartGame}>
            ▶ PLAY NOW
          </button>
          <button className="secondary-btn" onClick={onOpenShop}>
            🛍️ SHOP & UPGRADES
          </button>
          <button className="outline-btn" onClick={() => setShowControls(true)}>
            🎮 HOW TO PLAY
          </button>
        </div>

        {/* Mute Toggle Footer */}
        <div className="menu-footer">
          <button className="icon-btn" onClick={handleToggleSound}>
            {isMuted ? '🔇 MUTED' : '🔊 SOUND ON'}
          </button>
        </div>
      </div>

      {/* Controls Guide Modal */}
      {showControls && (
        <div className="modal-backdrop" onClick={() => setShowControls(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🎮 CONTROLS & POWER-UPS</h2>
            <div className="controls-grid">
              <div className="control-item">
                <span className="key-badge">A / D</span> or <span className="key-badge">← / →</span>
                <span>Switch Lanes (Left / Right)</span>
              </div>
              <div className="control-item">
                <span className="key-badge">W</span> or <span className="key-badge">↑</span>
                <span>Jump over low barriers & trains</span>
              </div>
              <div className="control-item">
                <span className="key-badge">S</span> or <span className="key-badge">↓</span>
                <span>Roll / Duck under high barriers</span>
              </div>
              <div className="control-item">
                <span className="key-badge">SPACE</span>
                <span>Activate Hoverboard Shield!</span>
              </div>
              <div className="control-item">
                <span className="key-badge">SWIPE</span>
                <span>Touchscreen gestures on mobile</span>
              </div>
            </div>

            <div className="powerups-guide">
              <h3>POWER-UPS:</h3>
              <p>🧲 <b>MAGNET</b> - Attracts all nearby gold coins</p>
              <p>🚀 <b>JETPACK</b> - Fly high above tracks collecting coin streams</p>
              <p>✨ <b>2X MULTIPLIER</b> - Doubles score multiplier</p>
              <p>🛹 <b>HOVERBOARD</b> - Protects from 1 crash</p>
            </div>

            <button className="primary-btn full-width" onClick={() => setShowControls(false)}>
              GOT IT!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
