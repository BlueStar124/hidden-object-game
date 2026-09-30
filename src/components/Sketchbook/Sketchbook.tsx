import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Loupe } from '../Loupe/Loupe';
import { HiddenObject } from '../../types/level';
import { SceneLayer } from '../Sprites/SceneLayer';
import { CamoTint, sampleCamoTints } from '../../game/CamoSampler';

interface SketchbookProps {
  sceneImage: string;
  nextSceneImage?: string;
  isTurning: boolean;
  foundObjects: HiddenObject[];
  allObjects?: HiddenObject[];
  debugMode?: boolean;
  radarPoint?: { x: number; y: number } | null;
  nudgeDirection?: { x: number; y: number } | null;
  onInspect: (nx: number, ny: number, screenPos: { x: number; y: number }) => void;
}

export const Sketchbook: React.FC<SketchbookProps> = ({
  sceneImage,
  isTurning,
  foundObjects,
  allObjects = [],
  debugMode = false,
  radarPoint,
  nudgeDirection,
  onInspect,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const [bookRect, setBookRect] = useState<DOMRect | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hoverCoords, setHoverCoords] = useState<{ nx: number; ny: number } | null>(null);
  const [camoTints, setCamoTints] = useState<Record<string, CamoTint>>({});

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

  // Update book dimensions on resize or image load
  const measureBook = useCallback(() => {
    if (bookRef.current) {
      setBookRect(bookRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    measureBook();
    window.addEventListener('resize', measureBook);
    return () => window.removeEventListener('resize', measureBook);
  }, [measureBook]);

  // Gentle 3D Tilt on mouse move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);

    setTilt({
      rx: -dy * 3.0,
      ry: dx * 4.5,
    });

    if (bookRef.current) {
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

  const handleDirectClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bookRef.current) return;
    const rect = bookRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const nx = clickX / rect.width;
    const ny = clickY / rect.height;

    onInspect(nx, ny, { x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={stageRef}
      className="sketchbook-stage"
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
            className={`sketchbook-book ${isTurning ? 'page-turning' : ''}`}
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

            {/* Found Objects Stamped Ink Rings */}
            {foundObjects.map((obj) => (
              <div
                key={obj.id}
                className="found-stamp-marker"
                style={{
                  left: `${(obj.x * 100).toFixed(2)}%`,
                  top: `${(obj.y * 100).toFixed(2)}%`,
                }}
              >
                <div className="stamp-circle" />
                <span className="stamp-label">{obj.name}</span>
              </div>
            ))}

            {/* Camouflaged animals and detective objects painted into the spread */}
            <SceneLayer
              sceneImage={sceneImage}
              objects={allObjects}
              foundIds={foundIds}
              tints={camoTints}
            />

            {/* Hint Tier 3: Radar Pulse Indicator */}
            {radarPoint && (
              <div
                className="radar-ping-marker"
                style={{
                  left: `${(radarPoint.x * 100).toFixed(2)}%`,
                  top: `${(radarPoint.y * 100).toFixed(2)}%`,
                }}
              >
                <div className="radar-ripple" />
                <div className="radar-center-dot" />
              </div>
            )}

            {/* 3D Page Turn Overlay Effect */}
            {isTurning && (
              <div className="turn-leaf-overlay">
                <div className="turning-page-curl" />
              </div>
            )}
          </div>
        </div>

        {/* The Interactive Loupe Magnifier */}
        <Loupe
          bookRect={bookRect}
          sceneImage={sceneImage}
          nudgeDirection={nudgeDirection}
          allObjects={allObjects}
          foundIds={foundIds}
          camoTints={camoTints}
          onInspect={onInspect}
        />

        {/* Live Coordinate Badge in Debug Mode */}
        {debugMode && hoverCoords && (
          <div className="debug-coord-badge">
            X: {hoverCoords.nx.toFixed(3)} | Y: {hoverCoords.ny.toFixed(3)}
          </div>
        )}
      </div>

      <style>{`
        .sketchbook-stage {
          position: relative;
          width: 100%;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          min-height: 0;
          overflow: hidden;
          touch-action: none;
        }

        .sketchbook-3d {
          position: relative;
          width: min(960px, 94vw, calc((100vh - 210px) * 1.41935));
          aspect-ratio: 1760 / 1240;
          perspective: 1800px;
          perspective-origin: 50% 46%;
          margin: 0 auto;
        }

        .sketchbook-tilt {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
          will-change: transform;
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
