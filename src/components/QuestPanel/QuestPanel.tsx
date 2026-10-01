import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Lock,
  PawPrint,
  Palette,
  ScanEye,
  Timer,
  Layers,
  Microscope,
  Feather,
  Stamp,
  Footprints,
  type LucideIcon,
} from 'lucide-react';
import { HiddenObject } from '../../types/level';
import { ObjectSprite } from '../Sprites/ObjectSprite';
import { isMainObject } from '../../game/GameState';

interface QuestPanelProps {
  objects: HiddenObject[];
  foundIds: string[];
  activeHintId?: string;
  onSelectClue?: (obj: HiddenObject) => void;
}

interface CamoTrait {
  key: string;
  icon: LucideIcon;
  label: string;
}

/** How a target is hidden, so players know what kind of searching it takes. */
function camoTrait(obj: HiddenObject): CamoTrait | null {
  if (!obj.spriteType || obj.spriteType === 'seal') return null;
  if (obj.camo === 'invisible') return { key: 'invisible', icon: ScanEye, label: 'Mực tàng hình · chỉ hiện qua kính lúp' };
  if (obj.roam) return { key: 'roam', icon: Footprints, label: 'Di chuyển liên tục · bắt đúng lúc' };
  if (obj.shy) return { key: 'shy', icon: Timer, label: 'Nhút nhát · thỉnh thoảng mới ló ra' };
  if (obj.camo === 'chameleon') return { key: 'chameleon', icon: Palette, label: 'Đổi màu theo nền' };
  if (obj.occluder) return { key: 'peek', icon: Layers, label: 'Nấp sau vật' };
  if ((obj.scale ?? 1) <= 0.45) return { key: 'tiny', icon: Microscope, label: 'Tí hon' };
  return { key: 'ink', icon: Feather, label: 'Hòa vào nét vẽ' };
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  objects,
  foundIds,
  activeHintId,
  onSelectClue,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const normalObjects = objects.filter(isMainObject);
  const secretObject = objects.find(o => o.isSecret);
  const bonusObjects = objects.filter(o => o.isBonus);
  const normalFound = normalObjects.filter(o => foundIds.includes(o.id)).length;
  const bonusFound = bonusObjects.filter(o => foundIds.includes(o.id)).length;
  const isSecretFound = secretObject ? foundIds.includes(secretObject.id) : false;

  return (
    <div className={`quest-dock ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="quest-toggle"
        type="button"
        aria-label={collapsed ? 'Hiện thanh manh mối' : 'Ẩn thanh manh mối'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Hiện thanh manh mối' : 'Ẩn thanh manh mối'}
        onClick={() => setCollapsed(value => !value)}
      >
        {collapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {!collapsed && <>
      {/* Header bar */}
      <div className="quest-header">
        <div className="quest-count">
          <Search size={16} className="quest-icon" />
          <span className="quest-count-label">MANH MỐI CẦN TÌM</span>
          <span className="quest-badge">
            {normalFound} / {normalObjects.length}
          </span>
        </div>

        <div className="quest-header-right">
          {bonusObjects.length > 0 && (
            <div
              className={`critter-tracker ${bonusFound === bonusObjects.length ? 'complete' : ''}`}
              title="Sinh vật tí hon ngụy trang khắp trang vẽ — không bắt buộc, nhưng được cộng điểm"
            >
              <PawPrint size={14} className="critter-icon" />
              <span className="critter-label">SINH VẬT ẨN NẤP</span>
              <div className="critter-slots">
                {bonusObjects.map(o => {
                  const isFound = foundIds.includes(o.id);
                  return (
                    <div
                      key={o.id}
                      className={`critter-slot ${isFound ? 'found' : ''}`}
                      title={isFound ? o.name : '???'}
                    >
                      <ObjectSprite type={o.spriteType} isFound={isFound} className={isFound ? '' : 'sprite-silhouette'} />
                    </div>
                  );
                })}
              </div>
              <span className="critter-count">
                {bonusFound}/{bonusObjects.length}
              </span>
            </div>
          )}

          {secretObject && (
            <div className={`secret-badge ${isSecretFound ? 'unlocked' : 'locked'}`}>
              {isSecretFound ? <Sparkles size={14} /> : <Lock size={14} />}
              <span className="secret-badge-text">{isSecretFound ? 'BÍ MẬT ĐÃ MỞ' : '1 VẬT THỂ ẨN BÍ MẬT'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cards list */}
      <div
        className="quest-cards-scroll"
        onWheel={e => {
          // Let a plain mouse wheel scroll the card strip sideways
          const strip = e.currentTarget;
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && strip.scrollWidth > strip.clientWidth) {
            strip.scrollLeft += e.deltaY;
          }
        }}
      >
        {normalObjects.map(obj => {
          const isFound = foundIds.includes(obj.id);
          const isHinted = activeHintId === obj.id;
          const trait = camoTrait(obj);

          return (
            <div
              key={obj.id}
              className={`quest-card ${isFound ? 'found' : ''} ${isHinted ? 'hint-highlight' : ''}`}
              onClick={() => !isFound && onSelectClue && onSelectClue(obj)}
              title={isFound ? obj.foundText : obj.clue}
            >
              <div className="quest-sprite-thumb">
                {obj.spriteType && obj.spriteType !== 'seal' ? (
                  // Only the silhouette until found — the colors are part of the surprise
                  <ObjectSprite
                    type={obj.spriteType}
                    isFound={isFound}
                    className={isFound ? '' : 'sprite-silhouette'}
                  />
                ) : (
                  <Stamp size={20} className="seal-thumb" />
                )}
                {isFound && <CheckCircle2 size={14} className="check-icon thumb-check" />}
              </div>

              <div className="quest-card-info">
                {trait && (
                  <div className={`camo-trait trait-${trait.key}`}>
                    <trait.icon size={10} />
                    <span>{trait.label}</span>
                  </div>
                )}
                <div className="quest-card-name">{obj.name}</div>
                <div className="quest-card-clue">
                  {isFound ? (obj.foundText || 'Đã tìm thấy!') : obj.clue}
                </div>
              </div>
            </div>
          );
        })}

        {/* Secret card */}
        {secretObject && (
          <div
            className={`quest-card secret-card ${isSecretFound ? 'found' : 'mystery'}`}
            title={isSecretFound ? secretObject.foundText : 'Dấu tích bí ẩn của cổ vật...'}
          >
            <div className="quest-card-status">
              {isSecretFound ? (
                <Sparkles size={18} className="secret-star" />
              ) : (
                <Lock size={16} className="lock-icon" />
              )}
            </div>

            {isSecretFound && secretObject.spriteType && (
              <div className="quest-sprite-thumb">
                <ObjectSprite type={secretObject.spriteType} isFound={true} isSecret={true} />
              </div>
            )}

            <div className="quest-card-info">
              <div className="quest-card-name">
                {isSecretFound ? secretObject.name : '??? Vật Phẩm Bí Mật'}
              </div>
              <div className="quest-card-clue">
                {isSecretFound
                  ? secretObject.foundText
                  : 'Vật được giấu kỹ nhất trang — hãy rê kính lúp thật chậm.'}
              </div>
            </div>
          </div>
        )}
      </div>

      </>}
      <style>{`
        .quest-dock.collapsed {
          padding: 0;
          height: 6px;
          min-height: 6px;
        }

        .quest-toggle {
          position: absolute;
          left: 16px;
          top: -32px;
          width: 48px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--hairline);
          border-bottom: 0;
          border-radius: 12px 12px 0 0;
          background: rgba(246, 242, 233, 0.97);
          color: var(--ink);
          cursor: pointer;
        }

        .quest-toggle:hover { background: #fffaf0; }
        .quest-toggle:focus-visible { outline: 2px solid var(--earth); outline-offset: 2px; }

        .quest-dock {
          position: relative;
          z-index: 90;
          background: rgba(246, 242, 233, 0.92);
          backdrop-filter: blur(14px);
          border-top: 1px solid var(--hairline);
          padding: 8px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 -4px 16px rgba(43,39,33,0.06);
        }

        .quest-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px 12px;
          flex-wrap: wrap;
          padding: 0 4px;
        }

        .quest-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Optional hidden critters tracker */
        .critter-tracker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 10px 2px 8px;
          border-radius: 999px;
          background: rgba(45, 122, 79, 0.08);
          border: 1px solid rgba(45, 122, 79, 0.18);
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 700;
          color: var(--emerald);
          letter-spacing: 0.06em;
        }

        .critter-tracker.complete {
          background: #dcfce7;
          border-color: #86efac;
          animation: pop 0.4s ease;
        }

        .critter-slots {
          display: flex;
          gap: 2px;
        }

        .critter-slot {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .critter-slot .object-sprite-container {
          width: 18px;
          height: 18px;
        }

        .critter-count {
          font-variant-numeric: tabular-nums;
        }

        .camo-trait {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-family: var(--sans);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .camo-trait.trait-chameleon { color: #4d7c0f; }
        .camo-trait.trait-invisible { color: #0284c7; }
        .camo-trait.trait-shy { color: #b45309; }
        .camo-trait.trait-roam { color: #0f766e; }
        .camo-trait.trait-peek { color: #7c3aed; }
        .camo-trait.trait-tiny { color: #be185d; }

        .quest-card.found .camo-trait {
          opacity: 0.6;
        }

        .quest-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--sans);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--ink);
          text-transform: uppercase;
        }

        .quest-icon {
          color: var(--earth);
        }

        .quest-badge {
          background: rgba(43,39,33,0.08);
          padding: 2px 8px;
          border-radius: 999px;
          color: var(--earth);
          font-size: 12px;
        }

        .secret-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .secret-badge.locked {
          background: rgba(43,39,33,0.06);
          color: var(--ink-faint);
        }

        .secret-badge.unlocked {
          background: #fef08a;
          color: #854d0e;
          border: 1px solid #facc15;
          animation: pop 0.4s ease;
        }

        .quest-cards-scroll {
          display: flex;
          align-items: stretch;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }

        .quest-cards-scroll::-webkit-scrollbar {
          height: 4px;
        }

        .quest-cards-scroll::-webkit-scrollbar-thumb {
          background: rgba(43,39,33,0.2);
          border-radius: 2px;
        }

        .quest-card {
          flex: 0 0 184px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          background: #fff;
          border: 1px solid var(--hairline);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .quest-sprite-thumb {
          position: relative;
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quest-sprite-thumb .object-sprite-container {
          width: 28px;
          height: 28px;
        }

        .seal-thumb {
          color: var(--crimson);
          opacity: 0.75;
        }

        .thumb-check {
          position: absolute;
          right: -4px;
          bottom: -3px;
          background: #fff;
          border-radius: 50%;
        }

        .quest-card:hover {
          border-color: rgba(43,39,33,0.3);
          transform: translateY(-2px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.08);
        }

        .quest-card.found {
          background: #f8faf8;
          border-color: #bbf7d0;
          opacity: 0.85;
        }

        .quest-card.found .quest-card-name {
          text-decoration: line-through;
          color: var(--emerald);
        }

        .quest-card.hint-highlight {
          border-color: var(--gold);
          background: #fffdf5;
          box-shadow: 0 0 12px rgba(179,131,59,0.35);
          animation: hintBounce 1s infinite alternate;
        }

        @keyframes hintBounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }

        .quest-card-status {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .check-icon {
          color: var(--emerald);
        }

        .quest-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .quest-card-name {
          font-family: var(--display);
          font-size: 15px;
          color: var(--ink);
          font-weight: 600;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .quest-card-clue {
          font-size: 11px;
          color: var(--ink-soft);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .secret-card.mystery {
          background: #faf6f0;
          border-style: dashed;
        }

        .secret-card.found {
          background: #fefce8;
          border-color: #fde047;
        }

        .secret-star {
          color: #ca8a04;
        }

        .lock-icon {
          color: var(--ink-faint);
        }

        @media (max-width: 768px) {
          .quest-card { flex: 0 0 170px; padding: 6px 10px; }
          .quest-card-name { font-size: 14px; }
          .quest-card-clue { font-size: 10.5px; }
          .critter-label { display: none; }
        }

        /* Phones held sideways: name-only cards so the page keeps its height */
        @media (max-height: 500px) {
          .quest-dock { padding: 4px 10px 6px; gap: 4px; }
          .quest-card { flex: 0 0 150px; padding: 4px 8px; }
          .quest-card-clue { display: none; }
          .quest-card-name { font-size: 13px; }
          .quest-sprite-thumb { width: 24px; height: 24px; }
          .quest-sprite-thumb .object-sprite-container { width: 22px; height: 22px; }
        }

        @media (max-width: 640px) {
          .quest-dock { padding: 5px 8px 8px; gap: 5px; }
          .quest-header { flex-wrap: nowrap; padding: 0 2px; }
          .quest-count { gap: 5px; font-size: 10px; letter-spacing: 0.08em; }
          .quest-count-label { display: none; }
          .quest-count::after { content: 'MANH MỐI'; order: 1; }
          .quest-badge { order: 2; font-size: 11px; padding: 1px 7px; }
          .quest-header-right { gap: 6px; flex-wrap: nowrap; }
          .critter-tracker { padding: 1px 8px 1px 6px; gap: 4px; }
          .critter-slot { width: 17px; height: 17px; }
          .critter-slot .object-sprite-container { width: 16px; height: 16px; }
          .secret-badge { padding: 3px 7px; }
          .secret-badge-text { display: none; }
          .quest-card { flex: 0 0 150px; padding: 5px 8px; gap: 6px; }
          .quest-sprite-thumb { width: 26px; height: 26px; }
          .quest-sprite-thumb .object-sprite-container { width: 24px; height: 24px; }
          .quest-card-name { font-size: 13px; }
          .quest-card-clue { font-size: 10px; line-height: 1.25; }
          .camo-trait { font-size: 8px; }
        }
      `}</style>
    </div>
  );
};
