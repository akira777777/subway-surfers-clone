import React from 'react';
import { PlayerState } from '../../game/types';

interface HUDProps {
  score: number;
  coins: number;
  multiplier: number;
  distance: number;
  playerState: PlayerState;
  onPause: () => void;
  onActivateHoverboard: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  coins,
  multiplier,
  distance,
  playerState,
  onPause,
  onActivateHoverboard,
}) => {
  const { magnet, multiplier: multTimer, jetpack, hoverboard } = playerState.activePowerups;

  return (
    <div className="hud-container">
      {/* Top Header Bar */}
      <div className="hud-header">
        {/* Score & Multiplier */}
        <div className="hud-score-box">
          <div className="hud-multiplier-badge">{multiplier}X</div>
          <div className="hud-score-text">{Math.floor(score).toLocaleString()}</div>
        </div>

        {/* Coins Counter */}
        <div className="hud-stat-pill gold">
          <span className="hud-icon">🪙</span>
          <span className="hud-value">{coins.toLocaleString()}</span>
        </div>

        {/* Distance Counter */}
        <div className="hud-stat-pill cyan">
          <span className="hud-icon">🏃</span>
          <span className="hud-value">{Math.floor(distance)}m</span>
        </div>

        {/* Pause Button */}
        <button className="hud-pause-btn" onClick={onPause} title="Pause Game (Esc/P)">
          ⏸
        </button>
      </div>

      {/* Active Power-Ups Gauge Bar */}
      <div className="hud-powerups-list">
        {magnet > 0 && (
          <div className="hud-powerup-bar magnet">
            <span className="hud-powerup-icon">🧲</span>
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill"
                style={{ width: `${(magnet / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {multTimer > 0 && (
          <div className="hud-powerup-bar multiplier">
            <span className="hud-powerup-icon">✨</span>
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill"
                style={{ width: `${(multTimer / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {jetpack > 0 && (
          <div className="hud-powerup-bar jetpack">
            <span className="hud-powerup-icon">🚀</span>
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill"
                style={{ width: `${(jetpack / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hoverboard Quick Trigger Button */}
      <button
        className={`hud-hoverboard-btn ${hoverboard ? 'active' : ''}`}
        onClick={onActivateHoverboard}
        title="Double-tap Space or click to activate Hoverboard!"
      >
        🛹 {hoverboard ? 'ACTIVE!' : 'BOARDS'}
      </button>
    </div>
  );
};
