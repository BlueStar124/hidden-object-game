import React, { useLayoutEffect, useRef, useState } from 'react';
import { HiddenObject, RoamBehavior } from '../../types/level';
import { CamoTint, SPRITE_BASE_WIDTH } from '../../game/CamoSampler';
import { RoamState, roamState, shyAnimationDelay } from '../../game/CreatureMotion';
import { isCreature } from '../../data/bestiary';
import { ObjectSprite } from './ObjectSprite';

type Point = { x: number; y: number };

interface SceneLayerProps {
  sceneImage: string;
  objects: HiddenObject[];
  foundIds: string[];
  foundAt?: Record<string, Point>; // Where roaming creatures were caught
  tints: Record<string, CamoTint>;
  inLoupe?: boolean;
  glow?: boolean; // Night pages: only the glowing eyes / firefly lights, drawn above the darkness
}

// Stable per-object blink offset so hidden creatures never blink in unison
function blinkDelay(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return `${(-(Math.abs(hash) % 4600) / 1000).toFixed(2)}s`;
}

/**
 * Moves an absolutely positioned element along a roaming path every frame, straight on the DOM
 * (no React re-render), using the same clock as click detection.
 */
export function useRoamingPosition(
  ref: React.RefObject<HTMLElement>,
  roam: RoamBehavior | undefined,
  active: boolean,
  onFrame?: (state: RoamState) => void
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useLayoutEffect(() => {
    if (!roam || !active || roam.path.length < 2) return;
    let raf = 0;
    const tick = () => {
      const state = roamState(roam);
      const el = ref.current;
      if (el) {
        el.style.left = `${state.x * 100}%`;
        el.style.top = `${state.y * 100}%`;
      }
      onFrameRef.current?.(state);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [ref, roam, active]);
}

const HiddenSprite: React.FC<{
  obj: HiddenObject;
  isFound: boolean;
  foundAt?: Point;
  tint?: CamoTint;
  inLoupe: boolean;
}> = ({ obj, isFound, foundAt, tint, inLoupe }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const orientRef = useRef<HTMLDivElement>(null);
  // Computed once on mount so the CSS peek animation lines up with the shared clock
  const [shyDelay] = useState(() => (obj.shy ? shyAnimationDelay(obj.shy) : undefined));

  const roaming = !!obj.roam && obj.roam.path.length >= 2;
  const baseRotate = `rotate(${obj.rotation ?? 0}deg)`;
  const baseFlip = obj.flip ? -1 : 1;

  useRoamingPosition(rootRef, obj.roam, roaming && !isFound, (state) => {
    if (orientRef.current) {
      orientRef.current.style.transform = `${baseRotate} scaleX(${baseFlip * (state.flip ? -1 : 1)})`;
    }
  });

  // A caught roamer stays where it was caught
  useLayoutEffect(() => {
    if (!roaming || !isFound || !rootRef.current) return;
    const at = foundAt ?? { x: obj.x, y: obj.y };
    rootRef.current.style.left = `${at.x * 100}%`;
    rootRef.current.style.top = `${at.y * 100}%`;
  }, [roaming, isFound, foundAt, obj.x, obj.y]);

  const classes = [
    'hidden-sprite',
    `camo-${obj.camo ?? 'ink'}`,
    isFound && 'is-found',
    inLoupe && 'in-loupe',
    obj.shy && `is-shy shy-${obj.shy.from ?? 'below'}`,
    roaming && 'is-roaming',
    roaming && obj.roam?.bob && 'roam-bob',
    obj.waterline !== undefined && 'in-water',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    // Roaming creatures are positioned every frame by useRoamingPosition
    left: roaming ? undefined : `${obj.x * 100}%`,
    top: roaming ? undefined : `${obj.y * 100}%`,
    width: `${SPRITE_BASE_WIDTH * (obj.scale ?? 1) * 100}%`,
    '--blink-delay': blinkDelay(obj.id),
    '--camo-fill': tint?.fill,
    '--camo-ink': tint?.ink,
    '--waterline': obj.waterline !== undefined ? `${obj.waterline * 100}%` : undefined,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} className={classes} style={style} data-object-id={obj.id}>
      <div
        ref={orientRef}
        className="hs-orient"
        style={roaming ? undefined : { transform: `${baseRotate}${obj.flip ? ' scaleX(-1)' : ''}` }}
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
 * The same layer is used on the page, magnified inside the loupe, and — on night pages —
 * once more above the darkness showing only the glowing eyes.
 */
const SceneLayerInner: React.FC<SceneLayerProps> = ({
  sceneImage,
  objects,
  foundIds,
  foundAt,
  tints,
  inLoupe = false,
  glow = false,
}) => {
  const painted = objects.filter((obj) => {
    if (!obj.spriteType || obj.spriteType === 'seal') return false;
    if (!glow) return true;
    // Only creatures still hiding have eyes shining in the dark
    return (
      isCreature(obj.spriteType) &&
      obj.glow !== false &&
      obj.camo !== 'invisible' &&
      !foundIds.includes(obj.id)
    );
  });

  return (
    <div className={`scene-layer ${glow ? 'glow-layer' : ''}`}>
      {painted.map((obj) => (
        <HiddenSprite
          key={obj.id}
          obj={obj}
          isFound={foundIds.includes(obj.id)}
          foundAt={foundAt?.[obj.id]}
          tint={tints[obj.id]}
          inLoupe={inLoupe}
        />
      ))}

      {/* Scraps of the painting laid back over tucked-away objects */}
      {!glow &&
        painted
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
