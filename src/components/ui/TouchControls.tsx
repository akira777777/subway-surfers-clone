import React, { useEffect, useRef } from 'react';

interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onRoll: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onRoll,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal Swipe
        if (deltaX > minSwipeDistance) {
          onRight();
        } else if (deltaX < -minSwipeDistance) {
          onLeft();
        }
      } else {
        // Vertical Swipe
        if (deltaY < -minSwipeDistance) {
          onJump();
        } else if (deltaY > minSwipeDistance) {
          onRoll();
        }
      }
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onLeft, onRight, onJump, onRoll]);

  return (
    <div className="touch-controls-overlay">
      {/* On-screen touch D-Pad buttons */}
      <div className="dpad-container">
        <button className="dpad-btn jump" onClick={onJump} title="Jump">
          ▲
        </button>
        <div className="dpad-row">
          <button className="dpad-btn left" onClick={onLeft} title="Move Left">
            ◀
          </button>
          <button className="dpad-btn right" onClick={onRight} title="Move Right">
            ▶
          </button>
        </div>
        <button className="dpad-btn roll" onClick={onRoll} title="Roll">
          ▼
        </button>
      </div>
    </div>
  );
};
