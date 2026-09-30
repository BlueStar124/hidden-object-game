import React from 'react';
import { Star, ArrowRight, RotateCcw, Trophy, Sparkles, PawPrint, ScanSearch, Moon } from 'lucide-react';
import { LevelData } from '../../types/level';
import { ObjectSprite } from '../Sprites/ObjectSprite';

interface VictoryScreenProps {
  level: LevelData;
  score: number;
  stars: number;
  timeBonus: number;
  timeTaken: number;
  mistakes: number;
  hintsUsed: number;
  isSecretFound: boolean;
  foundIds: string[];
  hasNextScene: boolean;
  nightUnlocked?: string; // Title of the night page this victory just unlocked
  onNextScene: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  level,
  score,
  stars,
  timeBonus,
  timeTaken,
  mistakes,
  hintsUsed,
  isSecretFound,
  foundIds,
  hasNextScene,
  nightUnlocked,
  onNextScene,
  onReplay,
  onExplore,
}) => {
  const critters = level.objects.filter((o) => o.isBonus);
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const leftovers = level.objects.filter((o) => (o.isBonus || o.isSecret) && !foundIds.includes(o.id)).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="victory-overlay">
      <div className="victory-card" role="dialog" aria-modal="true">
        <div className="victory-scroll">
        {/* Header Icon */}
        <div className="victory-trophy">
          <Trophy size={42} />
        </div>

        <div className="victory-tag">HỒ SƠ KHÉP LẠI</div>
        <h2 className="victory-title">ĐÃ PHÁ GIẢI MANH MỐI!</h2>
        <div className="victory-level-name">{level.title}</div>

        {/* 3 Stars Animation */}
        <div className="stars-row">
          {[1, 2, 3].map((starIndex) => (
            <div
              key={starIndex}
              className={`star-wrapper ${starIndex <= stars ? 'active' : 'inactive'}`}
              style={{ animationDelay: `${starIndex * 0.25}s` }}
            >
              <Star size={36} fill={starIndex <= stars ? '#eab308' : 'none'} />
            </div>
          ))}
        </div>

        {/* Secret Discovered Badge */}
        {isSecretFound && (
          <div className="secret-found-banner">
            <Sparkles size={16} />
            <span>PHÁT HIỆN CỔ VẬT BÍ MẬT! (+300 ĐIỂM)</span>
          </div>
        )}

        {/* Hidden critters spotted on this page */}
        {critters.length > 0 && (
          <div className={`critter-summary ${crittersFound === critters.length ? 'complete' : ''}`}>
            <div className="critter-summary-head">
              <PawPrint size={14} />
              <span>
                SINH VẬT ẨN NẤP: {crittersFound}/{critters.length}
              </span>
            </div>
            <div className="critter-summary-row">
              {critters.map((o) => {
                const isFound = foundIds.includes(o.id);
                return (
                  <div key={o.id} className="critter-summary-item" title={isFound ? o.name : '???'}>
                    <ObjectSprite
                      type={o.spriteType}
                      isFound={isFound}
                      className={isFound ? '' : 'sprite-silhouette'}
                    />
                    <span>{isFound ? o.name : '???'}</span>
                  </div>
                );
              })}
            </div>
            {crittersFound < critters.length && (
              <div className="critter-summary-note">
                Vẫn còn sinh vật nấp trong tranh — bấm “Soi Tiếp” để tìm nốt cho Sổ Tay!
              </div>
            )}
          </div>
        )}

        {/* A night page just opened up */}
        {nightUnlocked && (
          <div className="night-unlocked-banner">
            <Moon size={15} />
            <span>Đã mở khóa trang đêm: <b>{nightUnlocked}</b></span>
          </div>
        )}

        {/* Score Breakdown Table */}
        <div className="stats-grid">
          <div className="stat-row">
            <span>Thời gian hoàn thành:</span>
            <b>{formatTime(timeTaken)}</b>
          </div>
          <div className="stat-row">
            <span>Thưởng thời gian:</span>
            <b className="positive">+{timeBonus}</b>
          </div>
          <div className="stat-row">
            <span>Số lần click nhầm:</span>
            <b className={mistakes > 0 ? 'negative' : ''}>{mistakes}</b>
          </div>
          <div className="stat-row">
            <span>Gợi ý đã dùng:</span>
            <b>{hintsUsed}</b>
          </div>
          <div className="stat-divider" />
          <div className="stat-row total">
            <span>TỔNG ĐIỂM ĐIỀU TRA:</span>
            <b className="total-score">{score.toLocaleString('vi-VN')}</b>
          </div>
        </div>
        </div>

        {/* Actions stay pinned under the scrollable summary, always reachable on small phones */}
        <div className="victory-footer">
        {/* Keep hunting the leftovers (album only, no score) */}
        {leftovers > 0 && (
          <button className="explore-btn" onClick={onExplore}>
            <ScanSearch size={17} />
            <span>Soi Tiếp Tìm Nốt {leftovers} Vật Ẩn</span>
          </button>
        )}

        {/* Buttons */}
        <div className="victory-actions">
          <button className="btn-secondary" onClick={onReplay}>
            <RotateCcw size={16} />
            <span>Chơi Lại</span>
          </button>

          {hasNextScene ? (
            <button className="btn-primary" onClick={onNextScene}>
              <span>Lật Trang Mới</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn-primary" onClick={onNextScene}>
              <span>Hoàn Thành Vụ Án</span>
              <Trophy size={18} />
            </button>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .victory-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(35, 30, 24, 0.65);
          backdrop-filter: blur(10px);
          padding: 16px;
          animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .victory-card {
          width: 100%;
          max-width: 440px;
          max-height: calc(100vh - 32px);
          max-height: calc(100dvh - 32px);
          overflow: hidden;
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 10px 30px rgba(0,0,0,0.25),
            0 30px 60px rgba(0,0,0,0.35);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .victory-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 28px 24px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .victory-footer {
          flex-shrink: 0;
          padding: 10px 24px 20px;
        }

        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .victory-trophy {
          color: var(--gold);
          margin-bottom: 8px;
          animation: float 2.5s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .victory-tag {
          font-family: var(--sans);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--gold);
          text-transform: uppercase;
        }

        .victory-title {
          font-family: var(--display);
          font-size: 32px;
          font-weight: 400;
          margin: 4px 0 2px;
          color: var(--ink);
          line-height: 1.1;
        }

        .victory-level-name {
          font-size: 13.5px;
          color: var(--ink-soft);
          margin-bottom: 16px;
        }

        .stars-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .star-wrapper {
          transform: scale(0);
          animation: starPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .star-wrapper.active {
          color: #eab308;
          filter: drop-shadow(0 2px 8px rgba(234, 179, 8, 0.45));
        }

        .star-wrapper.inactive {
          color: rgba(43,39,33,0.2);
        }

        @keyframes starPop {
          to { transform: scale(1); }
        }

        .secret-found-banner {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef08a;
          color: #854d0e;
          border: 1px solid #facc15;
          border-radius: 999px;
          padding: 4px 14px;
          font-family: var(--sans);
          font-size: 11.5px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .critter-summary {
          width: 100%;
          background: rgba(45, 122, 79, 0.06);
          border: 1px dashed rgba(45, 122, 79, 0.3);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
        }

        .critter-summary.complete {
          background: #f0fdf4;
          border-style: solid;
          border-color: #86efac;
        }

        .critter-summary-head {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--emerald);
          margin-bottom: 8px;
        }

        .critter-summary-row {
          display: flex;
          justify-content: center;
          gap: 14px;
        }

        .critter-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: var(--ink-soft);
          max-width: 96px;
          text-align: center;
          line-height: 1.2;
        }

        .critter-summary-item .object-sprite-container {
          width: 34px;
          height: 34px;
        }

        .critter-summary-note {
          margin-top: 8px;
          font-size: 11.5px;
          font-style: italic;
          color: var(--ink-soft);
        }

        .stats-grid {
          width: 100%;
          background: #fff;
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          color: var(--ink-soft);
        }

        .stat-row b {
          color: var(--ink);
        }

        .stat-row b.positive {
          color: var(--emerald);
        }

        .stat-row b.negative {
          color: var(--crimson);
        }

        .stat-divider {
          height: 1px;
          background: var(--hairline);
          margin: 4px 0;
        }

        .stat-row.total {
          font-family: var(--sans);
          font-weight: 700;
          color: var(--ink);
          font-size: 13.5px;
        }

        .total-score {
          font-family: var(--display);
          font-size: 22px;
          color: var(--earth) !important;
        }

        .victory-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .explore-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          margin-bottom: 10px;
          border: 1.5px dashed rgba(45, 122, 79, 0.55);
          border-radius: 10px;
          background: rgba(45, 122, 79, 0.08);
          color: var(--emerald);
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .explore-btn:hover {
          background: rgba(45, 122, 79, 0.15);
        }

        .night-unlocked-banner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          margin-bottom: 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1b2440, #28325a);
          color: #f4ecd0;
          font-size: 12.5px;
        }

        @media (max-width: 480px), (max-height: 700px) {
          .victory-scroll { padding: 18px 16px 4px; }
          .victory-footer { padding: 8px 16px 14px; }
          .victory-trophy svg { width: 32px; height: 32px; }
          .victory-title { font-size: 25px; }
          .stars-row { margin-bottom: 10px; }
          .stats-grid { padding: 10px 12px; margin-bottom: 12px; gap: 6px; font-size: 12.5px; }
          .critter-summary { margin-bottom: 10px; }
        }
      `}</style>
    </div>
  );
};
