import React from 'react';
import { Hourglass, RotateCcw, BookOpen } from 'lucide-react';
import { LevelData } from '../../types/level';
import { isMainObject } from '../../game/GameState';

interface TimeUpScreenProps {
  level: LevelData;
  foundIds: string[];
  onReplay: () => void;
  onOpenIndex: () => void;
}

export const TimeUpScreen: React.FC<TimeUpScreenProps> = ({ level, foundIds, onReplay, onOpenIndex }) => {
  const main = level.objects.filter(isMainObject);
  const found = main.filter((o) => foundIds.includes(o.id)).length;

  return (
    <div className="timeup-overlay">
      <div className="timeup-card" role="dialog" aria-modal="true">
        <div className="timeup-icon">
          <Hourglass size={40} />
        </div>
        <div className="timeup-tag">HỒ SƠ CÒN DANG DỞ</div>
        <h2 className="timeup-title">Hết Giờ Điều Tra!</h2>
        <p className="timeup-text">
          Bạn đã tìm được <b>{found}</b> / {main.length} manh mối ở <b>{level.title}</b>. Những sinh vật
          ngụy trang vẫn đang chờ bạn quay lại soi kỹ hơn.
        </p>

        <div className="timeup-progress" aria-hidden="true">
          <div className="timeup-progress-fill" style={{ width: `${(found / Math.max(1, main.length)) * 100}%` }} />
        </div>

        <div className="timeup-actions">
          <button className="btn-secondary" onClick={onOpenIndex}>
            <BookOpen size={16} />
            <span>Mục Lục</span>
          </button>
          <button className="btn-primary" onClick={onReplay}>
            <RotateCcw size={17} />
            <span>Thử Lại Trang Này</span>
          </button>
        </div>
      </div>

      <style>{`
        .timeup-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(35, 30, 24, 0.68);
          backdrop-filter: blur(10px);
          padding: 16px;
          animation: fadeIn 0.4s ease forwards;
        }

        .timeup-card {
          width: 100%;
          max-width: 420px;
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 16px;
          padding: 28px 24px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 30px 60px rgba(0,0,0,0.35);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .timeup-icon {
          color: var(--crimson);
          margin-bottom: 6px;
          animation: hourglassFlip 2.4s ease-in-out infinite;
        }

        @keyframes hourglassFlip {
          0%, 70% { transform: rotate(0deg); }
          85%, 100% { transform: rotate(180deg); }
        }

        .timeup-tag {
          font-family: var(--sans);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--crimson);
        }

        .timeup-title {
          font-family: var(--display);
          font-size: 30px;
          font-weight: 400;
          margin: 4px 0 8px;
          color: var(--ink);
        }

        .timeup-text {
          margin: 0 0 14px;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--ink-soft);
        }

        .timeup-progress {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: rgba(43, 39, 33, 0.1);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .timeup-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #b3833b, #d8a85e);
        }

        .timeup-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }
      `}</style>
    </div>
  );
};
