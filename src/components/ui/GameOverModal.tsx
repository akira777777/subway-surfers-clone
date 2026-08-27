import React from 'react';

interface GameOverModalProps {
  score: number;
  coinsEarned: number;
  distance: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onOpenShop: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  coinsEarned,
  distance,
  highScore,
  isNewHighScore,
  onRestart,
  onOpenShop,
  onMenu,
}) => {
  return (
    <div className="overlay-menu-container">
      <div className="game-over-card glass-panel animated-bounce">
        {/* Header */}
        <h1 className="game-over-title">CRASHED!</h1>

        {isNewHighScore && (
          <div className="new-record-banner">
            🎉 NEW HIGH SCORE! 🎉
          </div>
        )}

        {/* Score Breakdown */}
        <div className="game-over-stats">
          <div className="stat-box-large">
            <span className="label">FINAL SCORE</span>
            <span className="val text-amber">{Math.floor(score).toLocaleString()}</span>
          </div>

          <div className="stat-grid-2">
            <div className="stat-box-small">
              <span className="label">COINS EARNED</span>
              <span className="val text-yellow">🪙 +{coinsEarned}</span>
            </div>
            <div className="stat-box-small">
              <span className="label">DISTANCE</span>
              <span className="val text-cyan">🏃 {Math.floor(distance)}m</span>
            </div>
          </div>

          <div className="best-score-row">
            <span>BEST RECORD:</span>
            <strong>{highScore.toLocaleString()}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="menu-action-stack">
          <button className="primary-btn pulse-glow" onClick={onRestart}>
            🔄 PLAY AGAIN
          </button>
          <button className="secondary-btn" onClick={onOpenShop}>
            🛍️ SHOP & UPGRADES
          </button>
          <button className="outline-btn" onClick={onMenu}>
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
