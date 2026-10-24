import fs from 'node:fs';

export function loadObjectSprite(esbuild, rootRequire, spriteSrc) {
  const out = esbuild.buildSync({
    entryPoints: [spriteSrc],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', out.outputFiles[0].text)(rootRequire, mod, mod.exports);
  return mod.exports.ObjectSprite;
}

export function spriteTypes(spriteSrc) {
  const src = fs.readFileSync(spriteSrc, 'utf8');
  return [...src.matchAll(/^\s*case '([a-z-]+)':/gm)].map((m) => m[1]);
}

export function renderMarkups(esbuild, rootRequire, React, renderToStaticMarkup, spriteSrc) {
  const ObjectSprite = loadObjectSprite(esbuild, rootRequire, spriteSrc);
  const markups = {};
  for (const type of spriteTypes(spriteSrc)) {
    const html = renderToStaticMarkup(React.createElement(ObjectSprite, { type }));
    const svg = html.match(/<svg[\s\S]*<\/svg>/);
    if (!svg) throw new Error(`No <svg> rendered for sprite "${type}"`);
    markups[type] = svg[0];
  }
  return markups;
}

// Variants measured in the browser. Each wraps the sprite the way SceneLayer does on the web.
// Sentinel colours stand in for the chameleon tint (sampled per object at runtime).
export const CAMO_FILL = 'rgb(1, 2, 3)';
export const CAMO_INK = 'rgb(4, 5, 6)';
export const VARIANTS = [
  { key: 'base', layer: 'scene-layer', sprite: 'hidden-sprite camo-ink is-found' },
  { key: 'chameleon', layer: 'scene-layer', sprite: 'hidden-sprite camo-chameleon' },
  { key: 'invisible', layer: 'scene-layer', sprite: 'hidden-sprite camo-invisible in-loupe' },
  { key: 'glow', layer: 'scene-layer glow-layer', sprite: 'hidden-sprite camo-ink' },
  { key: 'glowChameleon', layer: 'scene-layer glow-layer', sprite: 'hidden-sprite camo-chameleon' },
];

/** Runs in Chromium: measures structure, geometry and the resolved paint of every shape. */
export function measureInBrowser({ markups, variants, camoFill, camoInk }) {
  const host = document.getElementById('host');
  const SHAPES = 'path,circle,ellipse,rect,line,polygon,polyline';
  const r = (v) => Math.round(v * 1000) / 1000;
  const num = (el, a) => parseFloat(el.getAttribute(a) || '0');

  function toPath(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'path') return el.getAttribute('d');
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = num(el, 'cx');
      const cy = num(el, 'cy');
      const rx = tag === 'circle' ? num(el, 'r') : num(el, 'rx');
      const ry = tag === 'circle' ? num(el, 'r') : num(el, 'ry');
      return `M ${r(cx - rx)} ${r(cy)} A ${rx} ${ry} 0 1 0 ${r(cx + rx)} ${r(cy)} A ${rx} ${ry} 0 1 0 ${r(cx - rx)} ${r(cy)} Z`;
    }
    if (tag === 'rect') {
      const x = num(el, 'x');
      const y = num(el, 'y');
      const w = num(el, 'width');
      const h = num(el, 'height');
      let rx = el.hasAttribute('rx') ? num(el, 'rx') : el.hasAttribute('ry') ? num(el, 'ry') : 0;
      let ry = el.hasAttribute('ry') ? num(el, 'ry') : rx;
      rx = Math.min(rx, w / 2);
      ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M ${x} ${y} H ${r(x + w)} V ${r(y + h)} H ${x} Z`;
      return [
        `M ${r(x + rx)} ${y}`,
        `H ${r(x + w - rx)} A ${rx} ${ry} 0 0 1 ${r(x + w)} ${r(y + ry)}`,
        `V ${r(y + h - ry)} A ${rx} ${ry} 0 0 1 ${r(x + w - rx)} ${r(y + h)}`,
        `H ${r(x + rx)} A ${rx} ${ry} 0 0 1 ${x} ${r(y + h - ry)}`,
        `V ${r(y + ry)} A ${rx} ${ry} 0 0 1 ${r(x + rx)} ${y} Z`,
      ].join(' ');
    }
    if (tag === 'line') return `M ${num(el, 'x1')} ${num(el, 'y1')} L ${num(el, 'x2')} ${num(el, 'y2')}`;
    const pts = (el.getAttribute('points') || '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    let d = '';
    for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? 'L' : 'M'} ${pts[i]} ${pts[i + 1]} `;
    return tag === 'polygon' ? `${d}Z` : d.trim();
  }

  function ownMatrix(el) {
    if (!el.hasAttribute('transform')) return undefined;
    const m = el.transform.baseVal.consolidate()?.matrix;
    return m ? [m.a, m.b, m.c, m.d, m.e, m.f].map(r) : undefined;
  }

  function anim(el) {
    const cls = el.classList;
    const bb = el.getBBox();
    const at = (fx, fy) => [r(bb.x + bb.width * fx), r(bb.y + bb.height * fy)];
    const list = [];
    if (cls.contains('eye')) list.push({ kind: 'blink', origin: at(0.5, 0.5) });
    if (cls.contains('wing')) list.push({ kind: 'wing', origin: [24, 24] });
    if (cls.contains('tail')) list.push({ kind: 'tail', origin: cls.contains('tail-cat') ? at(0.1, 0.9) : at(0, 1) });
    if (cls.contains('wave')) list.push({ kind: 'wave', origin: at(0.7, 0.95) });
    if (cls.contains('glow-spot')) list.push({ kind: 'glowSpot' });
    return list;
  }

  const css = (c) => (c === camoFill ? '$fill' : c === camoInk ? '$ink' : c);
  const result = {};
  const warnings = [];

  for (const [type, markup] of Object.entries(markups)) {
    const paints = {};
    let tree = null;
    for (const v of variants) {
      host.innerHTML =
        `<div class="${v.layer}"><div class="${v.sprite}" style="--camo-fill: ${camoFill}; --camo-ink: ${camoInk}; width: 48px; height: 48px; left: 0; top: 0; transform: none;">` +
        `<div class="hs-orient"><div class="hs-shy"><div class="object-sprite-container ${type}">${markup}</div></div></div></div></div>`;
      const svg = host.querySelector('svg');
      svg.setAttribute('width', '48');
      svg.setAttribute('height', '48');
      const leaves = [...svg.querySelectorAll(SHAPES)];
      paints[v.key] = leaves.map((el) => {
        const cs = getComputedStyle(el);
        return {
          fill: css(cs.fill),
          stroke: css(cs.stroke),
          visible: cs.visibility !== 'hidden',
          sw: parseFloat(cs.strokeWidth),
          cap: cs.strokeLinecap,
          join: cs.strokeLinejoin,
          dash: cs.strokeDasharray,
          opacity: parseFloat(cs.opacity),
        };
      });

      if (v.key === 'base') {
        let leaf = 0;
        const walk = (el) => {
          const tag = el.tagName.toLowerCase();
          const node = { m: ownMatrix(el), anim: anim(el) };
          if (node.anim.length && node.m) warnings.push(`${type}: animated <${tag}> has its own transform`);
          if (tag === 'g') return { ...node, kind: 'g', children: [...el.children].map(walk) };
          return { ...node, kind: 'shape', d: toPath(el), leaf: leaf++ };
        };
        tree = [...svg.children].map(walk);
      }
    }
    result[type] = { tree, paints };
  }

  // Container-level styles per variant, for the record (blend, filter, opacity)
  const containers = {};
  for (const v of variants) {
    host.innerHTML = `<div class="${v.layer}"><div class="${v.sprite}"><div class="hs-orient"><div class="hs-shy"><div class="object-sprite-container ${v.key === 'base' ? 'sprite-found' : ''}"><svg></svg></div></div></div></div></div>`;
    const s = getComputedStyle(host.querySelector('.hidden-sprite'));
    const c = getComputedStyle(host.querySelector('.object-sprite-container'));
    containers[v.key] = {
      sprite: { opacity: s.opacity, blend: s.mixBlendMode, filter: s.filter },
      container: { opacity: c.opacity, filter: c.filter },
    };
  }
  return { result, warnings, containers };
}

const LINECAP = { butt: undefined, round: 'round', square: 'square' };
const LINEJOIN = { miter: undefined, round: 'round', bevel: 'bevel' };
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Compacts the browser measurements into the generated art table. */
export function buildArt(measured) {
  const art = {};
  for (const [type, { tree, paints }] of Object.entries(measured)) {
    const base = paints.base;
    const shapes = base.map((p, i) => {
      for (const key of ['chameleon', 'invisible', 'glow', 'glowChameleon']) {
        const q = paints[key][i];
        if (q.sw !== p.sw || q.cap !== p.cap || q.join !== p.join || q.dash !== p.dash) {
          throw new Error(`${type}: variant "${key}" changes stroke geometry of shape ${i}`);
        }
      }
      const glow = paints.glow[i];
      const glowCh = paints.glowChameleon[i];
      if (glow.visible !== glowCh.visible) throw new Error(`${type}: glow visibility depends on camouflage (shape ${i})`);
      const dash =
        p.dash && p.dash !== 'none'
          ? p.dash
              .split(/[\s,]+/)
              .map((v) => parseFloat(v))
              .filter((v) => !Number.isNaN(v))
          : undefined;
      return {
        stroke: {
          width: p.sw,
          cap: LINECAP[p.cap],
          join: LINEJOIN[p.join],
          dash,
          opacity: p.opacity !== 1 ? p.opacity : undefined,
        },
        base: [p.fill, p.stroke],
        chameleon: [paints.chameleon[i].fill, paints.chameleon[i].stroke],
        invisible: [paints.invisible[i].fill, paints.invisible[i].stroke],
        glow: glow.visible ? [glow.fill, glow.stroke] : null,
        // The chameleon colour rules outrank a few glow rules on the web (e.g. firefly lanterns)
        glowChameleon: glowCh.visible ? [glowCh.fill, glowCh.stroke] : null,
      };
    });

    const strip = (node) => {
      const out = {};
      if (node.m) out.m = node.m;
      if (node.anim.length) out.anim = node.anim;
      if (node.kind === 'g') {
        out.children = node.children.map(strip);
      } else {
        const s = shapes[node.leaf];
        out.d = node.d;
        out.paint = {
          ...Object.fromEntries(Object.entries(s.stroke).filter(([, v]) => v !== undefined)),
          base: s.base,
          ...(same(s.chameleon, s.base) ? {} : { chameleon: s.chameleon }),
          ...(same(s.invisible, s.base) ? {} : { invisible: s.invisible }),
          glow: s.glow,
          ...(s.glow && s.glowChameleon && !same(s.glowChameleon, s.glow) ? { glowChameleon: s.glowChameleon } : {}),
        };
      }
      return out;
    };
    art[type] = tree.map(strip);
  }
  return art;
}

