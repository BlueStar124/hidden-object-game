import { encodeChallenge } from '../../core/challenge';
import { STAMPS_FOR_SEAL, stampsByCountry } from '../../core/daily';
import { progress } from '../../core/progress';
import { isCritter, type HiddenObject, type Page } from '../../core/model';
import { challengeOf, placeOf } from '../../content';
import { challengeLink } from '../../platform/launchLink';
import { formatDuration, formatNumber } from '../../ui/format';
import type { PostcardContent } from './postcard';

/** What the player shares: the challenge of a hunt, postcards of a page or of the daily page. */

const GAME = 'The Lost Sketchbook';

/** The code and the message of a challenge on a page laid out with `seed`, done in `time` seconds. */
export function challengeMessage(page: Page, seed: number, time: number): { code: string; text: string } {
  const code = encodeChallenge(challengeOf(page, seed, time));
  const link = challengeLink(code);
  const text =
    `Thách bạn tìm nhanh hơn mình ở trang “${page.title}” trong ${GAME}: mình mất ${formatDuration(time)}. ` +
    `Nhập mã ${code} ở trang chủ${link ? ` hoặc mở ${link}` : ''}.`;
  return { code, text };
}

/** The point a postcard frames: the secret if found, else a critter, else any find. */
function highlight(page: Page, foundIds: string[]): HiddenObject | undefined {
  const found = page.objects.filter((o) => foundIds.includes(o.id));
  return found.find((o) => o.isSecret) ?? found.find((o) => o.rare) ?? found.find(isCritter) ?? found[0];
}

const countryOf = (page: Page) => placeOf(page.id)?.ref.country.name ?? '';

/** Postcards of a country whose gold seal is in the passport are gilded. */
function gilded(page: Page): boolean {
  const id = placeOf(page.id)?.ref.country.id;
  return !!id && (stampsByCountry(progress.stamps()).get(id) ?? 0) >= STAMPS_FOR_SEAL;
}

/** A postcard of a page just solved. */
export function victoryPostcard(page: Page, result: { foundIds: string[]; score: number; stars: number; time: number; code: string }): PostcardContent {
  const critters = page.objects.filter(isCritter);
  const spotted = critters.filter((o) => result.foundIds.includes(o.id)).length;
  return {
    page,
    focus: highlight(page, result.foundIds),
    country: countryOf(page),
    title: page.title,
    stars: result.stars,
    lines: [
      `Thời gian: ${formatDuration(result.time)}`,
      `Điểm điều tra: ${formatNumber(result.score)}`,
      ...(critters.length ? [`Sinh vật ẩn nấp: ${spotted}/${critters.length}`] : []),
    ],
    footer: `${GAME} · mã thử thách ${result.code}`,
    gilded: gilded(page),
  };
}

/** The message going with a postcard. */
export const postcardMessage = (page: Page, challengeText: string) => `Bưu thiếp từ ${countryOf(page)}: “${page.title}”. ${challengeText}`;

/** The daily page done: its postcard and message ('2026-10-12'). */
export function dailyShare(page: Page, day: string, time: number): { postcard: PostcardContent; text: string } {
  const [, month, date] = day.split('-');
  const when = `${date}/${month}`;
  return {
    postcard: {
      page,
      focus: page.focus ? { x: page.focus.x + page.focus.w / 2, y: page.focus.y + page.focus.h / 2 } : undefined,
      country: countryOf(page),
      title: `Trang của ngày ${when}`,
      lines: [page.title, `Thời gian: ${formatDuration(time)}`],
      footer: `${GAME} · mỗi ngày một góc tranh mới`,
      gilded: gilded(page),
    },
    text: `Trang của ngày ${when} trong ${GAME}: mình tìm xong trong ${formatDuration(time)}. Bạn thử xem nhanh hơn không?`,
  };
}
