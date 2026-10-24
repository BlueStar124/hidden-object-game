import type { HiddenObject } from '../../../core/model';
import {
  Feather,
  Footprints,
  Layers,
  Microscope,
  Palette,
  ScanEye,
  Timer,
  type LucideIcon,
} from '../../../ui/icons';

export const SECRET_CLUE = 'Vật được giấu kỹ nhất trang — hãy rê kính lúp thật chậm.';

export interface CamoTrait {
  key: keyof typeof TRAIT_COLOR;
  icon: LucideIcon;
  label: string;
}

export const TRAIT_COLOR = {
  invisible: '#0284c7',
  roam: '#0f766e',
  shy: '#b45309',
  chameleon: '#4d7c0f',
  peek: '#7c3aed',
  tiny: '#be185d',
  ink: '#6F4D2C',
} as const;

/** How a target is hidden, so players know what kind of searching it takes. */
export function camoTrait(obj: HiddenObject): CamoTrait | null {
  if (!obj.spriteType || obj.spriteType === 'seal') return null;
  if (obj.camo === 'invisible') {
    return { key: 'invisible', icon: ScanEye, label: 'Mực tàng hình · chỉ hiện qua kính lúp' };
  }
  if (obj.roam) return { key: 'roam', icon: Footprints, label: 'Di chuyển liên tục · bắt đúng lúc' };
  if (obj.shy) return { key: 'shy', icon: Timer, label: 'Nhút nhát · thỉnh thoảng mới ló ra' };
  if (obj.camo === 'chameleon') return { key: 'chameleon', icon: Palette, label: 'Đổi màu theo nền' };
  if (obj.occluder) return { key: 'peek', icon: Layers, label: 'Nấp sau vật' };
  if ((obj.scale ?? 1) <= 0.45) return { key: 'tiny', icon: Microscope, label: 'Tí hon' };
  return { key: 'ink', icon: Feather, label: 'Hòa vào nét vẽ' };
}

/**
 * What a card is called. Until a hint reads it (`read`) or it is found, only its silhouette tells
 * what to look for; a riddle stands in for the name, and so does a thing that moved since the day.
 */
export function cardName(obj: HiddenObject, found: boolean, read: boolean): string {
  if (found || read) return obj.name;
  if (obj.isSecret) return '??? Vật Phẩm Bí Mật';
  if (obj.riddle) return 'Câu đố';
  return obj.dayAt ? 'Đổi chỗ lúc đêm' : '???';
}

/** What a card says: the found text, the clue once read, else the riddle, where it was by day, or how to read it. */
export function cardText(obj: HiddenObject, found: boolean, read: boolean): string {
  if (found) return obj.foundText || 'Đã tìm thấy!';
  if (read) return obj.clue;
  if (obj.isSecret) return SECRET_CLUE;
  if (obj.riddle) return obj.riddle;
  return obj.dayAt
    ? `Ban ngày: ${obj.dayAt.clue}`
    : 'Chạm thẻ hoặc bấm Gợi Ý để đọc tên và manh mối';
}

