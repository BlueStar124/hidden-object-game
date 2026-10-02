import type { Country, Page } from '../../../core/model';
import marinaBaySands from './chapter-1/marina-bay-sands.json';
import gardensByTheBay from './chapter-1/gardens-by-the-bay.json';
import gardensByTheBayNight from './chapter-1/gardens-by-the-bay-night.json';
import merlionPark from './chapter-1/merlion-park.json';
import buddhaToothTemple from './chapter-2/buddha-tooth-temple.json';
import jooChiatShophouses from './chapter-2/joo-chiat-shophouses.json';
import lauPaSatMarket from './chapter-2/lau-pa-sat-market.json';
import lauPaSatMarketNight from './chapter-2/lau-pa-sat-market-night.json';
import marinaBaySkyline from './chapter-3/marina-bay-skyline.json';
import singaporeRiverQuay from './chapter-3/singapore-river-quay.json';
import singaporeRiverQuayNight from './chapter-3/singapore-river-quay-night.json';
import botanicGardensHeritage from './chapter-3/botanic-gardens-heritage.json';

// JSON imports are typed loosely (e.g. "camo": string): the files follow the Page shape
const page = (json: unknown) => json as Page;

/** Singapore — the first sketchbook: three chapters of three pages, three of them with a night. */
export const singapore: Country = {
  id: 'singapore',
  name: 'Singapore',
  chapters: [
    {
      id: 'chapter-01',
      title: 'Kỳ Quan Vịnh Marina',
      subtitle: 'The Bayfront Marvels — Vụ Án Đảo Quốc Sư Tử',
      prologue: [
        'Singapore, ngày 12 tháng 11...',
        'Một cuốn sổ ký họa màu nước thuộc về một kiến trúc sư bí ẩn đã bất ngờ biến mất.',
        'Ẩn bên trong những nét cọ thanh thoát là những manh mối tối mật chỉ có thể nhìn thấy qua một chiếc kính lúp quang học đặc biệt.',
        'Bạn là thám tử được mời tới để giải mã từng trang sách, tìm lại các manh mối và vén bức màn bí ẩn...',
      ],
      pages: [
        { day: page(marinaBaySands) },
        { day: page(gardensByTheBay), night: page(gardensByTheBayNight) },
        { day: page(merlionPark) },
      ],
    },
    {
      id: 'chapter-02',
      title: 'Phố Cổ & Di Sản Văn Hóa',
      subtitle: 'Heritage & Shophouses — Dấu Tích Thời Gian',
      prologue: [
        'Rời khỏi vùng vịnh hiện đại, dấu vết dẫn bước thám tử tiến sâu vào những con phố cổ ngàn năm văn hóa.',
        'Từ mái ngói chùa Phật Nha tại Chinatown, những căn shophouse Peranakan rực rỡ sắc màu Joo Chiat, đến hương vị Satay khói bốc ngây ngất tại chợ đêm Lau Pa Sat.',
        'Hãy cẩn thận soi kỹ từng góc phố, kiến trúc sư đang gửi gắm những lời nhắn mã hóa tiếp theo...',
      ],
      pages: [
        { day: page(buddhaToothTemple) },
        { day: page(jooChiatShophouses) },
        { day: page(lauPaSatMarket), night: page(lauPaSatMarketNight) },
      ],
    },
    {
      id: 'chapter-03',
      title: 'Trái Tim Sông Nước & Rừng Bách Thảo',
      subtitle: 'Riverside & Botanic Flora — Hồi Kết Cuốn Sổ',
      prologue: [
        'Chặng đường cuối cùng của cuộc phiêu lưu đã mở ra!',
        'Từ góc nhìn toàn cảnh đường chân trời Marina Bay Skyline, ngược dòng sông Singapore xuôi theo những con thuyền bumboat, tới cây đại thụ cổ kính tại Vườn Bách Thảo UNESCO.',
        'Lời giải đáp cuối cùng về tung tích của vị kiến trúc sư và bí mật lớn nhất của cuốn sổ đang chờ bạn khám phá!',
      ],
      pages: [
        { day: page(marinaBaySkyline) },
        { day: page(singaporeRiverQuay), night: page(singaporeRiverQuayNight) },
        { day: page(botanicGardensHeritage) },
      ],
    },
  ],
  // The paintings (1760 × 1240, the open sketchbook on a transparent margin)
  art: {
    'marina-bay-sands': require('../../../../assets/art/singapore/marina-bay-sands.png'),
    'gardens-by-the-bay': require('../../../../assets/art/singapore/gardens-by-the-bay.png'),
    merlion: require('../../../../assets/art/singapore/merlion.png'),
    'buddha-tooth': require('../../../../assets/art/singapore/buddha-tooth.png'),
    'joo-chiat': require('../../../../assets/art/singapore/joo-chiat.png'),
    'lau-pa-sat': require('../../../../assets/art/singapore/lau-pa-sat.png'),
    'marina-bay-skyline': require('../../../../assets/art/singapore/marina-bay-skyline.png'),
    'singapore-river': require('../../../../assets/art/singapore/singapore-river.png'),
    'botanic-gardens': require('../../../../assets/art/singapore/botanic-gardens.png'),
  },
};
