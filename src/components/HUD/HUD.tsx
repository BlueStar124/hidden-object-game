import React from 'react';
import { Pause, HelpCircle, Flame, Volume2, VolumeX, Eye, EyeOff, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { LevelData } from '../../types/level';

interface HUDProps {
  level: LevelData;
  currentIndex: number;
  totalScenes: number;
  score: number;
  remainingTime: number;
  combo: number;
  comboTimer: number;
  hintsUsed: number;
  soundEnabled: boolean;
  debugMode: boolean;
  onOpenPlateSelector: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onToggleSound: () => void;
  onToggleDebug: () => void;
  onUseHint: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  currentIndex,
  totalScenes,
  score,
  remainingTime,
  combo,
  comboTimer,
  soundEnabled,
  debugMode,
  onOpenPlateSelector,
  onPrevScene,
  onNextScene,
  onToggleSound,
  onToggleDebug,
  onUseHint,
  onPause,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = remainingTime <= 30;

  return (
    <header className="hud-container">
      {/* Left: Case Info & Page Switcher */}
      <div className="hud-left">
        <div className="hud-top-meta">
          <div className="hud-case-tag">HỒ SƠ ĐIỀU TRA #CHƯƠNG {level.chapter}</div>
          <div className="hud-page-switcher">
            <button
              className="page-nav-arrow"
              onClick={onPrevScene}
              disabled={currentIndex <= 0}
              title="Lật về trang trước"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="plate-picker-trigger"
              onClick={onOpenPlateSelector}
              title="Xem toàn bộ 9 trang ký họa"
            >
              <BookOpen size={14} />
              <span>Trang {currentIndex + 1} / {totalScenes}</span>
              <span className="dropdown-caret">▾</span>
            </button>
            <button
              className="page-nav-arrow"
              onClick={onNextScene}
              disabled={currentIndex >= totalScenes - 1}
              title="Lật sang trang sau"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <h1 className="hud-title">{level.title}</h1>
        <div className="hud-subtitle">{level.subtitle}</div>
      </div>

      {/* Center: Timer */}
      <div className={`hud-timer ${isLowTime ? 'pulse-danger' : ''}`}>
        <div className="timer-label">THỜI GIAN CÒN LẠI</div>
        <div className="timer-display">{formatTime(remainingTime)}</div>
        <div className="timer-bar-track">
          <div
            className="timer-bar-fill"
            style={{ width: `${Math.min(100, (remainingTime / level.timeLimit) * 100)}%` }}
          />
        </div>
      </div>

      {/* Right: Score, Combo & Actions */}
      <div className="hud-right">
        {/* Combo Badge */}
        {combo > 1 && (
          <div className="combo-badge">
            <Flame className="combo-icon" size={18} />
            <span>COMBO ×{combo}</span>
            <div
              className="combo-timer-bar"
              style={{ width: `${(comboTimer / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Current Score */}
        <div className="score-box">
          <div className="score-label">ĐIỂM ĐIỀU TRA</div>
          <div className="score-value">{score.toLocaleString('vi-VN')}</div>
        </div>

        {/* Action Controls */}
        <div className="hud-actions">
          {/* Debug Inspector Toggle */}
          <button
            className={`hud-btn ${debugMode ? 'debug-active' : ''}`}
            onClick={onToggleDebug}
            title={debugMode ? 'Tắt chế độ xem tọa độ & hitbox' : 'Bật chế độ xem tọa độ & hitbox'}
            aria-label="Toggle Debug Inspector"
          >
            {debugMode ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="btn-text">Soát Tọa Độ</span>
          </button>

          <button
            className="hud-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            className="hud-btn hint-btn"
            onClick={onUseHint}
            title="Sử dụng gợi ý manh mối (Trừ điểm)"
            aria-label="Hint"
          >
            <HelpCircle size={18} />
            <span className="btn-text">Gợi Ý</span>
          </button>

          <button
            className="hud-btn"
            onClick={onPause}
            title="Tạm dừng"
            aria-label="Pause"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .hud-container {
          position: relative;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: linear-gradient(180deg, rgba(240,236,226,0.96) 0%, rgba(240,236,226,0.85) 60%, rgba(240,236,226,0) 100%);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--hairline);
        }

        .hud-left {
          display: flex;
          flex-direction: column;
        }

        .hud-top-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .hud-case-tag {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--earth);
          text-transform: uppercase;
        }

        .hud-page-switcher {
          display: inline-flex;
          align-items: center;
          background: rgba(220, 214, 200, 0.45);
          border: 1px solid var(--hairline);
          border-radius: 20px;
          padding: 2px 4px;
          gap: 2px;
        }

        .page-nav-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: none;
          background: transparent;
          color: var(--ink-faint);
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.15s ease;
        }

        .page-nav-arrow:hover:not(:disabled) {
          background: rgba(44, 40, 36, 0.1);
          color: var(--ink);
        }

        .page-nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .plate-picker-trigger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          background: transparent;
          border: none;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          color: var(--ink);
          cursor: pointer;
          border-radius: 12px;
          transition: background 0.15s ease;
        }

        .plate-picker-trigger:hover {
          background: rgba(44, 40, 36, 0.08);
        }

        .dropdown-caret {
          font-size: 10px;
          color: var(--earth);
        }

        .hud-title {
          margin: 0;
          font-family: var(--serif);
          font-size: 20px;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--ink);
          line-height: 1.2;
        }

        .hud-subtitle {
          font-family: var(--sans);
          font-size: 11px;
          color: var(--ink-faint);
          letter-spacing: 0.02em;
        }

        .hud-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 140px;
        }

        .timer-label {
          font-family: var(--sans);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--ink-faint);
          margin-bottom: 2px;
        }

        .timer-display {
          font-family: var(--serif);
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--ink);
          line-height: 1;
        }

        .timer-bar-track {
          width: 100%;
          height: 3px;
          background: rgba(44, 40, 36, 0.12);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }

        .timer-bar-fill {
          height: 100%;
          background: var(--earth);
          transition: width 0.3s linear;
        }

        .pulse-danger .timer-display {
          color: #dc2626;
          animation: pulseRed 1s infinite alternate;
        }

        .pulse-danger .timer-bar-fill {
          background: #dc2626;
        }

        @keyframes pulseRed {
          from { opacity: 0.7; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1.02); }
        }

        .hud-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .combo-badge {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #ffffff;
          border-radius: 20px;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
          overflow: hidden;
          animation: comboPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .combo-icon {
          animation: flameWiggle 0.6s infinite alternate;
        }

        .combo-timer-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.7);
          transition: width 0.2s linear;
        }

        @keyframes comboPop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes flameWiggle {
          from { transform: rotate(-8deg); }
          to { transform: rotate(8deg); }
        }

        .score-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .score-label {
          font-family: var(--sans);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--ink-faint);
        }

        .score-value {
          font-family: var(--serif);
          font-size: 24px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1;
        }

        .hud-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hud-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          color: var(--ink);
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hud-btn:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(44, 40, 36, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }

        .hud-btn.debug-active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .hud-btn.hint-btn {
          background: linear-gradient(135deg, rgba(160, 107, 71, 0.12), rgba(160, 107, 71, 0.22));
          border-color: rgba(160, 107, 71, 0.4);
          color: var(--earth);
        }

        .hud-btn.hint-btn:hover {
          background: linear-gradient(135deg, rgba(160, 107, 71, 0.2), rgba(160, 107, 71, 0.35));
        }

        @media (max-width: 768px) {
          .hud-container {
            padding: 8px 12px;
            flex-wrap: wrap;
            gap: 8px;
          }
          .hud-left {
            order: 1;
            flex: 1 1 auto;
            min-width: 140px;
          }
          .hud-top-meta {
            gap: 6px;
            flex-wrap: wrap;
          }
          .hud-case-tag {
            font-size: 9px;
          }
          .plate-picker-trigger {
            font-size: 10px;
            padding: 1px 6px;
          }
          .hud-title {
            font-size: 15px;
          }
          .hud-subtitle {
            display: none;
          }
          .hud-timer {
            order: 3;
            flex: 1 1 100%;
            min-width: 0;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            background: rgba(220, 214, 200, 0.5);
            padding: 3px 10px;
            border-radius: 8px;
          }
          .timer-label {
            margin-bottom: 0;
            font-size: 8px;
          }
          .timer-display {
            font-size: 16px;
          }
          .timer-bar-track {
            width: 70px;
            margin-top: 0;
          }
          .hud-right {
            order: 2;
            gap: 8px;
          }
          .score-box {
            align-items: flex-end;
          }
          .score-label {
            display: none;
          }
          .score-value {
            font-size: 16px;
          }
          .hud-actions {
            gap: 4px;
          }
          .hud-btn {
            padding: 6px 8px;
          }
          .btn-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
