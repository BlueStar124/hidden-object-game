import React from 'react';
import type { SpriteType } from '../../app/src/core/model';
import './sprites.css';

export type { SpriteType };

interface ObjectSpriteProps {
  type?: SpriteType;
  isFound?: boolean;
  isSecret?: boolean;
  className?: string;
}

/*
 * Drawing conventions (used by the camouflage styles in sprites.css):
 * - outlines use INK strokes; colored areas use fills
 * - `.paint`  → a colored *stroke* used as paint (tails, limbs, shafts); camouflage treats it like a fill
 * - `.eye`    → blinks every few seconds while hidden; `.pupil` stays dark under camouflage;
 *               on night pages the eyes glow in the dark
 * - `.glow-spot` → glows in the dark on night pages (firefly lantern)
 * - `.wing` / `.tail` / `.wave` → flutter / wag / wave once the creature has been found
 */
const INK = '#2c241b';

/** Spiky outline: alternates between an outer and inner ellipse (durian shell). */
function spikyEllipse(cx: number, cy: number, rx: number, ry: number, spikes: number, len: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI * i) / spikes;
    const grow = i % 2 === 0 ? len : 0;
    pts.push(`${(cx + (rx + grow) * Math.cos(a)).toFixed(2)} ${(cy + (ry + grow) * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

/** Little "^" thorns scattered inside an ellipse (durian husk texture). */
function thornTexture(cx: number, cy: number, rx: number, ry: number, step: number) {
  let d = '';
  for (let y = cy - ry + step; y < cy + ry - step / 2; y += step) {
    const row = Math.round((y - cy) / step);
    for (let x = cx - rx + step / 2 + (row % 2 ? step / 2 : 0); x < cx + rx; x += step) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 0.72) continue;
      d += `M ${(x - 1.3).toFixed(1)} ${(y + 0.9).toFixed(1)} L ${x.toFixed(1)} ${(y - 1).toFixed(1)} L ${(x + 1.3).toFixed(1)} ${(y + 0.9).toFixed(1)} `;
    }
  }
  return d;
}

const DURIAN_SHELL = spikyEllipse(24, 27, 11.5, 13.5, 18, 2.4);
const DURIAN_THORNS = thornTexture(24, 27, 11.5, 13.5, 4.2);

/** Outlined limb: a dark stroke with a thinner colored stroke on top. */
const Limb: React.FC<{ d: string; color: string; w?: number; className?: string }> = ({
  d,
  color,
  w = 3.4,
  className = '',
}) => (
  <g className={className}>
    <path d={d} stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path
      d={d}
      className="paint"
      stroke={color}
      strokeWidth={Math.max(0.8, w - 1.6)}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </g>
);

export const ObjectSprite: React.FC<ObjectSpriteProps> = ({
  type = 'key',
  isFound = false,
  isSecret = false,
  className = '',
}) => {
  const renderSvg = () => {
    switch (type) {
      case 'cat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Calico Cat Sitting */}
            <path
              d="M 32 40 C 38 40 42 36 42 30 C 42 22 36 20 30 20 C 26 20 22 22 20 26 C 18 30 18 38 24 40 Z"
              fill="#e69d45"
              stroke="#2c241b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* White chest patch */}
            <path
              d="M 22 28 C 24 24 28 24 30 28 C 29 34 25 38 23 39 Z"
              fill="#faf6ee"
            />
            {/* Calico dark spot */}
            <path
              d="M 34 24 C 38 26 40 31 38 34 C 35 34 32 30 33 26 Z"
              fill="#523927"
            />
            {/* Cat Head */}
            <circle cx="22" cy="18" r="9" fill="#e69d45" stroke="#2c241b" strokeWidth="2" />
            {/* White muzzle */}
            <ellipse cx="22" cy="21" rx="4.5" ry="3.5" fill="#faf6ee" />
            {/* Nose & Mouth */}
            <path d="M 21 20 L 23 20 L 22 21.5 Z" fill="#d9777f" />
            <path d="M 22 21.5 Q 20 23 18.5 22.5 M 22 21.5 Q 24 23 25.5 22.5" stroke="#2c241b" strokeWidth="1.2" strokeLinecap="round" />
            {/* Eyes */}
            <g className="eye">
              <ellipse className="pupil" cx="18.5" cy="16.5" rx="1.6" ry="2.2" fill="#2d7a4f" />
              <circle cx="18.8" cy="15.8" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <ellipse className="pupil" cx="25.5" cy="16.5" rx="1.6" ry="2.2" fill="#2d7a4f" />
              <circle cx="25.8" cy="15.8" r="0.6" fill="#ffffff" />
            </g>
            {/* Ears */}
            <path d="M 14 14 L 13 6 L 19 11 Z" fill="#e69d45" stroke="#2c241b" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 14.5 12 L 14 8 L 18 11 Z" fill="#f2a8b0" />
            <path d="M 30 14 L 31 6 L 25 11 Z" fill="#e69d45" stroke="#2c241b" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 29.5 12 L 30 8 L 26 11 Z" fill="#f2a8b0" />
            {/* Tail */}
            <g className="tail tail-cat">
              <path
                className="paint"
                d="M 36 38 C 42 38 45 32 44 26 C 43 23 40 23 40 25 C 40 28 38 34 32 35"
                stroke="#e69d45"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 36 38 C 42 38 45 32 44 26 C 43 23 40 23 40 25 C 40 28 38 34 32 35"
                stroke="#2c241b"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Whiskers */}
            <path d="M 16 20 L 9 19 M 16 21.5 L 10 22.5 M 28 20 L 35 19 M 28 21.5 L 34 22.5" stroke="#2c241b" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );

      case 'dog':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cute Puppy Sitting */}
            <ellipse cx="26" cy="32" rx="10" ry="11" fill="#df9b52" stroke="#2c241b" strokeWidth="2" />
            <ellipse cx="25" cy="33" rx="6" ry="7" fill="#faf4e8" />
            {/* Head */}
            <circle cx="24" cy="18" r="10" fill="#df9b52" stroke="#2c241b" strokeWidth="2" />
            <ellipse cx="24" cy="22" rx="5.5" ry="4.5" fill="#faf4e8" />
            {/* Floppy Ears */}
            <path d="M 15 13 C 11 15 9 22 12 25 C 14 26 16 23 16 19 Z" fill="#a46128" stroke="#2c241b" strokeWidth="1.8" />
            <path d="M 33 13 C 37 15 39 22 36 25 C 34 26 32 23 32 19 Z" fill="#a46128" stroke="#2c241b" strokeWidth="1.8" />
            {/* Eyes */}
            <g className="eye">
              <circle className="pupil" cx="19.5" cy="16.5" r="1.8" fill="#2c241b" />
              <circle cx="20" cy="15.8" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="28.5" cy="16.5" r="1.8" fill="#2c241b" />
              <circle cx="29" cy="15.8" r="0.6" fill="#ffffff" />
            </g>
            {/* Nose & Tongue */}
            <ellipse className="pupil" cx="24" cy="20.5" rx="2" ry="1.4" fill="#2c241b" />
            <path d="M 23 23 Q 24 26 25 23" fill="#ea7070" stroke="#2c241b" strokeWidth="1" />
            {/* Red Collar */}
            <rect x="18" y="26" width="12" height="3" rx="1.5" fill="#c2410c" stroke="#2c241b" strokeWidth="1.2" />
            <circle cx="24" cy="29" r="1.2" fill="#eab308" />
            {/* Paws */}
            <ellipse cx="19" cy="41" rx="3.5" ry="2.2" fill="#faf4e8" stroke="#2c241b" strokeWidth="1.6" />
            <ellipse cx="29" cy="41" rx="3.5" ry="2.2" fill="#faf4e8" stroke="#2c241b" strokeWidth="1.6" />
          </svg>
        );

      case 'owl':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Detective Owl */}
            <ellipse cx="24" cy="27" rx="12" ry="14" fill="#8c6239" stroke="#2c241b" strokeWidth="2" />
            {/* Belly feathers */}
            <ellipse cx="24" cy="30" rx="7.5" ry="9" fill="#f5ede0" stroke="#2c241b" strokeWidth="1.4" />
            <path d="M 21 26 Q 24 28 27 26 M 20 30 Q 24 32 28 30 M 21 34 Q 24 36 27 34" stroke="#a17a53" strokeWidth="1.5" strokeLinecap="round" />
            {/* Ear Tufts */}
            <path d="M 14 16 L 11 6 L 19 12 Z" fill="#8c6239" stroke="#2c241b" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 34 16 L 37 6 L 29 12 Z" fill="#8c6239" stroke="#2c241b" strokeWidth="1.8" strokeLinejoin="round" />
            {/* Big Golden Eyes */}
            <g className="eye">
              <circle cx="18" cy="18" r="5" fill="#f59e0b" stroke="#2c241b" strokeWidth="1.8" />
              <circle className="pupil" cx="18" cy="18" r="2.8" fill="#1c1917" />
              <circle cx="17.2" cy="16.8" r="1" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="30" cy="18" r="5" fill="#f59e0b" stroke="#2c241b" strokeWidth="1.8" />
              <circle className="pupil" cx="30" cy="18" r="2.8" fill="#1c1917" />
              <circle cx="29.2" cy="16.8" r="1" fill="#ffffff" />
            </g>
            {/* Beak */}
            <path d="M 22.5 19 L 25.5 19 L 24 23 Z" fill="#ea580c" stroke="#2c241b" strokeWidth="1.2" />
            {/* Perch Claws */}
            <path d="M 18 41 L 18 44 M 20 41 L 20 44 M 28 41 L 28 44 M 30 41 L 30 44" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'dove':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* White Dove / Pigeon */}
            <path
              d="M 12 30 C 8 26 10 18 16 16 C 22 14 26 18 32 20 C 38 22 44 20 42 28 C 40 34 32 36 24 36 C 18 36 14 34 12 30 Z"
              fill="#ffffff"
              stroke="#2c241b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Wing */}
            <path
              className="wing wing-dove"
              d="M 18 22 C 22 18 28 18 32 24 C 28 30 22 30 18 26 Z"
              fill="#e2e8f0"
              stroke="#2c241b"
              strokeWidth="1.6"
            />
            {/* Head */}
            <circle cx="37" cy="17" r="5.5" fill="#ffffff" stroke="#2c241b" strokeWidth="1.8" />
            {/* Eye */}
            <g className="eye">
              <circle className="pupil" cx="38" cy="16" r="1.3" fill="#dc2626" />
              <circle cx="38.3" cy="15.7" r="0.4" fill="#ffffff" />
            </g>
            {/* Beak */}
            <path d="M 42 17 L 46 18 L 42 19.5 Z" fill="#f97316" stroke="#2c241b" strokeWidth="1" />
            {/* Olive Leaf in Beak */}
            <path d="M 45 18 C 46 15 48 15 47 17 C 46 19 44 19 45 18 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          </svg>
        );

      case 'butterfly':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Emerald Butterfly */}
            <g className="wing wing-l">
              <path
                d="M 24 22 C 20 12 10 10 8 16 C 6 22 14 28 23 25 Z"
                fill="#10b981"
                stroke="#064e3b"
                strokeWidth="1.8"
              />
              <path
                d="M 23 25 C 16 28 10 34 14 38 C 18 42 23 34 24 28 Z"
                fill="#059669"
                stroke="#064e3b"
                strokeWidth="1.6"
              />
              <circle cx="16" cy="18" r="2.5" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
              <circle cx="18" cy="33" r="1.5" fill="#fde047" />
            </g>
            <g className="wing wing-r">
              <path
                d="M 24 22 C 28 12 38 10 40 16 C 42 22 34 28 25 25 Z"
                fill="#10b981"
                stroke="#064e3b"
                strokeWidth="1.8"
              />
              <path
                d="M 25 25 C 32 28 38 34 34 38 C 30 42 25 34 24 28 Z"
                fill="#059669"
                stroke="#064e3b"
                strokeWidth="1.6"
              />
              <circle cx="32" cy="18" r="2.5" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
              <circle cx="30" cy="33" r="1.5" fill="#fde047" />
            </g>
            {/* Body */}
            <ellipse cx="24" cy="25" rx="1.8" ry="7" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
            {/* Antennae */}
            <path d="M 23 18 Q 20 12 17 11 M 25 18 Q 28 12 31 11" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="17" cy="11" r="1" fill="#f59e0b" />
            <circle cx="31" cy="11" r="1" fill="#f59e0b" />
          </svg>
        );

      case 'squirrel':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Squirrel with Bushy Tail */}
            <path
              className="tail tail-squirrel"
              d="M 28 36 C 36 38 42 32 40 22 C 38 10 26 8 26 14 C 26 18 34 18 34 24 C 34 30 28 32 24 33"
              fill="#b45309"
              stroke="#2c241b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Body */}
            <ellipse cx="20" cy="30" rx="7" ry="9" fill="#d97706" stroke="#2c241b" strokeWidth="2" />
            <ellipse cx="18" cy="31" rx="4" ry="6" fill="#fef3c7" />
            {/* Head */}
            <circle cx="17" cy="18" r="6" fill="#d97706" stroke="#2c241b" strokeWidth="1.8" />
            {/* Ear */}
            <path d="M 18 13 L 20 8 L 22 13 Z" fill="#b45309" stroke="#2c241b" strokeWidth="1.2" />
            {/* Eye */}
            <g className="eye">
              <circle className="pupil" cx="15" cy="17" r="1.3" fill="#1c1917" />
              <circle cx="15.3" cy="16.7" r="0.4" fill="#ffffff" />
            </g>
            {/* Snout */}
            <ellipse cx="12" cy="19" rx="1.5" ry="1.2" fill="#b45309" />
            {/* Acorn held in paws */}
            <ellipse cx="12" cy="27" rx="2.5" ry="3.2" fill="#78350f" stroke="#2c241b" strokeWidth="1" />
            <path d="M 10 25 Q 12 23 14 25" fill="#451a03" stroke="#2c241b" strokeWidth="0.8" />
          </svg>
        );

      case 'turtle':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Pond Turtle */}
            <path d="M 15 18 C 10 14 8 16 11 20 Z" fill="#4d7c0f" stroke="#2c241b" strokeWidth="1.2" />
            <path d="M 33 18 C 38 14 40 16 37 20 Z" fill="#4d7c0f" stroke="#2c241b" strokeWidth="1.2" />
            <path d="M 15 32 C 10 35 9 37 12 36 Z" fill="#4d7c0f" stroke="#2c241b" strokeWidth="1.2" />
            <path d="M 33 32 C 38 35 39 37 36 36 Z" fill="#4d7c0f" stroke="#2c241b" strokeWidth="1.2" />
            {/* Head */}
            <ellipse cx="24" cy="12" rx="3.5" ry="4.5" fill="#65a30d" stroke="#2c241b" strokeWidth="1.6" />
            <circle className="eye pupil" cx="22" cy="11" r="0.7" fill="#1c1917" />
            <circle className="eye pupil" cx="26" cy="11" r="0.7" fill="#1c1917" />
            {/* Shell */}
            <ellipse cx="24" cy="26" rx="11" ry="13" fill="#365314" stroke="#2c241b" strokeWidth="2" />
            <ellipse cx="24" cy="26" rx="6" ry="8" fill="#4d7c0f" stroke="#1c1917" strokeWidth="1.2" />
            <path className="paint" d="M 24 18 L 24 34 M 18 22 L 30 22 M 18 30 L 30 30" stroke="#a3e635" strokeWidth="1" />
          </svg>
        );

      case 'key':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Antique Golden Key */}
            <g transform="rotate(-35 24 24)">
              <circle cx="16" cy="24" r="8" fill="#eab308" stroke="#78350f" strokeWidth="2" />
              <circle cx="16" cy="24" r="4.5" fill="#fffbeb" stroke="#78350f" strokeWidth="1.6" />
              <circle cx="16" cy="24" r="2" fill="#b45309" />
              <rect x="23" y="22.5" width="18" height="3" rx="1.5" fill="#eab308" stroke="#78350f" strokeWidth="1.6" />
              <path d="M 36 25 L 36 31 L 39 31 L 39 25 Z" fill="#eab308" stroke="#78350f" strokeWidth="1.4" />
              <path d="M 31 25 L 31 29 L 33.5 29 L 33.5 25 Z" fill="#eab308" stroke="#78350f" strokeWidth="1.4" />
            </g>
          </svg>
        );

      case 'compass':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vintage Brass Compass */}
            <circle cx="24" cy="8" r="4.5" fill="none" stroke="#b45309" strokeWidth="2" />
            <circle cx="24" cy="26" r="16" fill="#d97706" stroke="#78350f" strokeWidth="2.2" />
            <circle cx="24" cy="26" r="13" fill="#fef3c7" stroke="#92400e" strokeWidth="1.4" />
            <circle cx="24" cy="26" r="11" stroke="#b45309" strokeWidth="0.8" strokeDasharray="2 3" />
            <polygon points="24,15 26.5,26 24,24.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
            <polygon points="24,15 21.5,26 24,24.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            <polygon points="24,37 26.5,26 24,27.5" fill="#2563eb" stroke="#1e40af" strokeWidth="0.8" />
            <polygon points="24,37 21.5,26 24,27.5" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.8" />
            <circle cx="24" cy="26" r="2.2" fill="#eab308" stroke="#78350f" strokeWidth="1" />
          </svg>
        );

      case 'letter':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Wax-sealed Envelope */}
            <g transform="rotate(8 24 24)">
              <rect x="8" y="14" width="32" height="22" rx="2" fill="#fbf0d9" stroke="#78350f" strokeWidth="1.8" />
              <path d="M 8 15 L 24 27 L 40 15" stroke="#92400e" strokeWidth="1.6" strokeLinejoin="round" />
              <path className="paint" d="M 8 35 L 18 24 M 40 35 L 30 24" stroke="#d6c3a5" strokeWidth="1.2" />
              <circle cx="24" cy="27" r="4.5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.2" />
              <circle cx="24" cy="27" r="2.5" fill="#b91c1c" />
              <path className="paint" d="M 23 26 L 25 28 M 25 26 L 23 28" stroke="#fca5a5" strokeWidth="0.8" />
            </g>
          </svg>
        );

      case 'pocket-watch':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Antique Pocket Watch */}
            <rect x="22" y="5" width="4" height="4" fill="#d97706" stroke="#78350f" strokeWidth="1" />
            <circle cx="24" cy="6" r="4" fill="none" stroke="#78350f" strokeWidth="1.8" />
            <circle cx="24" cy="27" r="16" fill="#f59e0b" stroke="#78350f" strokeWidth="2.2" />
            <circle cx="24" cy="27" r="12.5" fill="#fffbeb" stroke="#b45309" strokeWidth="1.4" />
            <circle cx="24" cy="18" r="0.8" fill="#78350f" />
            <circle cx="33" cy="27" r="0.8" fill="#78350f" />
            <circle cx="24" cy="36" r="0.8" fill="#78350f" />
            <circle cx="15" cy="27" r="0.8" fill="#78350f" />
            <line x1="24" y1="27" x2="24" y2="20" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="24" y1="27" x2="29" y2="25" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="24" cy="27" r="1.5" fill="#b45309" />
          </svg>
        );

      case 'quill':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Inkwell and Feather Quill */}
            <path d="M 12 36 L 14 26 L 24 26 L 26 36 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
            <rect x="15" y="23" width="8" height="3" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
            <rect x="15" y="28" width="8" height="5" fill="#f8fafc" rx="1" />
            <line x1="16" y1="30.5" x2="22" y2="30.5" stroke="#64748b" strokeWidth="0.8" />
            <path
              d="M 19 25 C 24 16 34 8 42 6 C 40 14 34 22 28 26 Z"
              fill="#f8fafc"
              stroke="#475569"
              strokeWidth="1.4"
            />
            <path className="paint" d="M 17 28 L 38 8" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );

      case 'teacup':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vintage Porcelain Teacup & Saucer */}
            <ellipse cx="24" cy="38" rx="15" ry="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1.6" />
            <ellipse cx="24" cy="38" rx="10" ry="2" fill="#e2e8f0" />
            <path
              d="M 13 22 C 13 32 17 36 24 36 C 31 36 35 32 35 22 Z"
              fill="#ffffff"
              stroke="#334155"
              strokeWidth="1.8"
            />
            <path d="M 19 28 Q 24 32 29 28 M 24 26 L 24 30" stroke="#1d4ed8" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 34 24 C 40 24 40 32 33 33" stroke="#334155" strokeWidth="1.8" fill="none" />
            <path className="paint" d="M 20 18 Q 18 13 21 8 M 27 18 Q 29 13 26 8" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'coin-pouch':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Leather Coin Pouch */}
            <path
              d="M 15 22 C 12 28 12 38 18 41 C 24 43 30 43 34 40 C 39 36 38 28 35 22 Z"
              fill="#78350f"
              stroke="#451a03"
              strokeWidth="2"
            />
            <path d="M 16 22 Q 24 25 34 22 L 36 17 Q 25 15 14 17 Z" fill="#92400e" stroke="#451a03" strokeWidth="1.6" />
            <path className="paint" d="M 15 22 Q 25 24 35 22" stroke="#eab308" strokeWidth="1.8" />
            <circle cx="28" cy="31" r="3.5" fill="#facc15" stroke="#854d0e" strokeWidth="1.2" />
            <circle cx="22" cy="33" r="3.2" fill="#eab308" stroke="#854d0e" strokeWidth="1.2" />
          </svg>
        );

      case 'spyglass':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Brass Spyglass Nautical Telescope */}
            <g transform="rotate(-30 24 24)">
              <rect x="7" y="21.5" width="6" height="5" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
              <rect x="13" y="20.5" width="8" height="7" fill="#d97706" stroke="#78350f" strokeWidth="1.4" />
              <rect x="21" y="19" width="10" height="10" fill="#f59e0b" stroke="#78350f" strokeWidth="1.6" />
              <rect x="31" y="17" width="12" height="14" rx="1.5" fill="#d97706" stroke="#78350f" strokeWidth="1.8" />
              <path className="paint" d="M 40 18 L 42 20 M 41 23 L 42 24" stroke="#93c5fd" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'vase':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Porcelain Blue & White Vase */}
            <ellipse cx="24" cy="11" rx="6" ry="2" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.4" />
            <path
              d="M 19 12 C 19 16 14 20 14 27 C 14 36 19 39 24 39 C 29 39 34 36 34 27 C 34 20 29 16 29 12 Z"
              fill="#ffffff"
              stroke="#1e3a8a"
              strokeWidth="2"
            />
            <path d="M 18 24 Q 24 20 30 24 M 18 30 Q 24 34 30 30" stroke="#2563eb" strokeWidth="1.6" fill="none" />
            <circle cx="24" cy="27" r="2.5" fill="#3b82f6" />
            <rect x="20" y="39" width="8" height="2" fill="#1e3a8a" />
          </svg>
        );

      case 'scroll':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ancient Papyrus Scroll */}
            <g transform="rotate(15 24 24)">
              <rect x="14" y="10" width="20" height="28" rx="2" fill="#fef3c7" stroke="#78350f" strokeWidth="1.6" />
              <ellipse cx="24" cy="10" rx="10" ry="2.5" fill="#fde68a" stroke="#78350f" strokeWidth="1.4" />
              <ellipse cx="24" cy="38" rx="10" ry="2.5" fill="#d97706" stroke="#78350f" strokeWidth="1.4" />
              <line x1="18" y1="18" x2="30" y2="18" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="18" y1="23" x2="28" y2="23" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="18" y1="28" x2="29" y2="28" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="31" cy="32" r="3" fill="#dc2626" />
            </g>
          </svg>
        );

      case 'magnifying-glass':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Mini Pocket Magnifier */}
            <circle cx="20" cy="20" r="11" fill="rgba(219, 234, 254, 0.4)" stroke="#b45309" strokeWidth="2.2" />
            <circle cx="20" cy="20" r="8.5" stroke="#d97706" strokeWidth="1.2" strokeDasharray="1 2" />
            <line x1="28" y1="28" x2="41" y2="41" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
            <line className="paint" x1="28" y1="28" x2="31" y2="31" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
            <path className="paint" d="M 14 15 Q 16 13 19 13" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      /* ---------------- Sinh vật & đồ vật ẩn nấp ---------------- */

      case 'gecko':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* House gecko (cicak) seen from above */}
            <Limb d="M 21.2 17 L 16.5 15.6 L 14 11.6" color="#d4b483" />
            <Limb d="M 26.8 17 L 31.5 15.6 L 34 11.6" color="#d4b483" />
            <Limb d="M 21 28 L 16 29.2 L 13.6 33.6" color="#d4b483" />
            <Limb d="M 27 28 L 32 29.2 L 34.4 33.6" color="#d4b483" />
            <circle cx="13.8" cy="11" r="1.5" fill="#d4b483" stroke={INK} strokeWidth="1" />
            <circle cx="34.2" cy="11" r="1.5" fill="#d4b483" stroke={INK} strokeWidth="1" />
            <circle cx="13.3" cy="34.2" r="1.5" fill="#d4b483" stroke={INK} strokeWidth="1" />
            <circle cx="34.7" cy="34.2" r="1.5" fill="#d4b483" stroke={INK} strokeWidth="1" />
            <path
              className="tail"
              d="M 24 4 C 27 4 28.6 6.8 28.2 9.6 C 27.9 11.8 26.6 13 26.2 14.4 C 28.4 17 28.6 23 27.4 27.6 C 26.8 30 26.2 31.2 26.4 33.2 C 26.8 37.4 29.6 40.8 33.6 43 C 34.4 43.5 34 44.6 33 44.5 C 28 44 23.4 39.6 22.4 34 C 22 31.6 21.4 30 20.8 27.6 C 19.6 23 19.8 17 21.8 14.4 C 21.4 13 20.1 11.8 19.8 9.6 C 19.4 6.8 21 4 24 4 Z"
              fill="#d4b483"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="19" r="1.1" fill="#9c7a4b" />
            <circle cx="22.8" cy="23.4" r="0.9" fill="#9c7a4b" />
            <circle cx="25.3" cy="25" r="0.9" fill="#9c7a4b" />
            <circle cx="24" cy="28.6" r="0.8" fill="#9c7a4b" />
            <path className="paint" d="M 24.2 33.5 L 26 33.2 M 25.4 37 L 27.3 36.4 M 27.6 40.2 L 29.4 39.4" stroke="#9c7a4b" strokeWidth="1.1" strokeLinecap="round" />
            <circle className="eye pupil" cx="21.5" cy="8.4" r="1.1" fill={INK} />
            <circle className="eye pupil" cx="26.5" cy="8.4" r="1.1" fill={INK} />
          </svg>
        );

      case 'chameleon':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chameleon walking, curled tail */}
            <Limb className="tail" d="M 13 27.5 C 7 29 4.5 34 6.5 38.5 C 8.5 42.5 14 41.5 14 37.5 C 14 34.8 10.8 34 9.8 36.2 C 9 38 11 39.2 11.8 38" color="#7fb069" w={3.8} />
            <Limb d="M 17 30 L 15.5 34.5 L 17.5 38.6" color="#7fb069" />
            <Limb d="M 30 29.5 L 32 34 L 30.5 38.6" color="#7fb069" />
            <path d="M 15.6 38.8 L 19.6 38.6 M 28.4 38.8 L 32.6 38.6" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <path
              d="M 12 29 C 11 22 16 15.5 24 15.5 C 29 15.5 32 17 34 18 C 35 15.5 37.5 13.5 40 14.5 C 41.5 17.5 43 21 44 24 C 42 26 38.5 26.5 35.5 26 C 33 29 28 31 22 31 C 17 31 13.5 30.5 12 29 Z"
              fill="#7fb069"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 20 16.6 C 19 21 19.5 26 21 30.6 M 27 16 C 26 21 26.5 26 28 30.4" stroke="#d6e6a3" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 36 25.6 C 38.5 25.2 41 24.8 43.4 23.8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="37.2" cy="19.6" r="3.3" fill="#9cc27f" stroke={INK} strokeWidth="1.3" />
              <circle className="pupil" cx="37.9" cy="19.5" r="1.3" fill={INK} />
            </g>
          </svg>
        );

      case 'frog':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Little frog sitting */}
            <ellipse cx="11.5" cy="35" rx="5" ry="3.8" fill="#8fbf5a" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="36.5" cy="35" rx="5" ry="3.8" fill="#8fbf5a" stroke={INK} strokeWidth="1.5" />
            <path
              d="M 11 37.5 C 9 30 13 22.5 24 22.5 C 35 22.5 39 30 37 37.5 C 33 40.5 15 40.5 11 37.5 Z"
              fill="#8fbf5a"
              stroke={INK}
              strokeWidth="1.8"
            />
            <ellipse cx="24" cy="33" rx="7" ry="5.2" fill="#e5efc4" />
            <ellipse cx="24" cy="22.5" rx="12" ry="7.5" fill="#8fbf5a" stroke={INK} strokeWidth="1.8" />
            <Limb d="M 17.5 30 L 16.5 38.5" color="#8fbf5a" w={3.2} />
            <Limb d="M 30.5 30 L 31.5 38.5" color="#8fbf5a" w={3.2} />
            <path d="M 13.5 39.8 L 19.5 39.8 M 28.5 39.8 L 34.5 39.8" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="16" cy="21" r="1.2" fill="#5f8f3a" />
            <circle cx="31.5" cy="20.5" r="1" fill="#5f8f3a" />
            <path d="M 16 25.5 Q 24 30 32 25.5" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="22" cy="21.2" r="0.6" fill={INK} />
            <circle cx="26" cy="21.2" r="0.6" fill={INK} />
            <g className="eye">
              <circle cx="16.5" cy="15.5" r="4.3" fill="#8fbf5a" stroke={INK} strokeWidth="1.6" />
              <ellipse className="pupil" cx="16.5" cy="15.6" rx="2.2" ry="1.5" fill={INK} />
              <circle cx="15.7" cy="14.7" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="31.5" cy="15.5" r="4.3" fill="#8fbf5a" stroke={INK} strokeWidth="1.6" />
              <ellipse className="pupil" cx="31.5" cy="15.6" rx="2.2" ry="1.5" fill={INK} />
              <circle cx="30.7" cy="14.7" r="0.6" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'snail':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Garden snail, head to the left */}
            <path
              d="M 4.5 39 C 5 35 7.5 31.5 11 31.5 C 13 31.5 14 33 15 35 L 38 35.5 C 41.5 35.8 44 37.4 44.5 39.5 C 31 41 17 41 4.5 39 Z"
              fill="#cdb99a"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <Limb d="M 8.6 32.4 L 6.6 24.6" color="#cdb99a" w={2.6} />
            <Limb d="M 11.6 32.2 L 12.2 25" color="#cdb99a" w={2.6} />
            <circle className="eye pupil" cx="6.4" cy="23.8" r="1.4" fill={INK} />
            <circle className="eye pupil" cx="12.3" cy="24.2" r="1.4" fill={INK} />
            <circle cx="27" cy="25" r="11" fill="#d49a5a" stroke={INK} strokeWidth="1.8" />
            <path
              d="M 27 25 C 27 22.5 30.5 22.5 30.5 25.5 C 30.5 29 25.5 29.5 24 26 C 22.5 22 26 17.5 30.5 18.5 C 35 19.5 36.5 25 34.5 29 C 32.5 33 26 34.5 21.5 31.5"
              stroke="#8a5a2b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path className="paint" d="M 19 19.5 C 21 17 24 15.5 27.5 15.4" stroke="#f0c48f" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        );

      case 'ladybug':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ladybug from above */}
            <path
              d="M 12.5 22 L 8.8 20.4 M 12 28 L 8.2 28.6 M 13.2 34 L 10 36.6 M 35.5 22 L 39.2 20.4 M 36 28 L 39.8 28.6 M 34.8 34 L 38 36.6"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M 21 9.5 Q 19 5.5 16.5 5 M 27 9.5 Q 29 5.5 31.5 5" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="24" cy="13" rx="6.5" ry="5" fill="#2c241b" />
            <circle cx="21.4" cy="11.8" r="1.2" fill="#fdf6e3" />
            <circle cx="26.6" cy="11.8" r="1.2" fill="#fdf6e3" />
            <circle cx="24" cy="26.5" r="12" fill="#d9412b" stroke={INK} strokeWidth="1.8" />
            <path d="M 24 15 L 24 38.5" stroke={INK} strokeWidth="1.4" />
            <circle cx="18.6" cy="22" r="2.4" fill="#2c241b" />
            <circle cx="29.4" cy="22" r="2.4" fill="#2c241b" />
            <circle cx="17.4" cy="30" r="2" fill="#2c241b" />
            <circle cx="30.6" cy="30" r="2" fill="#2c241b" />
            <circle cx="20.8" cy="35.2" r="1.4" fill="#2c241b" />
            <circle cx="27.2" cy="35.2" r="1.4" fill="#2c241b" />
            <path className="paint" d="M 16 19.2 Q 18 16.4 21 16" stroke="#f3a08e" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'mouse':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Field mouse, nose to the left */}
            <Limb className="tail" d="M 35.4 33.4 C 41 34 44 30 42.5 26 C 41.5 23.5 38.5 24 39 26.5" color="#e3b3b6" w={2.4} />
            <path
              d="M 5 29.5 C 8 27.5 11 23 16 21.5 C 20 20 26 19.5 31 22.5 C 36 25.5 37.5 31 35.5 34.5 C 34 36.8 30 37 26 37 L 15 37 C 12 37 11 35.5 10.5 34 C 8.5 32.5 6.5 31.3 5 29.5 Z"
              fill="#a89f94"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 12 33.6 C 16 35.4 22 35.6 27 34.4" stroke="#d9d2c8" strokeWidth="1.6" strokeLinecap="round" className="paint" />
            <circle cx="17.5" cy="19.5" r="4.8" fill="#a89f94" stroke={INK} strokeWidth="1.5" />
            <circle cx="17.6" cy="19.6" r="2.8" fill="#e8b4b8" />
            <g className="eye">
              <circle className="pupil" cx="12.2" cy="25.6" r="1.3" fill={INK} />
              <circle cx="12.5" cy="25.2" r="0.4" fill="#ffffff" />
            </g>
            <circle cx="5.3" cy="29.4" r="1.2" fill="#e0868f" stroke={INK} strokeWidth="0.8" />
            <path d="M 8 28 L 2.5 26.4 M 8 29.6 L 2.6 30.6" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
            <ellipse cx="15" cy="37.4" rx="2.6" ry="1.2" fill="#e8b4b8" stroke={INK} strokeWidth="1" />
            <ellipse cx="28" cy="37.4" rx="2.6" ry="1.2" fill="#e8b4b8" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'koi':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Koi fish, head to the right */}
            <path
              className="tail"
              d="M 8 24 C 5 20 2.5 18 1.5 17.5 C 2.8 21 3 26 1.5 30.5 C 3.5 29.5 6 27.5 8 24 Z"
              fill="#f08a4b"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 20 17 C 23 12.5 28 12.5 31 17.8 Z" fill="#f08a4b" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path
              d="M 6.5 24 C 12 16 26 14 34 19 C 37 20.5 39.5 22.5 41 24 C 39.5 26 37 27.5 34 29 C 26 34 12 32 6.5 24 Z"
              fill="#fbf5ea"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 17 18.4 C 21.5 16 27 16.6 29.6 20 C 26.4 23.6 20.6 23.4 17 18.4 Z" fill="#e8743b" />
            <path d="M 12 26.5 C 15 29 20 30 23 29 C 20 26.5 15.5 25.5 12 26.5 Z" fill="#e8743b" />
            <path d="M 33.4 20 C 36 21 38.4 22.8 39.2 24 C 36.6 25 34.4 23.8 33.4 20 Z" fill="#e8743b" />
            <path d="M 29.6 27.2 C 29 31 26.4 33.6 24.6 33.8 C 25.6 31 27 29 29.6 27.2 Z" fill="#f08a4b" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path className="paint" d="M 22 24.5 Q 23.5 23 25 24.5 M 26 25.5 Q 27.5 24 29 25.5" stroke="#d8c7ae" strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="35.8" cy="22.6" r="1.3" fill={INK} />
              <circle cx="36.1" cy="22.2" r="0.4" fill="#ffffff" />
            </g>
            <path d="M 40.6 24.2 L 42.4 25.4" stroke={INK} strokeWidth="1" strokeLinecap="round" />
          </svg>
        );

      case 'crab':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Shore crab waving its claws */}
            <Limb d="M 13 30 L 7.5 32 L 5.5 36.5" color="#d9573b" w={2.8} />
            <Limb d="M 14 33 L 9.5 36 L 8.5 40" color="#d9573b" w={2.8} />
            <Limb d="M 17 34.5 L 14 38.5 L 13.5 42" color="#d9573b" w={2.8} />
            <Limb d="M 35 30 L 40.5 32 L 42.5 36.5" color="#d9573b" w={2.8} />
            <Limb d="M 34 33 L 38.5 36 L 39.5 40" color="#d9573b" w={2.8} />
            <Limb d="M 31 34.5 L 34 38.5 L 34.5 42" color="#d9573b" w={2.8} />
            <Limb d="M 14 25 C 10.5 23 8.8 20 9.4 17" color="#d9573b" w={3.2} />
            <Limb d="M 34 25 C 37.5 23 39.2 20 38.6 17" color="#d9573b" w={3.2} />
            <path
              d="M 9 17.5 C 5 16.5 4 11.5 7.5 9.5 C 8 12 9.5 13 11 13 C 11.5 11 11 9 9.5 8 C 13 8.5 14.5 12.5 12.5 16 C 11.5 17.5 10 17.8 9 17.5 Z"
              fill="#d9573b"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M 39 17.5 C 43 16.5 44 11.5 40.5 9.5 C 40 12 38.5 13 37 13 C 36.5 11 37 9 38.5 8 C 35 8.5 33.5 12.5 35.5 16 C 36.5 17.5 38 17.8 39 17.5 Z"
              fill="#d9573b"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 20.5 22 L 19.5 17 M 27.5 22 L 28.5 17" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="24" cy="28" rx="11.5" ry="7.5" fill="#d9573b" stroke={INK} strokeWidth="1.8" />
            <path className="paint" d="M 16.5 25 Q 19 22.6 22 22.4" stroke="#f19a7c" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 21.8 30 Q 24 31.8 26.2 30" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="19.3" cy="15.6" r="2" fill="#fdf6e3" stroke={INK} strokeWidth="1.1" />
              <circle className="pupil" cx="19.5" cy="15.8" r="0.9" fill={INK} />
            </g>
            <g className="eye">
              <circle cx="28.7" cy="15.6" r="2" fill="#fdf6e3" stroke={INK} strokeWidth="1.1" />
              <circle className="pupil" cx="28.5" cy="15.8" r="0.9" fill={INK} />
            </g>
          </svg>
        );

      case 'otter':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Smooth-coated otter standing up */}
            <Limb className="tail" d="M 30.5 38.5 C 36 40.5 40.5 38.5 42.5 34" color="#8a5a36" w={4.4} />
            <path
              d="M 16.4 40.4 C 14.6 36 15 30 15.6 24 C 16.2 18.6 19.6 16 24 16 C 28.4 16 31.8 18.6 32.4 24 C 33 30 33.4 36 31.6 40.4 C 29 43 19 43 16.4 40.4 Z"
              fill="#8a5a36"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <ellipse cx="24" cy="30" rx="5.2" ry="8" fill="#e3cba3" />
            <ellipse cx="21.8" cy="24.6" rx="2.3" ry="1.6" fill="#8a5a36" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="26.2" cy="24.6" rx="2.3" ry="1.6" fill="#8a5a36" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="19.8" cy="42" rx="3.4" ry="1.5" fill="#6e4528" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="28.2" cy="42" rx="3.4" ry="1.5" fill="#6e4528" stroke={INK} strokeWidth="1.1" />
            <circle cx="17.6" cy="9.8" r="1.9" fill="#8a5a36" stroke={INK} strokeWidth="1.1" />
            <circle cx="30.4" cy="9.8" r="1.9" fill="#8a5a36" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="24" cy="13.6" rx="7.6" ry="6.6" fill="#8a5a36" stroke={INK} strokeWidth="1.7" />
            <ellipse cx="24" cy="16.2" rx="4.6" ry="3" fill="#e3cba3" />
            <ellipse className="pupil" cx="24" cy="14.8" rx="1.6" ry="1.1" fill={INK} />
            <path d="M 24 15.8 L 24 17 M 22.6 17.4 Q 24 18.4 25.4 17.4" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 20.4 16.4 L 16.6 15.8 M 20.4 17.4 L 16.8 18 M 27.6 16.4 L 31.4 15.8 M 27.6 17.4 L 31.2 18" stroke={INK} strokeWidth="0.7" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="20.8" cy="12.2" r="1.2" fill={INK} />
              <circle cx="21.1" cy="11.8" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="27.2" cy="12.2" r="1.2" fill={INK} />
              <circle cx="27.5" cy="11.8" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'kingfisher':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Kingfisher perched on a twig, beak to the left */}
            <path d="M 14 38.6 L 38 37.8" stroke="#7a5230" strokeWidth="2.2" strokeLinecap="round" className="paint" />
            <path d="M 24.2 34 L 23.6 38 M 27.4 34.2 L 27.4 38" stroke="#e8843a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 32 31.4 L 40.4 36.4 L 38.8 38.6 L 30.4 34 Z" fill="#1f5f8f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path
              d="M 17.6 20.4 C 23.6 18.2 32 21 34.2 27 C 35.2 30 34 33 31 34 C 26 35.6 20 33 18.4 28.4 Z"
              fill="#2f7fb8"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 18.5 23 C 19 29 23 33.5 29 33.8 C 25 30.5 22.5 27 21.5 22.5 Z" fill="#e8843a" />
            <path d="M 23.6 22.4 C 26.4 22.4 29.4 24 30.8 27" stroke="#7fc3e8" strokeWidth="1.3" strokeLinecap="round" className="paint wing" />
            <circle cx="21" cy="17" r="6.5" fill="#2f7fb8" stroke={INK} strokeWidth="1.6" />
            <path d="M 15.2 16.2 L 3 18.4 L 15.2 19.8 Z" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <ellipse cx="19.6" cy="19.8" rx="2.8" ry="1.5" fill="#e8843a" />
            <ellipse cx="23.8" cy="20.6" rx="1.8" ry="1.2" fill="#fdf6e3" />
            <g className="eye">
              <circle className="pupil" cx="20.8" cy="15.6" r="1.3" fill={INK} />
              <circle cx="21.1" cy="15.2" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'bat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Fruit bat hanging upside down, wings folded */}
            <path d="M 21 3.5 L 22.2 8.4 M 27 3.5 L 25.8 8.4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <path
              d="M 24 7 C 31 7 34 13 34 20 C 34 28 29 33.6 24 35.6 C 19 33.6 14 28 14 20 C 14 13 17 7 24 7 Z"
              fill="#5b4a5e"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 19 10.5 C 17.5 18 18.5 27 22 34 M 29 10.5 C 30.5 18 29.5 27 26 34" stroke="#33283a" strokeWidth="1.1" strokeLinecap="round" />
            <path className="paint" d="M 21.6 12 C 21 18 21.6 24 23 29" stroke="#86738a" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 20.6 39.4 L 19 44.6 L 23 41.2 Z" fill="#6b5a6e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 27.4 39.4 L 29 44.6 L 25 41.2 Z" fill="#6b5a6e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="24" cy="37" r="5" fill="#8a6f5e" stroke={INK} strokeWidth="1.5" />
            <path d="M 22.4 34.2 Q 24 33.2 25.6 34.2" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="22" cy="38" r="1.1" fill={INK} />
              <circle cx="22.2" cy="38.3" r="0.35" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="26" cy="38" r="1.1" fill={INK} />
              <circle cx="26.2" cy="38.3" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'monkey':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Long-tailed macaque sitting */}
            <Limb className="tail" d="M 31.5 38.5 C 38 38.5 42 34.5 42 28.5 C 42 24.5 43.5 22.5 45 21.5" color="#9b7b56" w={3.4} />
            <path
              d="M 16 40 C 13 34 14 26 19 23.5 C 22 22 26 22 29 23.5 C 34 26 35 34 32 40 C 28 42 20 42 16 40 Z"
              fill="#9b7b56"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <ellipse cx="24" cy="33" rx="4.6" ry="5.6" fill="#c9ab86" />
            <Limb d="M 19.2 26.4 C 16.6 30 16.6 34 19.6 36.6" color="#9b7b56" w={3.4} />
            <Limb d="M 28.8 26.4 C 31.4 30 31.4 34 28.4 36.6" color="#9b7b56" w={3.4} />
            <ellipse cx="19" cy="40.6" rx="3" ry="1.5" fill="#d9b99a" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="29" cy="40.6" rx="3" ry="1.5" fill="#d9b99a" stroke={INK} strokeWidth="1.1" />
            <circle cx="16" cy="15.2" r="2.5" fill="#d9b99a" stroke={INK} strokeWidth="1.2" />
            <circle cx="32" cy="15.2" r="2.5" fill="#d9b99a" stroke={INK} strokeWidth="1.2" />
            <circle cx="24" cy="15.5" r="7.6" fill="#9b7b56" stroke={INK} strokeWidth="1.7" />
            <path
              d="M 24 12 C 21 9.5 17.5 11.5 18.5 15 C 19.2 18.5 21.5 21.5 24 21.5 C 26.5 21.5 28.8 18.5 29.5 15 C 30.5 11.5 27 9.5 24 12 Z"
              fill="#d9b99a"
              stroke={INK}
              strokeWidth="1"
            />
            <path d="M 21 8.6 L 24 7 L 27 8.6" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 23.2 17.4 L 23.4 17.6 M 24.8 17.4 L 24.6 17.6 M 22.3 19.2 Q 24 20.3 25.7 19.2" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="21.8" cy="14.2" r="1.2" fill={INK} />
              <circle cx="22.1" cy="13.8" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="26.2" cy="14.2" r="1.2" fill={INK} />
              <circle cx="26.5" cy="13.8" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'moth':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bark moth, wings spread flat */}
            <path d="M 23 16.5 Q 20 11 16.5 9.5 M 25 16.5 Q 28 11 31.5 9.5" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 19.5 12.6 L 18.6 14.2 M 18 11.2 L 17 12.8 M 28.5 12.6 L 29.4 14.2 M 30 11.2 L 31 12.8" stroke={INK} strokeWidth="0.7" strokeLinecap="round" />
            <g className="wing wing-l">
              <path d="M 23 24.5 C 16 25 11 28.5 11.5 33 C 16 35 21 31.5 23.5 27 Z" fill="#a8927a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M 24 14.5 C 18 10.8 9 10 4.5 13.5 C 5 20 10 25.5 23 25 Z" fill="#bfae94" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M 7.5 15.2 L 10.5 18 L 13.6 15.8 L 16.8 19.4 L 20.2 17.2" stroke="#7d6b55" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="14" cy="21.4" r="1.9" fill="#7d6b55" />
              <circle cx="14" cy="21.4" r="0.8" fill="#e6dccb" />
            </g>
            <g className="wing wing-r">
              <path d="M 25 24.5 C 32 25 37 28.5 36.5 33 C 32 35 27 31.5 24.5 27 Z" fill="#a8927a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M 24 14.5 C 30 10.8 39 10 43.5 13.5 C 43 20 38 25.5 25 25 Z" fill="#bfae94" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M 40.5 15.2 L 37.5 18 L 34.4 15.8 L 31.2 19.4 L 27.8 17.2" stroke="#7d6b55" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="34" cy="21.4" r="1.9" fill="#7d6b55" />
              <circle cx="34" cy="21.4" r="0.8" fill="#e6dccb" />
            </g>
            <ellipse cx="24" cy="23.5" rx="2.1" ry="8.2" fill="#6e5b47" stroke={INK} strokeWidth="1.2" />
            <circle className="eye pupil" cx="23" cy="15.8" r="0.8" fill={INK} />
            <circle className="eye pupil" cx="25" cy="15.8" r="0.8" fill={INK} />
          </svg>
        );

      case 'dragonfly':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Dragonfly from above */}
            <g className="wing wing-l">
              <ellipse cx="13.2" cy="15.6" rx="10.4" ry="2.7" transform="rotate(-8 13.2 15.6)" fill="rgba(200, 230, 240, 0.55)" stroke={INK} strokeWidth="1" />
              <ellipse cx="13.6" cy="21" rx="9.6" ry="2.5" transform="rotate(10 13.6 21)" fill="rgba(200, 230, 240, 0.55)" stroke={INK} strokeWidth="1" />
            </g>
            <g className="wing wing-r">
              <ellipse cx="34.8" cy="15.6" rx="10.4" ry="2.7" transform="rotate(8 34.8 15.6)" fill="rgba(200, 230, 240, 0.55)" stroke={INK} strokeWidth="1" />
              <ellipse cx="34.4" cy="21" rx="9.6" ry="2.5" transform="rotate(-10 34.4 21)" fill="rgba(200, 230, 240, 0.55)" stroke={INK} strokeWidth="1" />
            </g>
            <path className="paint" d="M 5 16.6 L 21 16 M 5.6 20 L 21 19.6 M 43 16.6 L 27 16 M 42.4 20 L 27 19.6" stroke="#9fc7d4" strokeWidth="0.6" />
            <Limb d="M 24 20 L 24 44" color="#2a9d8f" w={3.4} />
            <path d="M 22.6 26 L 25.4 26 M 22.6 30 L 25.4 30 M 22.6 34 L 25.4 34 M 22.8 38 L 25.2 38" stroke={INK} strokeWidth="0.8" />
            <ellipse cx="24" cy="16.4" rx="2.8" ry="3.8" fill="#2a9d8f" stroke={INK} strokeWidth="1.3" />
            <g className="eye">
              <circle cx="22.2" cy="10.4" r="2" fill="#1d6f65" stroke={INK} strokeWidth="1.1" />
              <circle cx="25.8" cy="10.4" r="2" fill="#1d6f65" stroke={INK} strokeWidth="1.1" />
            </g>
          </svg>
        );

      case 'spider':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Little spider dangling on its thread */}
            <path className="paint" d="M 24 0 L 24 17" stroke="#8c8276" strokeWidth="0.8" />
            <path
              d="M 21 18.5 L 15 14 L 11 18 M 20.5 20 L 13.5 18.5 L 9 24 M 20.5 21.5 L 14 24 L 10.5 30 M 21 23 L 16 29 L 14 35 M 27 18.5 L 33 14 L 37 18 M 27.5 20 L 34.5 18.5 L 39 24 M 27.5 21.5 L 34 24 L 37.5 30 M 27 23 L 32 29 L 34 35"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="27.5" r="6.6" fill="#4a3f3a" stroke={INK} strokeWidth="1.4" />
            <path className="paint" d="M 24 23.4 L 24 31.4 M 21 27.2 L 27 27.2" stroke="#b9a58f" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="24" cy="19.8" r="3.9" fill="#4a3f3a" stroke={INK} strokeWidth="1.3" />
            <circle className="eye" cx="22.7" cy="19" r="0.8" fill="#fdf6e3" />
            <circle className="eye" cx="25.3" cy="19" r="0.8" fill="#fdf6e3" />
          </svg>
        );

      case 'paper-crane':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Origami crane */}
            <path d="M 24 24 L 34.5 6 L 27.4 27.6 Z" fill="#c85a4d" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" className="wing" />
            <path d="M 31 29.5 L 43.5 18 L 33.4 31.6 Z" fill="#d96c5f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 18.2 28.6 L 7.4 15.4 L 5 17.4 L 4.4 15.8 L 8.6 14.2 L 20.4 27.6 Z" fill="#d96c5f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 16 30.4 L 24 24 L 32.4 30.2 L 24 33.6 Z" fill="#e58a7c" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 24 24 L 12 8 L 20.6 27 Z" fill="#eea394" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" className="wing" />
            <path d="M 24 24 L 24 33.6 M 16 30.4 L 32.4 30.2" stroke="#9e4336" strokeWidth="0.8" />
          </svg>
        );

      case 'paper-boat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Paper boat folded from a newspaper page */}
            <path d="M 24 10 L 24 30 L 11.5 30 Z" fill="#f4ecdc" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 24 10 L 36.5 30 L 24 30 Z" fill="#dcd0b8" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 5.5 30 L 42.5 30 L 35.5 38.5 L 12.5 38.5 Z" fill="#efe5d1" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 19 17.5 L 22.6 17.5 M 17 21 L 22.6 21 M 15.4 24.5 L 22.6 24.5 M 12 34 L 20 34 M 23 34 L 33 34" stroke="#9c9486" strokeWidth="0.9" strokeLinecap="round" className="paint" />
            <path d="M 5.5 30 L 12.5 38.5 M 42.5 30 L 35.5 38.5" stroke="#b5a88f" strokeWidth="0.9" />
          </svg>
        );

      /* ---------------- Động vật hoang dã Singapore ---------------- */

      case 'heron':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Grey heron wading, beak to the left */}
            <Limb d="M 25 30.5 L 24 44" color="#c9a86a" w={2.4} />
            <Limb d="M 29 30.5 L 30 44" color="#c9a86a" w={2.4} />
            <path d="M 21.5 44.6 L 26.5 44.6 M 27.5 44.6 L 32.5 44.6" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 35 25 L 41.5 27.5 L 35.5 29.2 Z" fill="#8d9aa7" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 18 22 C 20 17 30 16 35 21 C 38 24 39 28 36 30 C 32 32 24 32 20 29 C 18 27 17 24 18 22 Z"
              fill="#a9b6c2"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint wing" d="M 22 22.5 C 27 20.5 33 22.5 35.5 26.5" stroke="#6f7f8e" strokeWidth="1.4" strokeLinecap="round" />
            <Limb d="M 21 21.5 C 16 19.5 18 14.5 15.2 11.2" color="#e3e9ed" w={4} />
            <path d="M 15.4 7.4 C 18.4 5.6 21.4 6 23.6 7.6" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="14.2" cy="9.6" r="3.4" fill="#eef2f4" stroke={INK} strokeWidth="1.4" />
            <path d="M 11.2 8.5 L 1.5 10.4 L 11 11.2 Z" fill="#d9a441" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            <circle className="eye pupil" cx="13.8" cy="9.1" r="0.9" fill={INK} />
          </svg>
        );

      case 'hornbill':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Oriental pied hornbill perched, casque & big yellow beak to the left */}
            <path className="paint" d="M 8 38.5 L 41 37" stroke="#7a5230" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 30 33 L 37 45 L 40.6 43.4 L 34 31 Z" fill="#2a2a2e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 36.4 44.1 L 40.2 42.6 L 40.9 43.9 L 37.2 45.4 Z" fill="#f4efe4" />
            <path
              d="M 19 18 C 24 15 33 18 35 26 C 36.5 32 33 36.5 28 36.5 C 23 36.5 20 33 19.5 28 C 19 24 18 21 19 18 Z"
              fill="#2a2a2e"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 20 27 C 21 32 24 35.5 28 36 C 25 32 23.5 29 23 25 Z" fill="#f4efe4" />
            <path className="paint wing" d="M 24 21 C 28 21.5 32 24 33.5 29" stroke="#5a5a62" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 26 36.2 L 25.5 38.4 M 29 36.2 L 29.5 38.4" stroke="#3a3a3a" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="20.5" cy="13" r="5.6" fill="#2a2a2e" stroke={INK} strokeWidth="1.5" />
            <path d="M 17 9.2 C 14 6.8 9 7 6.5 9.3 C 9.5 9.6 13 10.2 16.4 11.4 Z" fill="#efe0a8" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 16 11 C 11 11 6.5 12.5 3 16.5 C 7.5 16 12 15.8 16.2 15.2 Z" fill="#e9b949" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 15.7 11.4 L 15.9 15" stroke={INK} strokeWidth="0.9" />
            <g className="eye">
              <circle cx="21.2" cy="11.8" r="1.7" fill="#f4efe4" stroke={INK} strokeWidth="0.6" />
              <circle className="pupil" cx="21.3" cy="11.9" r="0.8" fill={INK} />
            </g>
          </svg>
        );

      case 'pangolin':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Sunda pangolin walking, snout to the left */}
            <Limb d="M 16 35 L 15 40.5" color="#8a6440" w={3} />
            <Limb d="M 32 34.5 L 33 40" color="#8a6440" w={3} />
            <path
              className="tail"
              d="M 8 33 C 10 26 16 20 25 19.5 C 33 19 39 23 41 29 C 43 33 45 37 44 40 C 41 40 38 37.5 36 35 C 32 36 20 37 13 36 C 11 35.8 9 35 8 33 Z"
              fill="#a67c52"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M 14.5 26 q 2 3 4 0 M 19 23 q 2 3 4 0 M 24 21.6 q 2 3 4 0 M 29 22 q 2 3 4 0 M 33.4 24.2 q 2 3 4 0 M 37 28 q 2 3 4 0 M 17 30 q 2 3 4 0 M 21.6 27.6 q 2 3 4 0 M 26.6 26.6 q 2 3 4 0 M 31.4 27.4 q 2 3 4 0 M 35.6 30.8 q 2 3 4 0 M 39.4 33.6 q 1.6 2.4 3.2 0"
              stroke="#6e4d2e"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path className="paint" d="M 13 35.4 C 20 36.6 30 36 35.5 34.8" stroke="#d9bfa0" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="8.2" cy="33.4" r="0.8" fill={INK} />
            <circle className="eye pupil" cx="12" cy="31" r="0.9" fill={INK} />
          </svg>
        );

      case 'monitor-lizard':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Malayan water monitor seen from above, tongue flicking */}
            <path d="M 24 3.2 L 24 0.8 M 24 0.8 L 23 -0.6 M 24 0.8 L 25 -0.6" stroke="#d9573b" strokeWidth="0.8" strokeLinecap="round" className="paint" />
            <Limb d="M 21.5 15 L 16.5 13.5 L 14.4 9.8" color="#6b705c" />
            <Limb d="M 26.5 15 L 31.5 13.5 L 33.6 9.8" color="#6b705c" />
            <Limb d="M 21 26 L 16 27.5 L 14 31.6" color="#6b705c" />
            <Limb d="M 27 26 L 32 27.5 L 34 31.6" color="#6b705c" />
            <path
              className="tail"
              d="M 24 3 C 26.5 3 27.6 5.5 27.2 8 C 27 9.6 26.2 10.6 26 11.8 C 28.5 14.5 29 21 28 26.5 C 27.5 29.5 26.6 31 26.8 33.5 C 27.2 37.5 30 41 34.5 43.5 C 35.3 44 35 45.2 34 45 C 28.5 44.3 23.5 40 22.4 34.5 C 22 32 21 30 20.2 27 C 19 21 19.5 14.5 22 11.8 C 21.8 10.6 21 9.6 20.8 8 C 20.4 5.5 21.5 3 24 3 Z"
              fill="#6b705c"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="23" cy="17" r="0.9" fill="#e9d77a" />
            <circle cx="25.5" cy="19.6" r="0.9" fill="#e9d77a" />
            <circle cx="22.6" cy="22" r="0.9" fill="#e9d77a" />
            <circle cx="25.2" cy="24.6" r="0.9" fill="#e9d77a" />
            <circle cx="23.6" cy="28" r="0.8" fill="#e9d77a" />
            <path className="paint" d="M 24 33.6 L 26.2 33 M 25.2 37 L 27.6 36.2 M 27.8 40.3 L 30 39.2" stroke="#e9d77a" strokeWidth="1.1" strokeLinecap="round" />
            <circle className="eye pupil" cx="22" cy="6.4" r="0.9" fill={INK} />
            <circle className="eye pupil" cx="26" cy="6.4" r="0.9" fill={INK} />
          </svg>
        );

      case 'jellyfish':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Moon jellyfish drifting */}
            <g className="tail">
              <path
                className="paint"
                d="M 14 23.5 C 13 28 16 31 14 36 M 19 24.5 C 18 30 21 34 19 41 M 29 24.5 C 30 30 27 34 29.5 41 M 34 23.5 C 35 28 32 31 34 36"
                stroke="#b77aa6"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <path
                className="paint"
                d="M 21.5 24 C 20 30 23 33 21.5 38.5 M 26.5 24 C 28 30 25 33 26.5 38.5"
                stroke="#e3a9cf"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>
            <path
              d="M 10 22 C 10 11 17 6 24 6 C 31 6 38 11 38 22 C 35 24 32 22 29.5 24 C 27 22 25.5 24 24 24 C 22.5 24 21 22 18.5 24 C 16 22 13 24 10 22 Z"
              fill="#efc6e2"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 15 17 C 17 12 21 10 24 10 C 27 10 31 12 33 17" stroke="#fbeaf5" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="19.5" cy="16.5" r="1.9" fill="#c98bb7" />
            <circle cx="24" cy="15" r="1.9" fill="#c98bb7" />
            <circle cx="28.5" cy="16.5" r="1.9" fill="#c98bb7" />
          </svg>
        );

      case 'seahorse':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Seahorse, snout to the left, tail curled */}
            <Limb className="tail" d="M 23.5 33 C 24 38 21 40 22 43 C 23 45.5 27 45 27 42 C 27 40 25 39.6 24.4 41" color="#e0a458" w={3.6} />
            <path d="M 28.6 21.5 C 32.5 20.5 33.4 25 29 28.2 Z" fill="#f2c48d" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path
              d="M 20 16 C 25 14 29.5 18 29 25 C 28.6 30 26 34 23 34 C 20 34 18 30.5 18.5 26 C 18.8 23 19.5 20 20 16 Z"
              fill="#e0a458"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 20.4 22 L 23 22.2 M 20 25 L 22.8 25.3 M 20.2 28 L 23 28.4 M 21 31 L 23.2 31.3" stroke="#b0743a" strokeWidth="1" strokeLinecap="round" />
            <path
              d="M 18 10 C 20 7 25 7 26.5 10.5 C 27.6 13 26 16 23 16.5 C 21 16.8 19.5 15.5 18.5 14.5 L 10 15.2 L 9.6 12.4 L 17.6 11.6 Z"
              fill="#e0a458"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M 21.4 7.8 L 22.4 5 L 23.6 7.6" fill="#f2c48d" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="22.6" cy="11.2" r="1.4" fill="#fdf6e3" stroke={INK} strokeWidth="0.6" />
              <circle className="pupil" cx="22.3" cy="11.3" r="0.7" fill={INK} />
            </g>
          </svg>
        );

      case 'mantis':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Praying mantis, head to the left, forelegs folded */}
            <Limb d="M 25 27.5 L 22 33 L 24 38.5" color="#8cc084" w={2.2} />
            <Limb d="M 28 28.5 L 29.5 34 L 32.5 38.5" color="#8cc084" w={2.2} />
            <Limb d="M 31 29 L 35 34.5 L 38.8 37.6" color="#8cc084" w={2.2} />
            <path
              d="M 26 25 C 31 22 39 23 43 27 C 42 30 35 32 28 30.5 C 26 30 25.2 27 26 25 Z"
              fill="#8cc084"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint wing" d="M 27.4 25.2 C 32 23.6 38 24 42 26.6" stroke="#5f9459" strokeWidth="1.2" strokeLinecap="round" />
            <Limb d="M 26.5 27 L 16.2 17.4" color="#8cc084" w={3.6} />
            <Limb d="M 17.6 18.6 L 13 24.2 L 17.2 22.2" color="#8cc084" w={2.8} />
            <Limb d="M 19.2 19.8 L 15.2 26.2 L 19.6 24.4" color="#8cc084" w={2.8} />
            <path d="M 13 12.6 C 10 8 7 7 4 7.5 M 17.6 12.2 C 17 7 15 4.5 12 3.5" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 11.6 13.2 L 19 12.4 L 15.4 19.4 Z" fill="#8cc084" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <circle className="eye" cx="12.8" cy="13.4" r="1.3" fill="#5f9459" stroke={INK} strokeWidth="0.6" />
            <circle className="eye" cx="17.8" cy="12.9" r="1.3" fill="#5f9459" stroke={INK} strokeWidth="0.6" />
          </svg>
        );

      case 'firefly':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Firefly in flight, glowing lantern tail */}
            <g className="wing wing-l">
              <ellipse cx="14" cy="22" rx="8.5" ry="3.4" transform="rotate(-25 14 22)" fill="rgba(210, 225, 235, 0.55)" stroke={INK} strokeWidth="0.9" />
            </g>
            <g className="wing wing-r">
              <ellipse cx="34" cy="22" rx="8.5" ry="3.4" transform="rotate(25 34 22)" fill="rgba(210, 225, 235, 0.55)" stroke={INK} strokeWidth="0.9" />
            </g>
            <path d="M 19.5 19 L 16 20.6 M 19.4 23 L 15.8 25 M 28.5 19 L 32 20.6 M 28.6 23 L 32.2 25" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <ellipse className="glow-spot" cx="24" cy="32.5" rx="5.2" ry="6.5" fill="#eef58a" stroke={INK} strokeWidth="1.2" />
            <path d="M 23.6 15 C 19.5 15.5 18.2 21 19 28 C 19.5 31 21.5 31.5 23.6 30.5 Z" fill="#4a3b2f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 24.4 15 C 28.5 15.5 29.8 21 29 28 C 28.5 31 26.5 31.5 24.4 30.5 Z" fill="#4a3b2f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 18.5 15.8 C 19 11 29 11 29.5 15.8 C 26 17 22 17 18.5 15.8 Z" fill="#d9713b" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="24" cy="13.8" r="1.2" fill={INK} />
            <circle cx="24" cy="10.4" r="2.2" fill="#2c241b" />
            <path d="M 23.2 8.8 Q 21 5 18.5 4.2 M 24.8 8.8 Q 27 5 29.5 4.2" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        );

      case 'civet':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Common palm civet (musang) prowling, masked face to the left */}
            <Limb className="tail" d="M 35 23 C 40 23 43.5 27 44 33 C 44.3 37 42.5 40 40 41" color="#5f564d" w={3.8} />
            <Limb d="M 16 28.5 L 15 36" color="#5f564d" w={3} />
            <Limb d="M 20 29.5 L 20.5 36.5" color="#5f564d" w={3} />
            <Limb d="M 30 29.5 L 29.5 36.5" color="#5f564d" w={3} />
            <Limb d="M 33.5 28 L 35 35.5" color="#5f564d" w={3} />
            <path
              d="M 12 22 C 16 18 28 17.5 34 20 C 37 21.5 37.5 26 35 28.5 C 30 30.5 20 30.5 15 28.5 C 12.5 27.5 11 24.5 12 22 Z"
              fill="#8f8579"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 17 21 C 22 20.2 28 20.2 32 21.3 M 18 24.6 L 20 24.2 M 23 24.8 L 25 24.5 M 28 24.8 L 30 24.6" stroke="#5f564d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 11 18.6 L 12.2 15.4 L 13.9 18.8 Z" fill="#8f8579" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 12.8 21.2 C 10 18.4 5.5 18.6 3.4 21.6 C 5.5 24.6 9.6 25.6 13 24.8 Z"
              fill="#8f8579"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 6.4 20.4 C 8.5 19.4 10.5 20 11.9 21.4 C 10 22.4 8 22.4 6.4 21.4 Z" fill="#3d3630" />
            <path className="paint" d="M 7 22.7 C 8.8 23.4 10.6 23.3 12 22.7" stroke="#efe8dc" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="3.8" cy="21.6" r="0.8" fill={INK} />
            <g className="eye">
              <circle className="pupil" cx="9.4" cy="20.8" r="1" fill={INK} />
              <circle cx="9.7" cy="20.5" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'sunbird':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Olive-backed sunbird on a twig, curved beak to the left */}
            <path className="paint" d="M 12 34.5 L 37 33.5" stroke="#7a5230" strokeWidth="2" strokeLinecap="round" />
            <path d="M 22 30.5 L 21.5 34 M 25 31 L 25.5 34" stroke="#3a3a3a" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 31.5 26 L 40 31 L 38.8 33 L 30.5 29 Z" fill="#6f7a3a" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path
              d="M 16 20 C 20 16 29 17 32 22 C 34 25 33 29 29 30.5 C 25 32 19 31 17 28 C 15.6 26 15 22.5 16 20 Z"
              fill="#9aa84f"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M 17 24.5 C 18 28.5 22 30.8 27 30.6 C 23 28.4 20.4 26 19.6 22.4 Z" fill="#f2d24b" />
            <path d="M 15.8 20.5 C 16.6 23.2 18.2 24.6 20.2 24.8 C 19.4 22.6 18.8 20.8 18.6 18.6 Z" fill="#4b4f9e" />
            <path className="paint wing" d="M 21 20.5 C 25 20 29 22 30.5 25.5" stroke="#6f7a3a" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="16.5" cy="17" r="4.2" fill="#9aa84f" stroke={INK} strokeWidth="1.4" />
            <path d="M 12.8 17.4 C 9.5 17.6 6 19.4 3.8 22.6" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="15.8" cy="16.2" r="1" fill={INK} />
              <circle cx="16.1" cy="15.9" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'slow-loris':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Slow loris hugging a branch, huge round eyes */}
            <Limb d="M 3 41 L 45 30" color="#8a6440" w={4.4} />
            <path
              d="M 14 30 C 13 22 18 17 25 17.5 C 32 18 36 23 35 30 C 34.5 35 30 38 24.5 38 C 19 38 14.5 35 14 30 Z"
              fill="#c9a27a"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 24.5 21 L 24.5 34" stroke="#9c7a55" strokeWidth="1.6" strokeLinecap="round" />
            <Limb d="M 17 29 C 15.6 32.6 16.6 35.6 19.4 37" color="#c9a27a" w={3.4} />
            <Limb d="M 32 29 C 33.2 31.8 32.6 34.2 30.4 35.4" color="#c9a27a" w={3.4} />
            <circle cx="17.4" cy="10.6" r="1.8" fill="#c9a27a" stroke={INK} strokeWidth="1" />
            <circle cx="30.6" cy="10.6" r="1.8" fill="#c9a27a" stroke={INK} strokeWidth="1" />
            <circle cx="24" cy="16" r="7.5" fill="#c9a27a" stroke={INK} strokeWidth="1.6" />
            <circle cx="20.6" cy="15.5" r="3.2" fill="#6e4d33" />
            <circle cx="27.4" cy="15.5" r="3.2" fill="#6e4d33" />
            <path className="paint" d="M 24 9.6 L 24 18.6" stroke="#f1e6d6" strokeWidth="1.8" strokeLinecap="round" />
            <g className="eye">
              <circle cx="20.6" cy="15.5" r="2.1" fill="#f0b43c" stroke={INK} strokeWidth="0.6" />
              <circle className="pupil" cx="20.6" cy="15.5" r="1.2" fill={INK} />
              <circle cx="20.1" cy="14.9" r="0.45" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27.4" cy="15.5" r="2.1" fill="#f0b43c" stroke={INK} strokeWidth="0.6" />
              <circle className="pupil" cx="27.4" cy="15.5" r="1.2" fill={INK} />
              <circle cx="26.9" cy="14.9" r="0.45" fill="#ffffff" />
            </g>
            <path d="M 23.2 19.8 L 24.8 19.8 L 24 20.8 Z" fill={INK} />
          </svg>
        );

      case 'colugo':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Sunda colugo clinging to a trunk, gliding membrane folded like a bark-coloured cloak */}
            <path d="M 14 21 L 10.5 19 M 34 21 L 37.5 19 M 18 42 L 16 45 M 30 42 L 32 45" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <path
              className="wing"
              d="M 24 10 C 30 10 34 16 35 24 C 36 31 34 38 30 42 C 27 44 21 44 18 42 C 14 38 12 31 13 24 C 14 16 18 10 24 10 Z"
              fill="#8c8577"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="19" cy="26" r="1.6" fill="#6e675b" />
            <circle cx="28.4" cy="22" r="1.4" fill="#6e675b" />
            <circle cx="26" cy="32" r="1.8" fill="#6e675b" />
            <circle cx="20.5" cy="36" r="1.3" fill="#6e675b" />
            <path className="paint" d="M 16 30 C 18 32 18.5 36 17.5 39 M 32 30 C 30 32 29.5 36 30.5 39" stroke="#6e675b" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 19 8.8 L 19.6 6.6 L 21 8.2 M 29 8.8 L 28.4 6.6 L 27 8.2" stroke={INK} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M 18.5 12 C 18 7 30 7 29.5 12 C 29.2 15.5 26.5 17.5 24 17.5 C 21.5 17.5 18.8 15.5 18.5 12 Z"
              fill="#9b9486"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="14.8" r="0.8" fill={INK} />
            <g className="eye">
              <circle className="pupil" cx="21.3" cy="11.6" r="1.9" fill={INK} />
              <circle cx="20.8" cy="11" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="26.7" cy="11.6" r="1.9" fill={INK} />
              <circle cx="26.2" cy="11" r="0.6" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'stick-insect':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Stick insect — looks exactly like a twig */}
            <path
              d="M 35 14.5 L 38.5 19.5 L 42 20.5 M 35 14.5 L 31 10 L 31.5 6 M 26 22.5 L 30 28 L 33.5 29 M 26 22.5 L 21.5 18.5 L 21 14.5 M 17 30.5 L 21 36 L 24 37.5 M 17 30.5 L 12 27 L 11 23"
              stroke="#5a4e36"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M 40 10 L 45 4 M 40 10 L 46.4 8.4" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
            <Limb d="M 6 40 L 40 10" color="#9c8a5e" w={3} />
            <path className="paint" d="M 12.5 33.8 L 14 35.2 M 20.5 26.6 L 22 28 M 29 19 L 30.5 20.4" stroke="#7d6e48" strokeWidth="0.9" strokeLinecap="round" />
            <circle className="eye pupil" cx="40.4" cy="9.4" r="0.7" fill={INK} />
          </svg>
        );

      /* ---------------- Đồ vật văn hóa & thám tử ---------------- */

      case 'durian':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Durian, king of fruits */}
            <path d={DURIAN_SHELL} fill="#a3a852" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path className="paint" d={DURIAN_THORNS} stroke="#6f7a3a" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
            <Limb d="M 24 13.4 L 24 7.6 L 27.4 6" color="#7a5230" w={2.8} />
          </svg>
        );

      case 'fortune-cat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Maneki-neko beckoning with its raised paw */}
            <path d="M 14 42 C 12 33 14 26 18 23 L 30 23 C 34 26 36 33 34 42 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <ellipse cx="29" cy="33.5" rx="4" ry="5.4" fill="#e9b949" stroke={INK} strokeWidth="1.2" />
            <path d="M 27.2 31.4 L 30.8 31.4 M 27 34 L 31 34 M 27.2 36.6 L 30.8 36.6" stroke="#8a6412" strokeWidth="0.8" strokeLinecap="round" />
            <ellipse cx="25.8" cy="35.4" rx="2.5" ry="2" fill="#fbf7ef" stroke={INK} strokeWidth="1" />
            <path className="wave" d="M 12.5 25 C 9 22 8 16 10 13 C 11.5 11 14 12 14 14.5 C 14 17.5 14.5 21 16.5 23.5 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 14.5 11 L 15 4.5 L 20 8 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 33.5 11 L 33 4.5 L 28 8 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 15.6 9.6 L 15.9 6.6 L 18.2 8.2 Z M 32.4 9.6 L 32.1 6.6 L 29.8 8.2 Z" fill="#f2a8b0" />
            <path d="M 13 16 C 13 9 19 6.5 24 6.5 C 29 6.5 35 9 35 16 C 35 21.5 30 24.5 24 24.5 C 18 24.5 13 21.5 13 16 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.7" />
            <path className="paint" d="M 17 23.6 C 21 25.6 27 25.6 31 23.6" stroke="#c0392b" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="24" cy="26.6" r="2.3" fill="#e9b949" stroke={INK} strokeWidth="1" />
            <path className="eye" d="M 18.5 15.6 Q 20 14 21.5 15.6 M 26.5 15.6 Q 28 14 29.5 15.6" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 23.2 18 L 24.8 18 L 24 19 Z" fill="#e0868f" />
            <path d="M 24 19 Q 22.5 20.5 21.5 19.8 M 24 19 Q 25.5 20.5 26.5 19.8" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="17.6" cy="18.6" r="1" fill="#f4a3a3" />
            <circle cx="30.4" cy="18.6" r="1" fill="#f4a3a3" />
          </svg>
        );

      case 'red-envelope':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Red packet (ang pow / lì xì) */}
            <g transform="rotate(-8 24 24)">
              <rect x="12" y="7" width="24" height="34" rx="1.8" fill="#c62828" stroke={INK} strokeWidth="1.6" />
              <rect className="paint" x="14" y="9" width="20" height="30" rx="1" stroke="#e9b949" strokeWidth="0.8" />
              <path d="M 12 14 L 24 20 L 36 14" stroke="#8e1b1b" strokeWidth="1.4" strokeLinejoin="round" />
              <circle cx="24" cy="27" r="6.5" fill="#e9b949" stroke="#8a6412" strokeWidth="1.2" />
              <path d="M 21 24.5 L 27 24.5 M 24 22.4 L 24 31.4 M 21.4 27.8 L 26.6 27.8 M 21 30.8 L 27 30.8" stroke="#8e1b1b" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'tiffin':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Peranakan enamel tingkat (tiffin carrier) */}
            <path d="M 14 11 C 14 2.5 34 2.5 34 11" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <rect x="11.5" y="10.5" width="25" height="9.5" rx="3" fill="#9fd4c0" stroke={INK} strokeWidth="1.5" />
            <rect x="11.5" y="20.5" width="25" height="9.5" rx="3" fill="#f2a7b8" stroke={INK} strokeWidth="1.5" />
            <rect x="11.5" y="30.5" width="25" height="9.5" rx="3" fill="#9fd4c0" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="24" cy="10.5" rx="12.5" ry="2" fill="#d0e9df" stroke={INK} strokeWidth="1.2" />
            <path className="paint" d="M 14 11 L 14 40 M 34 11 L 34 40" stroke="#8a8f99" strokeWidth="1.6" />
            <circle cx="19" cy="15.4" r="1.5" fill="#f2a7b8" />
            <circle cx="24" cy="15.4" r="1.5" fill="#fbf7ef" />
            <circle cx="29" cy="15.4" r="1.5" fill="#f2a7b8" />
            <circle cx="19" cy="25.4" r="1.5" fill="#9fd4c0" />
            <circle cx="24" cy="25.4" r="1.5" fill="#fbf7ef" />
            <circle cx="29" cy="25.4" r="1.5" fill="#9fd4c0" />
            <circle cx="19" cy="35.4" r="1.5" fill="#f2a7b8" />
            <circle cx="24" cy="35.4" r="1.5" fill="#fbf7ef" />
            <circle cx="29" cy="35.4" r="1.5" fill="#f2a7b8" />
          </svg>
        );

      case 'satay':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Three satay skewers fresh off the grill */}
            <Limb d="M 9 43 L 30 7" color="#d8b27a" w={2.2} />
            <Limb d="M 11 43.5 L 38 12" color="#d8b27a" w={2.2} />
            <Limb d="M 13 44 L 43 20" color="#d8b27a" w={2.2} />
            <g fill="#9c5a2e" stroke={INK} strokeWidth="1.1">
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(18.1 27.4) rotate(-59.7)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(21.1 22.3) rotate(-59.7)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(24.1 17.1) rotate(-59.7)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(24 28.3) rotate(-49.4)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(27.9 23.8) rotate(-49.4)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(31.8 19.2) rotate(-49.4)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(27.1 32.8) rotate(-38.7)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(31.7 29) rotate(-38.7)" />
              <rect x="-2.6" y="-2.2" width="5.2" height="4.4" rx="1.4" transform="translate(36.4 25.2) rotate(-38.7)" />
            </g>
            <path className="paint" d="M 17 26.4 L 18.6 27.6 M 23 27.2 L 24.8 28.2 M 26.2 31.8 L 28 32.6" stroke="#5e3217" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        );

      case 'kite':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Wau bulan — Malay moon kite */}
            <path className="paint" d="M 24 40 C 22 43.5 19 45 15 46.5" stroke="#8a8f99" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 24 3 L 24 36" stroke={INK} strokeWidth="1" />
            <path
              d="M 24 10 C 18 8 9 9 3 14 C 8 17 15 19 24 19 C 33 19 40 17 45 14 C 39 9 30 8 24 10 Z"
              fill="#d9573b"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 9 13.6 C 14 15 19 15.6 23 15.6 M 25 15.6 C 29 15.6 34 15 39 13.6" stroke="#f2c48d" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 24 3 C 22 5 21.5 8 24 10 C 26.5 8 26 5 24 3 Z" fill="#e9b949" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 21 19 C 21.5 23 22 26 24 28 C 26 26 26.5 23 27 19 Z" fill="#2a9d8f" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 10 30 C 14 40.5 34 40.5 38 30 C 33 35.5 15 35.5 10 30 Z" fill="#e9b949" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 24 28 L 24 34.6" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'vintage-camera':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vintage rangefinder camera */}
            <rect x="10" y="11.5" width="12" height="5.5" rx="1" fill="#b8bcc2" stroke={INK} strokeWidth="1.2" />
            <circle cx="33" cy="14.5" r="2.4" fill="#b8bcc2" stroke={INK} strokeWidth="1" />
            <circle cx="27.6" cy="14.2" r="1.1" fill="#8a8f99" stroke={INK} strokeWidth="0.8" />
            <rect x="7" y="16" width="34" height="22" rx="3" fill="#3d3a36" stroke={INK} strokeWidth="1.6" />
            <rect x="7" y="21" width="34" height="12" fill="#6e5a48" />
            <rect x="8" y="17.4" width="7" height="3" rx="0.6" fill="#b8bcc2" stroke={INK} strokeWidth="0.7" />
            <circle cx="24" cy="27" r="8" fill="#b8bcc2" stroke={INK} strokeWidth="1.5" />
            <circle cx="24" cy="27" r="5.5" fill="#2a2d33" stroke={INK} strokeWidth="0.8" />
            <circle cx="24" cy="27" r="2.6" fill="#4b6584" />
            <circle cx="22.3" cy="25.2" r="1" fill="#ffffff" />
          </svg>
        );

      case 'hourglass':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Hourglass with a wooden frame */}
            <path
              d="M 16 9 C 16 17 22 20 22.5 24 C 22 28 16 31 16 39 L 32 39 C 32 31 26 28 25.5 24 C 26 20 32 17 32 9 Z"
              fill="rgba(220, 235, 245, 0.6)"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M 17.8 13 C 18.5 17 22 19.5 23.2 22.5 L 24.8 22.5 C 26 19.5 29.5 17 30.2 13 Z" fill="#e3b76a" />
            <path className="paint" d="M 24 22.5 L 24 33.5" stroke="#e3b76a" strokeWidth="0.9" />
            <path d="M 17 38.6 C 19 33 22 32 24 32 C 26 32 29 33 31 38.6 Z" fill="#e3b76a" />
            <Limb d="M 13.5 9 L 13.5 39" color="#9c6b3f" w={3} />
            <Limb d="M 34.5 9 L 34.5 39" color="#9c6b3f" w={3} />
            <rect x="10.5" y="5" width="27" height="4.2" rx="1.2" fill="#9c6b3f" stroke={INK} strokeWidth="1.4" />
            <rect x="10.5" y="38.8" width="27" height="4.2" rx="1.2" fill="#9c6b3f" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'deerstalker':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Deerstalker — the detective's cap */}
            <path d="M 12 26 C 8 26.5 4 28.5 3 30.5 C 8 31 13 29.5 16 27.5 Z" fill="#9a7b53" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 36 26 C 40 26.5 44 28.5 45 30.5 C 40 31 35 29.5 32 27.5 Z" fill="#9a7b53" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 12 26 C 12 17 18 12 24 12 C 30 12 36 17 36 26 Z" fill="#a98b63" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path className="paint" d="M 16 17 L 32 17 M 13.4 21.2 L 34.6 21.2 M 18 13.6 L 18 26 M 24 12 L 24 26.6 M 30 13.6 L 30 26" stroke="#7d6243" strokeWidth="0.8" />
            <path d="M 12 26 C 18 28.6 30 28.6 36 26" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 18 24 C 17 30 19 34 22 35 C 24 32 24 28 23.5 24 Z" fill="#9a7b53" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 21 13 C 19 10 17 10.5 18.2 12.6 M 27 13 C 29 10 31 10.5 29.8 12.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <circle cx="24" cy="12" r="1.4" fill="#7d6243" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'saola':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Saola — Asian Unicorn of the Annamite Range */}
            <path d="M 21 16 L 15 4 M 26 16 L 20 4" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 21 16 L 15 4 M 26 16 L 20 4" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
            <path d="M 12 30 C 12 24 18 20 28 22 C 36 24 40 28 38 36 C 36 40 28 42 18 40 C 14 38 12 34 12 30 Z" fill="#6c3f20" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 16 34 C 18 36 24 37 28 36 C 24 38 18 38 16 34 Z" fill="#ffffff" />
            <path className="tail" d="M 38 34 C 42 35 44 38 42 41" stroke="#3e2311" strokeWidth="2.2" strokeLinecap="round" />
            {/* Head with the white face markings */}
            <path d="M 16 28 C 12 26 14 18 20 16 C 26 14 30 18 28 25 C 26 30 20 30 16 28 Z" fill="#7a4623" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 16 22 L 20 25 M 18 18 L 22 19" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 26 17 C 30 16 33 18 31 21 Z" fill="#5a3114" stroke={INK} strokeWidth="1.2" />
            <g className="eye">
              <circle cx="21" cy="20" r="2.2" fill="#1c1917" />
              <circle className="pupil" cx="21" cy="20" r="1.4" fill="#1c1917" />
              <circle cx="20.6" cy="19.4" r="0.6" fill="#ffffff" />
            </g>
            <Limb d="M 17 38 L 16 45" color="#5a3114" w={3.2} />
            <Limb d="M 23 39 L 24 45" color="#5a3114" w={3.2} />
            <Limb d="M 31 38 L 30 45" color="#5a3114" w={3.2} />
            <Limb d="M 36 36 L 37 44" color="#5a3114" w={3.2} />
          </svg>
        );

      case 'water-buffalo':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vietnamese Water Buffalo */}
            <path d="M 11 18 C 7 10 16 7 21 13" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 37 18 C 41 10 32 7 27 13" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 11 18 C 8 11 16 8 20 13" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 37 18 C 40 11 32 8 28 13" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="24" cy="31" rx="14" ry="10" fill="#475569" stroke={INK} strokeWidth="1.8" />
            <path className="tail" d="M 37 29 C 42 32 44 38 41 41" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
            {/* Head and ears */}
            <ellipse cx="24" cy="20" rx="7.5" ry="8" fill="#334155" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="14" cy="22" rx="3.5" ry="2" transform="rotate(-15 14 22)" fill="#475569" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="34" cy="22" rx="3.5" ry="2" transform="rotate(15 34 22)" fill="#475569" stroke={INK} strokeWidth="1.2" />
            <g className="eye">
              <circle cx="20" cy="18" r="1.8" fill="#0f172a" />
              <circle className="pupil" cx="20" cy="18" r="1.2" fill="#0f172a" />
              <circle cx="19.5" cy="17.5" r="0.5" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="28" cy="18" r="1.8" fill="#0f172a" />
              <circle className="pupil" cx="28" cy="18" r="1.2" fill="#0f172a" />
              <circle cx="27.5" cy="17.5" r="0.5" fill="#ffffff" />
            </g>
            {/* Muzzle */}
            <ellipse cx="24" cy="24" rx="4.5" ry="3" fill="#64748b" stroke={INK} strokeWidth="1.2" />
            <circle cx="22" cy="24" r="0.8" fill="#1e293b" />
            <circle cx="26" cy="24" r="0.8" fill="#1e293b" />
            <Limb d="M 16 38 L 16 45" color="#334155" w={3.4} />
            <Limb d="M 21 39 L 21 45" color="#334155" w={3.4} />
            <Limb d="M 27 39 L 27 45" color="#334155" w={3.4} />
            <Limb d="M 32 38 L 32 45" color="#334155" w={3.4} />
          </svg>
        );

      case 'conical-hat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Nón lá — palm-leaf conical hat with its chin ribbon */}
            <path d="M 16 31 C 15 37 18 43 24 44 C 30 43 33 37 32 31" stroke="#f43f5e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M 24 8 L 5 33 C 12 36 36 36 43 33 Z" fill="#fef3c7" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path className="paint" d="M 19 15 C 22 16 26 16 29 15" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <path className="paint" d="M 14 22 C 20 24 28 24 34 22" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <path className="paint" d="M 9 29 C 18 31 30 31 39 29" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 5 33 C 12 37 36 37 43 33 C 36 34 12 34 5 33 Z" fill="#d97706" opacity="0.6" />
          </svg>
        );

      case 'lantern':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Hội An Silk Lantern */}
            <path d="M 24 5 L 24 9" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            <rect x="20" y="9" width="8" height="2.5" rx="1" fill="#78350f" stroke={INK} strokeWidth="1.2" />
            <path d="M 20 11.5 C 13 14 11 20 11 25 C 11 30 14 35 20 37.5 L 28 37.5 C 34 35 37 30 37 25 C 37 20 35 14 28 11.5 Z" fill="#ef4444" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <circle className="glow-spot" cx="24" cy="24.5" r="4.5" fill="#fef08a" opacity="0.85" />
            <path className="paint" d="M 24 11.5 L 24 37.5" stroke="#b91c1c" strokeWidth="1" />
            <path className="paint" d="M 18 12.5 C 16 17 16 32 18 36.5" stroke="#b91c1c" strokeWidth="0.9" />
            <path className="paint" d="M 30 12.5 C 32 17 32 32 30 36.5" stroke="#b91c1c" strokeWidth="0.9" />
            <rect x="20" y="37.5" width="8" height="2.5" rx="1" fill="#78350f" stroke={INK} strokeWidth="1.2" />
            <path className="tail" d="M 24 40 L 24 46 M 22.5 40 L 22 45 M 25.5 40 L 26 45" stroke="#eab308" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'cyclo':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vietnamese Cyclo (Xích Lô) */}
            <circle cx="39" cy="33" r="8" fill="none" stroke={INK} strokeWidth="1.8" />
            <circle cx="39" cy="33" r="2" fill="#475569" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="14" cy="34" rx="7.5" ry="7.5" fill="none" stroke={INK} strokeWidth="1.8" />
            <circle cx="14" cy="34" r="1.8" fill="#475569" stroke={INK} strokeWidth="1.2" />
            <path d="M 14 34 L 28 34 L 39 33 L 34 23 L 26 23 L 28 34" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M 34 23 L 34 19 L 36 19" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <rect x="31" y="18" width="6" height="2.5" rx="1" fill="#1c1917" />
            {/* Seat and folding hood */}
            <path d="M 8 28 L 22 28 L 24 20 L 10 20 Z" fill="#0284c7" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 8 16 C 14 13 22 13 25 17" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 8 16 L 9 20 M 24 17 L 24 20" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 8 28 L 6 33 L 11 33" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      case 'golden-turtle':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Rùa Vàng Kim Quy Hồ Gươm - Mai vàng đồng ngậm gươm thần */}
            <path d="M 12 30 C 10 32 8 36 10 38 C 12 39 15 36 16 33" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="#b45309" />
            <path d="M 36 30 C 38 32 40 36 38 38 C 36 39 33 36 32 33" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="#b45309" />
            <ellipse cx="24" cy="27" rx="14" ry="11" fill="#d97706" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="27" rx="10" ry="7.5" fill="#f59e0b" stroke={INK} strokeWidth="1.2" />
            <path d="M 24 19.5 L 29 23 L 29 29 L 24 32.5 L 19 29 L 19 23 Z" stroke={INK} strokeWidth="1.2" fill="#fbbf24" />
            <path d="M 24 16 L 24 19.5 M 19 23 L 14 21 M 29 23 L 34 21 M 19 29 L 14 31 M 29 29 L 34 31 M 24 32.5 L 24 38" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path d="M 21 17 C 21 11 27 11 27 17 Z" fill="#b45309" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="22" cy="13" r="1.3" fill="#1c1917" />
              <circle className="pupil" cx="22" cy="13" r="0.9" fill="#1c1917" />
              <circle cx="21.7" cy="12.7" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="26" cy="13" r="1.3" fill="#1c1917" />
              <circle className="pupil" cx="26" cy="13" r="0.9" fill="#1c1917" />
              <circle cx="25.7" cy="12.7" r="0.4" fill="#ffffff" />
            </g>
            <path d="M 17 14 L 31 14" stroke="#eab308" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="16.5" cy="14" r="1" fill="#ef4444" />
            <path className="tail" d="M 24 38 L 24 43" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'water-puppet':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chú Tễu rối nước - Búi tóc đào, yếm đỏ, tay vẫy tếu táo */}
            <circle cx="17" cy="11" r="2.8" fill="#1c1917" stroke={INK} strokeWidth="1.2" />
            <circle cx="31" cy="11" r="2.8" fill="#1c1917" stroke={INK} strokeWidth="1.2" />
            <circle cx="24" cy="18" r="7.5" fill="#fed7aa" stroke={INK} strokeWidth="1.6" />
            <path d="M 21 21 Q 24 24 27 21" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <g className="eye">
              <circle cx="21" cy="16.5" r="1.3" fill="#1c1917" />
              <circle className="pupil" cx="21" cy="16.5" r="0.9" fill="#1c1917" />
              <circle cx="20.7" cy="16.2" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27" cy="16.5" r="1.3" fill="#1c1917" />
              <circle className="pupil" cx="27" cy="16.5" r="0.9" fill="#1c1917" />
              <circle cx="26.7" cy="16.2" r="0.4" fill="#ffffff" />
            </g>
            <path d="M 18 25 L 30 25 L 33 38 L 15 38 Z" fill="#ef4444" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 24 25 L 24 38" stroke="#b91c1c" strokeWidth="1.2" />
            <circle cx="24" cy="27" r="1.2" fill="#fde047" />
            <path className="wave" d="M 17 26 C 11 25 8 19 7 14" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
            <path d="M 17 26 C 11 25 8 19 7 14" stroke={INK} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 31 26 C 37 25 40 21 41 17" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
            <path d="M 31 26 C 37 25 40 21 41 17" stroke={INK} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 18 38 L 18 44 M 30 38 L 30 44" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
            <path d="M 12 43 C 18 45 30 45 36 43" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'dong-tao-chicken':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Gà Đông Tảo - Mào đỏ, ức tía, chân vảy rồng to xù xì */}
            <path className="tail" d="M 16 24 C 11 19 8 20 6 25 C 10 28 14 28 17 29" fill="#1e293b" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <ellipse cx="23" cy="27" rx="10" ry="8" fill="#7f1d1d" stroke={INK} strokeWidth="1.6" />
            <path d="M 19 25 C 22 23 27 24 28 28 C 27 32 21 33 19 25 Z" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <path d="M 27 25 C 29 21 30 17 31 14 C 33 13 36 15 35 18 C 34 22 31 26 29 28 Z" fill="#991b1b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 31 13 C 31 8 35 8 36 11 C 38 9 40 10 39 13 Z" fill="#ef4444" stroke={INK} strokeWidth="1.2" />
            <path d="M 36 16 L 41 17 L 36 19 Z" fill="#f59e0b" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="34" cy="15" r="1.4" fill="#1c1917" />
              <circle className="pupil" cx="34" cy="15" r="0.9" fill="#1c1917" />
              <circle cx="33.7" cy="14.7" r="0.4" fill="#ffffff" />
            </g>
            <Limb d="M 21 34 L 20 44" color="#dc2626" w={5} />
            <path d="M 17 44 L 23 44" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <Limb d="M 28 34 L 29 44" color="#dc2626" w={5} />
            <path d="M 26 44 L 32 44" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'hmong-dog':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chó H'Mông cộc đuôi - Lông hung đỏ, tai vểnh, đuôi cộc tròn */}
            <ellipse cx="23" cy="29" rx="11" ry="8" fill="#b45309" stroke={INK} strokeWidth="1.6" />
            <circle className="tail" cx="12" cy="27" r="3" fill="#92400e" stroke={INK} strokeWidth="1.4" />
            <path d="M 26 25 C 27 20 30 16 34 16 C 39 16 41 21 38 27 C 35 31 30 31 27 28 Z" fill="#d97706" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 31 16 L 31 10 L 35 15 Z" fill="#92400e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 36 16 L 38 10 L 40 15 Z" fill="#92400e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <ellipse cx="38" cy="23" rx="3.5" ry="2.5" fill="#fef3c7" stroke={INK} strokeWidth="1.1" />
            <circle cx="40" cy="22.5" r="1.1" fill="#1c1917" />
            <g className="eye">
              <circle cx="34.5" cy="19" r="1.5" fill="#1c1917" />
              <circle className="pupil" cx="34.5" cy="19" r="1" fill="#1c1917" />
              <circle cx="34.2" cy="18.7" r="0.4" fill="#ffffff" />
            </g>
            <Limb d="M 18 36 L 17 44" color="#92400e" w={3.4} />
            <Limb d="M 23 37 L 23 45" color="#92400e" w={3.4} />
            <Limb d="M 28 37 L 28 45" color="#b45309" w={3.4} />
            <Limb d="M 33 36 L 34 44" color="#b45309" w={3.4} />
          </svg>
        );

      case 'langur':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Voọc mông trắng - Thân đen tuyền, mông trắng, mào lông đầu */}
            <path className="tail" d="M 14 33 C 8 33 6 23 9 17" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="23" cy="27" rx="8.5" ry="10" fill="#1e293b" stroke={INK} strokeWidth="1.6" />
            <path d="M 15 28 C 15 34 20 37 25 36 C 21 34 18 30 17 27 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.2" />
            <circle cx="28" cy="16" r="6" fill="#1e293b" stroke={INK} strokeWidth="1.5" />
            <path d="M 23 16 C 24 11 29 11 31 13 C 33 16 32 19 28 20 C 25 20 23 18 23 16 Z" fill="#f8fafc" stroke={INK} strokeWidth="1" />
            <path d="M 28 10 L 29 6 L 31 10" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="29" cy="16.5" r="2.8" fill="#0f172a" />
            <g className="eye">
              <circle cx="30" cy="16" r="1.4" fill="#fbbf24" />
              <circle className="pupil" cx="30" cy="16" r="0.9" fill="#1c1917" />
              <circle cx="29.7" cy="15.7" r="0.4" fill="#ffffff" />
            </g>
            <Limb d="M 21 36 L 20 44" color="#1e293b" w={3} />
            <Limb d="M 27 36 L 28 44" color="#1e293b" w={3} />
          </svg>
        );

      case 'khen':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Khèn H'Mông - Bầu khèn gỗ, ống trúc và dải chỉ đỏ */}
            <path d="M 14 31 C 11 27 13 22 18 22 C 22 22 24 26 23 31 Z" fill="#78350f" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 16 38 L 36 10" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 16 38 L 36 10" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 18 40 L 40 9" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <path d="M 18 40 L 40 9" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 15 35 L 32 12" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 15 35 L 32 12" stroke={INK} strokeWidth="0.7" strokeLinecap="round" />
            <path d="M 13 33 L 28 13" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
            <rect x="22" y="21" width="5" height="3" rx="1" fill="#fde047" stroke={INK} strokeWidth="1" transform="rotate(-40 22 21)" />
            <path className="tail" d="M 16 33 C 12 37 10 43 8 45 M 17 34 C 15 39 14 43 12 46" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'cham-statue':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Tượng vũ nữ Apsara Champa - Vương miện sen, dáng múa sa thạch */}
            <path d="M 21 11 L 24 5 L 27 11 Z" fill="#d97706" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 18 13 C 21 11 27 11 30 13 L 29 15 L 19 15 Z" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="24" cy="18" rx="5" ry="5.5" fill="#d4d4d8" stroke={INK} strokeWidth="1.4" />
            <path d="M 22 21 Q 24 22.5 26 21" stroke="#52525b" strokeWidth="1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="22" cy="17.5" r="1.1" fill="#27272a" />
              <circle className="pupil" cx="22" cy="17.5" r="0.8" fill="#27272a" />
            </g>
            <g className="eye">
              <circle cx="26" cy="17.5" r="1.1" fill="#27272a" />
              <circle className="pupil" cx="26" cy="17.5" r="0.8" fill="#27272a" />
            </g>
            <path d="M 21 23 C 22 25 26 25 27 23" stroke="#eab308" strokeWidth="1.4" fill="none" />
            <path d="M 20 25 C 18 29 19 36 21 41 L 27 41 C 29 36 30 29 28 25 Z" fill="#a1a1aa" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path className="wave" d="M 20 25 C 14 26 10 23 8 18" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 20 25 C 14 26 10 23 8 18" stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M 28 25 C 34 26 38 29 40 35" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 28 25 C 34 26 38 29 40 35" stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'highland-elephant':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Voi Bản Đôn Tây Nguyên - Ngà trắng, bành voi, vòi cong */}
            <ellipse cx="23" cy="28" rx="12" ry="9" fill="#64748b" stroke={INK} strokeWidth="1.8" />
            <rect x="18" y="16" width="10" height="4" rx="1" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <path d="M 19 18 L 27 18" stroke="#ef4444" strokeWidth="1" />
            <circle cx="33" cy="24" r="7" fill="#475569" stroke={INK} strokeWidth="1.6" />
            <path d="M 27 20 C 25 24 26 29 30 30 C 31 27 30 22 28 20 Z" fill="#64748b" stroke={INK} strokeWidth="1.2" />
            <path d="M 37 25 C 41 27 43 33 40 37 C 39 37 38 35 39 33 C 40 30 38 28 36 28" fill="#475569" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 36 29 C 40 30 42 27 43 25" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
            <path d="M 36 29 C 40 30 42 27 43 25" stroke={INK} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <g className="eye">
              <circle cx="34" cy="22" r="1.4" fill="#0f172a" />
              <circle className="pupil" cx="34" cy="22" r="0.9" fill="#0f172a" />
              <circle cx="33.7" cy="21.7" r="0.4" fill="#ffffff" />
            </g>
            <Limb d="M 16 35 L 16 44" color="#475569" w={4} />
            <Limb d="M 22 36 L 22 44" color="#475569" w={4} />
            <Limb d="M 28 36 L 28 44" color="#475569" w={4} />
            <path className="tail" d="M 12 28 L 10 36" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'gong':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cồng chiêng Tây Nguyên - Chiêng đồng có núm, hoa văn đúc nổi */}
            <circle cx="24" cy="24" r="17" fill="#b45309" stroke={INK} strokeWidth="2" />
            <circle cx="24" cy="24" r="14" fill="#d97706" stroke={INK} strokeWidth="1.2" />
            <circle cx="24" cy="24" r="10" stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="3 2" />
            <circle cx="24" cy="24" r="5" fill="#f59e0b" stroke={INK} strokeWidth="1.6" />
            <circle cx="22.5" cy="22.5" r="1.5" fill="#fef08a" opacity="0.8" />
            <path d="M 20 7 C 22 4 26 4 28 7" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 20 7 C 22 4 26 4 28 7" stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'dragon-boat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thuyền rồng hoàng cung Huế - Đầu rồng vàng, lầu son sông Hương */}
            <path d="M 6 30 C 14 36 34 36 42 28 L 40 33 C 32 39 14 39 6 30 Z" fill="#92400e" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 40 29 C 43 25 43 19 40 16 C 39 18 38 18 38 16 C 36 18 36 21 38 24 Z" fill="#f59e0b" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="41" cy="18" r="1" fill="#ef4444" />
            <path d="M 18 24 L 28 24 L 29 20 L 17 20 Z" fill="#ef4444" stroke={INK} strokeWidth="1.2" />
            <path d="M 15 20 C 19 18 27 18 31 20" stroke="#eab308" strokeWidth="1.6" strokeLinecap="round" />
            <circle className="glow-spot" cx="23" cy="22" r="2" fill="#fef08a" opacity="0.9" />
            <path d="M 4 36 C 10 39 16 34 22 37 C 28 34 34 39 44 35" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      case 'dan-bau':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Đàn bầu - Cần sừng uốn cong, quả bầu tiện gỗ, một dây ngân */}
            <path d="M 6 32 L 40 24 L 41 27 L 7 35 Z" fill="#78350f" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 12 31 L 38 25" stroke="#f59e0b" strokeWidth="1" />
            <ellipse cx="10" cy="26" rx="3.5" ry="4.5" fill="#d97706" stroke={INK} strokeWidth="1.3" />
            <path className="wave" d="M 10 26 C 9 19 13 13 15 9" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 10 26 C 9 19 13 13 15 9" stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M 14 11 L 39 25" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="39" cy="25" r="1.5" fill="#fde047" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'banh-mi':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bánh mì Sài Gòn - Ổ vàng rụm, rạch giữa lộ chả lụa & dưa chuột */}
            <ellipse cx="24" cy="24" rx="18" ry="10" fill="#f59e0b" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="24" rx="16" ry="8" fill="#fbbf24" stroke={INK} strokeWidth="1" />
            <path d="M 9 24 Q 24 27 39 24" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 14 23 L 20 22 M 24 23 L 30 22 M 33 23 L 37 22" stroke="#f43f5e" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 17 25 L 23 25 M 27 25 L 34 25" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 21 21 L 23 18 M 27 21 L 29 18" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'coffee-phin':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cà phê phin nhôm truyền thống & ly thủy tinh */}
            <path d="M 18 10 L 30 10 L 29 7 L 19 7 Z" fill="#94a3b8" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="24" cy="6" r="1.2" fill="#64748b" stroke={INK} strokeWidth="1" />
            <rect x="17" y="10" width="14" height="12" rx="1" fill="#cbd5e1" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="24" cy="22" rx="10" ry="2.5" fill="#94a3b8" stroke={INK} strokeWidth="1.4" />
            <path d="M 18 24 L 19 40 C 19 42 29 42 29 40 L 30 24 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" opacity="0.85" />
            <path d="M 19 37 L 29 37 L 29 40 C 29 42 19 42 19 40 Z" fill="#fef3c7" />
            <path d="M 18.5 30 L 29.5 30 L 29 37 L 19 37 Z" fill="#451a03" />
            <circle cx="24" cy="26" r="1" fill="#451a03" />
          </svg>
        );

      case 'sampan':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Xuồng ba lá miền Tây - Chở sọt hoa trái nhiệt đới */}
            <path d="M 5 27 C 14 36 34 36 43 27 C 35 34 13 34 5 27 Z" fill="#78350f" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 6 27 C 15 32 33 32 42 27" stroke="#b45309" strokeWidth="1.8" fill="none" />
            <circle cx="20" cy="23" r="3.5" fill="#facc15" stroke={INK} strokeWidth="1" />
            <circle cx="25" cy="21" r="3" fill="#ef4444" stroke={INK} strokeWidth="1" />
            <circle cx="28" cy="24" r="3.5" fill="#22c55e" stroke={INK} strokeWidth="1" />
            <path d="M 14 36 L 35 15" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 33 17 L 37 13" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
            <path d="M 4 33 C 12 36 22 31 32 35 C 38 32 42 34 44 33" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'ca-mau-crab':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cua Năm Căn Cà Mau - Mai dày, 2 càng to kềnh màu đỏ cam */}
            <ellipse cx="24" cy="27" rx="10.5" ry="8.5" fill="#047857" stroke={INK} strokeWidth="1.8" />
            <path d="M 18 24 C 21 22 27 22 30 24 M 20 28 C 22 30 26 30 28 28" stroke="#065f46" strokeWidth="1.2" strokeLinecap="round" />
            <g className="eye">
              <circle cx="21" cy="18" r="1.6" fill="#1c1917" />
              <circle className="pupil" cx="21" cy="18" r="1.1" fill="#1c1917" />
              <circle cx="20.7" cy="17.7" r="0.5" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27" cy="18" r="1.6" fill="#1c1917" />
              <circle className="pupil" cx="27" cy="18" r="1.1" fill="#1c1917" />
              <circle cx="26.7" cy="17.7" r="0.5" fill="#ffffff" />
            </g>
            <path className="wave" d="M 15 23 C 9 20 7 13 12 10 C 16 8 18 15 15 19" fill="#ea580c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 33 23 C 39 20 41 13 36 10 C 32 8 30 15 33 19" fill="#ea580c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <Limb d="M 15 28 L 8 31 L 6 36" color="#059669" w={2.6} />
            <Limb d="M 16 32 L 10 36 L 9 41" color="#059669" w={2.6} />
            <Limb d="M 33 28 L 40 31 L 42 36" color="#059669" w={2.6} />
            <Limb d="M 32 32 L 38 36 L 39 41" color="#059669" w={2.6} />
          </svg>
        );

      case 'phu-quoc-dog':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chó xoáy Phú Quốc - Lông vàng lửa, dải xoáy kiếm trên lưng */}
            <ellipse cx="23" cy="28" rx="11" ry="8" fill="#d97706" stroke={INK} strokeWidth="1.6" />
            <path d="M 16 20 C 20 18 26 18 30 20 C 26 21 20 21 16 20 Z" fill="#92400e" stroke={INK} strokeWidth="0.8" />
            <path className="tail" d="M 13 26 C 9 24 7 18 10 14" stroke="#d97706" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M 27 24 C 28 19 32 15 36 15 C 40 15 42 19 39 25 C 37 29 31 29 27 26 Z" fill="#f59e0b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 32 15 L 34 8 L 36 14 Z" fill="#b45309" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 37 15 L 39 8 L 41 14 Z" fill="#b45309" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <ellipse cx="40" cy="21" rx="3" ry="2" fill="#fed7aa" stroke={INK} strokeWidth="1" />
            <circle cx="42" cy="20.5" r="1" fill="#1c1917" />
            <g className="eye">
              <circle cx="36" cy="18" r="1.5" fill="#1c1917" />
              <circle className="pupil" cx="36" cy="18" r="1" fill="#1c1917" />
              <circle cx="35.7" cy="17.7" r="0.4" fill="#ffffff" />
            </g>
            <Limb d="M 17 35 L 16 45" color="#b45309" w={3.2} />
            <Limb d="M 22 36 L 22 45" color="#b45309" w={3.2} />
            <Limb d="M 28 36 L 29 45" color="#d97706" w={3.2} />
            <Limb d="M 33 35 L 34 45" color="#d97706" w={3.2} />
          </svg>
        );

      case 'dugong':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bò biển Dugong Phú Quốc - Thân tròn hiền lành, đuôi xòe cá voi */}
            <path className="tail" d="M 12 25 C 8 21 5 18 5 24 C 5 30 8 27 12 25 Z" fill="#64748b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <ellipse cx="24" cy="25" rx="14" ry="9" fill="#94a3b8" stroke={INK} strokeWidth="1.8" />
            <path d="M 15 28 C 19 32 29 32 33 28 C 29 30 19 30 15 28 Z" fill="#cbd5e1" />
            <path d="M 34 22 C 38 21 42 24 41 28 C 40 31 35 30 33 28 Z" fill="#64748b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="39" cy="27" r="0.8" fill="#1c1917" />
            <path d="M 27 28 C 29 33 26 36 24 35 C 23 33 25 30 27 28 Z" fill="#64748b" stroke={INK} strokeWidth="1.2" />
            <g className="eye">
              <circle cx="34" cy="21" r="1.3" fill="#1c1917" />
              <circle className="pupil" cx="34" cy="21" r="0.9" fill="#1c1917" />
              <circle cx="33.7" cy="20.7" r="0.4" fill="#ffffff" />
            </g>
            <path d="M 39 28 C 41 33 43 35 44 38 M 38 29 C 40 32 39 35 40 37" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'dong-son-drum':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Trống đồng Đông Sơn - Mặt trống mặt trời và đàn chim Lạc */}
            <circle cx="24" cy="24" r="20" fill="#b4833e" stroke={INK} strokeWidth="1.8" />
            <circle cx="24" cy="24" r="16" stroke="#d4af37" strokeWidth="1.2" />
            <circle cx="24" cy="24" r="11" stroke="#8a5a22" strokeWidth="1" />
            <polygon points="24,19 25.5,22.5 29,24 25.5,25.5 24,29 22.5,25.5 19,24 22.5,22.5" fill="#fde047" stroke={INK} strokeWidth="0.8" />
            <circle cx="24" cy="24" r="5" stroke="#fde047" strokeWidth="0.8" />
            <path className="paint" d="M 24 5 C 31 5 37 9 40 15" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="1.5 2" />
            <path className="paint" d="M 40 33 C 37 39 31 43 24 43" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="1.5 2" />
            <path className="paint" d="M 8 33 C 5 27 5 21 8 15" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="1.5 2" />
            <path d="M 28 9 L 34 11 L 32 15 Z" fill="#d4af37" stroke={INK} strokeWidth="0.8" />
            <path d="M 39 26 L 41 32 L 37 30 Z" fill="#d4af37" stroke={INK} strokeWidth="0.8" />
            <path d="M 20 39 L 14 37 L 16 33 Z" fill="#d4af37" stroke={INK} strokeWidth="0.8" />
            <path d="M 9 22 L 7 16 L 11 18 Z" fill="#d4af37" stroke={INK} strokeWidth="0.8" />
          </svg>
        );

      case 'pho-bowl':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bát phở Thăng Long - Bát sứ trắng xanh, bánh phở, thịt bò, hành hoa */}
            <ellipse cx="24" cy="40" rx="9" ry="2.5" fill="#cbd5e1" stroke={INK} strokeWidth="1.2" />
            <path d="M 8 22 C 8 34 15 40 24 40 C 33 40 40 34 40 22 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="24" cy="22" rx="16" ry="6" fill="#fef08a" stroke={INK} strokeWidth="1.4" />
            <path d="M 9 22 C 14 26 34 26 39 22" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 16 21 C 20 24 28 24 32 21" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="21" cy="20" rx="4" ry="2.2" fill="#991b1b" stroke={INK} strokeWidth="0.8" />
            <ellipse cx="28" cy="21" rx="3.5" ry="2" fill="#991b1b" stroke={INK} strokeWidth="0.8" />
            <circle cx="16" cy="23" r="1.2" fill="#16a34a" />
            <circle cx="24" cy="24" r="1.2" fill="#16a34a" />
            <circle cx="31" cy="23" r="1.2" fill="#16a34a" />
            <circle cx="25" cy="19" r="1" fill="#16a34a" />
            <path className="wave" d="M 19 15 C 17 12 21 9 19 6" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
            <path className="wave" d="M 28 14 C 26 11 30 8 28 5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'brocade':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thổ cẩm Tây Bắc - Họa tiết quả trám dệt truyền thống */}
            <rect x="8" y="10" width="32" height="28" rx="2" fill="#1e293b" stroke={INK} strokeWidth="1.6" />
            <polygon points="24,13 36,24 24,35 12,24" fill="#dc2626" stroke="#f59e0b" strokeWidth="1.2" />
            <polygon points="24,17 31,24 24,31 17,24" fill="#0284c7" stroke="#f8fafc" strokeWidth="0.8" />
            <polygon points="24,20 28,24 24,28 20,24" fill="#fde047" stroke={INK} strokeWidth="0.6" />
            <path d="M 8 13 L 12 10 L 16 13 L 20 10 L 24 13 L 28 10 L 32 13 L 36 10 L 40 13" stroke="#eab308" strokeWidth="1" />
            <path d="M 8 35 L 12 38 L 16 35 L 20 38 L 24 35 L 28 38 L 32 35 L 36 38 L 40 35" stroke="#eab308" strokeWidth="1" />
            <path d="M 10 38 L 10 44 M 17 38 L 17 44 M 24 38 L 24 44 M 31 38 L 31 44 M 38 38 L 38 44" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'basket-boat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thuyền thúng nan làng chài - Thuyền tròn đan tre trét dầu rái */}
            <ellipse cx="24" cy="27" rx="17" ry="14" fill="#d97706" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="27" rx="14" ry="11" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="24" cy="27" rx="10" ry="7" fill="#78350f" />
            <ellipse cx="24" cy="27" rx="17" ry="14" stroke="#451a03" strokeWidth="1.2" strokeDasharray="3 2" />
            <Limb d="M 8 10 L 34 38" color="#a16207" w={2.2} />
            <path d="M 32 36 L 41 43 L 38 45 L 30 38 Z" fill="#ca8a04" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          </svg>
        );

      case 'ao-dai':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Áo dài truyền thống duyên dáng - Cổ tàu, tà bay thướt tha */}
            <path d="M 21 30 L 19 45 M 27 30 L 29 45" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 21 8 L 27 8 L 28 16 L 20 16 Z" fill="#9333ea" stroke={INK} strokeWidth="1.2" />
            <path d="M 21 8 C 21 6 27 6 27 8" stroke="#facc15" strokeWidth="1.4" />
            <path d="M 20 12 L 12 18 L 14 20 L 21 16 Z" fill="#7e22ce" stroke={INK} strokeWidth="1" />
            <path d="M 28 12 L 36 18 L 34 20 L 27 16 Z" fill="#7e22ce" stroke={INK} strokeWidth="1" />
            <path className="wave" d="M 20 16 C 18 24 16 34 18 42 C 22 43 26 43 28 42 C 30 34 28 24 28 16 Z" fill="#9333ea" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 24 9 C 26 11 27 13 28 16" stroke="#facc15" strokeWidth="1" />
          </svg>
        );

      case 't-rung':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Đàn T'rưng Tây Nguyên - Các ống nứa xếp so le treo trên khung */}
            <path d="M 8 10 C 14 36 18 40 22 42 M 40 14 C 34 36 30 40 26 42" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 10 14 L 38 18" stroke="#ca8a04" strokeWidth="0.8" />
            <path d="M 14 36 L 32 38" stroke="#ca8a04" strokeWidth="0.8" />
            <rect x="12" y="12" width="24" height="3" rx="1.5" fill="#eab308" stroke={INK} strokeWidth="0.9" />
            <rect x="13.5" y="17" width="21" height="3" rx="1.5" fill="#eab308" stroke={INK} strokeWidth="0.9" />
            <rect x="15" y="22" width="18" height="3" rx="1.5" fill="#facc15" stroke={INK} strokeWidth="0.9" />
            <rect x="16.5" y="27" width="15" height="3" rx="1.5" fill="#facc15" stroke={INK} strokeWidth="0.9" />
            <rect x="18" y="32" width="12" height="3" rx="1.5" fill="#fde047" stroke={INK} strokeWidth="0.9" />
            <rect x="19.5" y="37" width="9" height="3" rx="1.5" fill="#fde047" stroke={INK} strokeWidth="0.9" />
            <Limb d="M 28 6 L 35 15" color="#b45309" w={1.8} />
            <circle cx="35" cy="15" r="2.2" fill="#dc2626" stroke={INK} strokeWidth="0.8" />
          </svg>
        );

      case 'betta':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Siamese fighting fish (pla kat), head to the right, huge flowing crimson fins */}
            <g className="tail">
              <path
                d="M 24 22.6 L 19 23 C 15 15 10 9 5 7 C 2 13 1.5 22 2.5 28 C 3 34 5 39 8 42 C 12 36 16 30 19 25.5 L 24 25.6 Z"
                fill="#d8344a"
                stroke={INK}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M 17 24 L 6 11 M 16 24.4 L 4 20 M 16 24.8 L 4.5 30 M 17 25.4 L 8 38" stroke="#9e1f33" strokeWidth="1" strokeLinecap="round" />
            </g>
            <path d="M 32 27.5 C 30 33 24 39 15 43 C 16 38 18 32 21 27 Z" fill="#c52b45" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 33 20 C 30 14 23 10 14 8.5 C 16 12.5 18.5 17 21.5 21 Z" fill="#c52b45" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path
              d="M 43 23.5 C 41 19.8 36 18.8 30 19.6 C 24.5 20.4 20 21.6 18 24 C 20 26.6 24.5 27.8 30 28.4 C 36 29 41 27.4 43 23.5 Z"
              fill="#3f47a8"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 22 23.4 C 26 22.2 31 21.8 35 22.2" stroke="#6fb3e6" strokeWidth="1.3" strokeLinecap="round" />
            <path className="paint" d="M 24 25.8 q 1.2 -1.2 2.4 0 M 27.5 26.2 q 1.2 -1.2 2.4 0 M 31 26.4 q 1.2 -1.2 2.4 0" stroke="#8b78e0" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 37 20.4 C 35.5 22.5 35.5 25.5 37 27.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path d="M 34.6 27.4 C 34 31 32.6 34.4 30.4 37 C 31.4 33.6 31.8 30.4 31.6 27.8 Z" fill="#d8344a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 35 25.4 C 33.6 26.4 32.6 27.8 32.2 29.4 C 33.8 28.6 35 27.4 35.6 26 Z" fill="#7f8be0" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M 42.6 24.2 L 41 24.6" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="39.4" cy="22.6" r="1.3" fill={INK} />
              <circle cx="39.7" cy="22.2" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'crocodile':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Siamese crocodile lying low, long toothy snout to the left */}
            <Limb d="M 17.5 35.4 L 15 40.4 L 11.6 41.4 M 31 35.2 L 33.6 40.2 L 37 41" color="#6f7d3c" w={3.6} />
            <g className="tail">
              <path d="M 35.4 25.4 L 36.8 22.4 L 38.2 25.8 Z M 39.2 26.1 L 40.6 23.4 L 41.8 26 Z M 42.4 24.9 L 43.8 22.4 L 44.4 23.9 Z" fill="#4f5a2a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
              <path
                d="M 28.5 23.2 C 33.5 23.2 37.5 26.2 40.8 26 C 43.4 25.8 44.8 23.2 45.6 20 C 46.8 24 45.6 29.6 41.6 31.2 C 37.6 32.8 34.2 35.2 29.6 37.2 Z"
                fill="#6f7d3c"
                stroke={INK}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path className="paint" d="M 34.6 33.4 C 37.4 31.8 39.6 30.6 42.4 29.8" stroke="#c9c58a" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            <circle cx="20.1" cy="23.5" r="1.6" fill="#4f5a2a" stroke={INK} strokeWidth="1" />
            <circle cx="23.6" cy="22.1" r="1.6" fill="#4f5a2a" stroke={INK} strokeWidth="1" />
            <circle cx="27.4" cy="21.7" r="1.6" fill="#4f5a2a" stroke={INK} strokeWidth="1" />
            <circle cx="31" cy="22.2" r="1.6" fill="#4f5a2a" stroke={INK} strokeWidth="1" />
            <path
              d="M 2.4 31.6 C 2.2 30 4 29.4 6 29.2 C 8.5 28.9 10.5 28.2 12 27 C 12.6 24 16.4 23.4 17.4 26.2 C 20.5 22.6 26 21.4 31.5 22.6 C 35 23.4 36.6 26.5 36.2 30 C 35.8 34 33.6 36.6 30.2 37.6 C 25 39 19 39 14 37.4 C 10 36.6 6 35.6 3.2 34.6 C 2.2 34.2 2 33 2.4 31.6 Z"
              fill="#6f7d3c"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 8.5 35 C 15.5 37.2 24.5 37.6 30.5 36.4" stroke="#c9c58a" strokeWidth="1.6" strokeLinecap="round" />
            <path className="paint" d="M 20.5 27.4 L 22.5 27 M 25 26.6 L 27 26.4 M 29.5 26.6 L 31.5 27 M 22.5 31 L 24.5 30.8 M 27.2 30.6 L 29.2 30.8" stroke="#4f5a2a" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 2.8 32.6 C 6.5 32.8 10.5 32.6 14.5 31.4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 4.4 32.7 L 5.1 34.2 L 5.8 32.7 Z M 7.3 32.8 L 8 34.3 L 8.7 32.8 Z M 10.2 32.5 L 10.9 34 L 11.6 32.3 Z" fill="#fdf6e3" stroke={INK} strokeWidth="0.6" strokeLinejoin="round" />
            <circle cx="3.6" cy="30.4" r="0.7" fill={INK} />
            <g className="eye">
              <circle cx="14.8" cy="25.8" r="1.8" fill="#e0c64a" stroke={INK} strokeWidth="0.8" />
              <circle className="pupil" cx="14.8" cy="25.9" r="1" fill={INK} />
              <circle cx="14.4" cy="25.4" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'mudskipper':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Mudskipper propped on a mud mound, googly eyes on top, head to the left */}
            <path d="M 2.5 44 C 5 37.5 14 35 24 35 C 34 35 43 37.5 45.5 44 Z" fill="#7a5a3c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path className="paint" d="M 8 41 C 11 39.4 14 38.8 17 38.8 M 31 40 C 34 40 37 40.8 39.5 42" stroke="#a8845e" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 28 27.5 C 30 24 34 24 36.5 28 L 34.5 31 Z" fill="#a8977a" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 18.5 22.5 C 19.5 15.5 23 11.5 28 12 C 29 16.5 28.8 22 28 27 Z" fill="#a8977a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path className="paint" d="M 19.6 19 C 21 14.5 24 12.6 27.4 12.8" stroke="#3aa7e8" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 21 22 L 22.5 16 M 24 23 L 25 14.5 M 27 25 L 27.4 15" stroke="#6e5f48" strokeWidth="0.8" strokeLinecap="round" />
            <path className="tail" d="M 38 32 C 41 29.5 44.5 30 45.6 33.2 C 45 36 41.5 37 38 35.6 Z" fill="#a8977a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path
              d="M 6.5 31 C 6 25.5 9.5 21 15.5 21 C 21 21 25 24 29 27.5 C 32 30 35.5 31.5 39 32.3 L 39 35.6 C 35 36 30 35.6 25 35.2 C 18 34.6 11 35 8 33.8 C 7 33.2 6.6 32.2 6.5 31 Z"
              fill="#8c7b62"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 9 33.2 C 15 34.2 24 34 31 34.6" stroke="#c9b99a" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="15" cy="25.5" r="0.85" fill="#4cc3ff" />
            <circle cx="19.5" cy="25" r="0.85" fill="#4cc3ff" />
            <circle cx="22.5" cy="28.2" r="0.85" fill="#4cc3ff" />
            <circle cx="26.5" cy="29.4" r="0.85" fill="#4cc3ff" />
            <circle cx="18.5" cy="30.4" r="0.85" fill="#4cc3ff" />
            <circle cx="30.5" cy="31.4" r="0.85" fill="#4cc3ff" />
            <circle cx="34" cy="32.8" r="0.85" fill="#4cc3ff" />
            <path d="M 15.5 30 C 14 33 12.5 35 13 37.5 C 15 37.6 17.5 36 19 32 Z" fill="#a8977a" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 6.6 29.6 C 8 30.6 10 30.8 11.8 30" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="17.4" cy="18.4" r="2.9" fill="#fdf6e3" stroke={INK} strokeWidth="1.3" />
              <circle className="pupil" cx="16.8" cy="18.6" r="1.4" fill={INK} />
              <circle cx="16.4" cy="18" r="0.45" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="12.6" cy="19" r="3.1" fill="#fdf6e3" stroke={INK} strokeWidth="1.3" />
              <circle className="pupil" cx="11.9" cy="19.2" r="1.5" fill={INK} />
              <circle cx="11.5" cy="18.6" r="0.5" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'giant-catfish':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Mekong giant catfish (pla buek), broad flat whiskered head to the left */}
            <path
              className="tail"
              d="M 38.5 24.4 C 41 22 43.2 19.6 45.4 17 C 46.4 20.4 45.6 23.8 43.6 26 C 45.6 28.2 46.6 31.4 45.8 35 C 43.4 32.8 41 30 38.5 27.8 Z"
              fill="#8c979f"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 16.6 19.4 C 17.2 16.6 19.4 14.8 21.8 15 C 23.2 15.4 23.6 17.4 24.6 19 Z" fill="#8c979f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 27 29.8 C 29 32.2 31.5 33.2 34 33.2 C 33 30.6 31.5 29.2 30 28.8 Z" fill="#8c979f" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 3.2 25.4 C 3 22.6 5.5 21.2 9 20.8 C 13 20.4 15.5 19.6 18 19 C 24 17.8 30 18.8 34 21 C 36.2 22.2 38 23.4 39.8 24.4 L 39.8 27.8 C 36.5 29.6 32.5 30.8 27.5 31.4 C 20.5 32.2 13.5 32 8.5 30.8 C 5 30 3.4 28 3.2 25.4 Z"
              fill="#a3aeb5"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 7.5 29.4 C 14 31 23 31 31.5 29.6" stroke="#eef0ea" strokeWidth="2" strokeLinecap="round" />
            <path className="paint" d="M 15 24.6 C 22 24 30 24.2 37 25.6" stroke="#7d8992" strokeWidth="1" strokeLinecap="round" />
            <path d="M 13.2 21.6 C 12 24 12 27.6 13.4 30.4" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path d="M 15 27.6 C 16.5 30 18.5 32.4 21 33.4 C 20.5 30.4 18.5 28 15 27.6 Z" fill="#8c979f" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 3.4 26.4 C 5.5 27.8 8.4 28 10.6 27.2" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 4.6 27.4 C 3.4 29 2.4 30.2 1.2 30.6 M 8.2 27.8 C 7.8 29.8 6.8 31.4 5.4 32.4 M 4.4 23.4 C 3.2 22.2 2 21.6 0.8 21.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="8.6" cy="24.6" r="1.6" fill="#eef0ea" stroke={INK} strokeWidth="0.7" />
              <circle className="pupil" cx="8.4" cy="24.7" r="1" fill={INK} />
              <circle cx="8.1" cy="24.3" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'river-prawn':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Giant freshwater prawn (kung mae nam), long bright blue claws reaching left */}
            <path d="M 11.5 20.6 C 14 9 28 3 45.5 5 M 12 21.6 C 18 13 30 10 46 13" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path d="M 17.5 27.5 L 16 33.5 M 20.5 28 L 20 34.5 M 23.5 28 L 24 34" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <Limb d="M 16 25.6 L 10.5 28 L 6.8 28.6 M 18 27 L 13.5 32.5 L 9.8 35.4" color="#2a6fdb" w={3.6} />
            <path d="M 8.8 26.8 C 6 26.4 3 27 0.8 28.6 C 3 29.6 6 30.4 8.8 30.2 Z" fill="#2a6fdb" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 9.5 33.4 C 7.4 34.6 5.4 36.6 4.2 39.8 C 7 39.2 9.6 38 11.7 36.2 Z" fill="#2a6fdb" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 1.8 28.6 L 5.8 28.7 M 5.2 38.8 L 8.4 36" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <path
              className="tail"
              d="M 34.2 38.2 C 30.5 40 28.5 43.5 29.5 46 C 32 45.6 34.4 44.2 36 42 C 37.4 44.6 40 46.2 42.6 46.2 C 42.8 43 41.8 40.6 39.6 39.4 Z"
              fill="#e8873a"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M 26 16.8 C 33 16 39.5 20.5 41.6 27.5 C 43 32.5 41.8 37 39.6 39.6 L 34 38.4 C 35.4 35.4 35.4 32 33.6 29.6 C 31.6 27.2 28.8 27 26.4 27.6 Z"
              fill="#8fa6b8"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 31 16.9 L 29.5 27.3 M 35.6 18.8 L 32 28.2 M 39 22.4 L 33.8 29.8 M 41.2 27.4 L 34.9 32 M 41.9 32.4 L 35.2 34.8" stroke="#e8873a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 13.6 19.6 L 4.6 15.4 L 13 22.6 Z" fill="#8fa6b8" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 12.5 21 C 14 16.5 21 15 27 16.6 C 30 17.6 30.4 25.5 27.6 27.6 C 22.5 29.6 16.5 29 13.5 26.8 C 12 25.4 11.8 22.8 12.5 21 Z"
              fill="#9db3c4"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 16 20.6 C 19.5 19.2 23.5 19.2 26.6 20.4" stroke="#d3e0e8" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 14.2 20.4 L 12 18.4" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="11.4" cy="17.8" r="1.6" fill={INK} />
              <circle cx="11" cy="17.3" r="0.5" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'stingray':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Giant freshwater stingray seen from above, long whip tail curling to the right */}
            <g className="tail">
              <Limb d="M 29 37 C 32 41 37 43.4 42 43.6 C 43.6 43.6 45 43.2 46 42.6" color="#7d6347" w={2} />
              <Limb d="M 24 31 C 24.6 34.4 26.6 35.8 29.4 37.4" color="#7d6347" w={3.4} />
              <path d="M 27.4 35.4 L 31.4 35.8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            </g>
            <path d="M 18.4 29 C 18.2 33 20.8 35.4 24 35.4 C 27.2 35.4 29.8 33 29.6 29 Z" fill="#a3845f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path
              d="M 24 4.8 C 25.4 6 27 6.6 30.4 7.2 C 38.4 8.6 44.4 13.4 44.4 19.6 C 44.4 26.6 35.6 31.8 24 31.8 C 12.4 31.8 3.6 26.6 3.6 19.6 C 3.6 13.4 9.6 8.6 17.6 7.2 C 21 6.6 22.6 6 24 4.8 Z"
              fill="#a3845f"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 7 24.6 C 10.6 28.6 17 30.4 24 30.4 C 31 30.4 37.4 28.6 41 24.6" stroke="#cdb48f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 17.4 11 C 15.2 16 15.4 23.6 18.4 29.4 M 30.6 11 C 32.8 16 32.6 23.6 29.6 29.4" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <circle cx="10.5" cy="15.6" r="1.1" fill="#6b5236" />
            <circle cx="8.4" cy="21.4" r="1.3" fill="#6b5236" />
            <circle cx="12.8" cy="24.8" r="1" fill="#6b5236" />
            <circle cx="13" cy="19.6" r="0.8" fill="#6b5236" />
            <circle cx="37.5" cy="15.6" r="1.1" fill="#6b5236" />
            <circle cx="39.6" cy="21.4" r="1.3" fill="#6b5236" />
            <circle cx="35.2" cy="24.8" r="1" fill="#6b5236" />
            <circle cx="35" cy="19.6" r="0.8" fill="#6b5236" />
            <circle cx="21.6" cy="22.4" r="0.9" fill="#6b5236" />
            <circle cx="26.6" cy="24.6" r="1" fill="#6b5236" />
            <circle cx="23" cy="27.4" r="0.8" fill="#6b5236" />
            <ellipse cx="20.8" cy="16.8" rx="1" ry="0.7" fill="#5a4330" />
            <ellipse cx="27.2" cy="16.8" rx="1" ry="0.7" fill="#5a4330" />
            <g className="eye">
              <circle cx="20.8" cy="12.8" r="1.9" fill="#b9997a" stroke={INK} strokeWidth="1" />
              <circle className="pupil" cx="20.8" cy="12.9" r="1" fill={INK} />
              <circle cx="20.5" cy="12.5" r="0.35" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27.2" cy="12.8" r="1.9" fill="#b9997a" stroke={INK} strokeWidth="1" />
              <circle className="pupil" cx="27.2" cy="12.9" r="1" fill={INK} />
              <circle cx="26.9" cy="12.5" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'goldfish':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Fancy goldfish in a round glass fishbowl */}
            <path d="M 17 42.6 L 31 42.6 L 32.6 45.6 L 15.4 45.6 Z" fill="#b7dcec" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path
              d="M 15.4 10.4 C 6.5 14 3 22 4.8 30 C 6.4 37.4 12.4 42.4 20 43.4 L 28 43.4 C 35.6 42.4 41.6 37.4 43.2 30 C 45 22 41.5 14 32.6 10.4 Z"
              fill="#e6f4fa"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M 7.6 17 C 11.5 15.6 14.5 18 18 16.8 C 21.5 15.6 25 18 28.5 16.8 C 32 15.6 36 18 40.4 17 C 42.6 21 43.4 25.5 42.4 29.8 C 40.8 36.8 35 41.2 28 42.1 L 20 42.1 C 13 41.2 7.2 36.8 5.6 29.8 C 4.6 25.5 5.4 21 7.6 17 Z"
              fill="#8ccbea"
              opacity="0.75"
            />
            <path className="paint" d="M 7.6 17 C 11.5 15.6 14.5 18 18 16.8 C 21.5 15.6 25 18 28.5 16.8 C 32 15.6 36 18 40.4 17" stroke="#4a9cc8" strokeWidth="1.1" strokeLinecap="round" />
            <path className="paint" d="M 33 40.6 C 34 37 32 34 34 30 M 35.5 40 C 37.5 37 36 33.5 38 31" stroke="#5aa04a" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="15.5" cy="39.8" rx="2.4" ry="1.5" fill="#b9b2a6" stroke={INK} strokeWidth="0.9" />
            <ellipse cx="20" cy="40.8" rx="2" ry="1.3" fill="#e7a7a0" stroke={INK} strokeWidth="0.9" />
            <ellipse cx="29" cy="40.6" rx="2.2" ry="1.4" fill="#9fb8c9" stroke={INK} strokeWidth="0.9" />
            <g className="tail">
              <path
                d="M 26.5 28 C 29.5 23 34 21 37 22.5 C 35.5 25 34.5 27.5 35 29.5 C 36 31.5 37.5 34 36.5 36.5 C 33 36.5 29.5 34 26.5 30.5 Z"
                fill="#f6a54a"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M 28.5 29.2 L 35 29.4 M 29 27.6 L 34.5 24 M 29 31 L 34.5 34.5" stroke="#d9711f" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            <path d="M 17.5 23.6 C 19 20 22.5 19.5 25 21 C 24.5 22.5 24 23.5 23.5 24.2 Z" fill="#f6a54a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 12.5 29 C 12.5 25 16 23 20.5 23 C 25 23 27.5 26 27.5 29 C 27.5 32 25 34.5 20.5 34.5 C 16 34.5 12.5 33 12.5 29 Z"
              fill="#f28c28"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M 19 33.4 C 18.5 35.6 19.5 37.4 21 38 C 22 36.4 22 34.8 21.4 33.8 Z" fill="#f6a54a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path className="paint" d="M 19.5 28.6 q 1.2 -1.2 2.4 0 M 22.5 30.2 q 1.2 -1.2 2.4 0 M 20 31.6 q 1.2 -1.2 2.4 0" stroke="#d9711f" strokeWidth="0.9" strokeLinecap="round" />
            <circle cx="12.9" cy="29.6" r="0.8" fill="#d9711f" stroke={INK} strokeWidth="0.7" />
            <g className="eye">
              <circle cx="16" cy="27.4" r="1.7" fill="#fdf6e3" stroke={INK} strokeWidth="0.7" />
              <circle className="pupil" cx="15.8" cy="27.5" r="1" fill={INK} />
              <circle cx="15.5" cy="27.1" r="0.35" fill="#ffffff" />
            </g>
            <path className="paint" d="M 9.4 27 C 9 22.6 10.6 18.6 13.6 15.8" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="24" cy="9.8" rx="10.6" ry="2.4" fill="#d6edf7" stroke={INK} strokeWidth="1.6" />
          </svg>
        );

      case 'flying-snake':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Paradise tree snake winding along a twig, head up to the right, tongue flicking */}
            <Limb d="M 3 39.5 L 45 33" color="#7a5230" w={4} />
            <path d="M 9.5 38.6 C 7 36 6.5 33 8 30.5 C 10 32.5 10.8 35.4 9.5 38.6 Z" fill="#7fb069" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <Limb d="M 44 31 C 40 32 36 35.5 31 35.5 C 28 35.5 26 35 24 34" color="#1d2f22" w={3.8} />
            <Limb d="M 24 34 C 18 31 9 31.5 9 24.5 C 9 18 17 17.5 22 19.5 C 27 21.5 31.5 20 31.8 15 C 32 12 33 9.6 35.5 9" color="#1d2f22" w={5.4} />
            <path
              className="paint"
              d="M 44 31 C 40 32 36 35.5 31 35.5 C 28 35.5 26 35 24 34 C 18 31 9 31.5 9 24.5 C 9 18 17 17.5 22 19.5 C 27 21.5 31.5 20 31.8 15 C 32 12 33 9.6 35.5 9"
              stroke="#a6d13a"
              strokeWidth="2"
              strokeDasharray="1.6 1.1"
            />
            <path
              className="paint"
              d="M 24 34 C 18 31 9 31.5 9 24.5 C 9 18 17 17.5 22 19.5 C 27 21.5 31.5 20 31.8 15 C 32 12 33 9.6 35.5 9"
              stroke="#f0612a"
              strokeWidth="1.5"
              strokeDasharray="0.1 3.4"
              strokeLinecap="round"
            />
            <path className="paint" d="M 41.8 9.4 L 44.2 10 M 44.2 10 L 45.6 9.2 M 44.2 10 L 45.4 11.2" stroke="#e0353a" strokeWidth="0.8" strokeLinecap="round" />
            <ellipse cx="38.4" cy="8.8" rx="4" ry="2.8" fill="#1d2f22" stroke={INK} strokeWidth="1.3" />
            <path className="paint" d="M 35.6 7.8 C 37 7 39 7 40.6 7.6" stroke="#a6d13a" strokeWidth="1.1" strokeLinecap="round" />
            <g className="eye">
              <circle cx="39" cy="8.6" r="1.5" fill="#e9d77a" />
              <circle className="pupil" cx="39.2" cy="8.6" r="1" fill={INK} />
              <circle cx="38.8" cy="8.2" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'flying-lizard':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Draco flying lizard from above, striped wings spread, yellow throat flag */}
            <g className="wing">
              <path d="M 21.5 14.5 C 14 12 6 14.5 4 20.5 C 3 24.5 5 28 8 29 C 12 29.5 17 28 21.5 26 Z" fill="#f2a33a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 21 17 L 6.5 17.5 M 21 20 L 4.6 22.5 M 21 23 L 6 27.2 M 21 25 L 11 29" stroke="#b5541f" strokeWidth="1.1" strokeLinecap="round" />
            </g>
            <g className="wing">
              <path d="M 26.5 14.5 C 34 12 42 14.5 44 20.5 C 45 24.5 43 28 40 29 C 36 29.5 31 28 26.5 26 Z" fill="#f2a33a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 27 17 L 41.5 17.5 M 27 20 L 43.4 22.5 M 27 23 L 42 27.2 M 27 25 L 37 29" stroke="#b5541f" strokeWidth="1.1" strokeLinecap="round" />
            </g>
            <Limb d="M 22 13.6 L 17.4 14.2 L 14.8 13 M 26 13 L 30.6 12.4 L 32.6 9.4 M 22 28 L 18 30.5 L 17 34 M 26 28 L 30 30.5 L 31 34 M 24 29 C 24.5 35 23 40 24.5 46" color="#8a7a4a" w={2.6} />
            <path d="M 21.8 8.2 C 18.6 6.4 15 7.2 13.6 9.6 C 15.6 11.6 19.2 12.4 22.4 11.6 Z" fill="#f5d93a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 21.4 9.8 L 16 9.6" stroke="#c9a21f" strokeWidth="0.8" strokeLinecap="round" />
            <path
              d="M 24 10 C 26 10 26.8 12 26.6 14 C 27 18 27 23 26.2 28 C 25.8 30 24.8 31 24 31 C 23.2 31 22.2 30 21.8 28 C 21 23 21 18 21.4 14 C 21.2 12 22 10 24 10 Z"
              fill="#8a7a4a"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 23 15 L 25 15.6 M 23 19 L 25 19.6 M 23 23 L 25 23.6" stroke="#5f5230" strokeWidth="1.1" strokeLinecap="round" />
            <path
              d="M 24 2.5 C 26.4 2.5 27.6 5 27.2 7.6 C 27 9.5 25.8 11 24 11 C 22.2 11 21 9.5 20.8 7.6 C 20.4 5 21.6 2.5 24 2.5 Z"
              fill="#8a7a4a"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <g className="eye">
              <circle className="pupil" cx="22.2" cy="6.2" r="1" fill={INK} />
              <circle cx="22.4" cy="5.9" r="0.35" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="25.8" cy="6.2" r="1" fill={INK} />
              <circle cx="26" cy="5.9" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'scorpion':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Scorpion from above, big pincers forward, segmented tail curled round with its stinger raised */}
            <Limb d="M 20 18 L 13 16 L 10 18.5 M 20 21 L 12.5 21.5 L 9.5 25 M 20.5 24 L 13.5 27 L 11.5 31 M 21 26.5 L 15.5 31.5 L 15 36 M 28 18 L 35 16 L 38 18.5 M 28 21 L 35.5 21.5 L 38.5 25 M 27.5 24 L 34.5 27 L 36.5 31 M 27 26.5 L 32.5 31.5 L 33 36" color="#4a3528" w={2.2} />
            <Limb d="M 21 15 L 16 13 L 12.5 10 M 27 15 L 32 13 L 35.5 10" color="#3a2a20" w={3.4} />
            <path d="M 12.5 11.5 C 9 12.5 6 11 5.5 8 C 5 5.5 6 3.5 7 2.5 C 7.8 4.5 8.4 6 9.8 6.2 C 9.6 4.4 10 3 11.5 2.5 C 12.6 4 13.6 7 13.4 9.5 Z" fill="#3a2a20" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 35.5 11.5 C 39 12.5 42 11 42.5 8 C 43 5.5 42 3.5 41 2.5 C 40.2 4.5 39.6 6 38.2 6.2 C 38.4 4.4 38 3 36.5 2.5 C 35.4 4 34.4 7 34.6 9.5 Z" fill="#3a2a20" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path className="paint" d="M 7.4 9.2 C 8.4 10.4 10 10.8 11.4 10.4 M 40.6 9.2 C 39.6 10.4 38 10.8 36.6 10.4" stroke="#7a5a44" strokeWidth="1.1" strokeLinecap="round" />
            <g className="tail">
              <circle cx="24" cy="35" r="2.7" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <circle cx="24.8" cy="38.8" r="2.6" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <circle cx="27.6" cy="41.6" r="2.5" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <circle cx="31.4" cy="42.6" r="2.4" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <circle cx="35" cy="41.4" r="2.3" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <circle cx="37.4" cy="38.4" r="2.2" fill="#3a2a20" stroke={INK} strokeWidth="1.2" />
              <ellipse cx="37.8" cy="34.6" rx="2.3" ry="2.5" fill="#c9923a" stroke={INK} strokeWidth="1.2" />
              <path d="M 36.2 33.2 C 35.4 31.2 35.2 29.4 35.8 27.4 C 37.6 28.8 39 30.8 39.4 33.4 Z" fill="#a8742a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            </g>
            <path d="M 24 18.5 C 28.5 18.5 30 22.5 29.6 27 C 29.2 31 27 34.5 24 34.5 C 21 34.5 18.8 31 18.4 27 C 18 22.5 19.5 18.5 24 18.5 Z" fill="#3a2a20" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 19.2 23 L 28.8 23 M 18.8 26.5 L 29.2 26.5 M 19.4 30 L 28.6 30" stroke="#6e5240" strokeWidth="1" strokeLinecap="round" />
            <path className="paint" d="M 20.4 21.4 C 20.6 20.4 21.4 19.8 22.4 19.6" stroke="#8a6a50" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 19.5 14.5 C 20 12 28 12 28.5 14.5 L 29 19.5 C 27 21 21 21 19 19.5 Z" fill="#3a2a20" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="22.4" cy="16.4" r="1.4" fill="#f0e2c8" />
              <circle className="pupil" cx="22.5" cy="16.5" r="1" fill={INK} />
              <circle cx="22.1" cy="16" r="0.35" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="25.6" cy="16.4" r="1.4" fill="#f0e2c8" />
              <circle className="pupil" cx="25.5" cy="16.5" r="1" fill={INK} />
              <circle cx="25.9" cy="16" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'elephant':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Asian elephant with a festive cloth, trunk curled up, facing left */}
            <g className="tail">
              <Limb d="M 42.4 24 C 44.6 27 45.4 30 44.8 33" color="#8e98a3" w={2.4} />
              <path d="M 43.6 32.4 L 44 36.6 L 46 33 Z" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            </g>
            <Limb d="M 25.5 32 L 25.5 42.6 M 39 32 L 39 42.6" color="#838d98" w={6.2} />
            <path
              d="M 21 18 C 27 13.5 38 14 42 19.5 C 45 24 44.5 31 41.5 35 C 38.5 38 30 38.5 25 37.5 C 21 36.5 19 32 19.5 27 Z"
              fill="#a4adb7"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <Limb d="M 21 31 L 21 43 M 34 33 L 34 43" color="#a4adb7" w={6.4} />
            <path d="M 25.5 16.2 C 30 14.4 36 14.6 39.5 16.6 L 38.6 27.2 C 34.4 28.4 29.6 28.2 26.2 27 Z" fill="#c8333a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path className="paint" d="M 27 18 C 30.5 16.8 35 16.9 37.8 18.2 L 37.2 25.6 C 34 26.5 30 26.4 27.6 25.6 Z" stroke="#e9b949" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 32.5 19.4 L 34.6 21.6 L 32.5 23.8 L 30.4 21.6 Z" fill="#e9b949" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            <path
              d="M 6.4 8.4 C 7 6.2 5.4 4.6 3.8 5.6 C 2.4 6.6 2.2 10 2.2 13 C 2.2 21 5.6 27.6 12.4 27.4 C 15.6 29.6 21.6 29.2 24.4 24.4 C 26.6 20.4 26.6 14 24.2 11.4 C 22.4 9.4 19.4 9.2 17.9 10.6 C 17 9.6 15.6 9.2 14 9.6 C 10.6 10.4 9.4 14.6 9.8 19 C 8.2 20.6 6.6 19.2 6.2 16 C 5.9 13.2 5.8 10.6 6.4 8.4 Z"
              fill="#a4adb7"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M 2.6 19.6 L 6.6 18.6 M 2.3 15.4 L 6 15 M 2.4 11.2 L 5.9 11.2" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <path className="paint" d="M 19.6 44.8 L 20 44.8 M 22 44.8 L 22.4 44.8 M 32.6 44.8 L 33 44.8 M 35 44.8 L 35.4 44.8" stroke="#f4efe4" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 19.8 14 C 23.6 13.2 26.2 15.6 26 19.6 C 25.8 23.2 23.6 25.6 21.2 25.4 C 19.8 22.4 19.2 17.6 19.8 14 Z" fill="#98a1ab" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 21 16 C 23.4 15.8 24.6 17.6 24.4 20 C 24.2 22 23 23.6 21.8 23.6 C 21 21.4 20.8 18.4 21 16 Z" fill="#e9b8b4" />
            <path d="M 9.8 24.4 Q 11.2 26.2 13 25.2" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <circle cx="15.6" cy="21.6" r="1.4" fill="#f0a8a8" opacity="0.8" />
            <g className="eye">
              <circle className="pupil" cx="15" cy="17.4" r="1.3" fill={INK} />
              <circle cx="15.4" cy="17" r="0.45" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'gibbon':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* White-handed gibbon hanging from a branch by one long arm */}
            <Limb d="M 4 6.5 C 16 5 30 5.5 44 4" color="#7a5230" w={4.4} />
            <path d="M 38 5 C 39 8 41.6 9.6 43.6 9 C 43 6.8 40.6 5 38 5 Z" fill="#6aa84f" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <Limb d="M 15 7 C 16.5 12 19 17.5 23 21.5" color="#5a4232" w={4.6} />
            <Limb d="M 33 23.5 C 37.5 25 40.5 28.5 41.6 33.5 M 24.5 36 C 21 38 20 40.5 20.5 42.5 M 30 37.5 C 32.5 39.5 33 41.5 32.5 43.5" color="#5a4232" w={4.4} />
            <path
              d="M 22 22 C 24 19 32 19 34 23 C 36 28 35 35 31 38 C 28.5 39.5 25 39.5 23 37.5 C 20 34.5 20 27 22 22 Z"
              fill="#5a4232"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <ellipse cx="15" cy="6" rx="2.8" ry="2.4" fill="#f2ece0" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="41.8" cy="35" rx="2" ry="2.4" fill="#f2ece0" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="20.4" cy="43.4" rx="2.6" ry="1.6" fill="#f2ece0" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="33" cy="44.2" rx="2.6" ry="1.6" fill="#f2ece0" stroke={INK} strokeWidth="1.2" />
            <circle cx="29" cy="15.5" r="7" fill="#5a4232" stroke={INK} strokeWidth="1.6" />
            <circle cx="29" cy="15.8" r="5.6" fill="#f2ece0" />
            <ellipse cx="29" cy="16" rx="4" ry="4.4" fill="#2b211b" />
            <path d="M 28.2 18.2 L 28.4 18.4 M 29.8 18.2 L 29.6 18.4 M 27.6 19.4 Q 29 20.2 30.4 19.4" stroke="#a08a76" strokeWidth="0.8" strokeLinecap="round" />
            <g className="eye">
              <circle cx="27.3" cy="15.4" r="1.4" fill="#8a5a36" />
              <circle className="pupil" cx="27.3" cy="15.4" r="1" fill="#120d0a" />
              <circle cx="27.7" cy="15" r="0.45" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="30.7" cy="15.4" r="1.4" fill="#8a5a36" />
              <circle className="pupil" cx="30.7" cy="15.4" r="1" fill="#120d0a" />
              <circle cx="31.1" cy="15" r="0.45" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'sun-bear':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Malayan sun bear standing up, golden chest crescent, long pale claws */}
            <ellipse cx="19" cy="42.4" rx="3.6" ry="1.8" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="29" cy="42.4" rx="3.6" ry="1.8" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            <path
              d="M 15.5 40 C 13.5 34 14 26 17.5 22.5 C 20 20.5 28 20.5 30.5 22.5 C 34 26 34.5 34 32.5 40 C 29.5 43 18.5 43 15.5 40 Z"
              fill="#3b3431"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 17.6 23.6 C 18 33 30 33 30.4 23.6 C 28 28 20 28 17.6 23.6 Z" fill="#f0a33a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <g className="wave">
              <Limb d="M 17.5 25 C 13 25.5 10 23 9 18.5" color="#3b3431" w={5.4} />
              <Limb d="M 6.6 15.6 Q 5.2 13.8 5.6 12 M 8.4 14.8 Q 7.8 12.8 8.6 11.2 M 10.4 15.4 Q 10.6 13.4 11.8 12.4" color="#efe3c8" w={2.6} />
              <ellipse cx="8.6" cy="17" rx="2.6" ry="2.2" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            </g>
            <Limb d="M 30.5 25 C 35 25.5 38 23 39 18.5" color="#3b3431" w={5.4} />
            <Limb d="M 41.4 15.6 Q 42.8 13.8 42.4 12 M 39.6 14.8 Q 40.2 12.8 39.4 11.2 M 37.6 15.4 Q 37.4 13.4 36.2 12.4" color="#efe3c8" w={2.6} />
            <ellipse cx="39.4" cy="17" rx="2.6" ry="2.2" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            <circle cx="16.4" cy="7.6" r="2.6" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            <circle cx="31.6" cy="7.6" r="2.6" fill="#3b3431" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="24" cy="12.5" rx="8.6" ry="7.2" fill="#3b3431" stroke={INK} strokeWidth="1.7" />
            <ellipse cx="24" cy="16" rx="4.8" ry="3.6" fill="#d9b47c" stroke={INK} strokeWidth="1.1" />
            <ellipse cx="24" cy="14.6" rx="1.8" ry="1.2" fill={INK} />
            <path d="M 24 15.8 L 24 17 M 22.4 17.6 Q 24 18.8 25.6 17.6" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle cx="20.2" cy="11.4" r="1.6" fill="#a0703f" />
              <circle className="pupil" cx="20.2" cy="11.4" r="1" fill="#120d0a" />
              <circle cx="20.6" cy="11" r="0.45" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27.8" cy="11.4" r="1.6" fill="#a0703f" />
              <circle className="pupil" cx="27.8" cy="11.4" r="1" fill="#120d0a" />
              <circle cx="28.2" cy="11" r="0.45" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'porcupine':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Malayan porcupine, black-and-white quills fanned up and back, round nose to the left */}
            <path
              d="M 21.7 26.5 L 11 20.7 L 19 29.9 Z M 24.7 25.6 L 16.6 12.2 L 20.6 27.3 Z M 27.7 26.2 L 27 9.6 L 23.3 25.8 Z M 30.1 28.2 L 36.7 14 L 26.4 25.8 Z M 31.3 31 L 42.1 22.5 L 29.2 27.2 Z M 31 34.1 L 41 31.7 L 31 29.7 Z"
              fill="#2c241b"
              stroke={INK}
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <path
              d="M 21 26.3 L 10.5 25.2 L 18.1 32.6 Z M 24.2 25.1 L 12.4 15.2 L 18.6 29.3 Z M 27.5 25.5 L 21.2 8.3 L 20.6 26.6 Z M 30.3 27.5 L 32.8 9.3 L 23.6 25.2 Z M 31.8 30.5 L 41.1 17 L 27 25.3 Z M 31.7 33.8 L 43.4 27.1 L 29.9 27.1 Z"
              fill="#f4efe4"
              stroke={INK}
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <path
              d="M 14.7 25.7 L 12.8 25.5 L 12.2 26.9 L 13.5 28.2 Z M 17.1 19.2 L 15 17.4 L 13.7 18.3 L 14.9 20.9 Z M 23.8 15.2 L 22.6 12.1 L 21.1 12.3 L 21 15.6 Z M 31.8 16.6 L 32.3 13.3 L 30.8 12.8 L 29.1 15.7 Z M 37.4 22.4 L 39 20 L 38 18.8 L 35.5 20.3 Z M 38.7 29.8 L 40.8 28.6 L 40.4 27.1 L 38 27.1 Z"
              fill="#2c241b"
            />
            <Limb d="M 18 38 L 17.5 41.5 M 35 37.5 L 35.5 41" color="#3e2d22" w={3.4} />
            <path
              d="M 13 30 C 15 24 24 22.5 32 24 C 39 25.5 42 31 40 36 C 38 40 30 41 22 40.5 C 16 40 12 36 13 30 Z"
              fill="#5e4636"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 20.6 27.6 L 19.4 25.2 M 25.4 26.6 L 25 24 M 30.2 27.2 L 31.2 24.8 M 34.6 29.4 L 36.4 27.4" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <Limb d="M 15 38.5 L 14.5 42 M 31 39 L 31.5 42.5" color="#4a3328" w={3.4} />
            <path
              d="M 15.6 28.4 C 12 27 7.6 28.6 5.4 31.8 C 4.4 33.4 4.8 35.4 6.6 36.2 C 9.4 37.4 13.4 37.6 16.2 35.8 Z"
              fill="#6e5442"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <ellipse cx="13.6" cy="29.2" rx="1.5" ry="1.3" fill="#6e5442" stroke={INK} strokeWidth="1" />
            <circle cx="5.6" cy="33.6" r="1.9" fill="#3a2a20" stroke={INK} strokeWidth="0.8" />
            <path d="M 7 35.8 Q 8.4 36.6 9.8 35.8" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <g className="eye">
              <circle className="pupil" cx="10.2" cy="31.4" r="1.1" fill={INK} />
              <circle cx="10.5" cy="31" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'siamese-cat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Siamese cat lying in a loaf, seal-brown points and blue eyes, facing left */}
            <g className="tail tail-cat">
              <path d="M 41 40 C 45.6 39.6 46.2 31.4 43.6 27.6" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
              <path className="paint" d="M 41 40 C 45.6 39.6 46.2 31.4 43.6 27.6" stroke="#4a3226" strokeWidth="2.8" strokeLinecap="round" />
            </g>
            <path
              d="M 18 29 C 21 25 33 24.5 39.5 27 C 44 29 45 35 43.5 39 C 42.5 42 40 43.4 36 43.4 L 16 43.4 C 13 43.4 12.6 40 14 37 Z"
              fill="#f1e4c8"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 34 43 C 33 37 36 32.5 41 32" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <ellipse cx="37.6" cy="42.4" rx="3.2" ry="1.4" fill="#4a3226" stroke={INK} strokeWidth="1" />
            <path d="M 19.6 36.4 C 15 36.4 10.4 37.6 7.6 39.2 C 5.2 40.6 5.6 43.4 8.4 43.4 L 19.6 43.4 Z" fill="#f1e4c8" />
            <path d="M 19.6 36.4 C 15 36.4 10.4 37.6 7.6 39.2 M 8.4 43.4 L 19.6 43.4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 9.6 38.4 C 7.6 38.6 5.4 39.8 5.4 41.4 C 5.4 43 7.2 43.6 9.4 43.4 C 11 43.2 11.8 41.6 11.6 40 C 11.4 39 10.6 38.4 9.6 38.4 Z" fill="#4a3226" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <ellipse cx="14.6" cy="42.4" rx="3.2" ry="1.5" fill="#4a3226" stroke={INK} strokeWidth="1.1" />
            <path d="M 8.2 20 L 4.6 8.6 L 13.4 15.4 Z" fill="#4a3226" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 19.8 20 L 23.4 8.6 L 14.6 15.4 Z" fill="#4a3226" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 8 16.6 L 6.2 11.2 L 10.8 15 Z M 20 16.6 L 21.8 11.2 L 17.2 15 Z" fill="#7a5848" />
            <path
              d="M 7.6 19 C 9.6 15.6 18.4 15.6 20.4 19 C 22 22.4 21.4 26.6 18.8 29.4 C 17.2 31 15.6 31.8 14 31.8 C 12.4 31.8 10.8 31 9.2 29.4 C 6.6 26.6 6 22.4 7.6 19 Z"
              fill="#e8d5b0"
            />
            <path d="M 7.2 18.8 L 10.2 17 C 11.4 19 12.6 19.8 14 20 C 15.4 19.8 16.6 19 17.8 17 L 20.8 18.8 C 21.8 22.2 21.2 26.6 18.8 29.4 C 17.2 31 15.6 31.8 14 31.8 C 12.4 31.8 10.8 31 9.2 29.4 C 6.8 26.6 6.2 22.2 7.2 18.8 Z" fill="#5a3e2e" />
            <path
              d="M 7.6 19 C 9.6 15.6 18.4 15.6 20.4 19 C 22 22.4 21.4 26.6 18.8 29.4 C 17.2 31 15.6 31.8 14 31.8 C 12.4 31.8 10.8 31 9.2 29.4 C 6.6 26.6 6 22.4 7.6 19 Z"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <g className="eye">
              <path d="M 8.8 23.4 C 9.8 21.4 12.4 21 13.2 22.6 C 12.4 24.4 10.2 24.6 8.8 23.4 Z" fill="#4fb3ea" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
              <circle className="pupil" cx="11.2" cy="22.9" r="1" fill="#120d0a" />
              <circle cx="11.6" cy="22.5" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <path d="M 19.2 23.4 C 18.2 21.4 15.6 21 14.8 22.6 C 15.6 24.4 17.8 24.6 19.2 23.4 Z" fill="#4fb3ea" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
              <circle className="pupil" cx="16.8" cy="22.9" r="1" fill="#120d0a" />
              <circle cx="17.2" cy="22.5" r="0.4" fill="#ffffff" />
            </g>
            <path d="M 13.1 26.4 L 14.9 26.4 L 14 27.5 Z" fill="#c98a86" />
            <path d="M 14 27.5 L 14 28.2 M 12.8 28.6 Q 14 29.4 15.2 28.6" stroke="#c9b096" strokeWidth="0.7" strokeLinecap="round" />
          </svg>
        );

      case 'duck':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Mallard drake floating, green head and white collar, bill to the left */}
            <path className="paint" d="M 6 38.4 C 10 37.2 14 39.6 18 38.4 M 30 38.4 C 34 37.2 38 39.6 42 38.4" stroke="#7fb3d5" strokeWidth="1.2" strokeLinecap="round" />
            <path
              d="M 10 13.6 C 10 9.4 13 7 16.4 7.4 C 20 7.8 21.8 10.8 21 14.4 C 20.4 17.4 18.8 19.4 19 23.4 L 13.4 24 C 13.6 21.2 11.6 19.4 10.6 17.6 C 10.2 16.4 10 15 10 13.6 Z"
              fill="#1f7a4f"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 13 10 C 14.5 8.8 16.6 8.8 18 9.8" stroke="#5fc28f" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 11.6 20 C 14 21.2 17.4 21 19.2 19.8 L 19 22.2 C 17 23.2 13.8 23.4 12.6 22.2 Z" fill="#ffffff" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path
              d="M 15 26 C 18 23 26 23 32 24 C 36.5 24.8 40.6 23.4 44.4 20.2 C 45.4 25.4 44 31.6 40.4 34.6 C 37.6 36.8 32 37.4 26 37.4 L 18.6 37.4 C 13.6 37.4 10.8 34 11.2 30.4 C 11.4 28.4 13 27 15 26 Z"
              fill="#cfccc4"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 15 26 C 13 27 11.4 28.4 11.2 30.4 C 10.9 34 13.6 37.4 18.6 37.4 L 20.4 37.4 C 18.6 33.6 18.4 28.6 20.6 24.4 C 18.6 24.4 16.6 25 15 26 Z" fill="#8e4a2c" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 38.6 24.4 C 40.8 23.8 42.8 22.4 44.4 20.2 C 45.2 24.6 44.4 29 42.6 32 C 41 29.6 39.6 27 38.6 24.4 Z" fill="#2a2a2e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 43.6 21 L 46.4 22.4 L 44.4 24.6 Z" fill="#ffffff" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 41.6 21.6 C 40.8 18.4 43.6 16.8 44.6 18.8" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <g className="wing">
              <path d="M 21.6 27 C 26 24.4 35 24.6 39.6 27.6 C 37.6 31.6 32.6 33.6 26 32.8 C 23 32.4 21 30 21.6 27 Z" fill="#a9a196" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M 30.4 29.6 L 37.2 28.4 L 35.8 31.2 L 29.8 32 Z" fill="#3355c4" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            </g>
            <path d="M 10.6 13.2 C 7.6 12.8 4 13.6 2.6 15.6 C 3.8 17.8 7.4 17.8 10.8 16.8 Z" fill="#f2b632" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="7.4" cy="14.4" r="0.5" fill={INK} />
            <g className="eye">
              <circle className="pupil" cx="14" cy="12.4" r="1.2" fill={INK} />
              <circle cx="14.4" cy="12" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'rooster':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thai gamecock standing proud, sickle tail arching behind, beak to the left */}
            <Limb d="M 22.5 33 L 21.5 42.6 M 27.5 33 L 28.5 42.6" color="#e9b949" w={2.8} />
            <path d="M 18.4 43.4 L 21.6 42.8 L 24 43.6 M 25.6 43.6 L 28.6 42.8 L 31.6 43.4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <g className="tail">
              <path d="M 31 25 C 32 12 42 6 45.6 14 C 46.8 17 46.4 22 45 27 C 44.4 22 43.6 17 41.4 15 C 38.6 12.6 35 16.6 34.6 26 Z" fill="#1f3a32" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 33 27 C 35 18 41 16 43 21 C 44 24 43.6 28 42.4 31 C 41.6 27 40.6 22.6 38.6 22.6 C 36.6 22.6 35.6 25.6 35.4 28.6 Z" fill="#2b4d42" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
              <path className="paint" d="M 33.4 20 C 35.4 12 41.4 9.6 44.2 14" stroke="#3fa37a" strokeWidth="1" strokeLinecap="round" />
            </g>
            <path
              d="M 16.5 24 C 18.6 20.4 27 19.8 32.6 22.6 C 36.4 24.6 37 30.2 33.6 33.2 C 30 36.2 21.6 36.4 18.4 33.2 C 16 30.8 15.6 26.6 16.5 24 Z"
              fill="#2f2a2a"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 20 25 C 24 22.4 31 23 33.6 27 C 33 30.4 28.6 32.6 23.4 31.8 C 20.8 31.2 19.6 28 20 25 Z" fill="#a83a24" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 23 28.6 C 26.4 29.6 30 29.2 32.4 27.6" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <path
              d="M 11.4 11.6 C 10 16 11 20.6 14.6 24.2 L 14.6 27.6 L 17 25.8 L 18.4 28.8 L 20 26 L 22.2 28 L 22.6 24.2 C 22.4 19.6 19.8 15.4 18.6 11.4 Z"
              fill="#e8952e"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M 15 15 L 16 22 M 18 15.6 L 19.6 22.6" stroke="#b8621a" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 10.6 7.4 C 10 5 11 3.6 12.2 4.4 C 12.4 2.6 14.4 2.2 15 4 C 15.8 2.6 18 3 17.6 5.2 C 18.8 5.4 19 7.4 17.6 8.2 Z" fill="#d93b2b" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="14.4" cy="10.4" r="4.4" fill="#e8952e" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="13.2" cy="11" rx="2.6" ry="2.4" fill="#d93b2b" />
            <path d="M 10.4 9.8 L 5.4 11.4 L 10.2 13 Z" fill="#f2c14e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 10.6 13 C 9.4 15.4 10.4 18 12 17.6 C 13.2 17.2 13.2 14.8 12.4 13 Z" fill="#d93b2b" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="13.8" cy="9.8" r="1.4" fill="#f2c14e" stroke={INK} strokeWidth="0.5" />
              <circle className="pupil" cx="13.8" cy="9.8" r="1" fill={INK} />
              <circle cx="14.1" cy="9.5" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'peacock':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Green peafowl showing off its fanned train of eye-spots, facing left */}
            <g className="tail">
              <path
                d="M 18.5 36 L 6.3 27.5 Q 4.5 22.6 8.1 19.9 Q 7.6 14.5 11.6 13.3 Q 12.4 8 16.6 8.6 Q 18.6 3.8 22.4 6.1 Q 25.5 2.4 28.6 6.1 Q 32.4 3.8 34.4 8.6 Q 38.6 8 39.4 13.3 Q 43.4 14.5 42.9 19.9 Q 46.5 22.6 44.7 27.5 L 32.5 36 Z"
                fill="#3e8a4a"
                stroke={INK}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M 20.7 29.1 L 12.1 25.6 M 21.4 27.2 L 14.1 20.5 M 22.5 25.8 L 17.2 16.4 M 23.9 24.8 L 21.1 13.7 M 25.5 24.5 L 25.5 12.8 M 27.1 24.8 L 29.9 13.7 M 28.5 25.8 L 33.8 16.4 M 29.6 27.2 L 36.9 20.5 M 30.3 29.1 L 38.9 25.6" stroke="#265c30" strokeWidth="0.9" strokeLinecap="round" />
              <path
                d="M 6.7 24.7 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 9.1 18.5 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 12.7 13.6 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 17.4 10.5 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 22.6 9.4 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 27.8 10.5 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 32.5 13.6 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 36.1 18.5 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0 M 38.5 24.7 a 2.9 2.9 0 1 0 5.8 0 a 2.9 2.9 0 1 0 -5.8 0"
                fill="#e1b84a"
                stroke={INK}
                strokeWidth="0.8"
              />
              <path
                d="M 7.8 24.7 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 10.1 18.5 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 13.8 13.6 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 18.5 10.5 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 23.6 9.4 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 28.8 10.5 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 33.5 13.6 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 37.2 18.5 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0 M 39.5 24.7 a 1.85 1.85 0 1 0 3.7 0 a 1.85 1.85 0 1 0 -3.7 0"
                fill="#2a9d8f"
              />
              <path
                d="M 8.7 24.7 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 11 18.5 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 14.7 13.6 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 19.4 10.5 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 24.6 9.4 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 29.7 10.5 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 34.4 13.6 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 38.1 18.5 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0 M 40.4 24.7 a 0.95 0.95 0 1 0 1.9 0 a 0.95 0.95 0 1 0 -1.9 0"
                fill="#1e3a8a"
              />
            </g>
            <Limb d="M 24 40 L 23 44.6 M 28.4 40 L 29.4 44.6" color="#8d8a80" w={2.6} />
            <path
              d="M 21.4 31 C 20 27 19.4 23 19.6 19.6 L 24.8 19.4 C 24.8 23 26 26.4 28.4 28.8 C 32.4 31 33.4 35.4 31.4 38.8 C 29 41.8 23 41.8 21 38.8 C 19.4 36.2 19.8 33 21.4 31 Z"
              fill="#1f8a8f"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 21.8 31.6 q 1.4 1.6 2.8 0 M 21.6 35.2 q 1.4 1.6 2.8 0 M 20.6 27 q 1.2 1.4 2.4 0 M 20.2 23 q 1.2 1.4 2.4 0" stroke="#0f5e62" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 25.8 31 C 29 30.6 31.8 32.6 32 36 C 30.4 38.2 27.4 38.8 25.4 37.6 C 24.4 35.6 24.6 32.8 25.8 31 Z" fill="#2b5f8a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 22.6 15.8 C 21.6 12.4 22 9.4 23.2 7 C 24.6 9.4 24.8 12.4 24 15.8 Z" fill="#2e7d4f" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="22.4" cy="18.6" r="3.5" fill="#1f8a8f" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="21.8" cy="18.4" rx="2.1" ry="1.8" fill="#3b82f6" />
            <ellipse cx="23.8" cy="20.2" rx="1.5" ry="1.3" fill="#f6c445" />
            <path d="M 19.1 18 L 15.8 19.2 L 19.1 20 Z" fill="#a8a090" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <g className="eye">
              <circle className="pupil" cx="21.6" cy="18.2" r="1" fill={INK} />
              <circle cx="21.9" cy="17.9" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'myna':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Common myna on a twig, yellow eye patch and beak, facing left */}
            <path className="paint" d="M 6 39.4 L 42 38.2" stroke="#7a5230" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 11 39.2 C 9 36 5 35.8 3.6 37.4 C 5.6 39.6 8.8 40 11 39.2 Z" fill="#6aa84f" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <Limb d="M 21.6 34 L 21 39 M 25.8 34 L 26.2 39" color="#f5c518" w={2.6} />
            <g className="tail">
              <path d="M 29.4 30.6 L 34.6 41.4 C 36.6 42.6 40 41.2 40.6 39 L 32.8 28.4 Z" fill="#2e2420" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M 34 40.2 C 36 41 38.6 40.2 39.8 38 L 40.6 39 C 40 41.2 36.6 42.6 34.6 41.4 Z" fill="#ffffff" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            </g>
            <path
              d="M 15 21 C 19 17.4 28.6 18.4 32 23.6 C 34.4 27.4 33.2 32 29.6 34 C 25.6 36 19.6 35.2 17 31.6 C 15 28.8 14 24.4 15 21 Z"
              fill="#6b4228"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <g className="wing">
              <path d="M 21 22.6 C 25.4 21 31 23 32.6 28 C 31.4 31.6 27 32.6 23.4 31 C 21.2 29.4 20.4 25.6 21 22.6 Z" fill="#4a2c1a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M 26.8 28.4 C 28.6 27.8 30.4 28.2 31.4 29.4 C 30 30.6 28 30.8 26.6 30 Z" fill="#ffffff" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            </g>
            <circle cx="17.4" cy="14.6" r="6.4" fill="#1f1a17" stroke={INK} strokeWidth="1.6" />
            <path d="M 14.4 13.6 C 14.6 11.4 18 10.6 20.4 11.8 C 21.8 12.6 22.8 13.8 23.4 15 C 21.6 16.4 18.4 16.8 16.4 16 C 15.2 15.4 14.4 14.6 14.4 13.6 Z" fill="#f5c518" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M 11.6 14 C 9 14.4 6.4 15.4 5 17 C 7.4 17.6 9.8 17.4 11.8 16.8 Z" fill="#f5c518" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="17" cy="13.6" r="1.5" fill="#8a3a1e" />
              <circle className="pupil" cx="17" cy="13.6" r="1" fill="#120d0a" />
              <circle cx="17.4" cy="13.2" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'swallow':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Barn swallow flying towards us, wings swept wide, forked tail */}
            <g className="wing">
              <path d="M 21 20 C 15.6 15.4 8.4 12.4 2.6 13.2 C 6.4 16.6 11.4 21.8 19.6 26.4 Z" fill="#1f3f8a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 6.4 14.4 L 9.4 15.4 M 9.8 15.6 L 13 17.6 M 12.8 17.6 L 16.4 20.6" stroke="#5b7fd0" strokeWidth="1" strokeLinecap="round" />
            </g>
            <g className="wing">
              <path d="M 27 20 C 32.4 15.4 39.6 12.4 45.4 13.2 C 41.6 16.6 36.6 21.8 28.4 26.4 Z" fill="#1f3f8a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 41.6 14.4 L 38.6 15.4 M 38.2 15.6 L 35 17.6 M 35.2 17.6 L 31.6 20.6" stroke="#5b7fd0" strokeWidth="1" strokeLinecap="round" />
            </g>
            <path d="M 21 32 C 19 37 16.4 41.6 13.4 45.4 C 17.4 43 20.6 40.4 24 37 C 27.4 40.4 30.6 43 34.6 45.4 C 31.6 41.6 29 37 27 32 Z" fill="#1f3f8a" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 24 15 C 28 15 30 19 29.6 25 C 29.2 30 27 34.4 24 35.4 C 21 34.4 18.8 30 18.4 25 C 18 19 20 15 24 15 Z" fill="#f3e6c8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 18.6 22.4 C 21.4 24 26.6 24 29.4 22.4 L 29.6 24.6 C 26.6 26.2 21.4 26.2 18.4 24.6 Z" fill="#1f3f8a" />
            <circle cx="24" cy="12.8" r="5.2" fill="#2d54a8" stroke={INK} strokeWidth="1.6" />
            <path d="M 19.6 14.4 C 20.6 18.4 27.4 18.4 28.4 14.4 C 26.4 15.8 21.6 15.8 19.6 14.4 Z" fill="#c4502c" />
            <ellipse cx="24" cy="10" rx="2" ry="1.2" fill="#c4502c" />
            <path d="M 22.8 13.6 L 25.2 13.6 L 24 15.2 Z" fill={INK} />
            <g className="eye">
              <circle className="pupil" cx="21.6" cy="12.4" r="1.1" fill={INK} />
              <circle cx="21.9" cy="12.1" r="0.4" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="26.4" cy="12.4" r="1.1" fill={INK} />
              <circle cx="26.7" cy="12.1" r="0.4" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'rhino-beetle':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Siamese rhinoceros beetle (kwang) side-on, horn pincer to the left */}
            <Limb d="M 18 31 L 14.5 36 L 14 40 M 26 33 L 25.5 38.5 L 27.5 42 M 33 33 L 37 37.5 L 41 39" color="#3a1f12" w={2.2} />
            <Limb d="M 15 30 L 10 34.5 L 7.5 40 M 23 33 L 20.5 39.5 L 19.5 44 M 31 33.5 L 33.5 40 L 38 43.5" color="#4a2716" w={2.8} />
            <path
              d="M 21 18.5 C 27 13.5 38.5 14.5 42.5 21.5 C 45.5 27 43.5 33 37 35 C 31 36.5 24 35.5 21 32 Z"
              fill="#6b3420"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M 22.5 25.5 C 28 24 36 25.5 43 27.5" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path className="paint" d="M 25 19.2 C 29 17 34.5 17 38 19.2" stroke="#d9a07a" strokeWidth="1.7" strokeLinecap="round" />
            <path
              d="M 16 20 C 13 15.5 8.5 12.5 4.4 12 C 2.8 12 2.4 13.8 3.6 14.6 C 4.4 15.2 4.6 16.2 4.4 17.2 C 5.8 17 6.8 16 6.8 15 C 9.6 16 12 18.6 13.4 22.6 Z"
              fill="#3f1d10"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M 12 28 C 7.5 27.2 4.6 24.8 4 21.6 C 3 21.4 2.4 20.4 2.6 19.4 C 3.6 19.6 4.4 20.2 4.8 20.8 C 5 19.8 5.6 19.2 6.6 19 C 6.8 20 6.6 21 6.3 21.8 C 7.4 23.6 9.4 24.8 12.6 25 Z"
              fill="#3f1d10"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M 13 23 C 13 19 17 17 21 18 C 24 19 25 23 24 28 C 23 32 18 33.5 15 32 C 13 30 12.5 26 13 23 Z"
              fill="#3f1d10"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 16 21 C 17.5 19.6 19.5 19.4 21 20" stroke="#b07a5a" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="11.5" cy="28.5" rx="3" ry="2.6" fill="#3f1d10" stroke={INK} strokeWidth="1.3" />
            <g className="eye">
              <circle cx="11.6" cy="28.2" r="1.5" fill="#e9c7a0" stroke={INK} strokeWidth="0.5" />
              <circle className="pupil" cx="11.4" cy="28.3" r="1" fill={INK} />
              <circle cx="11.7" cy="27.9" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'cicada':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cicada from above, clear veined wings folded like a roof */}
            <path d="M 18.5 16.5 L 13.5 18.5 L 12.5 22 M 29.5 16.5 L 34.5 18.5 L 35.5 22" stroke={INK} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="24" cy="31" rx="5" ry="10" fill="#5d6a2c" stroke={INK} strokeWidth="1.2" />
            <g className="wing wing-l">
              <path
                d="M 23.5 19.5 C 17.5 20 12.8 23.5 12.2 29.5 C 11.8 35 15.4 41.4 21 46.2 C 22.8 47 24 45.8 24 43.5 Z"
                fill="rgba(215, 235, 228, 0.6)"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path className="paint" d="M 22 20.2 C 17.2 21.4 13.6 24.6 12.9 30" stroke="#6b7a32" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 22.6 22 C 18.6 26 16.6 33 19 42.4 M 14.6 34 C 17.4 35.2 20.5 35.8 22.8 35.2 M 17.4 40 L 22.6 41 M 20.4 43.8 L 23.4 43.4" stroke="#4a3f2a" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            <g className="wing wing-r">
              <path
                d="M 24.5 19.5 C 30.5 20 35.2 23.5 35.8 29.5 C 36.2 35 32.6 41.4 27 46.2 C 25.2 47 24 45.8 24 43.5 Z"
                fill="rgba(215, 235, 228, 0.6)"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path className="paint" d="M 26 20.2 C 30.8 21.4 34.4 24.6 35.1 30" stroke="#6b7a32" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 25.4 22 C 29.4 26 31.4 33 29 42.4 M 33.4 34 C 30.6 35.2 27.5 35.8 25.2 35.2 M 30.6 40 L 25.4 41 M 27.6 43.8 L 24.6 43.4" stroke="#4a3f2a" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            <path
              d="M 16 13 L 32 13 C 34 15 35 17.6 34.6 20.2 C 29 22.8 19 22.8 13.4 20.2 C 13 17.6 14 15 16 13 Z"
              fill="#8a8a3e"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 20.6 14.6 C 19.2 16.6 19.6 18.8 21.4 20.8 M 27.4 14.6 C 28.8 16.6 28.4 18.8 26.6 20.8" stroke="#4f5a26" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 19.5 21.2 C 21 25.6 27 25.6 28.5 21.2 Z" fill="#6b7a32" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path
              d="M 16.4 13.4 C 17 11.2 19.6 10.2 21.4 10 C 22 8 26 8 26.6 10 C 28.4 10.2 31 11.2 31.6 13.4 Z"
              fill="#6b7a32"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <g className="eye">
              <ellipse className="pupil" cx="15.4" cy="13.2" rx="2.3" ry="2.6" fill="#5a2e1e" stroke={INK} strokeWidth="1.2" />
              <circle cx="15" cy="12.3" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <ellipse className="pupil" cx="32.6" cy="13.2" rx="2.3" ry="2.6" fill="#5a2e1e" stroke={INK} strokeWidth="1.2" />
              <circle cx="33" cy="12.3" r="0.6" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'bee':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Honeybee from above: striped abdomen, fuzzy thorax, clear wings */}
            <path
              d="M 19.5 20 L 15 23 L 14 27 M 20 23.5 L 16.5 28 L 16.5 32 M 28.5 20 L 33 23 L 34 27 M 28 23.5 L 31.5 28 L 31.5 32"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g className="wing wing-l">
              <ellipse cx="13.5" cy="16.5" rx="9.5" ry="5" transform="rotate(-25 13.5 16.5)" fill="rgba(215, 235, 245, 0.6)" stroke={INK} strokeWidth="1.1" />
              <ellipse cx="14.5" cy="24" rx="6.5" ry="3.4" transform="rotate(12 14.5 24)" fill="rgba(215, 235, 245, 0.6)" stroke={INK} strokeWidth="1" />
              <path d="M 21 15.5 C 17 16 12 17.5 7 21" stroke="#8a9aa6" strokeWidth="0.7" strokeLinecap="round" />
            </g>
            <g className="wing wing-r">
              <ellipse cx="34.5" cy="16.5" rx="9.5" ry="5" transform="rotate(25 34.5 16.5)" fill="rgba(215, 235, 245, 0.6)" stroke={INK} strokeWidth="1.1" />
              <ellipse cx="33.5" cy="24" rx="6.5" ry="3.4" transform="rotate(-12 33.5 24)" fill="rgba(215, 235, 245, 0.6)" stroke={INK} strokeWidth="1" />
              <path d="M 27 15.5 C 31 16 36 17.5 41 21" stroke="#8a9aa6" strokeWidth="0.7" strokeLinecap="round" />
            </g>
            <path d="M 22.8 41.4 L 24 45.5 L 25.2 41.4 Z" fill={INK} />
            <ellipse cx="24" cy="32" rx="8.5" ry="10" fill="#f2c230" />
            <path d="M 16 28.5 C 20 30.5 28 30.5 32 28.5 L 32.5 31.5 C 28 33.5 20 33.5 15.5 31.5 Z" fill={INK} />
            <path d="M 16.2 35.8 C 20.5 37.8 27.5 37.8 31.8 35.8 L 30.4 38.6 C 27 40.4 21 40.4 17.6 38.6 Z" fill={INK} />
            <ellipse cx="24" cy="32" rx="8.5" ry="10" stroke={INK} strokeWidth="1.6" />
            <circle cx="24" cy="19" r="5.8" fill="#d9962b" stroke={INK} strokeWidth="1.5" />
            <path className="paint" d="M 21 17 L 22 18.2 M 24 16 L 24 17.5 M 27 17 L 26 18.2 M 21.5 21 L 22.5 20.2 M 26.5 21 L 25.5 20.2" stroke="#a8691a" strokeWidth="1" strokeLinecap="round" />
            <path d="M 22.6 8 L 20.6 4.6 L 17.4 3.6 M 25.4 8 L 27.4 4.6 L 30.6 3.6" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="24" cy="11" rx="5.4" ry="4.2" fill="#c98a2e" stroke={INK} strokeWidth="1.5" />
            <g className="eye">
              <ellipse className="pupil" cx="20.6" cy="10.8" rx="1.9" ry="2.6" fill={INK} />
              <circle cx="20.9" cy="9.8" r="0.6" fill="#ffffff" />
            </g>
            <g className="eye">
              <ellipse className="pupil" cx="27.4" cy="10.8" rx="1.9" ry="2.6" fill={INK} />
              <circle cx="27.7" cy="9.8" r="0.6" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'lantern-bug':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Pyrops candelaria lanternfly from above, long red snout up front */}
            <path
              d="M 21.5 20 L 17 17.5 L 15.5 14 M 26.5 20 L 31 17.5 L 32.5 14 M 22 24 L 8.5 23.5 L 5.5 26.5 M 26 24 L 39.5 23.5 L 42.5 26.5 M 22.5 28 L 9 31.5 L 6 35 M 25.5 28 L 39 31.5 L 42 35"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="24" cy="31" rx="3.2" ry="9" fill="#c9a03a" stroke={INK} strokeWidth="1.2" />
            <g className="wing wing-l">
              <path
                d="M 23 23 C 17 23.5 11 28 9.5 34.5 C 8.8 38 10 41 12.5 42.5 C 15.5 42.5 18.5 40 21 36 C 22.5 33 23.5 28 23 23 Z"
                fill="#f5c518"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M 9.4 35.5 C 8.9 38.6 10.2 41.2 12.5 42.5 C 15 42.5 16.8 41.3 18 39.8 C 15 38.5 11.8 37.5 9.4 35.5 Z" fill={INK} />
              <path
                d="M 23.6 19.8 C 21 19.8 18 22 16.4 26 C 14.6 31 14.2 37 15.2 42.6 C 16.2 45 19 45 20.4 42.8 C 22.4 37.5 23.6 31 23.9 24.5 Z"
                fill="#4f8a3a"
                stroke={INK}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="20.6" cy="24.6" r="1.3" fill="#efe08a" />
              <circle cx="18.6" cy="30" r="1.3" fill="#efe08a" />
              <circle cx="20.2" cy="34.6" r="1.1" fill="#efe08a" />
              <circle cx="17.6" cy="39" r="1.1" fill="#efe08a" />
            </g>
            <g className="wing wing-r">
              <path
                d="M 25 23 C 31 23.5 37 28 38.5 34.5 C 39.2 38 38 41 35.5 42.5 C 32.5 42.5 29.5 40 27 36 C 25.5 33 24.5 28 25 23 Z"
                fill="#f5c518"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M 38.6 35.5 C 39.1 38.6 37.8 41.2 35.5 42.5 C 33 42.5 31.2 41.3 30 39.8 C 33 38.5 36.2 37.5 38.6 35.5 Z" fill={INK} />
              <path
                d="M 24.4 19.8 C 27 19.8 30 22 31.6 26 C 33.4 31 33.8 37 32.8 42.6 C 31.8 45 29 45 27.6 42.8 C 25.6 37.5 24.4 31 24.1 24.5 Z"
                fill="#4f8a3a"
                stroke={INK}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="27.4" cy="24.6" r="1.3" fill="#efe08a" />
              <circle cx="29.4" cy="30" r="1.3" fill="#efe08a" />
              <circle cx="27.8" cy="34.6" r="1.1" fill="#efe08a" />
              <circle cx="30.4" cy="39" r="1.1" fill="#efe08a" />
            </g>
            <path
              d="M 19.5 18.5 C 19.5 16 28.5 16 28.5 18.5 C 28.5 21 26.5 22.5 24 22.5 C 21.5 22.5 19.5 21 19.5 18.5 Z"
              fill="#8f8a46"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M 22 16.8 C 21.4 12.5 21.6 8.5 23.2 5 C 24.2 2.6 27.4 2.2 28.2 3.8 C 26.4 5 26.2 7.5 26 10 C 25.8 12.4 26 14.5 26 16.8 Z"
              fill="#c8372d"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="23.5" cy="13.5" r="0.6" fill="#fbf7ef" />
            <circle cx="24.6" cy="10.5" r="0.6" fill="#fbf7ef" />
            <circle cx="23.4" cy="8.3" r="0.6" fill="#fbf7ef" />
            <circle cx="25" cy="5.6" r="0.6" fill="#fbf7ef" />
            <circle cx="24.9" cy="14.8" r="0.6" fill="#fbf7ef" />
            <g className="eye">
              <circle cx="20.8" cy="17.4" r="1.6" fill="#e9c7a0" stroke={INK} strokeWidth="0.7" />
              <circle className="pupil" cx="20.6" cy="17.5" r="1" fill="#5a1e14" />
              <circle cx="20.9" cy="17.1" r="0.35" fill="#ffffff" />
            </g>
            <g className="eye">
              <circle cx="27.2" cy="17.4" r="1.6" fill="#e9c7a0" stroke={INK} strokeWidth="0.7" />
              <circle className="pupil" cx="27.4" cy="17.5" r="1" fill="#5a1e14" />
              <circle cx="27.7" cy="17.1" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'parakeet':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Red-breasted parakeet perched on a twig, red hooked beak to the left */}
            <g className="tail">
              <path
                d="M 25 29 C 29 34 33 40 37.5 46 C 36 46.6 34.5 46.2 33.5 45 C 30 40 26.5 35 22.5 31 Z"
                fill="#3a9a96"
                stroke={INK}
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path className="paint" d="M 25 31.5 C 28.5 35.5 32 40 35.5 45.2" stroke="#2b7a8a" strokeWidth="0.9" strokeLinecap="round" />
            </g>
            <path className="paint" d="M 5 35.5 C 15 34.5 28 34 42 32.5" stroke="#7a5230" strokeWidth="2.4" strokeLinecap="round" />
            <path className="paint" d="M 35 33 C 37 30 39.5 29.5 41.5 30.5" stroke="#7a5230" strokeWidth="1.4" strokeLinecap="round" />
            <path
              d="M 14 18 C 17 15 24 16 27 21 C 30 26 29.5 31 26 33 C 22 35 16 34 14 30 C 12.5 26.5 12.5 21 14 18 Z"
              fill="#5aa845"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 13.6 21 C 13 25 13.5 29.5 16 32 C 18.5 33.5 21.5 33.6 23.5 32.4 C 20 30 18 25 18.5 19.5 Z" fill="#f2a08b" />
            <g className="wing">
              <path
                d="M 19 19.5 C 24 19 28.5 23 29 28.5 C 29.3 31 27.5 33 25 33.5 C 22 30 19.5 25 19 19.5 Z"
                fill="#3f8a35"
                stroke={INK}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M 21 21.5 C 23.5 22 25 24 25.5 26 C 23.5 25.5 22 24 21 21.5 Z" fill="#c9d64a" />
            </g>
            <path d="M 18 33 L 17.5 35.8 M 21.5 33.6 L 21.5 36" stroke="#8a8f99" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="16.5" cy="12.5" r="6" fill="#8ea6c8" stroke={INK} strokeWidth="1.6" />
            <path d="M 11 15 C 13 16.5 17 17.5 20.5 16.5 C 19.5 18.5 16 19.6 12.5 18.5 C 11.4 17.8 10.8 16.4 11 15 Z" fill={INK} />
            <path d="M 11.6 10.4 C 12.8 10 14 10.4 14.4 10.8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path
              d="M 11.5 9.8 C 8.5 9.5 6.5 11.5 6.8 14.5 C 7 16 8 16.8 8.6 16 C 8.4 14.2 9.5 13.6 11.6 14.4 Z"
              fill="#e0412f"
              stroke={INK}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M 11.4 14.2 C 9.6 14 8.8 15 9.2 16.2 C 10.2 16.8 11.2 16.2 11.6 15.4 Z" fill="#3a2e24" />
            <g className="eye">
              <circle cx="15.4" cy="11.2" r="1.9" fill="#f3e1a0" stroke={INK} strokeWidth="0.6" />
              <circle className="pupil" cx="15.3" cy="11.3" r="1" fill={INK} />
              <circle cx="15.6" cy="10.9" r="0.35" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'temple-bell':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thai temple bell with a bodhi-leaf wind catcher hanging from its clapper */}
            <Limb d="M 21.8 7 C 21.4 3.8 22.4 2.2 24 2.2 C 25.6 2.2 26.6 3.8 26.2 7" color="#e9b949" w={2.8} />
            <path
              d="M 17 14 C 17 10.4 20 9.4 24 9.4 C 28 9.4 31 10.4 31 14 L 32 22 C 32.5 25 34.5 27 37 28.5 L 11 28.5 C 13.5 27 15.5 25 16 22 Z"
              fill="#b87a35"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M 19.6 10.4 L 21.2 6.4 L 26.8 6.4 L 28.4 10.4 Z" fill="#f2c94c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 20.6 8.4 L 27.4 8.4" stroke={INK} strokeWidth="0.8" />
            <path d="M 16.9 13.2 Q 24 14.8 31.1 13.2 L 31.3 15.4 Q 24 17 16.7 15.4 Z" fill="#f2c94c" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M 16 21.6 Q 24 23.2 32 21.6 L 32.4 24 Q 24 25.6 15.6 24 Z" fill="#f2c94c" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            <path className="paint" d="M 20 11.5 C 19.5 15 19 19 18.4 21.5" stroke="#e8b97a" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="24" cy="28.5" rx="13" ry="2" fill="#6e4518" stroke={INK} strokeWidth="1.4" />
            <rect x="22.8" y="27.5" width="2.4" height="4.5" rx="1" fill="#8a5a22" stroke={INK} strokeWidth="1" />
            <g className="tail">
              <path d="M 24 32 L 24 35.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
              <path
                d="M 24 35.5 C 21.5 33.2 16.5 33.5 16.5 37.8 C 16.5 41 20 43 23 44.2 L 24 47 L 25 44.2 C 28 43 31.5 41 31.5 37.8 C 31.5 33.5 26.5 33.2 24 35.5 Z"
                fill="#f2c94c"
                stroke={INK}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path className="paint" d="M 24 35.5 L 24 44 M 24 38.4 L 20.2 36.6 M 24 41 L 19.8 39.8 M 24 38.4 L 27.8 36.6 M 24 41 L 28.2 39.8" stroke="#a8781e" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'naga-head':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Naga staircase finial, open jaws to the left, flame crest sweeping back */}
            <path
              d="M 22 24 C 28 30 30 38 29 46 L 43 46 C 44 36 40 24 31 16 Z"
              fill="#3f9a52"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 22 24 C 28 30 30 38 29 46 L 33.5 46 C 34.3 38 31.5 30 25.8 22.2 Z" fill="#e9b949" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 25.4 28 L 28.6 26.2 M 27.6 32.4 L 31 31 M 29 37 L 32.6 36.2 M 29.5 41.6 L 33.4 41.2" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
            <path className="paint" d="M 34 26 q 2 -1.6 4 0 M 35 32 q 2 -1.6 4 0 M 36 38 q 2 -1.6 4 0 M 33 20.5 q 1.8 -1.4 3.6 0" stroke="#2a7a3e" strokeWidth="1" strokeLinecap="round" />
            <path
              d="M 14 13 C 14 8 17 4.5 21 3 C 20 6 21 8.5 23.5 9 C 24 5.5 27 3 31 3 C 29 6 29.5 9 32 10.5 C 33.5 7.5 37 6.5 41 7.5 C 38.5 9.5 37.5 12.5 38.5 15 C 40.5 14.5 43 15.5 45 17.5 C 41.5 18 38.5 20.5 36 24 L 26 22 Z"
              fill="#e9b949"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 20 10 C 20 8 20.5 6.5 21.5 5.5 M 27 10.5 C 27.5 8 28.5 6.5 30 5.2 M 33 13 C 34.5 11 36.5 9.6 39 9 M 36 18 C 38 17 40.5 16.6 43 17.3" stroke="#d9573b" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 8 19.5 L 23 22 L 22 28 L 9.5 28 Z" fill="#b8322a" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 10 20 L 11.2 24 L 12.6 20.3 Z M 16 21 L 17 24.2 L 18.2 21.3 Z M 12 28.4 L 13 25 L 14.2 28.4 Z" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            <path
              d="M 9 27.5 C 14 28 19 27.4 24 25 L 26 29 C 21 31.5 14.5 32.5 9.5 31.5 C 7.8 31 7.8 28.2 9 27.5 Z"
              fill="#3f9a52"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M 32 18 C 28 12.5 20 10.5 14 12 C 10.5 12.8 7.5 14.6 5 15.2 C 3 13.6 1 15.6 2.2 17.8 C 3.2 19.6 6 20.4 8.2 19.4 C 13 20.6 18 21.4 23 22 C 26 22.5 29 22 32 18 Z"
              fill="#3f9a52"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 5 15.2 C 4.4 12 6.4 10.4 8 11.4 C 9 12.2 8.2 13.8 7 13.2" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <path className="paint" d="M 23 18.6 q 1.5 -1.4 3 0 M 26.5 19.6 q 1.5 -1.4 3 0 M 25 15.8 q 1.5 -1.4 3 0" stroke="#2a7a3e" strokeWidth="1" strokeLinecap="round" />
            <path d="M 12.5 13.8 C 15 11.5 20 11.8 22.5 14 C 19.5 13.5 16 13.8 13.5 15.2 Z" fill="#e9b949" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <ellipse cx="18" cy="16.2" rx="2.5" ry="1.8" fill="#fbf7ef" stroke={INK} strokeWidth="1" />
            <circle cx="17.6" cy="16.3" r="1.2" fill="#d9412b" />
            <circle cx="17.6" cy="16.3" r="0.6" fill={INK} />
            <circle cx="5.6" cy="16.4" r="0.6" fill={INK} />
          </svg>
        );

      case 'khon-mask':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Hanuman khon mask: white monkey face under a golden spire crown */}
            <path d="M 12.5 20 C 7.5 21 5 25.5 6 31 C 8 29 10 28 12.5 28 Z" fill="#e9b949" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 35.5 20 C 40.5 21 43 25.5 42 31 C 40 29 38 28 35.5 28 Z" fill="#e9b949" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 24 1.5 C 23 7 20.5 12 17.5 16.5 L 30.5 16.5 C 27.5 12 25 7 24 1.5 Z" fill="#e9b949" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 22.4 7 L 25.6 7 M 20.9 10.6 L 27.1 10.6 M 19.2 13.8 L 28.8 13.8" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path
              d="M 12 20 C 11 26 11 32 13 36 C 15 41 19 44 24 44 C 29 44 33 41 35 36 C 37 32 37 26 36 20 C 32 17.5 16 17.5 12 20 Z"
              fill="#f7f3ea"
              stroke={INK}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M 12 18.5 C 16 15.2 32 15.2 36 18.5 L 36 21 C 32 18.4 16 18.4 12 21 Z" fill="#e9b949" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="24" cy="17.6" r="1.4" fill="#2f8a4a" stroke={INK} strokeWidth="0.8" />
            <circle cx="18" cy="18.4" r="0.8" fill="#c0392b" />
            <circle cx="30" cy="18.4" r="0.8" fill="#c0392b" />
            <path className="paint" d="M 14 23.5 C 16 21 20.5 20.6 22.5 22.6 M 34 23.5 C 32 21 27.5 20.6 25.5 22.6" stroke="#2f8a4a" strokeWidth="1.6" strokeLinecap="round" />
            <path className="paint" d="M 13 28 C 13.5 31 15 32 16.5 31.5 M 35 28 C 34.5 31 33 32 31.5 31.5" stroke="#2f8a4a" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="18.5" cy="26" r="3.6" fill="#e9b949" stroke={INK} strokeWidth="1" />
            <circle cx="29.5" cy="26" r="3.6" fill="#e9b949" stroke={INK} strokeWidth="1" />
            <circle cx="18.5" cy="26" r="2.6" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" />
            <circle cx="29.5" cy="26" r="2.6" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" />
            <circle cx="18.5" cy="26" r="1.4" fill={INK} />
            <circle cx="29.5" cy="26" r="1.4" fill={INK} />
            <path d="M 22.6 30.6 C 23.2 29.6 24.8 29.6 25.4 30.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path
              d="M 15 33 C 19 31.5 29 31.5 33 33 C 32 38 28 41.5 24 41.5 C 20 41.5 16 38 15 33 Z"
              fill="#c0392b"
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M 16.4 33.4 C 20 32.4 28 32.4 31.6 33.4 L 31.2 35.4 C 27 34.6 21 34.6 16.8 35.4 Z" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M 19.5 39.4 C 22.5 40.2 25.5 40.2 28.5 39.4 L 27.8 38 C 25.5 38.6 22.5 38.6 20.2 38 Z" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M 20.6 33 L 20.6 34.9 M 24 32.8 L 24 34.7 M 27.4 33 L 27.4 34.9" stroke={INK} strokeWidth="0.6" />
            <path d="M 16.9 35 L 18.2 38.2 L 19.4 34.8 Z M 31.1 35 L 29.8 38.2 L 28.6 34.8 Z" fill="#fbf7ef" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          </svg>
        );

      case 'spirit-house':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* San phra phum: Thai spirit house on its pillar, garland on the porch */}
            <path d="M 15 46 L 17 42.5 L 31 42.5 L 33 46 Z" fill="#d8cdb8" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="20.5" y="33" width="7" height="10" fill="#f4efe4" stroke={INK} strokeWidth="1.5" />
            <rect x="14" y="20" width="20" height="11" fill="#fbf7ef" stroke={INK} strokeWidth="1.5" />
            <path className="paint" d="M 15.8 21.5 L 15.8 30.5 M 32.2 21.5 L 32.2 30.5" stroke="#e9b949" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 21 31 L 21 25.5 C 21 22.6 27 22.6 27 25.5 L 27 31 Z" fill="#8e1b1b" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 8 22.5 L 14 15 L 34 15 L 40 22.5 Z" fill="#c0392b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 8 22.5 C 6.5 21.5 6 20 6.5 18.6 M 40 22.5 C 41.5 21.5 42 20 41.5 18.6" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 14 16.5 L 24 4.5 L 34 16.5 Z" fill="#d9573b" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <Limb d="M 13 17 L 24 4.5 L 35 17" color="#e9b949" w={3.2} />
            <path d="M 13 17 C 11 16.6 10.4 14.8 11.2 13.6 M 35 17 C 37 16.6 37.6 14.8 36.8 13.6" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 24 4.5 C 24 2.5 25.4 1.4 27 1.8 C 26 2.4 25.6 3.2 25.8 4.2" fill="#e9b949" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 24 8.5 L 20.5 13.5 L 27.5 13.5 Z" fill="#e9b949" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            <rect x="9" y="30.5" width="30" height="3.2" rx="0.8" fill="#c0392b" stroke={INK} strokeWidth="1.5" />
            <path className="paint" d="M 10.5 32.1 L 37.5 32.1" stroke="#e9b949" strokeWidth="0.9" strokeLinecap="round" />
            <g fill="#f39c12" stroke={INK} strokeWidth="0.6">
              <circle cx="11.5" cy="34.6" r="1.1" />
              <circle cx="13.3" cy="36.2" r="1.1" />
              <circle cx="15.5" cy="36.8" r="1.1" />
              <circle cx="17.7" cy="36.2" r="1.1" />
              <circle cx="30.3" cy="36.2" r="1.1" />
              <circle cx="32.5" cy="36.8" r="1.1" />
              <circle cx="34.7" cy="36.2" r="1.1" />
              <circle cx="36.5" cy="34.6" r="1.1" />
            </g>
          </svg>
        );

      case 'lotus-bud':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Offering lotus bud with folded petal tips, on its stem beside a round leaf */}
            <path
              d="M 13.5 40 L 10.2 44.8 C 6 44.4 3.5 42.4 3.5 40 C 3.5 37 8 35 13.5 35 C 19 35 23.5 37 23.5 40 C 23.5 43 19.5 45 14 45.1 Z"
              fill="#5aa845"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 13.5 40 L 6 38.4 M 13.5 40 L 10.5 36 M 13.5 40 L 16.8 35.8 M 13.5 40 L 21 38.6 M 13.5 40 L 19.5 43.4" stroke="#3e8a35" strokeWidth="0.9" strokeLinecap="round" />
            <Limb d="M 26 29 C 27 35 26 40 27.5 46" color="#4f9a45" w={3.6} />
            <path
              d="M 26 3 C 30 8 33 14 32.5 20 C 32 25 29.5 29 26 30 C 22.5 29 20 25 19.5 20 C 19 14 22 8 26 3 Z"
              fill="#f7b6c6"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path className="paint" d="M 26 4.5 C 27.6 6.5 29 8.6 29.8 10.8" stroke="#e0628a" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 26 30 C 21 29.5 17.5 26 17 21 C 16.8 18 17.5 15.5 18.5 13.5 L 23.5 16.5 C 22.5 20 23 25 26 30 Z" fill="#ec7fa0" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 26 30 C 31 29.5 34.5 26 35 21 C 35.2 18 34.5 15.5 33.5 13.5 L 28.5 16.5 C 29.5 20 29 25 26 30 Z" fill="#ec7fa0" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 18.5 13.5 L 14 17.5 L 20.5 18 Z" fill="#fbd5df" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 33.5 13.5 L 38 17.5 L 31.5 18 Z" fill="#fbd5df" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 21.5 30.5 C 23 28.6 24.6 28.4 26 29.6 C 27.4 28.4 29 28.6 30.5 30.5 C 29 31.6 23 31.6 21.5 30.5 Z" fill="#4f9a45" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
        );

      case 'longtail-boat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ruea hang yao — long-tail boat, bow to the left, engine and prop shaft trailing at the stern */}
            <path d="M 17.5 21 L 17.5 30 M 28.5 21 L 28.5 30" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 15 21.8 C 17.5 18.4 28.5 18.4 31 21.8 Z" fill="#2a7fc4" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 37.5 27 L 46 41.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            <path className="paint" d="M 37.5 27 L 46 41.5" stroke="#b8bfc6" strokeWidth="1" strokeLinecap="round" />
            <path d="M 43.6 41.6 L 47.2 40.4 M 45.2 39.4 L 46.6 43.4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 2.5 9 C 4 19 7.5 27.5 13 30 L 37 30 L 36.2 35.6 C 28 38.4 16 38.4 11 36.4 C 6 33.6 3.4 22 2.5 9 Z" fill="#a8693a" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M 9 31.6 C 15 33.6 27 33.8 36.6 32.8" stroke="#6e4424" strokeWidth="1" strokeLinecap="round" />
            <path d="M 13 30 L 37 30" stroke="#e0b27a" strokeWidth="1.3" className="paint" />
            <g className="tail">
              <path d="M 5 12.6 C 8 9.6 10.6 12 14 9.6 L 15 12 C 11.4 14.2 9 12.4 5.6 14.6 Z" fill="#d6372b" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M 5.6 14.6 C 9.4 13.6 11.6 16 15.4 15 L 15.6 17.4 C 11.6 18.4 9.4 16 6 16.8 Z" fill="#f2c230" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M 6 16.8 C 9 17.6 10.4 20.4 13.6 20.8 L 13 23 C 9.6 22.4 8.2 19.8 6.4 19 Z" fill="#3f9b4a" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
            </g>
            <circle cx="4.8" cy="15" r="2.3" fill="#f08c1d" stroke={INK} strokeWidth="1" />
            <path d="M 3.6 15 L 6 15 M 4.8 13.8 L 4.8 16.2" stroke="#b8561a" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M 38.4 21 C 38.6 18.6 39.6 17.4 41 17" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 33.2 20.4 L 38.8 20.4 L 39.4 23.2 L 32.6 23.2 Z" fill="#5d6873" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 31.8 23 L 40 23 L 40.6 28.6 L 31.2 28.6 Z" fill="#8d99a6" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 34.4 23.2 L 34.4 28.4 M 37.4 23.2 L 37.4 28.4" stroke={INK} strokeWidth="0.8" />
            <path d="M 32 25 L 24.6 22.2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      case 'royal-barge':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Suphannahong royal barge — swan-head prow to the left, spired pavilion amidships */}
            <path d="M 15 33.6 L 10.6 41.2 M 20 34.4 L 15.6 42 M 25 34.6 L 20.6 42.2 M 30 34.4 L 25.6 42 M 35 33.6 L 30.6 41.2 M 40 31.6 L 35.6 39.2" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 7 29.5 C 14 31.5 32 31.5 40 28.5 C 42.5 27 44 23 44.5 17.5 C 46.5 22 46.5 30 42 33.5 C 36 37.5 16 38 10 35.5 C 7.5 34 6.5 32 7 29.5 Z" fill="#e3b23c" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path className="paint" d="M 9.5 32.6 C 17 35 32 35 41.5 31" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
            <path d="M 11.5 31.5 C 6 27 6 20 9 16.5 C 11.5 13.5 11.5 10.5 9.5 8.5" stroke={INK} strokeWidth="5.4" strokeLinecap="round" />
            <path className="paint" d="M 11.5 31.5 C 6 27 6 20 9 16.5 C 11.5 13.5 11.5 10.5 9.5 8.5" stroke="#c0392b" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M 6.4 22 L 9.6 22.6 M 7.6 17.4 L 10.4 18.8" stroke="#f2c94c" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 11 5.5 C 14 4 15.5 6.5 13 8 C 15 9 13.5 11 11.5 10" fill="#e3b23c" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 7 6.5 C 9.5 5 12.5 6.5 12 9.5 C 11.5 11.5 9 11.5 7.5 10.8 L 3 10.4 L 6 8.4 Z" fill="#e3b23c" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <circle cx="9.4" cy="8.4" r="0.8" fill={INK} />
            <path className="tail" d="M 4.5 10.5 L 4.5 14.5" stroke="#c0392b" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="20" y="22" width="12" height="8" rx="0.8" fill="#c0392b" stroke={INK} strokeWidth="1.3" />
            <path d="M 22.5 30 L 22.5 22.5 M 29.5 30 L 29.5 22.5" stroke="#f2c94c" strokeWidth="1.4" />
            <path d="M 17.5 22.5 L 34.5 22.5 L 30.5 17 L 21.5 17 Z" fill="#c0392b" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 21 17.2 L 31 17.2 L 28.4 12.6 L 23.6 12.6 Z" fill="#e3b23c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 23.8 12.8 L 28.2 12.8 L 26 3.5 Z" fill="#e3b23c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        );

      case 'krathong':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Loy Krathong float: banana-trunk base, folded banana-leaf petals, marigolds, candle and incense */}
            <path d="M 7 35 L 7 39.5 C 7 43.5 41 43.5 41 39.5 L 41 35 Z" fill="#c9d48a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 12 37.5 L 12 41.5 M 18 38 L 18 42.5 M 24 38 L 24 42.8 M 30 38 L 30 42.5 M 36 37.5 L 36 41.5" stroke="#8a9a4a" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 14 26 L 9 15 L 20 23 Z M 34 26 L 39 15 L 28 23 Z M 21 23 L 24 13 L 27 23 Z" fill="#3d8a3c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 7 37 L 5.5 25 L 14 32 Z M 41 37 L 42.5 25 L 34 32 Z M 13 37 L 13.5 22.5 L 21 33 Z M 35 37 L 34.5 22.5 L 27 33 Z M 18.5 37.5 L 24 21 L 29.5 37.5 Z" fill="#5fae4f" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 9 33 L 6.5 27 M 16.5 34 L 14 25 M 24 35 L 24 24 M 31.5 34 L 34 25 M 39 33 L 41.5 27" stroke="#2f6b2d" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M 19 26 L 15 9 M 20.5 25.5 L 17.6 8.4 M 22 25 L 20.4 8.2" stroke="#a5452f" strokeWidth="1" strokeLinecap="round" className="paint" />
            <path d="M 15 9 L 14.7 7.8 M 17.6 8.4 L 17.4 7.2 M 20.4 8.2 L 20.3 7" stroke="#f2793a" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="25" y="13" width="4.4" height="13" rx="1" fill="#fbf3dc" stroke={INK} strokeWidth="1.2" />
            <path d="M 27.2 13 L 27.2 11.6" stroke={INK} strokeWidth="0.9" />
            <path className="glow-spot" d="M 27.2 4 C 29 6.5 30 8.2 30 9.6 C 30 11.2 28.8 12 27.2 12 C 25.6 12 24.4 11.2 24.4 9.6 C 24.4 8.2 25.4 6.5 27.2 4 Z" fill="#f9b233" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <circle cx="16" cy="28.5" r="3.6" fill="#f08c1d" stroke={INK} strokeWidth="1.1" />
            <circle cx="32" cy="28.5" r="3.6" fill="#f08c1d" stroke={INK} strokeWidth="1.1" />
            <circle cx="24" cy="29.5" r="3.9" fill="#f6c431" stroke={INK} strokeWidth="1.1" />
            <path d="M 14.4 28.5 L 17.6 28.5 M 16 26.9 L 16 30.1 M 30.4 28.5 L 33.6 28.5 M 32 26.9 L 32 30.1 M 22.3 29.5 L 25.7 29.5 M 24 27.8 L 24 31.2" stroke="#b8561a" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        );

      case 'sky-lantern':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Khom loi — Yi Peng paper sky lantern, flame burning in the open bottom */}
            <path d="M 14.5 38 L 10.5 16 C 10 8 16 3.5 24 3.5 C 32 3.5 38 8 37.5 16 L 33.5 38 Z" fill="#fbf3df" />
            <path d="M 12.32 26 L 14.5 38 L 33.5 38 L 35.68 26 C 29 28 19 28 12.32 26 Z" fill="#f9c98c" />
            <path d="M 13.41 32 L 14.5 38 L 33.5 38 L 34.59 32 C 29 34 19 34 13.41 32 Z" fill="#f39a4a" />
            <path d="M 17.5 4.6 C 15 10 15.6 26 18.4 38.6 M 24 3.5 L 24 35 M 30.5 4.6 C 33 10 32.4 26 29.6 38.6" stroke="#b89a6c" strokeWidth="1" />
            <path d="M 10.7 15 C 18 17 30 17 37.3 15" stroke="#b89a6c" strokeWidth="1" />
            <path d="M 14.5 38 L 10.5 16 C 10 8 16 3.5 24 3.5 C 32 3.5 38 8 37.5 16 L 33.5 38" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <ellipse cx="24" cy="38.4" rx="9.6" ry="2.6" fill="#d9772b" stroke={INK} strokeWidth="1.5" />
            <path d="M 15 38.4 L 33 38.4" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            <path className="glow-spot" d="M 24 30.6 C 26.4 33.4 27.4 35 27.4 36.4 C 27.4 38 26 39 24 39 C 22 39 20.6 38 20.6 36.4 C 20.6 35 21.6 33.4 24 30.6 Z" fill="#fde047" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
        );

      case 'clay-lamp':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Lanna prateep — scalloped terracotta oil lamp with a lit wick */}
            <path d="M 14 44 C 14 40.5 18 39 20 37 L 28 37 C 30 39 34 40.5 34 44 Z" fill="#b5562b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <ellipse cx="24" cy="23.6" rx="17" ry="3.6" fill="#6b2f16" stroke={INK} strokeWidth="1.2" />
            <path d="M 6 24 Q 9.6 19 13.2 24 Q 16.8 19 20.4 24 Q 24 19 27.6 24 Q 31.2 19 34.8 24 Q 38.4 19 42 24 C 41 32 34 37 24 37 C 14 37 7 32 6 24 Z" fill="#d17840" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M 13.2 24 C 13.6 28 15 32 17 34.5 M 20.4 24 L 21.2 36 M 27.6 24 L 26.8 36 M 34.8 24 C 34.4 28 33 32 31 34.5" stroke="#8f3f1c" strokeWidth="1" strokeLinecap="round" />
            <path d="M 8.5 29 C 14 31.5 34 31.5 39.5 29" stroke="#f2b07a" strokeWidth="1.2" strokeLinecap="round" className="paint" />
            <path d="M 24 22.5 L 24 18.5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            <path className="glow-spot" d="M 24 3.5 C 27.5 8.5 30.5 11.5 30.5 15 C 30.5 18.6 27.6 20.5 24 20.5 C 20.4 20.5 17.5 18.6 17.5 15 C 17.5 11.5 20.5 8.5 24 3.5 Z" fill="#f59e2a" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 24 10 C 26 12.5 27.3 14.4 27.3 16 C 27.3 17.8 25.8 18.7 24 18.7 C 22.2 18.7 20.7 17.8 20.7 16 C 20.7 14.4 22 12.5 24 10 Z" fill="#fde68a" />
          </svg>
        );

      case 'jasmine-garland':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Phuang malai — jasmine bud ring with a rose-and-marigold knot and dangling tails */}
            <g className="tail">
              <path d="M 21.5 32 L 17.6 41 M 24 33 L 24 42.4 M 26.5 32 L 30.4 41" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
              <path className="paint" d="M 21.5 32 L 17.6 41 M 24 33 L 24 42.4 M 26.5 32 L 30.4 41" stroke="#fdfbf3" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.8 0.8" />
              <path d="M 17.6 40.4 L 15.4 45.4 L 19.6 45.4 Z M 24 41.8 L 22 46.4 L 26 46.4 Z M 30.4 40.4 L 28.4 45.4 L 32.6 45.4 Z" fill="#d6372b" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            </g>
            <path d="M 15 30.5 C 12 31 10 33.5 10.5 35.5 C 13 35.4 15 33 15 30.5 Z M 33 30.5 C 36 31 38 33.5 37.5 35.5 C 35 35.4 33 33 33 30.5 Z" fill="#3f9b4a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <ellipse cx="24" cy="16" rx="13" ry="11" stroke={INK} strokeWidth="7.4" />
            <ellipse className="paint" cx="24" cy="16" rx="13" ry="11" stroke="#b9d39a" strokeWidth="5.2" />
            <ellipse className="paint" cx="24" cy="16" rx="13" ry="11" stroke="#fdfbf3" strokeWidth="4.8" strokeDasharray="2.6 1.1" />
            <circle cx="17.5" cy="28.5" r="4" fill="#f08c1d" stroke={INK} strokeWidth="1.2" />
            <circle cx="30.5" cy="28.5" r="4" fill="#f08c1d" stroke={INK} strokeWidth="1.2" />
            <path d="M 15.5 28.5 L 19.5 28.5 M 17.5 26.5 L 17.5 30.5 M 28.5 28.5 L 32.5 28.5 M 30.5 26.5 L 30.5 30.5" stroke="#b8561a" strokeWidth="0.8" strokeLinecap="round" />
            <circle cx="24" cy="29" r="5" fill="#d6372b" stroke={INK} strokeWidth="1.3" />
            <path d="M 24 29 C 24 27.6 25.8 27.6 25.8 29.2 C 25.8 31 22.4 31.2 22.2 28.8 C 22 26.4 26 25.8 27.2 28" stroke="#8e1b1b" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        );

      case 'paper-umbrella':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bo Sang oiled-paper parasol, open and tilted, bamboo ribs showing underneath */}
            <g transform="rotate(-14 24 24)">
              <path d="M 24 31 L 24 46" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
              <path className="paint" d="M 24 31 L 24 46" stroke="#9c6b3f" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M 4 23 L 24 32 L 44 23 C 36 26 12 26 4 23 Z" fill="#f0c98a" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M 9 24.6 L 24 32 M 16 25.6 L 24 32 M 24 25.8 L 24 32 M 32 25.6 L 24 32 M 39 24.6 L 24 32" stroke="#a87a45" strokeWidth="0.8" />
              <path d="M 4 23 C 5 12 14 6 24 6 C 34 6 43 12 44 23 Q 40.5 23.6 38 26 Q 34.5 25.6 31 27 Q 27.5 26 24 27.4 Q 20.5 26 17 27 Q 13.5 25.6 10 26 Q 7.5 23.6 4 23 Z" fill="#e8622c" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M 24 6 C 18 10 12 18 10 26 M 24 6 C 21 12 18 20 17 27 M 24 6 L 24 27.4 M 24 6 C 27 12 30 20 31 27 M 24 6 C 30 10 36 18 38 26" stroke="#9e3510" strokeWidth="0.9" />
              <path d="M 12 22.5 C 16 19 23 17.6 28 13 M 20.6 17.6 C 24 19 28 20 31.5 21.6" stroke="#5b3a1e" strokeWidth="1.1" strokeLinecap="round" />
              <g fill="#fde9ef" stroke={INK} strokeWidth="0.7">
                <circle cx="17.5" cy="15.3" r="1.5" />
                <circle cx="19.1" cy="16.5" r="1.5" />
                <circle cx="18.5" cy="18.4" r="1.5" />
                <circle cx="16.5" cy="18.4" r="1.5" />
                <circle cx="15.9" cy="16.5" r="1.5" />
                <circle cx="31.5" cy="19.3" r="1.4" />
                <circle cx="33" cy="20.4" r="1.4" />
                <circle cx="32.4" cy="22.2" r="1.4" />
                <circle cx="30.6" cy="22.2" r="1.4" />
                <circle cx="30" cy="20.4" r="1.4" />
              </g>
              <circle cx="17.5" cy="17" r="1" fill="#f2c230" />
              <circle cx="31.5" cy="21" r="0.9" fill="#f2c230" />
              <circle cx="27.6" cy="12.6" r="1.3" fill="#fde9ef" stroke={INK} strokeWidth="0.7" />
              <path d="M 24 15.8 C 24.6 13.8 26.4 13.4 27 14.2 C 26.2 15.6 25 16 24 15.8 Z M 25.6 19.2 C 26.6 20.8 28.4 21 28.8 20 C 27.8 19 26.6 18.8 25.6 19.2 Z" fill="#3f9b4a" />
              <circle cx="24" cy="5" r="1.6" fill="#9c6b3f" stroke={INK} strokeWidth="1" />
            </g>
          </svg>
        );

      case 'long-drum':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Klong yao — Lanna long drum, tilted as when carried, cloth skirt with tassels and a shoulder strap */}
            <path d="M 26 4.5 C 39 1 46.5 15 43.5 25 C 42 30 37.5 32 34 31.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
            <path className="paint" d="M 26 4.5 C 39 1 46.5 15 43.5 25 C 42 30 37.5 32 34 31.5" stroke="#2a9d8f" strokeWidth="1.6" strokeLinecap="round" />
            <g transform="translate(-1 -1.6) rotate(-24 24 25)">
              <path d="M 14 7 C 14 14 19 18 21.5 22 L 21.5 37 C 19 39 15 40.5 15 44 L 33 44 C 33 40.5 29 39 26.5 37 L 26.5 22 C 29 18 34 14 34 7 Z" fill="#9a5a30" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M 14.6 9 L 18 18.5 L 21.4 9.4 L 24 19.5 L 26.6 9.4 L 30 18.5 L 33.4 9" stroke="#e8d3a6" strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M 18.8 19.6 C 22 20.8 26 20.8 29.2 19.6" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
              <ellipse cx="24" cy="7" rx="10" ry="3" fill="#f3e6c4" stroke={INK} strokeWidth="1.6" />
              <ellipse cx="24" cy="7" rx="3.6" ry="1.2" fill="#3a2e24" />
              <g className="tail">
                <path d="M 17.6 33 L 16.6 40 M 20.8 34.2 L 20.2 41.2 M 24 34.6 L 24 41.6 M 27.2 34.2 L 27.8 41.2 M 30.4 33 L 31.4 40" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
                <path className="paint" d="M 17.6 33 L 16.6 40 M 20.8 34.2 L 20.2 41.2 M 24 34.6 L 24 41.6 M 27.2 34.2 L 27.8 41.2 M 30.4 33 L 31.4 40" stroke="#f2c230" strokeWidth="1.2" strokeLinecap="round" />
              </g>
              <path d="M 18 22.6 C 21 24 27 24 30 22.6 L 32.6 32 C 28 35 20 35 15.4 32 Z" fill="#c62828" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path className="paint" d="M 17.4 25.4 C 21 27.2 27 27.2 30.6 25.4 M 16.2 30 C 20.6 32.6 27.4 32.6 31.8 30" stroke="#f2c230" strokeWidth="1.3" />
              <path d="M 22 28.6 L 24 27 L 26 28.6 L 24 30.2 Z" fill="#f2c230" stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
            </g>
          </svg>
        );

      case 'tuk-tuk':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bangkok tuk-tuk, nose to the left: blue canopy with yellow trim, driver up front, bench behind */}
            <circle cx="41.5" cy="37" r="5" fill="#3a3330" stroke={INK} strokeWidth="1.4" />
            <path d="M 10 15 L 12 26 M 23.5 15 L 23.5 26 M 42.5 14.5 L 42.5 27" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
            <path className="paint" d="M 10 15 L 12 26 M 23.5 15 L 23.5 26 M 42.5 14.5 L 42.5 27" stroke="#c0c6cc" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 11 16 L 22.5 16 L 22.5 25 L 12.6 25 Z" fill="#cfe8f5" opacity="0.6" />
            <path d="M 27 26 L 27 22 L 40 22 L 40 26 Z M 39 22 L 39 16.5 L 42 16.5 L 42 22 Z" fill="#d6372b" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 15 20 L 19.5 22.5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 4.5 31 C 4.5 27 7 25.5 11 25.5 L 44.5 25.5 C 46 25.5 46.4 27 46 28.5 L 44.5 35.5 L 8.5 35.5 C 6 35.5 4.5 34 4.5 31 Z" fill="#1e74c8" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path className="paint" d="M 6 29 L 45.5 29" stroke="#f2c230" strokeWidth="1.4" />
            <circle cx="7.4" cy="27.8" r="1.8" fill="#fff6c8" stroke={INK} strokeWidth="1" />
            <path d="M 6 15.5 C 6 9 11 6 18 6 L 42 6 C 44.5 6 45.5 7.5 45.5 10 L 45.5 14 Z" fill="#1e74c8" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M 6 15.5 L 45.5 14 L 45.5 16.4 L 6.5 17.9 Z" fill="#f2c230" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="11.5" cy="39" r="4.8" fill="#3a3330" stroke={INK} strokeWidth="1.6" />
            <circle cx="11.5" cy="39" r="1.8" fill="#c0c6cc" stroke={INK} strokeWidth="0.9" />
            <path d="M 5.6 37.6 C 6 32.6 9 31.4 11.5 31.4 C 14 31.4 17 32.6 17.4 37.6 Z" fill="#f2c230" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="35" cy="38" r="6" fill="#3a3330" stroke={INK} strokeWidth="1.6" />
            <circle cx="35" cy="38" r="2.2" fill="#c0c6cc" stroke={INK} strokeWidth="0.9" />
          </svg>
        );

      case 'boxing-gloves':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Pair of red Muay Thai gloves in front of the white-and-red mongkhon headband */}
            <ellipse cx="24" cy="13" rx="14" ry="6" stroke={INK} strokeWidth="4.4" />
            <ellipse className="paint" cx="24" cy="13" rx="14" ry="6" stroke="#fdfbf3" strokeWidth="2.8" />
            <ellipse className="paint" cx="24" cy="13" rx="14" ry="6" stroke="#d6372b" strokeWidth="2.8" strokeDasharray="2 2.4" />
            <path d="M 36.5 9.5 C 39.5 7.5 41.5 6 43.5 3.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
            <path className="paint" d="M 36.5 9.5 C 39.5 7.5 41.5 6 43.5 3.5" stroke="#fdfbf3" strokeWidth="1.6" strokeLinecap="round" />
            <g transform="translate(16.5 28) rotate(-14)">
              <path d="M -6.6 4 C -10.6 -1 -11 -10 -6 -13.4 C -1.6 -16.2 5.4 -15.4 7.8 -10.6 C 9.2 -7.6 9 -4 8 -2 L 6 4 Z" fill="#d7262e" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M -7.6 -4.6 C -3.6 -2.4 1.6 -2.6 5 -4.4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M 5 -6 C 9.6 -7.4 12 -2 9.4 1.6 C 8.4 3 6.8 3.6 5.6 3.4 C 6.6 0 6.4 -3 5 -6 Z" fill="#e53d3d" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path className="paint" d="M -6.4 -9 C -5 -11.8 -2 -13 0.8 -12.8" stroke="#f6a5a5" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M -6.8 3.6 L 6.4 3.6 L 5.8 13.4 L -6.2 13.4 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M -6.6 6.2 L 6.2 6.2" stroke="#d7262e" strokeWidth="1.3" className="paint" />
              <path d="M -2 8 L 2 11.6 M 2 8 L -2 11.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            </g>
            <g transform="translate(31.5 28) rotate(14) scale(-1 1)">
              <path d="M -6.6 4 C -10.6 -1 -11 -10 -6 -13.4 C -1.6 -16.2 5.4 -15.4 7.8 -10.6 C 9.2 -7.6 9 -4 8 -2 L 6 4 Z" fill="#d7262e" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M -7.6 -4.6 C -3.6 -2.4 1.6 -2.6 5 -4.4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M 5 -6 C 9.6 -7.4 12 -2 9.4 1.6 C 8.4 3 6.8 3.6 5.6 3.4 C 6.6 0 6.4 -3 5 -6 Z" fill="#e53d3d" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
              <path className="paint" d="M -6.4 -9 C -5 -11.8 -2 -13 0.8 -12.8" stroke="#f6a5a5" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M -6.8 3.6 L 6.4 3.6 L 5.8 13.4 L -6.2 13.4 Z" fill="#fbf7ef" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M -6.6 6.2 L 6.2 6.2" stroke="#d7262e" strokeWidth="1.3" className="paint" />
              <path d="M -2 8 L 2 11.6 M 2 8 L -2 11.6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'mango-sticky-rice':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Khao niao mamuang: sticky rice and fanned mango slices on a banana leaf */}
            <ellipse cx="24" cy="31" rx="21" ry="12.5" fill="#fbf7ef" stroke={INK} strokeWidth="1.7" />
            <ellipse cx="24" cy="31.6" rx="17" ry="9.6" stroke="#d8ccb4" strokeWidth="1" />
            <path d="M 5 36 C 11 23.5 31 18.5 43.5 25.5 C 37.5 37 18 42 5 36 Z" fill="#5aa33f" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 6.5 35.5 C 18 30.5 31 26 42 25.8" stroke="#3d7f2b" strokeWidth="1" strokeLinecap="round" />
            {/* Mango slices, back to front */}
            <g transform="translate(29.6 24.1) rotate(-64)">
              <path d="M -9 0 C -7 -3.6 7 -3.6 9 0 C 7 2.2 -7 2.2 -9 0 Z" fill="#f7b52c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              <path className="paint" d="M -6 -1 C -3 -2.1 3 -2.1 6 -1" stroke="#fcd970" strokeWidth="0.9" strokeLinecap="round" />
            </g>
            <g transform="translate(32.8 26.5) rotate(-42)">
              <path d="M -9 0 C -7 -3.6 7 -3.6 9 0 C 7 2.2 -7 2.2 -9 0 Z" fill="#f7b52c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              <path className="paint" d="M -6 -1 C -3 -2.1 3 -2.1 6 -1" stroke="#fcd970" strokeWidth="0.9" strokeLinecap="round" />
            </g>
            <g transform="translate(34.9 29.9) rotate(-20)">
              <path d="M -9 0 C -7 -3.6 7 -3.6 9 0 C 7 2.2 -7 2.2 -9 0 Z" fill="#f7b52c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              <path className="paint" d="M -6 -1 C -3 -2.1 3 -2.1 6 -1" stroke="#fcd970" strokeWidth="0.9" strokeLinecap="round" />
            </g>
            <g transform="translate(35.5 33.9) rotate(2)">
              <path d="M -9 0 C -7 -3.6 7 -3.6 9 0 C 7 2.2 -7 2.2 -9 0 Z" fill="#f7b52c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
              <path className="paint" d="M -6 -1 C -3 -2.1 3 -2.1 6 -1" stroke="#fcd970" strokeWidth="0.9" strokeLinecap="round" />
            </g>
            {/* Sticky rice mound with coconut cream and mung beans */}
            <path
              d="M 7.5 33.5 Q 5.5 29 8.5 26.5 Q 7.5 21.5 11.5 20 Q 11.5 15 16 14.6 Q 19 11.8 22.5 14.4 Q 27 14.2 27.2 18.8 Q 30.4 21 29 25 Q 31 29.5 27.5 32.6 C 21.5 35.8 13 35.6 7.5 33.5 Z"
              fill="#fffefa"
              stroke={INK}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M 11 29.5 L 12.3 28.9 M 15.5 31.8 L 16.8 32.2 M 21 31.2 L 22.1 30.3 M 25.5 28.5 L 26.4 29.4 M 9.5 25.5 L 10.6 26" stroke="#c9bfa8" strokeWidth="0.9" strokeLinecap="round" />
            <path
              d="M 10.5 20.5 Q 13 17 17 17.4 Q 21 15.2 26 17.8 Q 27.8 20.6 25.6 21.6 L 25.4 23.4 Q 24.8 24.6 24.1 23.4 L 23.8 22 Q 21.6 21.6 20.6 22 L 20.4 26 Q 19.7 27.4 19 26 L 18.7 22.3 Q 16.4 22.6 15.4 23 L 15.1 24.4 Q 14.4 25.6 13.7 24.4 L 13.5 23 Q 10.8 22.8 10.5 20.5 Z"
              fill="#f2dc9e"
              stroke={INK}
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <ellipse cx="14.8" cy="19.6" rx="0.95" ry="0.7" fill="#e2ad2a" />
            <ellipse cx="18.4" cy="18.4" rx="0.95" ry="0.7" fill="#e2ad2a" />
            <ellipse cx="22" cy="18.6" rx="0.95" ry="0.7" fill="#e2ad2a" />
            <circle cx="16.6" cy="20.6" r="0.5" fill={INK} />
            <circle cx="20.4" cy="20.2" r="0.5" fill={INK} />
            <circle cx="24.2" cy="19.8" r="0.5" fill={INK} />
          </svg>
        );

      case 'coconut':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Young green coconut, top cut open, with a striped straw */}
            <path
              d="M 13 17 C 7.5 20 5.5 27 6.5 32 C 8 40 15 44.5 24 44.5 C 33 44.5 40 40 41.5 32 C 42.5 27 40.5 20 35 17 Z"
              fill="#6fae4a"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M 35 18 C 40 21 42 27 41 32 C 40 38 35 42 29 43.6 C 34 39 37 31 35 18 Z" fill="#4f8f35" />
            <ellipse cx="12.6" cy="28" rx="1.8" ry="4.6" fill="#ffffff" opacity="0.35" />
            <path d="M 18 18.5 C 14.5 25 14.5 36 19 43 M 30 18.5 C 33 25 33 36 29.5 43" stroke="#3f7a2a" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="24" cy="17" rx="11" ry="3.8" fill="#efe4c4" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="24" cy="17.3" rx="7.2" ry="2.5" fill="#ffffff" stroke={INK} strokeWidth="1" />
            <ellipse cx="24" cy="17.6" rx="4.6" ry="1.5" fill="#cfe3dc" />
            <path d="M 25.5 17.5 L 29.6 7 Q 30.6 4.6 33 4.2 L 37 3.6" stroke={INK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            <path className="paint" d="M 25.5 17.5 L 29.6 7 Q 30.6 4.6 33 4.2 L 37 3.6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path className="paint" d="M 25.5 17.5 L 29.6 7 Q 30.6 4.6 33 4.2 L 37 3.6" stroke="#e0403a" strokeWidth="2.2" strokeDasharray="1.6 1.6" strokeLinejoin="round" />
          </svg>
        );

      case 'thai-tea':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cha yen: Thai iced tea in a tied plastic bag with a straw */}
            <path d="M 21 14 C 15 17 9.5 23 9.5 31 C 9.5 39.5 15.5 44.5 24 44.5 C 32.5 44.5 38.5 39.5 38.5 31 C 38.5 23 33 17 27 14 Z" fill="#eef5f4" />
            <path
              d="M 11.3 23.5 C 18 25.5 30 25.5 36.7 23.5 C 38 26 38.5 28.5 38.5 31 C 38.5 39.5 32.5 44.5 24 44.5 C 15.5 44.5 9.5 39.5 9.5 31 C 9.5 28.5 10 26 11.3 23.5 Z"
              fill="#e8822f"
            />
            <path d="M 11.3 23.5 C 18 25.5 30 25.5 36.7 23.5 C 37.3 24.8 37.7 26 38 27.2 C 30 29.5 18 29.5 10 27.2 C 10.3 26 10.7 24.8 11.3 23.5 Z" fill="#f3b071" />
            <rect x="13.5" y="31" width="6" height="6" rx="1.2" transform="rotate(15 16.5 34)" fill="#fde6cc" stroke={INK} strokeWidth="0.9" />
            <rect x="26.5" y="33.5" width="6" height="6" rx="1.2" transform="rotate(-12 29.5 36.5)" fill="#fde6cc" stroke={INK} strokeWidth="0.9" />
            <rect x="27" y="27" width="5" height="5" rx="1" transform="rotate(22 29.5 29.5)" fill="#fde6cc" stroke={INK} strokeWidth="0.9" />
            <path d="M 21 14 L 18.5 22.5 M 27 14 L 29.5 22.5" stroke="#9fb3b0" strokeWidth="0.8" strokeLinecap="round" />
            <Limb d="M 23 25 L 27.5 3.5" color="#3fae5a" w={3.2} />
            <path d="M 21 14 C 15 17 9.5 23 9.5 31 C 9.5 39.5 15.5 44.5 24 44.5 C 32.5 44.5 38.5 39.5 38.5 31 C 38.5 23 33 17 27 14 Z" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path className="paint" d="M 13.5 30 C 13.5 35 15.5 39 18.5 41" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
            <path d="M 21.5 12.5 C 20 10 18.5 8 19 6.8 L 21.5 7.8 L 23.5 6.4 L 25.5 7.8 L 28 6.8 C 28.5 8 27.5 10 26.5 12.5 Z" fill="#eef5f4" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <Limb d="M 21 12.8 C 12 9.5 10.5 1.8 16.5 2 C 22 2.2 23.5 7 22.5 12" color="#e04f5f" w={2.6} />
            <rect x="20" y="11.8" width="8" height="3" rx="1.4" fill="#e04f5f" stroke={INK} strokeWidth="1.1" />
          </svg>
        );

      case 'mangosteen':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Mangosteen, whole and split open to show the white segments */}
            <ellipse cx="17" cy="22.5" rx="12.5" ry="11.8" fill="#5a2350" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="11" cy="21" rx="1.8" ry="3.4" fill="#ffffff" opacity="0.3" />
            <path d="M 17 12 C 15.1 10.9 14.9 8.1 17 7.5 C 19.1 8.1 18.9 10.9 17 12 Z" fill="#7a9a3c" stroke={INK} strokeWidth="1" />
            <Limb d="M 17 9.5 L 18 4.5" color="#6b7a2e" w={3} />
            <path d="M 17 11.7 C 13.5 9.3 9 10.1 9.5 12.7 C 10.1 15.1 14.1 14.9 17 12.9 Z" fill="#86a843" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 17 11.7 C 20.5 9.3 25 10.1 24.5 12.7 C 23.9 15.1 19.9 14.9 17 12.9 Z" fill="#86a843" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 17 12.1 C 14.5 13.7 14.5 17.5 17 18.1 C 19.5 17.5 19.5 13.7 17 12.1 Z" fill="#86a843" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            {/* Opened half */}
            <path d="M 21.5 34 A 11.5 7 0 0 1 44.5 34 C 44.5 41 39 45 33 45 C 27 45 21.5 41 21.5 34 Z" fill="#4a1c40" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <ellipse cx="33" cy="34" rx="11.5" ry="7" fill="#b8456a" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="33" cy="34.2" rx="7" ry="4.2" fill="#fdfaf2" stroke={INK} strokeWidth="1.1" />
            <path d="M 33 34.2 L 33 30 M 33 34.2 L 39.4 32.6 M 33 34.2 L 37.5 38 M 33 34.2 L 28.2 37.8 M 33 34.2 L 26.6 32.4" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        );

      case 'noodle-bowl':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thai boat noodles with chopsticks and a spoon */}
            <path className="paint" d="M 22 13 Q 20 10 22 7 M 28 13 Q 30 10 28 6" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 17 37.6 L 31 37.6 L 32 41.5 L 16 41.5 Z" fill="#a83a24" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 6.5 22 C 6.5 32 13.5 38.5 24 38.5 C 34.5 38.5 41.5 32 41.5 22 Z" fill="#c84b31" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <path className="paint" d="M 7.4 26 C 10 30.5 17 33 24 33 C 31 33 38 30.5 40.6 26" stroke="#f5d78a" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="24" cy="22" rx="17.5" ry="5.6" fill="#f7efe0" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="24" cy="22.5" rx="15" ry="4.3" fill="#6b3a1e" stroke={INK} strokeWidth="1" />
            <Limb d="M 13 22.4 L 6.5 9" color="#b8bcc2" w={3.4} />
            <ellipse cx="14.4" cy="24.2" rx="3.4" ry="2" transform="rotate(-20 14.4 24.2)" fill="#b8bcc2" stroke={INK} strokeWidth="1.1" />
            <path className="paint" d="M 12.5 23.4 C 14.5 21.6 16.5 25 18.5 23 C 20.5 21.2 22.5 25 24.5 23.3 M 16 25.4 C 18 24 20 26.6 22 25.2" stroke="#f3dfa3" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="29.5" cy="23" r="2.5" fill="#a0714e" stroke={INK} strokeWidth="1" />
            <circle cx="33.6" cy="24.2" r="1.9" fill="#a0714e" stroke={INK} strokeWidth="1" />
            <path d="M 25 24.6 Q 27 23 28.6 25 Q 26.6 26.2 25 24.6 Z M 35 22 Q 37 20.6 38.2 22.4 Q 36.4 23.4 35 22 Z" fill="#64b043" stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
            <Limb d="M 2.5 21 L 45.5 17.6 M 3 23.2 L 45.5 20.2" color="#c48a4a" w={2.8} />
          </svg>
        );

      case 'mortar-pestle':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Krok: clay som tam mortar with pestle, green papaya, chili and lime */}
            <path d="M 14 38.6 L 28 38.6 L 29.5 42.8 L 12.5 42.8 Z" fill="#a9542c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 8.5 18 C 9.5 27 13 34 15 39 L 27 39 C 29 34 32.5 27 33.5 18 Z" fill="#c56a3c" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 10.3 25 C 17 27 25 27 31.7 25 M 12.6 32 C 18 33.6 24 33.6 29.4 32" stroke="#8e4523" strokeWidth="1.1" strokeLinecap="round" />
            <ellipse cx="21" cy="18" rx="12.8" ry="4" fill="#d98a5c" stroke={INK} strokeWidth="1.7" />
            <ellipse cx="21" cy="18.2" rx="10" ry="2.8" fill="#5e2a12" />
            <Limb d="M 22 16 L 36.5 4.5" color="#b98149" w={4.6} />
            <path d="M 12 18.6 C 12 14 16 11 20 12.5 C 23 10 28.5 11.5 30 15 C 31.5 16 31 18 30 18.8 C 24 20.6 17 20.6 12 18.6 Z" fill="#bfe07e" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 14.5 16.5 C 17 14.5 19 15.5 21 14 M 19.5 18 C 22 16 25 17 27.5 15 M 24 13.5 C 26 13 27.5 14 28.5 16.2" stroke="#7fae3e" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 16.5 14.5 C 14 12 11 9 8 8.5 C 8.5 10.5 11.5 14 15 16 Z" fill="#e0302b" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path className="paint" d="M 16 15.2 L 18.4 13.4" stroke="#4f8a2e" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 29 43.5 A 6.5 6.5 0 0 1 42 43.5 Z" fill="#5db039" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M 30.6 43.5 A 4.9 4.9 0 0 1 40.4 43.5 Z" fill="#d5ee8f" />
            <path d="M 35.5 43.5 L 32.2 40.2 M 35.5 43.5 L 35.5 38.9 M 35.5 43.5 L 38.8 40.2" stroke="#8fbf4a" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
        );

      case 'abacus':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chinese abacus (suanpan): two beads above the beam, four below; see-through frame */}
            <path d="M 10.8 9.6 V 38.4 M 17.4 9.6 V 38.4 M 24 9.6 V 38.4 M 30.6 9.6 V 38.4 M 37.2 9.6 V 38.4" stroke={INK} strokeWidth="1.1" />
            <rect x="4" y="7" width="3.2" height="34" fill="#8f5a2e" stroke={INK} strokeWidth="1.4" />
            <rect x="40.8" y="7" width="3.2" height="34" fill="#8f5a2e" stroke={INK} strokeWidth="1.4" />
            <rect x="2.5" y="6" width="43" height="3.6" rx="1.6" fill="#a8693a" stroke={INK} strokeWidth="1.6" />
            <rect x="2.5" y="38.4" width="43" height="3.6" rx="1.6" fill="#a8693a" stroke={INK} strokeWidth="1.6" />
            <rect x="7.2" y="18" width="33.6" height="3" fill="#a8693a" stroke={INK} strokeWidth="1.1" />
            <path
              d="M 8.3 11.1 L 9.7 9.5 L 11.9 9.5 L 13.3 11.1 L 11.9 12.7 L 9.7 12.7 Z M 8.3 14.3 L 9.7 12.7 L 11.9 12.7 L 13.3 14.3 L 11.9 15.9 L 9.7 15.9 Z M 8.3 22.6 L 9.7 21 L 11.9 21 L 13.3 22.6 L 11.9 24.2 L 9.7 24.2 Z M 8.3 25.8 L 9.7 24.2 L 11.9 24.2 L 13.3 25.8 L 11.9 27.4 L 9.7 27.4 Z M 8.3 33.7 L 9.7 32.1 L 11.9 32.1 L 13.3 33.7 L 11.9 35.3 L 9.7 35.3 Z M 8.3 36.9 L 9.7 35.3 L 11.9 35.3 L 13.3 36.9 L 11.9 38.5 L 9.7 38.5 Z M 14.9 11.1 L 16.3 9.5 L 18.5 9.5 L 19.9 11.1 L 18.5 12.7 L 16.3 12.7 Z M 14.9 16.4 L 16.3 14.8 L 18.5 14.8 L 19.9 16.4 L 18.5 18 L 16.3 18 Z M 14.9 27.3 L 16.3 25.7 L 18.5 25.7 L 19.9 27.3 L 18.5 28.9 L 16.3 28.9 Z M 14.9 30.5 L 16.3 28.9 L 18.5 28.9 L 19.9 30.5 L 18.5 32.1 L 16.3 32.1 Z M 14.9 33.7 L 16.3 32.1 L 18.5 32.1 L 19.9 33.7 L 18.5 35.3 L 16.3 35.3 Z M 14.9 36.9 L 16.3 35.3 L 18.5 35.3 L 19.9 36.9 L 18.5 38.5 L 16.3 38.5 Z M 21.5 13.2 L 22.9 11.6 L 25.1 11.6 L 26.5 13.2 L 25.1 14.8 L 22.9 14.8 Z M 21.5 16.4 L 22.9 14.8 L 25.1 14.8 L 26.5 16.4 L 25.1 18 L 22.9 18 Z M 21.5 22.6 L 22.9 21 L 25.1 21 L 26.5 22.6 L 25.1 24.2 L 22.9 24.2 Z M 21.5 25.8 L 22.9 24.2 L 25.1 24.2 L 26.5 25.8 L 25.1 27.4 L 22.9 27.4 Z M 21.5 29 L 22.9 27.4 L 25.1 27.4 L 26.5 29 L 25.1 30.6 L 22.9 30.6 Z M 21.5 36.9 L 22.9 35.3 L 25.1 35.3 L 26.5 36.9 L 25.1 38.5 L 22.9 38.5 Z M 28.1 11.1 L 29.5 9.5 L 31.7 9.5 L 33.1 11.1 L 31.7 12.7 L 29.5 12.7 Z M 28.1 14.3 L 29.5 12.7 L 31.7 12.7 L 33.1 14.3 L 31.7 15.9 L 29.5 15.9 Z M 28.1 22.6 L 29.5 21 L 31.7 21 L 33.1 22.6 L 31.7 24.2 L 29.5 24.2 Z M 28.1 30.5 L 29.5 28.9 L 31.7 28.9 L 33.1 30.5 L 31.7 32.1 L 29.5 32.1 Z M 28.1 33.7 L 29.5 32.1 L 31.7 32.1 L 33.1 33.7 L 31.7 35.3 L 29.5 35.3 Z M 28.1 36.9 L 29.5 35.3 L 31.7 35.3 L 33.1 36.9 L 31.7 38.5 L 29.5 38.5 Z M 34.7 11.1 L 36.1 9.5 L 38.3 9.5 L 39.7 11.1 L 38.3 12.7 L 36.1 12.7 Z M 34.7 16.4 L 36.1 14.8 L 38.3 14.8 L 39.7 16.4 L 38.3 18 L 36.1 18 Z M 34.7 22.6 L 36.1 21 L 38.3 21 L 39.7 22.6 L 38.3 24.2 L 36.1 24.2 Z M 34.7 25.8 L 36.1 24.2 L 38.3 24.2 L 39.7 25.8 L 38.3 27.4 L 36.1 27.4 Z M 34.7 29 L 36.1 27.4 L 38.3 27.4 L 39.7 29 L 38.3 30.6 L 36.1 30.6 Z M 34.7 32.2 L 36.1 30.6 L 38.3 30.6 L 39.7 32.2 L 38.3 33.8 L 36.1 33.8 Z"
              fill="#c8402c"
              stroke={INK}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'palm-leaf-book':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bai lan: palm-leaf manuscript fanned open on its cord, between lacquered cover boards */}
            <g transform="translate(9 32)">
              <rect x="-3" y="4.6" width="40" height="4.2" rx="1.6" fill="#9e2a1c" stroke={INK} strokeWidth="1.5" />
              <rect x="-2" y="-1" width="38.5" height="6.2" fill="#e9bd4f" stroke={INK} strokeWidth="1.2" />
              <path d="M -1.5 1 H 36 M -1.5 3 H 36" stroke="#a87a22" strokeWidth="0.8" />
              <g transform="rotate(-12)">
                <rect x="-2.5" y="-6.4" width="39.5" height="5.4" rx="2.6" fill="#f1dfae" stroke={INK} strokeWidth="1.2" />
                <path d="M 4 -3.6 Q 5 -4.9 6 -3.6 T 8 -3.6 T 10 -3.6 T 12 -3.6 T 14 -3.6 T 16 -3.6 T 18 -3.6 T 20 -3.6 T 22 -3.6 T 24 -3.6 T 26 -3.6 T 28 -3.6" stroke={INK} strokeWidth="0.75" />
              </g>
              <g transform="rotate(-24)">
                <rect x="-2.5" y="-6.4" width="39.5" height="5.4" rx="2.6" fill="#f1dfae" stroke={INK} strokeWidth="1.2" />
                <path d="M 4 -3.6 Q 5 -4.9 6 -3.6 T 8 -3.6 T 10 -3.6 T 12 -3.6 T 14 -3.6 T 16 -3.6 T 18 -3.6 T 20 -3.6 T 22 -3.6 T 24 -3.6 T 26 -3.6 T 28 -3.6" stroke={INK} strokeWidth="0.75" />
              </g>
              <g transform="rotate(-36)">
                <rect x="-3" y="-7" width="40" height="6" rx="2" fill="#b3301f" stroke={INK} strokeWidth="1.5" />
                <rect className="paint" x="-0.8" y="-5.4" width="35.6" height="2.8" rx="0.8" stroke="#edc35a" strokeWidth="0.9" />
                <path d="M 19 -5.6 L 21.6 -4 L 19 -2.4 L 16.4 -4 Z" fill="#edc35a" stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
              </g>
            </g>
            <Limb d="M 9 32 C 5 34 3.6 37 4.6 40.4" color="#f0c040" w={2.4} />
            <circle cx="9" cy="32" r="1.9" fill="#f0c040" stroke={INK} strokeWidth="1" />
            <path d="M 3 40 L 6.4 40 L 7.4 45 L 2 45 Z" fill="#e0a020" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 4.2 41.4 L 4 44.4 M 5.4 41.4 L 5.8 44.4" stroke="#a8741a" strokeWidth="0.7" />
          </svg>
        );

      case 'kratip':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Kratip: Lanna woven sticky-rice basket on its little stand */}
            <path className="paint" d="M 12.5 25 C 8 12 18 2.5 30 4 C 40 5.5 41 17 35.5 25" stroke="#7a4b2a" strokeWidth="1.6" strokeLinecap="round" />
            <Limb d="M 15.5 40 L 13.5 45 M 32.5 40 L 34.5 45" color="#8a5a2b" w={2.8} />
            <Limb d="M 21.5 40.5 L 21 44.6 M 26.5 40.5 L 27 44.6" color="#8a5a2b" w={2.6} />
            <rect x="13.5" y="38" width="21" height="2.8" rx="1.2" fill="#a8743a" stroke={INK} strokeWidth="1.3" />
            <path d="M 13 21 C 11 27 11 33 13.5 38.5 L 34.5 38.5 C 37 33 37 27 35 21 Z" fill="#dcb46a" stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
            <path
              d="M 13.2 26.4 L 15.4 23.6 L 17.5 26.4 L 19.7 23.6 L 21.8 26.4 L 24 23.6 L 26.2 26.4 L 28.3 23.6 L 30.5 26.4 L 32.6 23.6 L 34.8 26.4 M 12.4 31.4 L 14.7 28.6 L 17 31.4 L 19.4 28.6 L 21.7 31.4 L 24 28.6 L 26.3 31.4 L 28.6 28.6 L 31 31.4 L 33.3 28.6 L 35.6 31.4 M 13.2 36.4 L 15.4 33.6 L 17.5 36.4 L 19.7 33.6 L 21.8 36.4 L 24 33.6 L 26.2 36.4 L 28.3 33.6 L 30.5 36.4 L 32.6 33.6 L 34.8 36.4"
              stroke="#a27536"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <circle cx="12.5" cy="25" r="1.4" fill="#8a5a2b" stroke={INK} strokeWidth="1" />
            <circle cx="35.5" cy="25" r="1.4" fill="#8a5a2b" stroke={INK} strokeWidth="1" />
            <path d="M 12.5 19 C 12.5 12.5 17.5 9 24 9 C 30.5 9 35.5 12.5 35.5 19 Z" fill="#e2bf74" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 18 18.5 C 18 14 20.5 11 24 10 M 30 18.5 C 30 14 27.5 11 24 10 M 24 10 V 18.5" stroke="#a27536" strokeWidth="0.9" strokeLinecap="round" />
            <rect x="11" y="18.2" width="26" height="4" rx="2" fill="#c99a4e" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="24" cy="8.6" rx="2.2" ry="1.4" fill="#b07f3a" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'treasure-map':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Old folded treasure map: river, islands, dotted trail to the red X */}
            <path
              d="M 5 9 L 12 8 L 14 9.5 L 22 7.5 L 30 8.5 L 33 7 L 37.6 7.6 L 43.2 13 L 44 18 L 43 26 L 44.5 33 L 42 40 L 33 41.5 L 30 40 L 22 42 L 15 40.5 L 6 41.5 L 6.5 34 L 4.5 30 L 5.5 22 L 4 16 Z"
              fill="#f0d9a4"
              stroke={INK}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M 24 7.8 C 23.8 20 24.2 30 23.8 41.6 M 4.8 24.5 C 18 24.2 30 24.8 43.6 24.5" stroke="#c6a25c" strokeWidth="1" strokeLinecap="round" />
            <path d="M 27 12 C 31 10.5 36 11.5 37 15.5 C 37.8 19.5 33.5 21 29.5 20 C 26 19 24.8 14 27 12 Z" fill="#8cbf5a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 8 30 C 12 27 19 28.5 19.5 33 C 20 37.5 13 39 9.5 37.5 C 7 36 6.5 32 8 30 Z" fill="#8cbf5a" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <Limb d="M 6 20.5 C 11 18.5 14 23.5 19 22.5 C 24 21.5 26 27 30 28.5 C 34 30 38 27.5 43.4 29.6" color="#3a86c8" w={3} />
            <path d="M 16 33 C 20 29.5 24 37 28 34.5 C 29.5 33.6 30.6 34 31.6 34.4" stroke={INK} strokeWidth="1.1" strokeDasharray="1.4 1.6" strokeLinecap="round" />
            <Limb d="M 32.5 31.5 L 38 37 M 38 31.5 L 32.5 37" color="#d42a2a" w={3.6} />
            <path d="M 37.6 7.6 L 43.2 13 L 38.2 13.4 Z" fill="#dcc085" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="11" cy="14" r="2.8" stroke={INK} strokeWidth="0.7" />
            <polygon points="11,9.8 11.9,13.1 15.2,14 11.9,14.9 11,18.2 10.1,14.9 6.8,14 10.1,13.1" fill="#7a4a1e" stroke={INK} strokeWidth="0.5" strokeLinejoin="round" />
            <polygon points="11,9.8 11.9,13.1 10.1,13.1" fill="#d42a2a" />
          </svg>
        );

      case 'nghe':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Con Nghe - Sacred Temple Lion-Dog */}
            <path d="M 28 38 C 34 38 38 34 38 28 C 38 22 34 20 28 20 C 24 20 20 22 18 26 C 16 30 18 36 22 38 Z" fill="#d97736" stroke={INK} strokeWidth="1.8" />
            <circle cx="20" cy="18" r="8" fill="#d97736" stroke={INK} strokeWidth="1.8" />
            <path d="M 14 12 C 12 8 16 6 18 10 Z" fill="#b45309" stroke={INK} strokeWidth="1.4" />
            <path d="M 24 12 C 26 8 22 6 20 10 Z" fill="#b45309" stroke={INK} strokeWidth="1.4" />
            <path d="M 16 19 Q 20 22 24 19 Q 20 16 16 19" fill="#faf5eb" stroke={INK} strokeWidth="1.2" />
            <g className="eye">
              <circle className="pupil" cx="17.5" cy="16.5" r="1.5" fill="#1c1917" />
              <circle cx="17.8" cy="16" r="0.5" fill="#fff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="22.5" cy="16.5" r="1.5" fill="#1c1917" />
              <circle cx="22.8" cy="16" r="0.5" fill="#fff" />
            </g>
            <ellipse cx="20" cy="18" rx="2" ry="1.4" fill="#991b1b" />
            <g className="tail">
              <path d="M 36 34 C 42 32 44 26 40 22 C 38 24 38 28 34 30" fill="#b45309" stroke={INK} strokeWidth="1.6" />
            </g>
            <ellipse cx="18" cy="39" rx="3" ry="2" fill="#faf5eb" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="28" cy="39" rx="3.5" ry="2.2" fill="#faf5eb" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'red-crowned-crane':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Seu Dau Do - Red-crowned Crane */}
            <path d="M 20 30 C 26 28 34 32 36 38 C 30 40 22 38 18 34 Z" fill="#fafafa" stroke={INK} strokeWidth="1.6" />
            <path d="M 32 35 C 36 35 42 38 42 41 C 36 41 32 38 30 36 Z" fill="#1c1917" />
            <path d="M 18 32 C 16 26 18 16 16 10" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 18 32 C 16 26 18 16 16 10" stroke="#fafafa" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="9" r="3.5" fill="#fafafa" stroke={INK} strokeWidth="1.4" />
            <circle cx="15" cy="7.5" r="1.8" fill="#dc2626" />
            <path d="M 13 9 L 6 10 L 13 11 Z" fill="#ca8a04" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <g className="eye">
              <circle className="pupil" cx="15.5" cy="9" r="0.8" fill="#1c1917" />
            </g>
            <Limb d="M 22 36 L 20 45" color="#57534e" w={2} />
            <Limb d="M 27 36 L 27 45" color="#57534e" w={2} />
          </svg>
        );

      case 'dong-ho-pig':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Lon Dong Ho - Folk Yin-Yang Pig */}
            <ellipse cx="24" cy="28" rx="14" ry="10" fill="#fde047" stroke={INK} strokeWidth="1.8" />
            <circle cx="24" cy="27" r="4.5" fill="#ca8a04" stroke={INK} strokeWidth="1" />
            <path d="M 24 22.5 C 26.5 22.5 26.5 27 24 27 C 21.5 27 21.5 31.5 24 31.5" stroke={INK} strokeWidth="1" fill="none" />
            <circle cx="12" cy="25" r="7" fill="#fde047" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="7.5" cy="26" rx="3" ry="4" fill="#facc15" stroke={INK} strokeWidth="1.4" />
            <circle cx="7" cy="25" r="0.8" fill="#1c1917" />
            <circle cx="7" cy="27" r="0.8" fill="#1c1917" />
            <g className="eye">
              <circle className="pupil" cx="12" cy="23" r="1.2" fill="#1c1917" />
            </g>
            <path d="M 12 19 C 10 14 14 14 15 18 Z" fill="#eab308" stroke={INK} strokeWidth="1.4" />
            <g className="tail">
              <path d="M 38 27 Q 43 24 41 21 Q 39 19 42 17" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </g>
            <rect x="16" y="36" width="3.5" height="5" rx="1.5" fill="#eab308" stroke={INK} strokeWidth="1.4" />
            <rect x="28" y="36" width="3.5" height="5" rx="1.5" fill="#eab308" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'bamboo-dragonfly':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chuon Chuon Tre - Balancing Bamboo Dragonfly */}
            <path d="M 24 8 C 23 8 23 38 24 42 C 25 38 25 8 24 8 Z" fill="#eab308" stroke={INK} strokeWidth="1.6" />
            <path d="M 24 16 C 14 10 6 16 8 20 C 14 20 20 18 24 17 Z" fill="#ef4444" stroke={INK} strokeWidth="1.4" />
            <path d="M 24 16 C 34 10 42 16 40 20 C 34 20 28 18 24 17 Z" fill="#ef4444" stroke={INK} strokeWidth="1.4" />
            <path d="M 24 20 C 15 18 9 24 11 27 C 16 26 21 23 24 21 Z" fill="#3b82f6" stroke={INK} strokeWidth="1.2" />
            <path d="M 24 20 C 33 18 39 24 37 27 C 32 26 27 23 24 21 Z" fill="#3b82f6" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="24" cy="8" rx="2.5" ry="3" fill="#ca8a04" stroke={INK} strokeWidth="1.4" />
            <circle cx="24" cy="6" r="1" fill="#1c1917" />
          </svg>
        );

      case 'black-carp':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ca Chep Den - Black Carp */}
            <path d="M 8 24 C 14 14 28 14 36 20 C 40 24 38 28 34 30 C 26 34 14 32 8 24 Z" fill="#334155" stroke={INK} strokeWidth="1.8" />
            <path d="M 36 22 Q 44 14 44 24 Q 44 34 36 28 Z" fill="#1e293b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 18 16 Q 24 10 28 16" fill="#1e293b" stroke={INK} strokeWidth="1.4" />
            <path d="M 18 28 Q 22 34 26 30" fill="#1e293b" stroke={INK} strokeWidth="1.4" />
            <g className="eye">
              <circle cx="12" cy="22" r="2.5" fill="#facc15" stroke={INK} strokeWidth="1" />
              <circle className="pupil" cx="12" cy="22" r="1.4" fill="#0f172a" />
            </g>
            <path d="M 8 26 Q 5 28 4 30" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 20 20 Q 24 24 20 28 M 25 19 Q 29 23 25 27 M 30 20 Q 34 24 30 27" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'giant-water-bug':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ca Cuong - Giant Water Bug */}
            <ellipse cx="24" cy="26" rx="11" ry="15" fill="#4d7c0f" stroke={INK} strokeWidth="1.8" />
            <path d="M 14 22 L 24 32 L 34 22" stroke={INK} strokeWidth="1.6" fill="none" />
            <circle cx="24" cy="11" r="5" fill="#365314" stroke={INK} strokeWidth="1.6" />
            <g className="eye">
              <circle className="pupil" cx="21" cy="10" r="1.5" fill="#1c1917" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="27" cy="10" r="1.5" fill="#1c1917" />
            </g>
            <path d="M 20 12 C 16 6 12 10 14 14" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 28 12 C 32 6 36 10 34 14" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
            <Limb d="M 14 26 L 6 30" color="#365314" w={2.4} />
            <Limb d="M 34 26 L 42 30" color="#365314" w={2.4} />
            <Limb d="M 16 34 L 8 40" color="#365314" w={2.4} />
            <Limb d="M 32 34 L 40 40" color="#365314" w={2.4} />
          </svg>
        );

      case 'green-peafowl':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cong Ma Vang - Green Peafowl */}
            <path d="M 18 28 C 22 24 30 26 34 32 C 30 38 22 36 18 32 Z" fill="#059669" stroke={INK} strokeWidth="1.6" />
            <path d="M 28 30 C 36 28 44 34 44 42 C 36 42 30 38 28 34 Z" fill="#0d9488" stroke={INK} strokeWidth="1.4" />
            <path d="M 18 28 C 16 22 18 14 16 10" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 18 28 C 16 22 18 14 16 10" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="9" r="3.5" fill="#059669" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="16" cy="9.5" rx="1.5" ry="1" fill="#facc15" />
            <path d="M 13 9 L 8 10 L 13 11 Z" fill="#ca8a04" stroke={INK} strokeWidth="1" />
            <path d="M 15 6 L 14 3 M 16 6 L 16 2 M 17 6 L 18 3" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="14" cy="2.5" r="0.8" fill="#0d9488" />
            <circle cx="16" cy="1.5" r="0.8" fill="#0d9488" />
            <circle cx="18" cy="2.5" r="0.8" fill="#0d9488" />
            <g className="eye">
              <circle className="pupil" cx="15" cy="8.5" r="0.8" fill="#1c1917" />
            </g>
            <Limb d="M 22 35 L 20 44" color="#78716c" w={2} />
            <Limb d="M 26 35 L 26 44" color="#78716c" w={2} />
          </svg>
        );

      case 'pygmy-loris':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cu Li Lun - Pygmy Loris */}
            <circle cx="24" cy="22" r="11" fill="#b45309" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="26" rx="6" ry="5" fill="#fef3c7" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="24" cy="24" rx="2" ry="1.4" fill="#78350f" />
            <g className="eye">
              <circle cx="18" cy="20" r="4.5" fill="#f59e0b" stroke={INK} strokeWidth="1.5" />
              <circle className="pupil" cx="18" cy="20" r="2.6" fill="#1c1917" />
              <circle cx="17.2" cy="19" r="0.8" fill="#fff" />
            </g>
            <g className="eye">
              <circle cx="30" cy="20" r="4.5" fill="#f59e0b" stroke={INK} strokeWidth="1.5" />
              <circle className="pupil" cx="30" cy="20" r="2.6" fill="#1c1917" />
              <circle cx="29.2" cy="19" r="0.8" fill="#fff" />
            </g>
            <circle cx="13" cy="15" r="2.5" fill="#b45309" stroke={INK} strokeWidth="1.4" />
            <circle cx="35" cy="15" r="2.5" fill="#b45309" stroke={INK} strokeWidth="1.4" />
            <path d="M 14 36 C 18 32 30 32 34 36" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="18" cy="37" rx="3" ry="2" fill="#fef3c7" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="30" cy="37" rx="3" ry="2" fill="#fef3c7" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'gray-shanked-douc':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vooc Cha Va Chan Xam - Gray-shanked Douc */}
            <circle cx="24" cy="18" r="9" fill="#ea580c" stroke={INK} strokeWidth="1.8" />
            <path d="M 15 18 C 12 24 16 28 24 28 C 32 28 36 24 33 18 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.4" />
            <g className="eye">
              <circle className="pupil" cx="20" cy="17" r="1.5" fill="#1c1917" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="28" cy="17" r="1.5" fill="#1c1917" />
            </g>
            <ellipse cx="24" cy="21" rx="2" ry="1.4" fill="#1c1917" />
            <path d="M 18 28 C 14 32 14 42 24 42 C 34 42 34 32 30 28 Z" fill="#64748b" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="35" rx="5" ry="6" fill="#f8fafc" />
            <g className="tail">
              <path d="M 28 40 Q 42 42 40 26" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 28 40 Q 42 42 40 26" stroke="#f8fafc" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'binturong':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cay Muc - Binturong */}
            <ellipse cx="22" cy="28" rx="13" ry="9" fill="#1e293b" stroke={INK} strokeWidth="1.8" />
            <circle cx="14" cy="20" r="6.5" fill="#1e293b" stroke={INK} strokeWidth="1.8" />
            <path d="M 9 16 L 7 13 M 19 16 L 21 13" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="11" cy="22" rx="2.5" ry="2" fill="#f8fafc" stroke={INK} strokeWidth="1" />
            <circle cx="10" cy="21.5" r="1" fill="#0f172a" />
            <g className="eye">
              <circle className="pupil" cx="15" cy="19" r="1.2" fill="#f59e0b" />
            </g>
            <g className="tail">
              <path d="M 34 26 C 44 26 46 38 38 40 C 34 41 32 36 36 34" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 34 26 C 44 26 46 38 38 40 C 34 41 32 36 36 34" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </g>
            <rect x="16" y="35" width="4" height="5" rx="2" fill="#0f172a" stroke={INK} strokeWidth="1.2" />
            <rect x="26" y="35" width="4" height="5" rx="2" fill="#0f172a" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'indochinese-tiger':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ho Dong Duong - Indochinese Tiger */}
            <ellipse cx="26" cy="28" rx="14" ry="10" fill="#ea580c" stroke={INK} strokeWidth="1.8" />
            <circle cx="16" cy="20" r="8" fill="#ea580c" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="16" cy="23" rx="4.5" ry="3.5" fill="#fff7ed" stroke={INK} strokeWidth="1" />
            <path d="M 14 22 L 18 22 L 16 24 Z" fill="#991b1b" />
            <g className="eye">
              <circle className="pupil" cx="13" cy="18" r="1.4" fill="#1c1917" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="19" cy="18" r="1.4" fill="#1c1917" />
            </g>
            <path d="M 16 13 L 16 16 M 13 14 L 14 16 M 19 14 L 18 16" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 24 20 L 23 26 M 28 19 L 27 25 M 33 21 L 32 27" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="10" cy="14" r="2" fill="#ea580c" stroke={INK} strokeWidth="1.4" />
            <circle cx="22" cy="14" r="2" fill="#ea580c" stroke={INK} strokeWidth="1.4" />
            <g className="tail">
              <path d="M 38 27 Q 45 23 43 16" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M 38 27 Q 45 23 43 16" stroke="#ea580c" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>
            <rect x="20" y="36" width="3.5" height="5" rx="1.5" fill="#fff7ed" stroke={INK} strokeWidth="1.4" />
            <rect x="30" y="36" width="3.5" height="5" rx="1.5" fill="#fff7ed" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'white-cheeked-gibbon':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Vuon Den Ma Trang - White-cheeked Gibbon */}
            <circle cx="24" cy="20" r="8" fill="#0f172a" stroke={INK} strokeWidth="1.8" />
            <path d="M 16 20 C 14 25 18 26 21 24" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 32 20 C 34 25 30 26 27 24" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <g className="eye">
              <circle className="pupil" cx="21" cy="18" r="1.2" fill="#f59e0b" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="27" cy="18" r="1.2" fill="#f59e0b" />
            </g>
            <ellipse cx="24" cy="22" rx="2" ry="1.4" fill="#334155" />
            <ellipse cx="24" cy="34" rx="8" ry="9" fill="#0f172a" stroke={INK} strokeWidth="1.8" />
            <Limb d="M 17 28 C 10 32 8 20 6 12" color="#0f172a" w={3.2} />
            <Limb d="M 31 28 C 38 32 40 20 42 12" color="#0f172a" w={3.2} />
          </svg>
        );

      case 'flying-squirrel':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Soc Bay - Flying Squirrel */}
            <path d="M 12 16 L 36 16 L 40 36 L 8 36 Z" fill="#fef3c7" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="24" cy="24" rx="7" ry="10" fill="#9a3412" stroke={INK} strokeWidth="1.6" />
            <circle cx="24" cy="14" r="6" fill="#9a3412" stroke={INK} strokeWidth="1.6" />
            <g className="eye">
              <circle className="pupil" cx="21" cy="13" r="1.8" fill="#1c1917" />
              <circle cx="20.5" cy="12.5" r="0.6" fill="#fff" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="27" cy="13" r="1.8" fill="#1c1917" />
              <circle cx="26.5" cy="12.5" r="0.6" fill="#fff" />
            </g>
            <polygon points="19,8 21,12 18,12" fill="#9a3412" stroke={INK} strokeWidth="1" />
            <polygon points="29,8 27,12 30,12" fill="#9a3412" stroke={INK} strokeWidth="1" />
            <path d="M 24 34 C 28 38 28 44 24 45 C 20 44 20 38 24 34 Z" fill="#7c2d12" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'treeshrew':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Doi Chuot Rung - Treeshrew */}
            <ellipse cx="24" cy="28" rx="11" ry="7" fill="#78350f" stroke={INK} strokeWidth="1.6" />
            <path d="M 14 26 L 6 27 L 13 22 Z" fill="#78350f" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="6" cy="27" r="0.8" fill="#1c1917" />
            <g className="eye">
              <circle className="pupil" cx="12" cy="24" r="1.5" fill="#1c1917" />
              <circle cx="11.5" cy="23.5" r="0.5" fill="#fff" />
            </g>
            <circle cx="16" cy="21" r="2" fill="#9a3412" stroke={INK} strokeWidth="1" />
            <g className="tail">
              <path d="M 34 27 Q 44 26 42 32" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 34 27 Q 44 26 42 32" stroke="#9a3412" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>
            <ellipse cx="18" cy="35" rx="2.5" ry="1.5" fill="#fed7aa" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="28" cy="35" rx="2.5" ry="1.5" fill="#fed7aa" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'water-rail':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Chim Trich Co - Water Rail */}
            <ellipse cx="26" cy="26" rx="11" ry="8" fill="#1d4ed8" stroke={INK} strokeWidth="1.6" />
            <circle cx="16" cy="18" r="6" fill="#1d4ed8" stroke={INK} strokeWidth="1.6" />
            <path d="M 18 14 C 15 13 13 14 11 16 L 4 19 L 11 20" fill="#dc2626" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <g className="eye">
              <circle className="pupil" cx="15" cy="17" r="1" fill="#fff" />
              <circle cx="15" cy="17" r="0.6" fill="#1c1917" />
            </g>
            <path d="M 26 22 Q 36 22 36 28 Q 28 32 26 22" fill="#15803d" stroke={INK} strokeWidth="1.2" />
            <Limb d="M 22 33 L 18 44" color="#dc2626" w={2} />
            <Limb d="M 28 33 L 26 44" color="#dc2626" w={2} />
          </svg>
        );

      case 'tiger-prawn':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Tom Su Nam Can - Tiger Prawn */}
            <path d="M 14 18 C 22 10 34 14 36 24 C 38 32 30 38 20 38 C 14 38 12 34 16 32" stroke={INK} strokeWidth="2" fill="none" />
            <path d="M 14 18 C 22 10 34 14 36 24 C 38 32 30 38 20 38 C 14 38 12 34 16 32" stroke="#fb923c" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 22 13 L 24 17 M 28 15 L 30 20 M 34 22 L 30 24 M 32 29 L 28 30 M 26 35 L 24 32" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="18" r="1.5" fill="#1c1917" />
            <path d="M 14 18 L 6 12 M 14 18 L 4 16" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 16 32 L 10 38 L 8 32 Z" fill="#ea580c" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'climbing-perch':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ca Ro Dong - Climbing Perch */}
            <path d="M 8 24 C 14 16 28 16 36 20 C 40 24 38 28 34 30 C 26 32 14 30 8 24 Z" fill="#4d7c0f" stroke={INK} strokeWidth="1.8" />
            <path d="M 16 16 L 18 12 L 22 16 L 24 12 L 28 16 L 30 13 L 34 18" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" fill="#365314" />
            <path d="M 34 22 Q 42 18 42 24 Q 42 30 34 26 Z" fill="#365314" stroke={INK} strokeWidth="1.4" />
            <g className="eye">
              <circle cx="13" cy="22" r="2.5" fill="#facc15" stroke={INK} strokeWidth="1" />
              <circle className="pupil" cx="13" cy="22" r="1.4" fill="#0f172a" />
            </g>
            <path d="M 18 20 C 20 22 20 26 18 28" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      case 'giant-featherback':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ca That Lat - Featherback */}
            <path d="M 6 24 C 12 18 26 18 40 20 C 42 24 36 32 24 34 C 14 34 8 28 6 24 Z" fill="#94a3b8" stroke={INK} strokeWidth="1.6" />
            <path d="M 22 18 Q 23 14 24 18" stroke={INK} strokeWidth="1.5" fill="none" />
            <path d="M 14 33 Q 26 36 38 28" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <circle cx="22" cy="28" r="1.2" fill="#0f172a" />
            <circle cx="27" cy="27" r="1.2" fill="#0f172a" />
            <circle cx="32" cy="25" r="1.2" fill="#0f172a" />
            <g className="eye">
              <circle cx="10" cy="22" r="1.8" fill="#facc15" stroke={INK} strokeWidth="0.8" />
              <circle className="pupil" cx="10" cy="22" r="1" fill="#0f172a" />
            </g>
          </svg>
        );

      case 'mangrove-clam':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* So Huyet Ben Tre - Mangrove Clam */}
            <path d="M 24 38 C 12 38 8 26 14 18 C 18 12 30 12 34 18 C 40 26 36 38 24 38 Z" fill="#f5f5f4" stroke={INK} strokeWidth="1.8" />
            <path d="M 24 38 L 16 16 M 24 38 L 20 14 M 24 38 L 24 13 M 24 38 L 28 14 M 24 38 L 32 16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
            <ellipse cx="24" cy="37" rx="4" ry="2" fill="#991b1b" />
          </svg>
        );

      case 'pearl-oyster':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Trai Ngoc Phu Quoc - Pearl Oyster */}
            <path d="M 10 32 C 10 40 38 40 38 32 C 38 26 32 24 24 24 C 16 24 10 26 10 32 Z" fill="#e2e8f0" stroke={INK} strokeWidth="1.8" />
            <path d="M 12 28 C 12 16 36 16 36 28 Z" fill="#cbd5e1" stroke={INK} strokeWidth="1.8" />
            <circle className="glow-spot" cx="24" cy="30" r="5" fill="#fef08a" stroke={INK} strokeWidth="1.2" />
            <circle cx="22.5" cy="28.5" r="1.5" fill="#ffffff" />
          </svg>
        );

      case 'horned-owl':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Cu Vo Rung Thong - Horned Owl */}
            <ellipse cx="24" cy="28" rx="12" ry="13" fill="#451a03" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="30" rx="7" ry="8" fill="#fed7aa" stroke={INK} strokeWidth="1.2" />
            <path d="M 15 17 L 11 8 L 19 14 Z" fill="#451a03" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M 33 17 L 37 8 L 29 14 Z" fill="#451a03" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <g className="eye">
              <circle cx="18" cy="20" r="4.5" fill="#eab308" stroke={INK} strokeWidth="1.6" />
              <circle className="pupil" cx="18" cy="20" r="2.4" fill="#1c1917" />
              <circle cx="17.2" cy="19" r="0.8" fill="#fff" />
            </g>
            <g className="eye">
              <circle cx="30" cy="20" r="4.5" fill="#eab308" stroke={INK} strokeWidth="1.6" />
              <circle className="pupil" cx="30" cy="20" r="2.4" fill="#1c1917" />
              <circle cx="29.2" cy="19" r="0.8" fill="#fff" />
            </g>
            <polygon points="24,23 22,27 26,27" fill="#ea580c" />
          </svg>
        );

      case 'centipede':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ret Khong Lo - Giant Cave Centipede */}
            <path d="M 10 38 Q 24 16 38 10" stroke="#b91c1c" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 10 38 Q 24 16 38 10" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="10" r="3" fill="#7f1d1d" stroke={INK} strokeWidth="1.4" />
            <path d="M 39 8 L 44 4 M 40 10 L 45 8" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 12 36 L 8 40 M 14 32 L 10 36 M 18 28 L 13 31 M 22 24 L 17 26 M 26 20 L 22 21 M 30 16 L 27 16" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 16 38 L 19 42 M 19 33 L 23 37 M 23 28 L 28 31 M 27 23 L 32 25 M 31 18 L 36 19 M 35 14 L 40 14" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'silver-pheasant':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Ga Loi Trang - Silver Pheasant */}
            <ellipse cx="20" cy="28" rx="9" ry="8" fill="#1e293b" stroke={INK} strokeWidth="1.6" />
            <circle cx="14" cy="18" r="5.5" fill="#1e293b" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="13" cy="17" rx="3" ry="2.5" fill="#dc2626" />
            <g className="eye">
              <circle className="pupil" cx="13" cy="17" r="0.8" fill="#fff" />
            </g>
            <path d="M 10 18 L 5 19 L 10 20 Z" fill="#ca8a04" stroke={INK} strokeWidth="0.8" />
            <path d="M 26 26 C 36 24 44 28 44 38 C 36 34 28 32 24 30 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
            <path d="M 28 27 L 38 31 M 30 29 L 41 33 M 32 31 L 43 35" stroke="#334155" strokeWidth="1" strokeLinecap="round" />
            <Limb d="M 18 35 L 16 44" color="#dc2626" w={2} />
            <Limb d="M 23 35 L 22 44" color="#dc2626" w={2} />
          </svg>
        );

      case 'bamboo-rat':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Dui Moc Rung Nua - Bamboo Rat */}
            <ellipse cx="26" cy="28" rx="14" ry="10" fill="#71717a" stroke={INK} strokeWidth="1.8" />
            <circle cx="15" cy="25" r="7" fill="#71717a" stroke={INK} strokeWidth="1.8" />
            <circle cx="18" cy="19" r="2" fill="#e4e4e7" stroke={INK} strokeWidth="1" />
            <g className="eye">
              <circle className="pupil" cx="14" cy="23" r="1.2" fill="#1c1917" />
            </g>
            <circle cx="9" cy="26" r="1.2" fill="#1c1917" />
            <rect x="8" y="27.5" width="1.6" height="2.5" fill="#ea580c" stroke={INK} strokeWidth="0.6" />
            <rect x="10" y="27.5" width="1.6" height="2.5" fill="#ea580c" stroke={INK} strokeWidth="0.6" />
            <ellipse cx="20" cy="37" rx="3.5" ry="2" fill="#e4e4e7" stroke={INK} strokeWidth="1.2" />
            <ellipse cx="32" cy="37" rx="3.5" ry="2" fill="#e4e4e7" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'river-snail':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Oc Buou Dong - River Snail */}
            <ellipse cx="24" cy="26" rx="13" ry="11" fill="#365314" stroke={INK} strokeWidth="1.8" />
            <path d="M 24 15 C 32 15 35 24 31 31 C 27 37 18 36 15 31 C 12 26 16 20 22 20 C 27 20 28 25 25 28" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="31" cy="31" rx="4" ry="5" fill="#a16207" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'crane-statue':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Hac Ngu Lung Rua - Crane on Turtle */}
            <ellipse cx="24" cy="40" rx="11" ry="4.5" fill="#b45309" stroke={INK} strokeWidth="1.6" />
            <circle cx="14" cy="40" r="2" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <Limb d="M 22 36 L 22 26" color="#b45309" w={2.2} />
            <Limb d="M 26 36 L 26 26" color="#b45309" w={2.2} />
            <ellipse cx="24" cy="22" rx="6" ry="4.5" fill="#d97706" stroke={INK} strokeWidth="1.4" />
            <path d="M 21 20 C 19 14 21 8 20 5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <circle cx="19.5" cy="4.5" r="2" fill="#d97706" stroke={INK} strokeWidth="1" />
            <path d="M 18 4.5 L 12 5.5" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="11" cy="5.5" r="2" fill="#ec4899" stroke={INK} strokeWidth="0.8" />
          </svg>
        );

      case 'ly-dragon':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Rong Thoi Ly - Ly Dynasty Dragon */}
            <path d="M 8 36 Q 16 14 24 24 Q 32 34 40 12" stroke="#eab308" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M 8 36 Q 16 14 24 24 Q 32 34 40 12" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="12" r="5" fill="#ca8a04" stroke={INK} strokeWidth="1.6" />
            <path d="M 42 9 C 46 6 46 14 42 15" stroke={INK} strokeWidth="1.4" fill="#ef4444" />
            <circle cx="46" cy="15" r="1.8" fill="#fbbf24" stroke={INK} strokeWidth="1" />
            <g className="eye">
              <circle className="pupil" cx="39" cy="11" r="1" fill="#1c1917" />
            </g>
          </svg>
        );

      case 'hoan-kiem-sword':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thuan Thien Kiem - Magic Sword */}
            <path d="M 24 6 L 27 12 L 26 34 L 24 37 L 22 34 L 21 12 Z" fill="#38bdf8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <line x1="24" y1="8" x2="24" y2="34" stroke="#ffffff" strokeWidth="1" />
            <path d="M 17 34 C 20 32 28 32 31 34 L 29 37 L 19 37 Z" fill="#eab308" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <rect x="22.5" y="37" width="3" height="6" rx="1" fill="#b91c1c" stroke={INK} strokeWidth="1.2" />
            <circle cx="24" cy="44" r="2.5" fill="#eab308" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'star-lantern':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Den Ong Sao - Star Lantern */}
            <circle cx="24" cy="22" r="13" stroke="#ca8a04" strokeWidth="1.8" fill="none" />
            <polygon points="24,9 28,18 38,18 30,24 33,34 24,28 15,34 18,24 10,18 20,18" fill="#ef4444" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            <circle className="glow-spot" cx="24" cy="22" r="3.5" fill="#fef08a" stroke={INK} strokeWidth="1" />
            <Limb d="M 24 35 L 24 45" color="#ca8a04" w={2.2} />
          </svg>
        );

      case 'bamboo-flute':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Sao Truc - Bamboo Flute */}
            <rect x="8" y="22" width="32" height="4" rx="2" fill="#fef3c7" stroke={INK} strokeWidth="1.6" transform="rotate(-25 24 24)" />
            <circle cx="14" cy="29" r="1" fill="#1c1917" />
            <circle cx="18" cy="27" r="1" fill="#1c1917" />
            <circle cx="22" cy="25" r="1" fill="#1c1917" />
            <circle cx="26" cy="23" r="1" fill="#1c1917" />
            <circle cx="30" cy="21" r="1" fill="#1c1917" />
            <path d="M 38 18 Q 44 20 42 26" stroke="#dc2626" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        );

      case 'to-he':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* To He - Folk Dough Figurine */}
            <Limb d="M 24 26 L 24 45" color="#ca8a04" w={2} />
            <circle cx="24" cy="15" r="7" fill="#ec4899" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="24" cy="22" rx="5" ry="4" fill="#22c55e" stroke={INK} strokeWidth="1.4" />
            <circle cx="19" cy="11" r="2.5" fill="#eab308" stroke={INK} strokeWidth="1" />
            <circle cx="29" cy="11" r="2.5" fill="#eab308" stroke={INK} strokeWidth="1" />
            <circle cx="24" cy="16" r="2" fill="#38bdf8" />
            <circle cx="22" cy="14" r="0.8" fill="#1c1917" />
            <circle cx="26" cy="14" r="0.8" fill="#1c1917" />
          </svg>
        );

      case 'non-quai-thao':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Non Quai Thao - Flat Palm Hat */}
            <ellipse cx="24" cy="18" rx="16" ry="6" fill="#fef08a" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="18" rx="11" ry="4" fill="#ca8a04" stroke={INK} strokeWidth="1.2" />
            <path d="M 14 20 C 14 30 18 42 19 44" stroke="#9333ea" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 34 20 C 34 30 30 42 29 44" stroke="#9333ea" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="42" r="2" fill="#ec4899" />
          </svg>
        );

      case 'lotus-flower':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Hoa Sen Hong - Lotus Flower */}
            <path d="M 12 36 Q 24 40 36 36" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 24 10 C 18 18 18 28 24 34 C 30 28 30 18 24 10 Z" fill="#f472b6" stroke={INK} strokeWidth="1.6" />
            <path d="M 14 20 C 12 26 16 32 22 34 C 18 28 16 22 14 20 Z" fill="#f472b6" stroke={INK} strokeWidth="1.4" />
            <path d="M 34 20 C 36 26 32 32 26 34 C 30 28 32 22 34 20 Z" fill="#f472b6" stroke={INK} strokeWidth="1.4" />
            <ellipse cx="24" cy="26" rx="2.5" ry="3.5" fill="#facc15" />
          </svg>
        );

      case 'banh-chung':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Banh Chung Xanh - Square Sticky Rice Cake */}
            <rect x="10" y="10" width="28" height="28" rx="2" fill="#15803d" stroke={INK} strokeWidth="2" />
            <line x1="19" y1="10" x2="19" y2="38" stroke="#fde047" strokeWidth="1.8" />
            <line x1="29" y1="10" x2="29" y2="38" stroke="#fde047" strokeWidth="1.8" />
            <line x1="10" y1="19" x2="38" y2="19" stroke="#fde047" strokeWidth="1.8" />
            <line x1="10" y1="29" x2="38" y2="29" stroke="#fde047" strokeWidth="1.8" />
          </svg>
        );

      case 'bat-trang-pottery':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Gom Bat Trang - Porcelain Vase */}
            <path d="M 18 10 L 30 10 L 28 16 C 36 22 36 34 30 40 L 18 40 C 12 34 12 22 20 16 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.8" />
            <path d="M 16 28 Q 24 22 32 28" stroke="#1d4ed8" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="28" r="3" fill="#1d4ed8" />
            <line x1="19" y1="13" x2="29" y2="13" stroke="#1d4ed8" strokeWidth="1.4" />
          </svg>
        );

      case 'bamboo-basket':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Thung Tre Nan - Woven Bamboo Basket */}
            <ellipse cx="24" cy="22" rx="16" ry="7" fill="#d97706" stroke={INK} strokeWidth="1.8" />
            <path d="M 8 22 C 8 36 40 36 40 22" stroke={INK} strokeWidth="1.8" fill="#b45309" />
            <ellipse cx="24" cy="22" rx="13" ry="5" fill="#fde68a" stroke={INK} strokeWidth="1.2" />
            <path d="M 14 26 L 34 26 M 16 30 L 32 30" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'h-mong-flute':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Sao Meo Tay Bac - H'Mong Flute */}
            <rect x="10" y="21" width="28" height="6" rx="3" fill="#78350f" stroke={INK} strokeWidth="1.8" />
            <rect x="10" y="20" width="6" height="8" rx="2" fill="#ca8a04" stroke={INK} strokeWidth="1.2" />
            <circle cx="22" cy="24" r="1.2" fill="#1c1917" />
            <circle cx="27" cy="24" r="1.2" fill="#1c1917" />
            <circle cx="32" cy="24" r="1.2" fill="#1c1917" />
          </svg>
        );

      case 'terraced-sheaf':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Bo Lua Nep Nuong - Paddy Sheaf */}
            <path d="M 18 42 L 22 26 C 16 20 12 12 18 8 C 22 14 22 22 24 26 C 26 22 26 14 30 8 C 36 12 32 20 26 26 L 30 42 Z" fill="#eab308" stroke={INK} strokeWidth="1.6" />
            <rect x="20" y="28" width="8" height="3" rx="1" fill="#b45309" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'champa-relief':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Phu Dieu Champa - Terracotta Relief */}
            <rect x="10" y="8" width="28" height="32" rx="3" fill="#c2410c" stroke={INK} strokeWidth="1.8" />
            <path d="M 24 14 C 20 18 20 22 24 24 C 28 22 28 18 24 14 Z" fill="#fed7aa" stroke={INK} strokeWidth="1.2" />
            <path d="M 16 24 C 20 26 28 26 32 24" stroke="#fed7aa" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 20 24 L 20 34 L 28 34 L 28 24" stroke="#fed7aa" strokeWidth="2" fill="none" strokeLinejoin="round" />
          </svg>
        );

      case 'hue-kite':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Dieu Rong Hue - Royal Dragon Kite */}
            <circle cx="24" cy="14" r="7" fill="#ef4444" stroke={INK} strokeWidth="1.6" />
            <circle cx="20" cy="24" r="4" fill="#eab308" stroke={INK} strokeWidth="1.4" />
            <circle cx="28" cy="28" r="3.5" fill="#3b82f6" stroke={INK} strokeWidth="1.4" />
            <circle cx="22" cy="35" r="3" fill="#10b981" stroke={INK} strokeWidth="1.4" />
            <circle cx="26" cy="41" r="2.5" fill="#ec4899" stroke={INK} strokeWidth="1.2" />
            <g className="eye">
              <circle className="pupil" cx="22" cy="13" r="1.2" fill="#1c1917" />
            </g>
            <g className="eye">
              <circle className="pupil" cx="26" cy="13" r="1.2" fill="#1c1917" />
            </g>
          </svg>
        );

      case 'incense-burner':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Lu Tram Cung Dinh - Incense Burner */}
            <ellipse cx="24" cy="26" rx="11" ry="8" fill="#b45309" stroke={INK} strokeWidth="1.8" />
            <path d="M 16 24 C 16 16 32 16 32 24 Z" fill="#d97706" stroke={INK} strokeWidth="1.6" />
            <circle cx="24" cy="14" r="2" fill="#d97706" stroke={INK} strokeWidth="1.2" />
            <Limb d="M 17 33 L 15 42" color="#b45309" w={2.5} />
            <Limb d="M 31 33 L 33 42" color="#b45309" w={2.5} />
            <Limb d="M 24 34 L 24 43" color="#b45309" w={2.5} />
            <path d="M 24 12 Q 22 8 25 5" stroke="#e2e8f0" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        );

      case 'palm-leaf-fan':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Quat Nan La Co - Palm Leaf Fan */}
            <path d="M 24 30 C 10 30 8 10 24 10 C 40 10 38 30 24 30 Z" fill="#fde68a" stroke={INK} strokeWidth="1.8" />
            <line x1="24" y1="10" x2="24" y2="44" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 14 18 L 24 24 L 34 18" stroke="#ca8a04" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
            <path d="M 16 24 L 24 28 L 32 24" stroke="#ca8a04" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
          </svg>
        );

      case 'cham-lamp':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Den Dau Champa - Terracotta Oil Lamp */}
            <path d="M 10 26 C 10 36 38 36 38 26 L 42 22 L 34 22 C 30 22 26 24 24 24 C 22 24 18 22 14 22 L 6 22 Z" fill="#ea580c" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="24" cy="36" rx="8" ry="2.5" fill="#c2410c" stroke={INK} strokeWidth="1.2" />
            <path className="glow-spot" d="M 40 22 C 40 16 43 14 43 12 C 43 14 46 16 46 22 Z" fill="#fbbf24" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'royal-umbrella':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Long Vang Hoang Cung - Royal Umbrella */}
            <path d="M 10 22 C 10 12 38 12 38 22 Z" fill="#eab308" stroke={INK} strokeWidth="1.8" />
            <path d="M 10 22 Q 17 25 24 22 Q 31 25 38 22" stroke="#dc2626" strokeWidth="1.8" fill="none" />
            <circle cx="24" cy="10" r="2" fill="#ca8a04" stroke={INK} strokeWidth="1.2" />
            <Limb d="M 24 22 L 24 45" color="#78350f" w={2.4} />
          </svg>
        );

      case 'sea-shell-curtain':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Rem Vo Oc Bien - Shell Windchime */}
            <line x1="10" y1="8" x2="38" y2="8" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            <Limb d="M 16 9 L 16 40" color="#d6d3d1" w={1} />
            <Limb d="M 24 9 L 24 44" color="#d6d3d1" w={1} />
            <Limb d="M 32 9 L 32 40" color="#d6d3d1" w={1} />
            <circle cx="16" cy="18" r="3" fill="#fef3c7" stroke={INK} strokeWidth="1" />
            <circle cx="16" cy="30" r="2.5" fill="#fed7aa" stroke={INK} strokeWidth="1" />
            <circle cx="24" cy="20" r="3.5" fill="#fed7aa" stroke={INK} strokeWidth="1" />
            <circle cx="24" cy="34" r="3" fill="#fef3c7" stroke={INK} strokeWidth="1" />
            <circle cx="32" cy="18" r="3" fill="#fef3c7" stroke={INK} strokeWidth="1" />
            <circle cx="32" cy="30" r="2.5" fill="#fed7aa" stroke={INK} strokeWidth="1" />
          </svg>
        );

      case 'highland-crossbow':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* No Go Tay Nguyen - Highland Crossbow */}
            <path d="M 8 16 Q 24 22 40 16" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
            <line x1="8" y1="16" x2="24" y2="32" stroke="#a8a29e" strokeWidth="1.2" />
            <line x1="40" y1="16" x2="24" y2="32" stroke="#a8a29e" strokeWidth="1.2" />
            <rect x="22.5" y="12" width="3" height="30" rx="1.5" fill="#7f1d1d" stroke={INK} strokeWidth="1.4" />
          </svg>
        );

      case 'southern-scarf':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Khan Ran Nam Bo - Checkered Scarf */}
            <path d="M 12 12 Q 24 24 36 12 Q 28 34 22 44 Q 18 34 12 12 Z" fill="#f8fafc" stroke={INK} strokeWidth="1.8" />
            <path d="M 16 16 L 32 16 M 15 22 L 31 22 M 17 28 L 27 28 M 18 34 L 26 34" stroke="#1c1917" strokeWidth="1.4" strokeDasharray="2 2" />
          </svg>
        );

      case 'dan-kim':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Dan Kim Nam Bo - Moon Lute */}
            <circle cx="24" cy="30" r="11" fill="#b45309" stroke={INK} strokeWidth="1.8" />
            <circle cx="24" cy="30" r="7" fill="#fde68a" stroke={INK} strokeWidth="1.2" />
            <rect x="22.5" y="6" width="3" height="16" rx="1.5" fill="#78350f" stroke={INK} strokeWidth="1.4" />
            <circle cx="24" cy="6" r="2.5" fill="#b45309" stroke={INK} strokeWidth="1.2" />
            <line x1="23" y1="6" x2="23" y2="32" stroke="#1c1917" strokeWidth="0.8" />
            <line x1="25" y1="6" x2="25" y2="32" stroke="#1c1917" strokeWidth="0.8" />
          </svg>
        );

      case 'clay-piggy':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Heo Dat Lai Thieu - Terracotta Piggy Bank */}
            <ellipse cx="24" cy="27" rx="13" ry="10" fill="#ef4444" stroke={INK} strokeWidth="1.8" />
            <circle cx="14" cy="24" r="6.5" fill="#ef4444" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="9" cy="25" rx="2.5" ry="3" fill="#facc15" stroke={INK} strokeWidth="1.2" />
            <circle cx="8.5" cy="24.5" r="0.8" fill="#1c1917" />
            <circle cx="8.5" cy="26" r="0.8" fill="#1c1917" />
            <g className="eye">
              <circle className="pupil" cx="14" cy="22" r="1.2" fill="#1c1917" />
            </g>
            <rect x="22" y="16.5" width="6" height="1.6" rx="0.8" fill="#1c1917" />
            <circle cx="26" cy="26" r="3" fill="#facc15" />
            <rect x="17" y="35" width="3" height="5" rx="1.5" fill="#facc15" stroke={INK} strokeWidth="1.2" />
            <rect x="28" y="35" width="3" height="5" rx="1.5" fill="#facc15" stroke={INK} strokeWidth="1.2" />
          </svg>
        );

      case 'coconut-candy':
        return (
          <svg viewBox="0 0 48 48" className="sprite-svg" fill="none">
            {/* Keo Dua Ben Tre - Coconut Candy */}
            <rect x="14" y="18" width="20" height="12" rx="2" fill="#d97706" stroke={INK} strokeWidth="1.8" transform="rotate(10 24 24)" />
            <path d="M 10 16 L 15 22 L 11 26 Z" fill="#fef3c7" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 38 22 L 33 26 L 37 32 Z" fill="#fef3c7" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="18" y="21" width="12" height="6" rx="1" fill="#15803d" stroke={INK} strokeWidth="1" transform="rotate(10 24 24)" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`object-sprite-container ${type} ${isFound ? 'sprite-found' : ''} ${
        isSecret ? 'sprite-secret' : ''
      } ${className}`}
    >
      {renderSvg()}
    </div>
  );
};
export default ObjectSprite;
