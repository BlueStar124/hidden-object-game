import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Loupe } from '../Loupe/Loupe';
import { HiddenObject, NightLight } from '../../types/level';
import { SceneLayer, useRoamingPosition } from '../Sprites/SceneLayer';
import { NightSky } from './NightSky';
import { CamoTint, sampleCamoTints } from '../../game/CamoSampler';

type Point = { x: number; y: number };

interface SketchbookProps {
  sceneImage: string;
  nextSceneImage?: string;
  isTurning: boolean;
  foundObjects: HiddenObject[];
  foundAt?: Record<string, Point>;
  allObjects?: HiddenObject[];
  debugMode?: boolean;
  radarTarget?: HiddenObject | null; // Hint tier 3: the object the radar pulses on
  nudgeDirection?: { x: number; y: number } | null;
  isNight?: boolean;
  nightLights?: NightLight[];
  fogged?: boolean;
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
}

// Mobile zoom controls move in gentle 10% increments instead of making the
// page jump abruptly from 1x to 1.6x.
const ZOOM_STEPS = Array.from({ length: 21 }, (_, index) =>
  Number((1 + index * 0.1).toFixed(1))
);
const NO_LIGHTS: NightLight[] = [];

// Phones see the spread tiny at "fit"; start them zoomed in (upright phones the most,
// so the page fills the screen height and is swiped sideways)
function defaultZoom(): number {
  if (typeof window === 'undefined') return 1;
  const { innerWidth: w, innerHeight: h } = window;
  if (w < 700 && h > w) return 2.2;
  if (h < 500) return 1.6;
  return 1;
}

/** Hint radar ring; follows the target if it is a roaming creature. */
const RadarMarker: React.FC<{ target: HiddenObject }> = ({ target }) => {
  const ref = useRef<HTMLDivElement>(null);
  useRoamingPosition(ref, target.roam, !!target.roam);
  return (
    <div
      ref={ref}
      className="radar-ping-marker"
      style={target.roam ? undefined : { left: `${target.x * 100}%`, top: `${target.y * 100}%` }}
    >
      <div className="radar-ripple" />
      <div className="radar-center-dot" />
    </div>
  );
};

export const Sketchbook: React.FC<SketchbookProps> = ({
  sceneImage,
  isTurning,
  foundObjects,
  foundAt,
  allObjects = [],
  debugMode = false,
  radarTarget,
  nudgeDirection,
  isNight = false,
  nightLights = NO_LIGHTS,
  fogged = false,
  onInspect,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGCircleElement>(null);
  const [bookRect, setBookRect] = useState<DOMRect | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hoverCoords, setHoverCoords] = useState<{ nx: number; ny: number } | null>(null);
  const [camoTints, setCamoTints] = useState<Record<string, CamoTint>>({});
  const [zoom, setZoom] = useState(defaultZoom);

  const foundIds = useMemo(() => foundObjects.map((f) => f.id), [foundObjects]);

  // Chameleon objects borrow the paint colors around them
  useEffect(() => {
    let cancelled = false;
    sampleCamoTints(sceneImage, allObjects).then((tints) => {
      if (!cancelled) setCamoTints(tints);
    });
    return () => {
      cancelled = true;
    };
  }, [sceneImage, allObjects]);

  // Keep the book's size in sync (window resize, image load, zoom)
  const measureBook = useCallback(() => {
    if (bookRef.current) {
      setBookRect(bookRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    measureBook();
    const el = bookRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureBook);
      return () => window.removeEventListener('resize', measureBook);
    }
    const ro = new ResizeObserver(measureBook);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureBook]);

  // A new page on a zoomed-in phone opens on the middle of the spread
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    requestAnimationFrame(() => {
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    });
  }, [sceneImage]);

  // Zooming keeps the middle of the visible area in view
  const changeZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STEPS.indexOf(zoom);
    const next = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + dir))];
    if (next === zoom) return;
    const stage = stageRef.current;
    const cx = stage ? (stage.scrollLeft + stage.clientWidth / 2) / Math.max(1, stage.scrollWidth) : 0.5;
    const cy = stage ? (stage.scrollTop + stage.clientHeight / 2) / Math.max(1, stage.scrollHeight) : 0.5;
    setZoom(next);
    requestAnimationFrame(() => {
      if (!stage) return;
      stage.scrollLeft = cx * stage.scrollWidth - stage.clientWidth / 2;
      stage.scrollTop = cy * stage.scrollHeight - stage.clientHeight / 2;
    });
  };

  // Night flashlight follows the loupe (straight on the SVG, no re-render)
  const handleLoupeMove = useCallback((x: number, y: number, r: number) => {
    const beam = beamRef.current;
    const book = bookRef.current;
    if (!beam || !book || !book.offsetWidth) return;
    const k = 1760 / book.offsetWidth;
    beam.setAttribute('cx', (x * k).toFixed(1));
    beam.setAttribute('cy', (y * k).toFixed(1));
    beam.setAttribute('r', (r * k * 1.35).toFixed(1));
  }, []);

  // Gentle 3D Tilt on mouse move (not for touch, not while zoomed in)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!stageRef.current) return;
    if (e.pointerType === 'mouse' && zoom === 1) {
      const r = stageRef.current.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      setTilt({ rx: -dy * 3.0, ry: dx * 4.5 });
    }

    if (debugMode && bookRef.current) {
      const bRect = bookRef.current.getBoundingClientRect();
      const nx = (e.clientX - bRect.left) / bRect.width;
      const ny = (e.clientY - bRect.top) / bRect.height;
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        setHoverCoords({ nx, ny });
      }
    }
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
    setHoverCoords(null);
  };

  useEffect(() => {
    if (zoom !== 1) setTilt({ rx: 0, ry: 0 });
  }, [zoom]);

  const handleDirectClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bookRef.current) return;
    const rect = bookRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    onInspect(nx, ny, { x: e.clientX, y: e.clientY });
  };

  const zoomIdx = ZOOM_STEPS.indexOf(zoom);

  return (
    <div className="sketchbook-viewport">
      <div
        ref={stageRef}
        className={`sketchbook-stage ${zoom > 1 ? 'zoomed' : ''}`}
        style={{ '--book-zoom': zoom } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="sketchbook-3d">
          <div
            className="sketchbook-tilt"
            style={{
              transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
            }}
          >
            {/* Surface Cast Shadows */}
            <div className="sb-cast ambient" />
            <div className="sb-cast contact" />

            {/* Book Canvas Spread */}
            <div
              ref={bookRef}
              className={`sketchbook-book ${isTurning ? 'page-turning' : ''} ${isNight ? 'night' : ''}`}
              onClick={handleDirectClick}
            >
              {/* The Main Watercolor Spread Artwork */}
              <img
                src={sceneImage}
                alt="Watercolor Scene"
                className="scene-spread-img"
                draggable={false}
                onLoad={measureBook}
              />

              {/* Debug Mode: Show Exact Target Hitboxes */}
              {debugMode &&
                allObjects.map((obj) => (
                  <div
                    key={`debug-${obj.id}`}
                    className="debug-hitbox"
                    style={{
                      left: `${(obj.x * 100).toFixed(2)}%`,
                      top: `${(obj.y * 100).toFixed(2)}%`,
                      width: `${(obj.radius * 2 * 100).toFixed(2)}%`,
                      aspectRatio: '1',
                    }}
                    title={`${obj.name} [x: ${obj.x}, y: ${obj.y}]`}
                  >
                    <span className="debug-label">{obj.name}</span>
                  </div>
                ))}

              {/* Found Objects Stamped Ink Rings (roamers: where they were caught) */}
              {foundObjects.map((obj) => {
                const at = foundAt?.[obj.id] ?? obj;
                return (
                  <div
                    key={obj.id}
                    className="found-stamp-marker"
                    style={{
                      left: `${(at.x * 100).toFixed(2)}%`,
                      top: `${(at.y * 100).toFixed(2)}%`,
                    }}
                  >
                    <div className="stamp-circle" />
                    <span className="stamp-label">{obj.name}</span>
                  </div>
                );
              })}

              {/* Camouflaged animals and detective objects painted into the spread */}
              <SceneLayer
                sceneImage={sceneImage}
                objects={allObjects}
                foundIds={foundIds}
                foundAt={foundAt}
                tints={camoTints}
              />

              {/* Night: darkness with a flashlight hole, lamps, and glowing eyes above it */}
              {isNight && (
                <>
                  <NightSky lights={nightLights} beamRef={beamRef} />
                  <SceneLayer
                    sceneImage={sceneImage}
                    objects={allObjects}
                    foundIds={foundIds}
                    tints={camoTints}
                    glow
                  />
                </>
              )}

              {/* Hint Tier 3: Radar Pulse Indicator */}
              {radarTarget && <RadarMarker key={radarTarget.id} target={radarTarget} />}

              {/* 3D Page Turn Overlay Effect */}
              {isTurning && (
                <div className="turn-leaf-overlay">
                  <div className="turning-page-curl" />
                </div>
              )}
            </div>
          </div>

          {/* The Interactive Loupe Magnifier (a flashlight on night pages) */}
          <Loupe
            bookRect={bookRect}
            sceneImage={sceneImage}
            nudgeDirection={nudgeDirection}
            allObjects={allObjects}
            foundIds={foundIds}
            foundAt={foundAt}
            camoTints={camoTints}
            night={isNight}
            fogged={fogged}
            onMove={isNight ? handleLoupeMove : undefined}
            onInspect={onInspect}
          />

          {/* Live Coordinate Badge in Debug Mode */}
          {debugMode && hoverCoords && (
            <div className="debug-coord-badge">
              X: {hoverCoords.nx.toFixed(3)} | Y: {hoverCoords.ny.toFixed(3)}
            </div>
          )}
        </div>
      </div>

      {/* Zoom controls — mainly for phones, where the spread is small */}
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => changeZoom(-1)}
          disabled={zoomIdx <= 0}
          aria-label="Thu nhỏ trang sách"
          title="Thu nhỏ trang sách"
        >
          <ZoomOut size={18} />
        </button>
        <span className="zoom-level">{zoom}×</span>
        <button
          className="zoom-btn"
          onClick={() => changeZoom(1)}
          disabled={zoomIdx >= ZOOM_STEPS.length - 1}
          aria-label="Phóng to trang sách"
          title="Phóng to trang sách"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      <style>{`
        .sketchbook-viewport {
          position: relative;
          width: 100%;
          flex: 1;
          min-height: 0;
        }

        .sketchbook-stage {
          position: absolute;
          inset: 0;
          display: flex;
          padding: 6px 12px;
          overflow: hidden;
          touch-action: manipulation;
          container-type: size;
          overscroll-behavior: contain;
        }

        .sketchbook-stage.zoomed {
          overflow: auto;
          touch-action: pan-x pan-y;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        .sketchbook-3d {
          position: relative;
          flex: none;
          margin: auto;
          /* Fit the stage (container units), then scale by the zoom level */
          width: calc(min(960px, 100cqw, 100cqh * 1.41935) * var(--book-zoom, 1));
          aspect-ratio: 1760 / 1240;
          perspective: 1800px;
          perspective-origin: 50% 46%;
        }

        .sketchbook-tilt {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
          will-change: transform;
        }

        .zoom-controls {
          position: absolute;
          right: 12px;
          bottom: 10px;
          z-index: 70;
          display: none;
          align-items: center;
          gap: 2px;
          padding: 3px;
          background: rgba(255, 252, 245, 0.92);
          border: 1px solid var(--hairline);
          border-radius: 999px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
          backdrop-filter: blur(8px);
        }

        .zoom-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: var(--ink);
          cursor: pointer;
        }

        .zoom-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .zoom-level {
          min-width: 34px;
          text-align: center;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 700;
          color: var(--earth);
        }

        /* Phones, small tablets and short landscape screens get the zoom controls */
        @media (max-width: 900px), (max-height: 560px) {
          .zoom-controls { display: flex; }
        }

        /* Night pages */
        .sketchbook-book.night {
          box-shadow: 0 6px 28px rgba(8, 12, 30, 0.45);
        }

        .night-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 17;
        }

        .night-lights {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 18;
          overflow: hidden;
        }

        .night-lamp {
          position: absolute;
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          mix-blend-mode: screen;
          animation: lampFlicker 4s ease-in-out infinite;
        }

        @keyframes lampFlicker {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        .night-star {
          position: absolute;
          border-radius: 50%;
          background: #f8fbff;
          box-shadow: 0 0 4px rgba(210, 225, 255, 0.9);
          animation: starTwinkle 3s ease-in-out infinite;
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .night-moon {
          position: absolute;
          left: 7%;
          top: 7%;
          width: 3.2%;
          aspect-ratio: 1;
          border-radius: 50%;
          box-shadow: inset -7px -3px 0 0 #f4ecd0;
          filter: drop-shadow(0 0 8px rgba(244, 236, 208, 0.6));
          transform: rotate(-20deg);
        }

        /* Surface Shadows */
        .sb-cast {
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .sb-cast.ambient {
          left: 4%;
          right: 4%;
          top: 25%;
          bottom: 2%;
          background: radial-gradient(50% 50% at 50% 58%, rgba(58,44,26,0.36) 0%, rgba(58,44,26,0.18) 42%, rgba(58,44,26,0) 75%);
          filter: blur(28px);
        }

        .sb-cast.contact {
          left: 8%;
          right: 8%;
          top: 60%;
          bottom: 8%;
          background: radial-gradient(50% 44% at 50% 45%, rgba(44,32,14,0.42) 0%, rgba(44,32,14,0.16) 50%, rgba(44,32,14,0) 78%);
          filter: blur(12px);
        }

        .sketchbook-book {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          overflow: hidden;
          cursor: crosshair;
          box-shadow: 0 4px 20px rgba(43,39,33,0.15);
          user-select: none;
          -webkit-user-select: none;
        }

        .scene-spread-img {
          width: 100%;
          height: 100%;
          object-fit: fill;
          display: block;
          user-select: none;
          pointer-events: none;
        }

        /* Debug Hitbox Ring */
        .debug-hitbox {
          position: absolute;
          transform: translate(-50%, -50%);
          border: 2px dashed rgba(217, 119, 6, 0.85);
          background: rgba(254, 240, 138, 0.22);
          border-radius: 50%;
          pointer-events: none;
          z-index: 24;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .debug-label {
          position: absolute;
          top: 100%;
          background: rgba(0, 0, 0, 0.82);
          color: #fef08a;
          font-family: var(--sans);
          font-size: 10.5px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 3px;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .debug-coord-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.85);
          color: #4ade80;
          font-family: monospace;
          font-size: 12px;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 4px;
          pointer-events: none;
          z-index: 80;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        /* Stamped ink circles when objects are discovered */
        .found-stamp-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 25;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: stampIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes stampIn {
          0% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }

        .stamp-circle {
          width: 44px;
          height: 44px;
          border: 2px dashed rgba(45, 122, 79, 0.85);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(45, 122, 79, 0.2) 0%, transparent 70%);
          box-shadow: 0 0 12px rgba(45, 122, 79, 0.45);
        }

        .stamp-label {
          margin-top: 4px;
          font-family: var(--display);
          font-size: 13px;
          color: var(--emerald);
          font-weight: 600;
          background: rgba(255, 255, 255, 0.92);
          padding: 1px 6px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          white-space: nowrap;
        }

        /* Hint Tier 3 Radar Pulse */
        .radar-ping-marker {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 20;
        }

        .radar-ripple {
          width: 60px;
          height: 60px;
          border: 2px solid var(--gold);
          border-radius: 50%;
          animation: radarWave 1.4s ease-out infinite;
        }

        @keyframes radarWave {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .radar-center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          transform: translate(-50%, -50%);
          background: var(--gold);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--gold);
        }

        /* 3D Page Turn Animation */
        .turn-leaf-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 48%, rgba(255,255,255,0.4) 50%, transparent 100%);
          animation: pageCurlSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes pageCurlSweep {
          0% { transform: translateX(100%) skewX(-15deg); opacity: 0.8; }
          100% { transform: translateX(-100%) skewX(-5deg); opacity: 0; }
        }

        @media (max-width: 640px) {
          .sketchbook-stage { padding: 4px; }
          .stamp-circle { width: 32px; height: 32px; }
          .stamp-label { font-size: 11px; }
          .debug-label { font-size: 9px; }
        }
      `}</style>
    </div>
  );
};
