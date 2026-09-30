import React from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Compass,
  Palette,
  Eye,
  Moon,
  Flashlight,
  Footprints,
  type LucideIcon,
} from 'lucide-react';
import { ChapterData, LevelData } from '../../types/level';

interface BriefingItem {
  icon: LucideIcon;
  text: string;
}

const DAY_BRIEFING: BriefingItem[] = [
  { icon: Search, text: 'Rê kính lúp để soi từng nét vẽ màu nước độ phân giải cao.' },
  {
    icon: Palette,
    text: 'Mọi thứ đều được ngụy trang: có con đổi màu theo nền, có vật viết bằng mực tàng hình chỉ hiện qua kính lúp, có con nhút nhát thỉnh thoảng mới ló ra.',
  },
  { icon: Footprints, text: 'Có sinh vật không chịu đứng yên — canh đúng lúc nó đi ngang qua để bắt.' },
  { icon: Eye, text: 'Để ý những đôi mắt chớp chớp — dấu hiệu của sinh vật đang ẩn nấp!' },
  { icon: Sparkles, text: 'Click khi phát hiện manh mối để thu thập điểm và mở trang mới!' },
];

const NIGHT_BRIEFING: BriefingItem[] = [
  { icon: Flashlight, text: 'Kính lúp giờ là đèn pin — chỉ vùng quanh kính mới được soi sáng.' },
  { icon: Eye, text: 'Trong bóng tối, mắt của các con vật phát sáng lấp lánh. Hãy lần theo chúng!' },
  { icon: Sparkles, text: 'Đom đóm và những kẻ lang thang luôn di chuyển — rọi đèn và bắt đúng lúc.' },
];

interface StoryPrologueProps {
  chapter: ChapterData;
  nightLevel?: LevelData; // When set: the intro card for that page's night variant
  onStartGame: () => void;
}

export const StoryPrologue: React.FC<StoryPrologueProps> = ({ chapter, nightLevel, onStartGame }) => {
  const night = !!nightLevel;
  const briefing = night ? NIGHT_BRIEFING : DAY_BRIEFING;
  const paragraphs = night ? [nightLevel!.storyClue] : chapter.prologue;

  return (
    <div className={`prologue-overlay ${night ? 'night' : ''}`}>
      <div className="prologue-card" role="dialog" aria-modal="true">
        <div className="prologue-scroll">
          {/* Top Seal Stamp */}
          <div className="prologue-stamp">
            {night ? <Moon size={22} /> : <Compass size={24} />}
            <span>{night ? 'ĐÊM XUỐNG' : `CASE FILE #${chapter.chapterNumber}`}</span>
          </div>

          <h1 className="prologue-title">{night ? nightLevel!.title : chapter.title}</h1>
          <div className="prologue-subtitle">{night ? nightLevel!.subtitle : chapter.subtitle}</div>

          <div className="divider-line" />

          {/* Narrative Paragraphs */}
          <div className="narrative-body">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="narrative-p">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Instructions Briefing */}
          <div className="briefing-box">
            {briefing.map(({ icon: Icon, text }) => (
              <div key={text} className="briefing-item">
                <Icon size={18} className="briefing-icon" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button — outside the scroll area so it is always reachable */}
        <div className="prologue-footer">
          <button className="start-investigation-btn" onClick={onStartGame}>
            {night ? <Flashlight size={20} /> : <BookOpen size={20} />}
            <span>{night ? 'Bật Đèn Pin & Bắt Đầu' : 'Mở Cuốn Sổ & Bắt Đầu Điều Tra'}</span>
          </button>
        </div>
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
          max-height: calc(100vh - 32px);
          max-height: calc(100dvh - 32px);
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow:
            0 12px 36px rgba(0,0,0,0.3),
            0 32px 72px rgba(0,0,0,0.4);
          animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .prologue-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 32px 28px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .prologue-footer {
          flex-shrink: 0;
          padding: 12px 28px 24px;
          border-top: 1px solid transparent;
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
          flex-shrink: 0;
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
          margin-bottom: 8px;
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

        /* Night intro: ink-blue card */
        .prologue-overlay.night {
          background: rgba(6, 10, 26, 0.8);
        }

        .prologue-overlay.night .prologue-card {
          background: linear-gradient(180deg, #1b2440 0%, #141a30 100%);
          border-color: rgba(255, 226, 160, 0.25);
        }

        .prologue-overlay.night .prologue-title { color: #f4ecd0; }
        .prologue-overlay.night .prologue-subtitle { color: rgba(244, 236, 208, 0.7); }
        .prologue-overlay.night .narrative-body { color: rgba(244, 236, 208, 0.92); }
        .prologue-overlay.night .divider-line { background: rgba(244, 236, 208, 0.2); }
        .prologue-overlay.night .prologue-stamp { color: #f4d58d; border-color: #f4d58d; }
        .prologue-overlay.night .briefing-box {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(244, 236, 208, 0.18);
          color: rgba(244, 236, 208, 0.85);
        }
        .prologue-overlay.night .briefing-icon { color: #f4d58d; }

        /* Small phones: tighter card so the story and the button both fit */
        @media (max-width: 480px), (max-height: 640px) {
          .prologue-overlay { padding: 10px; }
          .prologue-scroll { padding: 20px 16px 4px; }
          .prologue-footer { padding: 10px 16px 16px; }
          .prologue-title { font-size: 28px; }
          .prologue-subtitle { font-size: 12.5px; }
          .divider-line { margin: 12px 0; }
          .narrative-body { font-size: 13.5px; line-height: 1.5; margin-bottom: 12px; }
          .narrative-p { margin-bottom: 8px; }
          .briefing-box { padding: 10px 12px; gap: 6px; font-size: 12px; }
          .start-investigation-btn { height: 46px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
};
