import type { HiddenObject, ToolId } from '../core/model';
import { Microscope, Rainbow, ScanEye, type LucideIcon } from './icons';

/** How each tool's finds are marked on the clue bar and in the page index. */
export const TOOL_MARKS: Record<ToolId, { icon: LucideIcon; color: string }> = {
  'uv-lens': { icon: ScanEye, color: '#0284c7' },
  prism: { icon: Rainbow, color: '#9333ea' },
  'twin-lens': { icon: Microscope, color: '#b45309' },
};

/** A page's objects that need a tool, by tool (in the order they first appear). */
export function byTool(objects: readonly HiddenObject[]): [ToolId, HiddenObject[]][] {
  const groups = new Map<ToolId, HiddenObject[]>();
  for (const o of objects) if (o.requires) groups.set(o.requires, [...(groups.get(o.requires) ?? []), o]);
  return [...groups];
}
