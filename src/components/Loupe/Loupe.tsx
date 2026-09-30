import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HiddenObject } from '../../types/level';
import { SceneLayer } from '../Sprites/SceneLayer';
import { CamoTint } from '../../game/CamoSampler';

interface LoupeProps {
  bookRect: DOMRect | null;
  sceneImage: string;
  zoomFactor?: number;
  nudgeDirection?: { x: number; y: number } | null;
  allObjects?: HiddenObject[];
  foundIds?: string[];
  camoTints?: Record<string, CamoTint>;
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
}

const NO_OBJECTS: HiddenObject[] = [];
const NO_IDS: string[] = [];
const NO_TINTS: Record<string, CamoTint> = {};

export const Loupe: React.FC<LoupeProps> = ({
  bookRect,
  sceneImage,
  zoomFactor = 2.4,
  nudgeDirection,
  allObjects = NO_OBJECTS,
  foundIds = NO_IDS,
  camoTints = NO_TINTS,
  onInspect,
}) => {
  const [pos, setPos] = useState({ x: 300, y: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const loupeRef = useRef<HTMLDivElement>(null);

  // Responsive Loupe diameter: scales gracefully from mobile to desktop
  const bookWidth = bookRect?.width || 800;
  const loupeDiameter = Math.round(Math.max(130, Math.min(240, bookWidth * 0.25)));
  const radius = loupeDiameter / 2;

  // Initialize position when bookRect is measured
  useEffect(() => {
    if (bookRect && pos.x === 300 && pos.y === 220) {
      setPos({
        x: bookRect.width * 0.58,
        y: bookRect.height * 0.62,
      });
    }
  }, [bookRect]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !bookRect) return;

    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    // Constrain within book bounds with generous margins
    newX = Math.max(10, Math.min(bookRect.width - 10, newX));
    newY = Math.max(10, Math.min(bookRect.height - 10, newY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // Inspect at current center
    triggerInspect(pos.x, pos.y);
  };

  const triggerInspect = useCallback(
    (curX: number, curY: number) => {
      if (!bookRect || bookRect.width === 0 || bookRect.height === 0) return;
      const nx = curX / bookRect.width;
      const ny = curY / bookRect.height;
      onInspect(nx, ny, {
        x: bookRect.left + curX,
        y: bookRect.top + curY,
      });
    },
    [bookRect, onInspect]
  );

  return (
    <div
      ref={loupeRef}
      className={`loupe-wrapper ${isDragging ? 'held' : ''} ${nudgeDirection ? 'nudge-anim' : ''}`}
      style={{
        transform: `translate3d(${pos.x - radius}px, ${pos.y - radius}px, 0)`,
        width: `${loupeDiameter}px`,
        height: `${loupeDiameter}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setIsDragging(false)}
      // pointerup already inspected this tap/drag; inspecting again here would count
      // the just-found object as a wrong click (penalty + combo reset)
      onClick={(e) => e.stopPropagation()}
      title="Rê kính lúp để điều tra, click để kiểm tra vật thể"
    >
      {/* Wooden Handle */}
      <div className="loupe-grip" />

      {/* Brass Bezel Outer Ring */}
      <div className="loupe-bezel">
        {/* Glass Lens with magnified background image & sprites */}
        <div className="loupe-lens">
          {bookRect && (
            <div
              className="loupe-zoom-stage"
              style={{
                position: 'absolute',
                left: `${-pos.x * zoomFactor + radius}px`,
                top: `${-pos.y * zoomFactor + radius}px`,
                width: `${bookRect.width * zoomFactor}px`,
                height: `${bookRect.height * zoomFactor}px`,
                pointerEvents: 'none',
              }}
            >
              <img
                src={sceneImage}
                alt=""
                className="loupe-scene-img"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />

              {/* Magnified camouflage — invisible ink only shows up here */}
              <SceneLayer
                sceneImage={sceneImage}
                objects={allObjects}
                foundIds={foundIds}
                tints={camoTints}
                inLoupe
              />
            </div>
          )}

          {/* Optical Highlights */}
          <div className="lens-specular" />
          <div className="lens-crosshair" />
        </div>
      </div>

      <style>{`
        .loupe-wrapper {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 60;
          cursor: grab;
          touch-action: none;
          user-select: none;
          will-change: transform;
        }

        .loupe-wrapper.held {
          cursor: grabbing;
        }

        .loupe-wrapper.nudge-anim {
          animation: nudgePulse 0.8s ease-in-out infinite alternate;
        }

        @keyframes nudgePulse {
          from { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(179, 131, 59, 0.4)); }
          to { transform: scale(1.06); filter: drop-shadow(0 8px 24px rgba(179, 131, 59, 0.8)); }
        }

        .loupe-grip {
          position: absolute;
          width: 24px;
          height: 140px;
          left: 80%;
          top: 80%;
          transform-origin: top left;
          transform: rotate(45deg);
          background: linear-gradient(90deg, #3d2716 0%, #6d4a2d 40%, #8c603a 65%, #3d2716 100%);
          border-radius: 12px;
          box-shadow:
            5px 12px 24px rgba(0, 0, 0, 0.4),
            inset 1px 0 2px rgba(255, 255, 255, 0.15);
          pointer-events: none;
        }

        .loupe-grip::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 18px;
          background: linear-gradient(90deg, #b3833b 0%, #e5c378 50%, #8c6226 100%);
          border-radius: 6px 6px 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .loupe-bezel {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          padding: 8px;
          background: conic-gradient(
            from 180deg at 50% 50%,
            #8c6226 0deg,
            #e5c378 45deg,
            #b3833b 90deg,
            #fff1c4 135deg,
            #8c6226 180deg,
            #e5c378 225deg,
            #b3833b 270deg,
            #fff1c4 315deg,
            #8c6226 360deg
          );
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.35),
            0 24px 48px rgba(0, 0, 0, 0.25),
            inset 0 1px 2px rgba(255, 255, 255, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.6);
        }

        .loupe-lens {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background-color: #ded7c8;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.45);
        }

        .lens-specular {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(
            circle at 32% 28%,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.15) 30%,
            rgba(255, 255, 255, 0) 65%
          );
          mix-blend-mode: overlay;
          z-index: 20;
        }

        .lens-crosshair {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.25;
          z-index: 21;
        }
        .lens-crosshair::before,
        .lens-crosshair::after {
          content: "";
          position: absolute;
          background: var(--earth);
        }
        .lens-crosshair::before {
          left: 4px;
          top: 0;
          width: 2px;
          height: 10px;
        }
        .lens-crosshair::after {
          left: 0;
          top: 4px;
          width: 10px;
          height: 2px;
        }
      `}</style>
    </div>
  );
};
export default Loupe;
