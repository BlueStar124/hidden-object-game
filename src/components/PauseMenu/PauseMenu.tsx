import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, BookOpen, Home } from 'lucide-react';
import { LevelData } from '../../types/level';

interface PauseMenuProps {
  level: LevelData;
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  level,
  soundEnabled,
  onResume,
  onRestart,
  onToggleSound,
  onExit,
}) => {
  return (
    <div className="pause-overlay">
      <div className="pause-card">
        <div className="pause-tag">HỒ SƠ TẠM DỪNG</div>
        <h2 className="pause-title">TẠM DỪNG ĐIỀU TRA</h2>

        {/* Story recap box */}
        <div className="story-recap">
          <div className="recap-header">
            <BookOpen size={15} />
            <span>NHẮC LẠI MANH MỐI:</span>
          </div>
          <p className="recap-text">{level.storyClue}</p>
        </div>

        {/* Action Buttons */}
        <div className="pause-actions">
          <button className="pause-btn primary" onClick={onResume}>
            <Play size={18} />
            <span>Tiếp Tục Điều Tra</span>
          </button>

          <button className="pause-btn" onClick={onRestart}>
            <RotateCcw size={18} />
            <span>Khởi Động Lại Màn Này</span>
          </button>

          <button className="pause-btn" onClick={onToggleSound}>
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>Âm Thanh: {soundEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>

          <button className="pause-btn danger" onClick={onExit}>
            <Home size={18} />
            <span>Về Màn Hình Chính</span>
          </button>
        </div>
      </div>

      <style>{`
        .pause-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(35, 30, 24, 0.6);
          backdrop-filter: blur(8px);
          padding: 16px;
        }

        .pause-card {
          width: 100%;
          max-width: 400px;
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        .pause-tag {
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--ink-faint);
          text-transform: uppercase;
        }

        .pause-title {
          font-family: var(--display);
          font-size: 28px;
          font-weight: 400;
          color: var(--ink);
          margin: 4px 0 16px;
        }

        .story-recap {
          width: 100%;
          background: #fff;
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          text-align: left;
        }

        .recap-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          color: var(--earth);
          margin-bottom: 6px;
        }

        .recap-text {
          margin: 0;
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.45;
          font-style: italic;
        }

        .pause-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pause-btn {
          width: 100%;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--paper);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          color: var(--ink);
          font-family: var(--sans);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pause-btn:hover {
          background: #fff;
          border-color: rgba(43,39,33,0.3);
        }

        .pause-btn.primary {
          background: linear-gradient(180deg, #b3833b 0%, #9a6a3e 100%);
          color: #fff;
          border: none;
          box-shadow: 0 2px 8px rgba(154, 106, 62, 0.3);
        }

        .pause-btn.primary:hover {
          background: linear-gradient(180deg, #c7954b 0%, #a97747 100%);
        }

        .pause-btn.danger {
          color: var(--crimson);
        }
      `}</style>
    </div>
  );
};
