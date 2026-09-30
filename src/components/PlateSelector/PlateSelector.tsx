import React from 'react';
import { X, BookOpen, CheckCircle, Star, PawPrint, Moon, Lock } from 'lucide-react';
import { LevelData, ChapterData } from '../../types/level';
import { SaveManager } from '../../game/SaveManager';

interface PlateSelectorProps {
  isOpen: boolean;
  currentIndex: number;
  isNight: boolean;
  allScenes: LevelData[];
  allChapters: ChapterData[];
  nightByDayId: Record<string, LevelData>;
  onSelectScene: (index: number, night?: boolean) => void;
  onClose: () => void;
}

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <>
    {[...Array(3)].map((_, i) => (
      <Star
        key={i}
        size={12}
        fill={i < count ? '#f59e0b' : 'transparent'}
        stroke={i < count ? '#f59e0b' : '#9ca3af'}
      />
    ))}
  </>
);

function critterProgress(level: LevelData) {
  const seen = new Set(SaveManager.getDiscovered(level.id));
  const ids = level.objects.filter((o) => o.isBonus).map((o) => o.id);
  return { total: ids.length, spotted: ids.filter((id) => seen.has(id)).length };
}

export const PlateSelector: React.FC<PlateSelectorProps> = ({
  isOpen,
  currentIndex,
  isNight,
  allScenes,
  allChapters,
  nightByDayId,
  onSelectScene,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="plate-selector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="plate-header">
          <div className="plate-title-group">
            <BookOpen className="plate-icon" size={24} />
            <div>
              <h2 className="plate-modal-title">Mục Lục 9 Trang Ký Họa</h2>
              <p className="plate-modal-desc">
                Chọn trang để điều tra · hoàn thành trang ngày để mở khóa 🌙 trang đêm
              </p>
            </div>
          </div>
          <button className="plate-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Chapters and Grid of 9 scenes */}
        <div className="plate-scroll-body">
          {allChapters.map((chapter) => {
            const chapterScenes = allScenes.filter((s) => s.chapter === chapter.chapterNumber);

            return (
              <div key={chapter.id} className="chapter-section">
                <div className="chapter-section-header">
                  <span className="chapter-badge">CHƯƠNG {chapter.chapterNumber}</span>
                  <span className="chapter-name">{chapter.title}</span>
                  <span className="chapter-sub"> — {chapter.subtitle}</span>
                </div>

                <div className="plate-grid">
                  {chapterScenes.map((scene) => {
                    const sceneGlobalIdx = allScenes.findIndex((s) => s.id === scene.id);
                    const isCurrent = sceneGlobalIdx === currentIndex && !isNight;
                    const progress = SaveManager.getSceneProgress(scene.id);
                    const isPassed = Boolean(progress && progress.stars > 0);
                    const critters = critterProgress(scene);

                    const night = nightByDayId[scene.id];
                    const nightProgress = night ? SaveManager.getSceneProgress(night.id) : undefined;
                    const nightCritters = night ? critterProgress(night) : null;
                    const isCurrentNight = sceneGlobalIdx === currentIndex && isNight;

                    return (
                      <div
                        key={scene.id}
                        className={`plate-card ${isCurrent ? 'active' : ''} ${isPassed ? 'completed' : ''}`}
                        onClick={() => {
                          onSelectScene(sceneGlobalIdx);
                          onClose();
                        }}
                      >
                        <div className="plate-card-thumb-wrap">
                          <img
                            src={scene.sceneImage}
                            alt={scene.title}
                            className="plate-card-thumb"
                            loading="lazy"
                          />
                          <div className="plate-num-tag">
                            Trang {sceneGlobalIdx + 1}
                          </div>
                          {isCurrent && (
                            <div className="plate-current-badge">Đang mở</div>
                          )}
                          {isPassed && (
                            <div className="plate-passed-badge">
                              <CheckCircle size={14} /> Hoàn tất
                            </div>
                          )}
                        </div>

                        <div className="plate-card-info">
                          <h4 className="plate-card-title">{scene.title}</h4>
                          <p className="plate-card-subtitle">{scene.subtitle}</p>

                          <div className="plate-card-meta">
                            {progress ? (
                              <div className="plate-card-stars">
                                <Stars count={progress.stars} />
                                <span className="plate-card-score">
                                  {progress.highScore.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            ) : (
                              <span className="plate-card-unplayed">Chưa giải mã</span>
                            )}
                            {critters.total > 0 && (
                              <span
                                className={`plate-card-critters ${
                                  critters.spotted === critters.total ? 'complete' : ''
                                }`}
                                title="Sinh vật ẩn nấp đã phát hiện trên trang này"
                              >
                                <PawPrint size={11} />
                                {critters.spotted}/{critters.total}
                              </span>
                            )}
                          </div>

                          {night && (
                            <button
                              className={`plate-night-btn ${isPassed ? '' : 'locked'} ${
                                isCurrentNight ? 'active' : ''
                              }`}
                              disabled={!isPassed}
                              title={isPassed ? night.title : 'Hoàn thành trang ngày để mở khóa trang đêm'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPassed) return;
                                onSelectScene(sceneGlobalIdx, true);
                                onClose();
                              }}
                            >
                              {isPassed ? <Moon size={13} /> : <Lock size={12} />}
                              <span className="plate-night-name">
                                {isPassed ? night.title : 'Trang Đêm · khóa'}
                              </span>
                              {isPassed && nightProgress && (
                                <span className="plate-card-stars">
                                  <Stars count={nightProgress.stars} />
                                </span>
                              )}
                              {isPassed && nightCritters && nightCritters.total > 0 && (
                                <span className="plate-night-critters">
                                  <PawPrint size={10} />
                                  {nightCritters.spotted}/{nightCritters.total}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
