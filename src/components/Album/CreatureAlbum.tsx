import React, { useMemo, useState } from 'react';
import { X, BookHeart, Check, Moon } from 'lucide-react';
import { LevelData, SpriteType } from '../../types/level';
import { BESTIARY } from '../../data/bestiary';
import { SaveManager } from '../../game/SaveManager';
import { ObjectSprite } from '../Sprites/ObjectSprite';

interface CreatureAlbumProps {
  levels: LevelData[]; // Day pages followed by night pages
  onClose: () => void;
}

type Filter = 'all' | 'creature' | 'object';

interface Sighting {
  label: string;
  night: boolean;
  found: boolean;
}

interface AlbumEntry {
  type: Exclude<SpriteType, 'seal'>;
  discovered: boolean;
  sightings: Sighting[];
}

function pageLabel(level: LevelData) {
  return `Trang ${level.sceneIndex + 1}`;
}

/** "Sổ Tay Sinh Vật" — every creature and object the player has ever spotted, with a fun fact. */
export const CreatureAlbum: React.FC<CreatureAlbumProps> = ({ levels, onClose }) => {
  const [filter, setFilter] = useState<Filter>('all');

  const entries = useMemo<AlbumEntry[]>(() => {
    const byType = new Map<Exclude<SpriteType, 'seal'>, AlbumEntry>();
    for (const level of levels) {
      const seen = new Set(SaveManager.getDiscovered(level.id));
      for (const obj of level.objects) {
        if (!obj.spriteType || obj.spriteType === 'seal') continue;
        const type = obj.spriteType;
        const entry = byType.get(type) ?? { type, discovered: false, sightings: [] };
        const found = seen.has(obj.id);
        entry.discovered ||= found;
        entry.sightings.push({ label: pageLabel(level), night: !!level.isNight, found });
        byType.set(type, entry);
      }
    }
    // Creatures first, then objects; each group in bestiary order
    const order = Object.keys(BESTIARY);
    return [...byType.values()].sort((a, b) => {
      const ka = BESTIARY[a.type].kind === 'creature' ? 0 : 1;
      const kb = BESTIARY[b.type].kind === 'creature' ? 0 : 1;
      return ka - kb || order.indexOf(a.type) - order.indexOf(b.type);
    });
  }, [levels]);

  const shown = entries.filter((e) => filter === 'all' || BESTIARY[e.type].kind === filter);
  const discoveredCount = entries.filter((e) => e.discovered).length;
  const pct = Math.round((discoveredCount / Math.max(1, entries.length)) * 100);

  const count = (kind: Filter) => {
    const list = entries.filter((e) => kind === 'all' || BESTIARY[e.type].kind === kind);
    return `${list.filter((e) => e.discovered).length}/${list.length}`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="album-modal" onClick={(e) => e.stopPropagation()}>
        <div className="album-header">
          <div className="album-title-group">
            <BookHeart className="album-icon" size={24} />
            <div>
              <h2 className="album-title">Sổ Tay Sinh Vật</h2>
              <p className="album-desc">
                Đã phát hiện {discoveredCount}/{entries.length} loài & cổ vật · {pct}%
              </p>
            </div>
          </div>
          <button className="plate-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="album-progress" aria-hidden="true">
          <div className="album-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="album-tabs" role="tablist">
          {(
            [
              ['all', 'Tất cả'],
              ['creature', 'Sinh vật'],
              ['object', 'Đồ vật'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              className={`album-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span className="album-tab-count">{count(key)}</span>
            </button>
          ))}
        </div>

        <div className="album-grid">
          {shown.map((entry) => {
            const info = BESTIARY[entry.type];
            return (
              <div key={entry.type} className={`album-card ${entry.discovered ? 'discovered' : 'unknown'}`}>
                <div className="album-sprite">
                  <ObjectSprite
                    type={entry.type}
                    isFound={entry.discovered}
                    className={entry.discovered ? '' : 'sprite-silhouette'}
                  />
                </div>
                <div className="album-card-body">
                  <div className="album-card-name">{entry.discovered ? info.name : '???'}</div>
                  <div className="album-card-fact">
                    {entry.discovered ? info.fact : 'Chưa phát hiện — hãy soi kỹ các trang bên dưới.'}
                  </div>
                  <div className="album-sightings">
                    {entry.sightings.map((s, i) => (
                      <span key={i} className={`album-chip ${s.found ? 'found' : ''} ${s.night ? 'night' : ''}`}>
                        {s.night && <Moon size={10} />}
                        {s.label}
                        {s.found && <Check size={10} />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .album-modal {
          width: 100%;
          max-width: 920px;
          max-height: calc(100dvh - 32px);
          background: var(--paper-card);
          border: 1px solid var(--hairline);
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), 0 32px 80px rgba(0, 0, 0, 0.45);
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .album-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 24px 12px;
        }

        .album-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .album-icon {
          color: var(--emerald);
          flex-shrink: 0;
        }

        .album-title {
          margin: 0;
          font-family: var(--display);
          font-size: 26px;
          font-weight: 500;
          color: var(--ink);
          line-height: 1.15;
        }

        .album-desc {
          margin: 2px 0 0;
          font-family: var(--sans);
          font-size: 12px;
          color: var(--ink-soft);
        }

        .album-progress {
          height: 6px;
          margin: 0 24px 12px;
          border-radius: 999px;
          background: rgba(43, 39, 33, 0.08);
          overflow: hidden;
          flex-shrink: 0;
        }

        .album-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #2d7a4f, #6fbf73);
        }

        .album-tabs {
          display: flex;
          gap: 6px;
          padding: 0 24px 12px;
          border-bottom: 1px solid var(--hairline);
          flex-shrink: 0;
          overflow-x: auto;
        }

        .album-tab {
          flex-shrink: 0;
          border: 1px solid var(--hairline);
          background: rgba(255, 255, 255, 0.7);
          color: var(--ink-soft);
          border-radius: 999px;
          padding: 5px 12px;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .album-tab.active {
          background: var(--emerald);
          border-color: var(--emerald);
          color: #fff;
        }

        .album-tab-count {
          opacity: 0.75;
          font-variant-numeric: tabular-nums;
          margin-left: 2px;
        }

        .album-grid {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 14px 24px 24px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px;
          align-content: start;
        }

        .album-card {
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--hairline);
          background: #fff;
        }

        .album-card.unknown {
          background: #faf6f0;
          border-style: dashed;
        }

        .album-sprite {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: radial-gradient(circle, rgba(179, 131, 59, 0.12), transparent 70%);
        }

        .album-sprite .object-sprite-container {
          width: 44px;
          height: 44px;
          animation: none;
        }

        .album-card-body {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .album-card-name {
          font-family: var(--display);
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }

        .album-card.unknown .album-card-name {
          color: var(--ink-faint);
          letter-spacing: 0.1em;
        }

        .album-card-fact {
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--ink-soft);
        }

        .album-sightings {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }

        .album-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-family: var(--sans);
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          background: rgba(43, 39, 33, 0.06);
          color: var(--ink-faint);
        }

        .album-chip.night {
          background: rgba(27, 36, 64, 0.1);
          color: #3b4a7a;
        }

        .album-chip.found {
          background: rgba(45, 122, 79, 0.12);
          color: var(--emerald);
        }

        @media (max-width: 640px) {
          .album-header { padding: 14px 16px 10px; }
          .album-title { font-size: 21px; }
          .album-progress { margin: 0 16px 10px; }
          .album-tabs { padding: 0 16px 10px; }
          .album-grid { padding: 12px 16px 18px; grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
