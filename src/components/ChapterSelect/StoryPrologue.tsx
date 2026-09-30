import React from 'react';
import { BookOpen, Search, Sparkles, Compass, Palette, Eye } from 'lucide-react';
import { ChapterData } from '../../types/level';

interface StoryPrologueProps {
  chapter: ChapterData;
  onStartGame: () => void;
}

export const StoryPrologue: React.FC<StoryPrologueProps> = ({
  chapter,
  onStartGame,
}) => {
  return (
    <div className="prologue-overlay">
      <div className="prologue-card">
        {/* Top Seal Stamp */}
        <div className="prologue-stamp">
          <Compass size={28} />
          <span>CASE FILE #{chapter.chapterNumber}</span>
        </div>

        <h1 className="prologue-title">{chapter.title}</h1>
        <div className="prologue-subtitle">{chapter.subtitle}</div>

        <div className="divider-line" />

        {/* Narrative Paragraphs */}
        <div className="narrative-body">
          {chapter.prologue.map((paragraph, index) => (
            <p key={index} className="narrative-p">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Instructions Briefing */}
        <div className="briefing-box">
          <div className="briefing-item">
            <Search size={18} className="briefing-icon" />
            <span>Rê kính lúp để soi từng nét vẽ màu nước độ phân giải cao.</span>
          </div>
          <div className="briefing-item">
            <Palette size={18} className="briefing-icon" />
            <span>
              Mọi thứ đều được ngụy trang: có con đổi màu theo nền, có vật viết bằng mực tàng hình
              chỉ hiện qua kính lúp, có con nhút nhát thỉnh thoảng mới ló ra.
            </span>
          </div>
          <div className="briefing-item">
            <Eye size={18} className="briefing-icon" />
            <span>Để ý những đôi mắt chớp chớp — dấu hiệu của sinh vật đang ẩn nấp!</span>
          </div>
          <div className="briefing-item">
            <Sparkles size={18} className="briefing-icon" />
            <span>Click khi phát hiện manh mối để thu thập điểm và mở trang mới!</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="start-investigation-btn" onClick={onStartGame}>
          <BookOpen size={20} />
          <span>Mở Cuốn Sổ & Bắt Đầu Điều Tra</span>
        </button>
      </div>

      <style>{`
        .prologue-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 26, 20, 0.72);
          backdrop-filter: blur(12px);
          padding: 16px;
        }

        .prologue-card {
          width: 100%;
          max-width: 520px;
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 16px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow:
            0 12px 36px rgba(0,0,0,0.3),
            0 32px 72px rgba(0,0,0,0.4);
          animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes popIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .prologue-stamp {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--earth);
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          border: 1.5px dashed var(--earth);
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .prologue-title {
          font-family: var(--display);
          font-size: 38px;
          font-weight: 400;
          margin: 0;
          color: var(--ink);
          line-height: 1.1;
        }

        .prologue-subtitle {
          font-size: 14px;
          color: var(--ink-soft);
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        .divider-line {
          width: 60%;
          height: 1px;
          background: var(--hairline);
          margin: 18px 0;
        }

        .narrative-body {
          text-align: justify;
          color: var(--ink);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .narrative-p {
          margin: 0 0 10px;
          text-indent: 1.5em;
        }

        .briefing-box {
          width: 100%;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid var(--hairline);
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          font-size: 13px;
          color: var(--ink-soft);
          margin-bottom: 24px;
        }

        .briefing-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .briefing-icon {
          color: var(--gold);
          flex-shrink: 0;
        }

        .start-investigation-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(180deg, #b3833b 0%, #9a6a3e 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: var(--sans);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(154, 106, 62, 0.4);
          transition: all 0.2s;
        }

        .start-investigation-btn:hover {
          background: linear-gradient(180deg, #c7954b 0%, #a97747 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(154, 106, 62, 0.5);
        }
      `}</style>
    </div>
  );
};
