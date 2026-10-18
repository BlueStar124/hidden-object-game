import type { CaseState, HiddenObject, Page } from '../core/model';
import { migrantProgress, migrantObjectId } from '../core/migrants';
import { canDeduce } from '../core/mystery';
import { progress } from '../core/progress';
import type { FindResult } from '../core/caseFile';
import { placeOf } from '../content';
import { MIGRANTS } from '../content/migrants';
import { submitStoryScore } from '../platform/leaderboard';
import { sound } from '../platform/sound';
import type { PlayMode } from './navigationLayout';
import type { Notify } from './useNotices';

export function handleDiscovery(
  found: HiddenObject,
  at: { x: number; y: number },
  pageId: string,
  friendHunt: boolean,
  notify: Notify
): void {
  if (!friendHunt) progress.recordDiscovery(pageId, found.id);
  if (found.rare && found.spriteType) {
    const first = progress.recordRareFind(found.spriteType);
    sound.playCreature();
    notify(first ? '✨ Sinh vật ánh vàng! Đã ghi vào Sổ Tay' : '✨ Lại một sinh vật ánh vàng!', { x: at.x, y: at.y - 44 }, 'info');
  }
  const migrant = MIGRANTS.find((m) => migrantObjectId(m) === found.id);
  if (migrant) {
    const { met, total } = migrantProgress(migrant, progress.discovered);
    notify(
      met === total ? `${migrant.name}: đã gặp ở mọi nơi! Đọc câu chuyện trong Hộ Chiếu` : `${migrant.name}: đã gặp ${met}/${total} nơi`,
      { x: at.x, y: at.y - 44 },
      'info'
    );
  }
  if (!found.isClue) return;
  const chapter = placeOf(pageId)?.ref.chapter;
  if (chapter && canDeduce(chapter, progress.discovered) && !progress.isMysterySolved(chapter.id)) {
    notify('Đủ manh mối của chương! Mở Mục Lục để suy luận', { x: at.x, y: at.y - 44 }, 'info');
  }
}

export function handleVictoryRecord(
  solved: NonNullable<FindResult['solved']>,
  page: Page,
  c: CaseState,
  mode: PlayMode,
  friendHunt: boolean,
  nextPage: Page | null,
  night: Page | undefined,
  isNight: boolean,
  foundItems: string[]
): string | null {
  sound.playVictory();
  if (mode.kind === 'daily') {
    const countryId = placeOf(page.id)?.ref.country.id ?? '';
    progress.recordStamp(mode.puzzle.day, { pageId: page.id, countryId, time: page.timeLimit - c.remainingTime });
    return null;
  }
  if (friendHunt) {
    return null;
  }
  const isStoryBook = mode.kind === 'book';
  const wasPassed = (progress.pageResult(page.id)?.stars ?? 0) > 0;
  const critters = page.objects.filter((o) => o.isBonus && foundItems.includes(o.id)).map((o) => o.id);
  progress.recordVictory(
    page.id,
    isStoryBook ? (nextPage?.id ?? null) : null,
    solved.score,
    solved.stars,
    page.timeLimit - c.remainingTime,
    critters,
    isStoryBook
  );
  if (isStoryBook && !isNight) {
    submitStoryScore(
      page.id,
      solved.score,
      solved.stars,
      page.timeLimit - c.remainingTime
    ).catch(() => {});
  }
  return isStoryBook && !wasPassed && night ? night.title : null;
}

