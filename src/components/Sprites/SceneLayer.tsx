import React, { useState } from 'react';
import { HiddenObject } from '../../types/level';
import { CamoTint, SPRITE_BASE_WIDTH } from '../../game/CamoSampler';
import { shyAnimationDelay } from '../../game/ShyClock';
import { ObjectSprite } from './ObjectSprite';

interface SceneLayerProps {
  sceneImage: string;
  objects: HiddenObject[];
  foundIds: string[];
  tints: Record<string, CamoTint>;
  inLoupe?: boolean;
}

// Stable per-object blink offset so hidden creatures never blink in unison
function blinkDelay(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `${(-(Math.abs(hash) % 4600) / 1000).toFixed(2)}s`;
}

const HiddenSprite: React.FC<{
  obj: HiddenObject;
  isFound: boolean;
  tint?: CamoTint;
  inLoupe: boolean;
}> = ({ obj, isFound, tint, inLoupe }) => {
  // Computed once on mount so the CSS peek animation lines up with the shared shy clock
  const [shyDelay] = useState(() => (obj.shy ? shyAnimationDelay(obj.shy) : undefined));

  const classes = [
    'hidden-sprite',
    `camo-${obj.camo ?? 'ink'}`,
    isFound && 'is-found',
    inLoupe && 'in-loupe',
    obj.shy && `is-shy shy-${obj.shy.from ?? 'below'}`,
    obj.waterline !== undefined && 'in-water',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    left: `${obj.x * 100}%`,
    top: `${obj.y * 100}%`,
    width: `${SPRITE_BASE_WIDTH * (obj.scale ?? 1) * 100}%`,
    '--blink-delay': blinkDelay(obj.id),
    '--camo-fill': tint?.fill,
    '--camo-ink': tint?.ink,
    '--waterline': obj.waterline !== undefined ? `${obj.waterline * 100}%` : undefined,
  } as React.CSSProperties;

  return (
    <div className={classes} style={style} data-object-id={obj.id}>
      <div
        className="hs-orient"
        style={{ transform: `rotate(${obj.rotation ?? 0}deg)${obj.flip ? ' scaleX(-1)' : ''}` }}
      >
        <div
          className="hs-shy"
          style={
            obj.shy && shyDelay
              ? { animationDuration: `${obj.shy.period}s`, animationDelay: shyDelay }
              : undefined
          }
        >
          <ObjectSprite type={obj.spriteType} isFound={isFound} isSecret={obj.isSecret} />
        </div>
      </div>
    </div>
  );
};

/**
 * Paints every hidden object of a scene into a 100% × 100% layer over the artwork.
 * The same layer is used on the page and, magnified, inside the loupe.
 */
const SceneLayerInner: React.FC<SceneLayerProps> = ({
  sceneImage,
  objects,
  foundIds,
  tints,
  inLoupe = false,
}) => {
  const painted = objects.filter((obj) => obj.spriteType && obj.spriteType !== 'seal');

  return (
    <div className="scene-layer">
      {painted.map((obj) => (
        <HiddenSprite
          key={obj.id}
          obj={obj}
          isFound={foundIds.includes(obj.id)}
          tint={tints[obj.id]}
          inLoupe={inLoupe}
        />
      ))}

      {/* Scraps of the painting laid back over tucked-away objects */}
      {painted
        .filter((obj) => obj.occluder && obj.occluder.length >= 3)
        .map((obj) => (
          <div
            key={`occluder-${obj.id}`}
            className="sprite-occluder"
            style={{
              backgroundImage: `url(${sceneImage})`,
              clipPath: `polygon(${obj
                .occluder!.map(([x, y]) => `${(x * 100).toFixed(3)}% ${(y * 100).toFixed(3)}%`)
                .join(', ')})`,
            }}
          />
        ))}
    </div>
  );
};

export const SceneLayer = React.memo(SceneLayerInner);
