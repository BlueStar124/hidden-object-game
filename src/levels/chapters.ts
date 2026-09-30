import { ChapterData, LevelData } from '../types/level';
import marinaData from './chapter-01/marina.json';
import gardensData from './chapter-01/gardens.json';
import merlionData from './chapter-01/merlion.json';
import buddhaToothData from './chapter-02/buddha-tooth.json';
import jooChiatData from './chapter-02/joo-chiat.json';
import lauPaSatData from './chapter-02/lau-pa-sat.json';
import skylineData from './chapter-03/skyline.json';
import riverData from './chapter-03/river.json';
import botanicData from './chapter-03/botanic.json';
import gardensNightData from './night/gardens-night.json';
import lauPaSatNightData from './night/lau-pa-sat-night.json';
import riverNightData from './night/river-night.json';

/** Night variants, keyed by the id of the day page they belong to. */
export const NIGHT_BY_DAY_ID: Record<string, LevelData> = Object.fromEntries(
  [gardensNightData, lauPaSatNightData, riverNightData].map((n) => [
    (n as LevelData).dayId!,
    n as LevelData,
  ])
);

export const CHAPTER_1: ChapterData = {
  id: 'chapter-01',
  chapterNumber: 1,
  title: 'Kỳ Quan Vịnh Marina',
  subtitle: 'The Bayfront Marvels — Vụ Án Đảo Quốc Sư Tử',
  prologue: [
    'Singapore, ngày 12 tháng 11...',
    'Một cuốn sổ ký họa màu nước thuộc về một kiến trúc sư bí ẩn đã bất ngờ biến mất.',
    'Ẩn bên trong những nét cọ thanh thoát là những manh mối tối mật chỉ có thể nhìn thấy qua một chiếc kính lúp quang học đặc biệt.',
    'Bạn là thám tử được mời tới để giải mã từng trang sách, tìm lại các manh mối và vén bức màn bí ẩn...'
  ],
  scenes: [marinaData as LevelData, gardensData as LevelData, merlionData as LevelData]
};

export const CHAPTER_2: ChapterData = {
  id: 'chapter-02',
  chapterNumber: 2,
  title: 'Phố Cổ & Di Sản Văn Hóa',
  subtitle: 'Heritage & Shophouses — Dấu Tích Thời Gian',
  prologue: [
    'Rời khỏi vùng vịnh hiện đại, dấu vết dẫn bước thám tử tiến sâu vào những con phố cổ ngàn năm văn hóa.',
    'Từ mái ngói chùa Phật Nha tại Chinatown, những căn shophouse Peranakan rực rỡ sắc màu Joo Chiat, đến hương vị Satay khói bốc ngây ngất tại chợ đêm Lau Pa Sat.',
    'Hãy cẩn thận soi kỹ từng góc phố, kiến trúc sư đang gửi gắm những lời nhắn mã hóa tiếp theo...'
  ],
  scenes: [buddhaToothData as LevelData, jooChiatData as LevelData, lauPaSatData as LevelData]
};

export const CHAPTER_3: ChapterData = {
  id: 'chapter-03',
  chapterNumber: 3,
  title: 'Trái Tim Sông Nước & Rừng Bách Thảo',
  subtitle: 'Riverside & Botanic Flora — Hồi Kết Cuốn Sổ',
  prologue: [
    'Chặng đường cuối cùng của cuộc phiêu lưu đã mở ra!',
    'Từ góc nhìn toàn cảnh đường chân trời Marina Bay Skyline, ngược dòng sông Singapore xuôi theo những con thuyền bumboat, tới cây đại thụ cổ kính tại Vườn Bách Thảo UNESCO.',
    'Lời giải đáp cuối cùng về tung tích của vị kiến trúc sư và bí mật lớn nhất của cuốn sổ đang chờ bạn khám phá!'
  ],
  scenes: [skylineData as LevelData, riverData as LevelData, botanicData as LevelData]
};

export const ALL_CHAPTERS: ChapterData[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3];

export const ALL_SCENES: LevelData[] = [
  marinaData as LevelData,
  gardensData as LevelData,
  merlionData as LevelData,
  buddhaToothData as LevelData,
  jooChiatData as LevelData,
  lauPaSatData as LevelData,
  skylineData as LevelData,
  riverData as LevelData,
  botanicData as LevelData
];

export function getSceneById(sceneId: string) {
  for (const ch of ALL_CHAPTERS) {
    const scene = ch.scenes.find(s => s.id === sceneId);
    if (scene) return { chapter: ch, scene };
  }
  return null;
}

export function getChapterBySceneIndex(sceneIndex: number): ChapterData {
  if (sceneIndex < 3) return CHAPTER_1;
  if (sceneIndex < 6) return CHAPTER_2;
  return CHAPTER_3;
}
