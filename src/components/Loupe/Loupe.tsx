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
  foundAt?: Record<string, { x: number; y: number }>;
  camoTints?: Record<string, CamoTint>;
  night?: boolean; // Night pages: the loupe doubles as a flashlight
  fogged?: boolean; // Misted over after a burst of random clicks
  onMove?: (x: number, y: number, radius: number) => void; // Lens centre in book pixels
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
}

const NO_OBJECTS: HiddenObject[] = [];
const NO_IDS: string[] = [];
const NO_TINTS: Record<string, CamoTint> = {};

// While dragging near the edge of a zoomed (scrollable) page, scroll it along
const EDGE_ZONE = 44;
const EDGE_STEP = 12;

export const Loupe: React.FC<LoupeProps> = ({
  bookRect,
  sceneImage,
  zoomFactor = 2.4,
  nudgeDirection,
  allObjects = NO_OBJECTS,
  foundIds = NO_IDS,
  foundAt,
  camoTints = NO_TINTS,
  night = false,
  fogged = false,
  onMove,
  onInspect,
}) => {
  const [pos, setPos] = useState({ x: 300, y: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const loupeRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useRef(0);

  // Responsive Loupe diameter: scales gracefully from mobile to desktop
  const bookWidth = bookRect?.width || 800;
  // On a zoomed-in phone the page is wider than the screen — size the lens by the screen too
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const loupeDiameter = Math.round(Math.max(110, Math.min(240, bookWidth * 0.25, viewportWidth * 0.36)));
  const radius = loupeDiameter / 2;

  // Initialize position when bookRect is measured; keep pointing at the same spot when the
  // page is zoomed or resized
  useEffect(() => {
    if (!bookRect || bookRect.width === 0) return;
    const prevWidth = measuredWidth.current;
    measuredWidth.current = bookRect.width;
    if (!prevWidth) {
      setPos({ x: bookRect.width * 0.58, y: bookRect.height * 0.62 });
    } else if (Math.abs(prevWidth - bookRect.width) > 0.5) {
      const k = bookRect.width / prevWidth;
      setPos((p) => ({ x: p.x * k, y: p.y * k }));
    }
  }, [bookRect]);

  useEffect(() => {
    onMove?.(pos.x, pos.y, radius);
  }, [pos.x, pos.y, radius, onMove]);

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

    // Zoomed page on a small screen: nudge the scroll so the loupe can travel the whole spread
    const stage = loupeRef.current?.closest('.sketchbook-stage') as HTMLElement | null;
    if (stage && (stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight)) {
      const r = stage.getBoundingClientRect();
      const before = { x: stage.scrollLeft, y: stage.scrollTop };
      if (e.clientX > r.right - EDGE_ZONE) stage.scrollLeft += EDGE_STEP;
      else if (e.clientX < r.left + EDGE_ZONE) stage.scrollLeft -= EDGE_STEP;
      if (e.clientY > r.bottom - EDGE_ZONE) stage.scrollTop += EDGE_STEP;
      else if (e.clientY < r.top + EDGE_ZONE) stage.scrollTop -= EDGE_STEP;
      // The page moved under the finger: shift the grab offset so the loupe stays with it
      dragOffset.current.x -= stage.scrollLeft - before.x;
      dragOffset.current.y -= stage.scrollTop - before.y;
    }

    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    // Constrain within book bounds with generous margins
    newX = Math.max(10, Math.min(bookRect.width - 10, newX));
    newY = Math.max(10, Math.min(bookRect.height - 10, newY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
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
      // The lens centre on screen, measured live (the page may have scrolled since)
      const lens = loupeRef.current?.getBoundingClientRect();
      onInspect(nx, ny, lens
        ? { x: lens.left + lens.width / 2, y: lens.top + lens.height / 2 }
        : { x: bookRect.left + curX, y: bookRect.top + curY });
    },
    [bookRect, onInspect]
  );

  return (
    <div
      ref={loupeRef}
      className={`loupe-wrapper ${isDragging ? 'held' : ''} ${nudgeDirection ? 'nudge-anim' : ''} ${
        night ? 'night' : ''
      } ${fogged ? 'fogged' : ''}`}
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
      title={night ? 'Rê đèn pin để soi trong bóng tối' : 'Rê kính lúp để điều tra, click để kiểm tra vật thể'}
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
                foundAt={foundAt}
                tints={camoTints}
                inLoupe
              />
            </div>
          )}

          {/* Flashlight falloff on night pages, mist when fogged */}
          {night && <div className="lens-night-vignette" />}
          {fogged && <div className="lens-fog" />}

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

        /* Night pages: the lens is a warm flashlight beam */
        .loupe-wrapper.night .loupe-bezel {
          box-shadow:
            0 0 28px rgba(255, 214, 140, 0.45),
            0 12px 32px rgba(0, 0, 0, 0.45),
            inset 0 1px 2px rgba(255, 255, 255, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.6);
        }

        .lens-night-vignette {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          z-index: 19;
          background: radial-gradient(circle, rgba(255, 226, 160, 0.14) 0%, rgba(255, 226, 160, 0.05) 45%, rgba(10, 16, 38, 0.45) 100%);
        }

        /* Fogged loupe after spamming clicks */
        .loupe-wrapper.fogged .loupe-zoom-stage {
          filter: blur(5px) saturate(0.6);
        }

        .lens-fog {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          z-index: 19;
          background:
            radial-gradient(circle at 35% 40%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 45%),
            radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 50%),
            rgba(236, 240, 244, 0.55);
          animation: fogClear 3s ease-in forwards;
        }

        @keyframes fogClear {
          0% { opacity: 1; }
          70% { opacity: 0.85; }
          100% { opacity: 0; }
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
