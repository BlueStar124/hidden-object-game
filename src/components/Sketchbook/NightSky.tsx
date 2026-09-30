import React from 'react';
import { NightLight } from '../../types/level';

const W = 1760;
const H = 1240;

// Fixed star field in the upper part of the spread (normalized x, y, size)
const STARS: [number, number, number][] = [
  [0.06, 0.08, 1.2], [0.13, 0.16, 0.8], [0.21, 0.06, 1], [0.29, 0.13, 0.7], [0.36, 0.05, 1.3],
  [0.44, 0.11, 0.8], [0.57, 0.07, 1.1], [0.63, 0.15, 0.7], [0.71, 0.05, 0.9], [0.78, 0.12, 1.2],
  [0.86, 0.07, 0.8], [0.93, 0.14, 1], [0.1, 0.25, 0.7], [0.52, 0.2, 0.9], [0.9, 0.24, 0.7],
];

interface NightSkyProps {
  lights: NightLight[];
  beamRef: React.RefObject<SVGCircleElement>;
}

/**
 * Night pages: a dark wash over the spread with a hole wherever there is light — the
 * flashlight beam around the loupe (moved by the parent through `beamRef`) and the
 * page's lamps, which also get a coloured glow painted on top.
 */
export const NightSky: React.FC<NightSkyProps> = ({ lights, beamRef }) => (
  <>
    <svg className="night-overlay" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="night-beam">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.62" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <radialGradient id="night-lamp">
          <stop offset="0" stopColor="#5c5c5c" />
          <stop offset="0.5" stopColor="#a8a8a8" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id="night-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="#fff" />
          {lights.map((l, i) => (
            <circle key={i} cx={l.x * W} cy={l.y * H} r={l.r * W * 1.15} fill="url(#night-lamp)" />
          ))}
          <circle ref={beamRef} cx={W / 2} cy={H / 2} r={140} fill="url(#night-beam)" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="#0b1026" fillOpacity="0.88" mask="url(#night-mask)" />
    </svg>

    <div className="night-lights" aria-hidden="true">
      <div className="night-moon" />
      {STARS.map(([x, y, s], i) => (
        <span
          key={`star-${i}`}
          className="night-star"
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: `${s * 3}px`,
            height: `${s * 3}px`,
            animationDelay: `${(i * 0.37) % 3}s`,
          }}
        />
      ))}
      {lights.map((l, i) => (
        <span
          key={`lamp-${i}`}
          className="night-lamp"
          style={{
            left: `${l.x * 100}%`,
            top: `${l.y * 100}%`,
            width: `${l.r * 200}%`,
            background: `radial-gradient(circle, ${l.color} 0%, transparent 70%)`,
            animationDelay: `${(i * 0.53) % 4}s`,
          }}
        />
      ))}
    </div>
  </>
);
