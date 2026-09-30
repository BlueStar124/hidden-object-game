import React from 'react';
import { SpriteType } from '../../types/level';
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
 * - `.eye`    → blinks every few seconds while hidden; `.pupil` stays dark under camouflage
 * - `.wing` / `.tail` → flutter / wag once the creature has been found
 */
const INK = '#2c241b';

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
