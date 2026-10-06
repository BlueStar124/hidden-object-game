import type { Country, Page } from '../../../core/model';
import watArun from './chapter-1/wat-arun.json';
import watArunNight from './chapter-1/wat-arun-night.json';
import damnoenSaduak from './chapter-1/damnoen-saduak.json';
import grandPalace from './chapter-1/grand-palace.json';
import watPho from './chapter-2/wat-pho.json';
import yaowarat from './chapter-2/yaowarat.json';
import yaowaratNight from './chapter-2/yaowarat-night.json';
import ayutthaya from './chapter-2/ayutthaya.json';
import chiangMai from './chapter-3/chiang-mai.json';
import doiSuthep from './chapter-3/doi-suthep.json';
import doiSuthepNight from './chapter-3/doi-suthep-night.json';
import loyKrathong from './chapter-3/loy-krathong.json';

// JSON imports are typed loosely (e.g. "camo": string): the files follow the Page shape
const page = (json: unknown) => json as Page;

/** Thái Lan — cuốn sổ ký họa xứ Chùa Vàng: ba chương chín trang ký họa và ba màn đêm huyền ảo. */
export const thailand: Country = {
  id: 'thailand',
  name: 'Thái Lan',
  chapters: [
    {
      id: 'chapter-01',
      title: 'Bình Minh Chao Phraya',
      subtitle: 'Temple of Dawn & Kênh Rạch Hoàng Gia',
      prologue: [
        'Bangkok, ngày 14 tháng 12...',
        'Hành trình của vị kiến trúc sư bí ẩn tiếp tục đưa chúng ta đến với xứ sở Chùa Vàng.',
        'Trước mắt bạn là dòng sông Chao Phraya cuộn sóng với bảo tháp Wat Arun lộng lẫy, chợ nổi rộn rã thuyền hoa trái và Hoàng Cung uy nghiêm dát vàng rực rỡ.',
        'Hãy chuẩn bị kính lúp thám tử để mở ra những trang ký họa đầu tiên dọc dòng sông mẹ!',
      ],
      pages: [
        { day: page(watArun), night: page(watArunNight) },
        { day: page(damnoenSaduak) },
        { day: page(grandPalace) },
      ],
    },
    {
      id: 'chapter-02',
      title: 'Phố Cổ & Di Tích Ngàn Năm',
      subtitle: 'Heritage & Ancient Ruins — Dấu Tích Xiêm La',
      prologue: [
        'Rời bến sông nhộn nhịp, hành trình thám tử tiến sâu vào những không gian văn hóa trầm mặc và phố thị hoa lệ.',
        'Từ ngôi chùa Phật Nằm Wat Pho với nghệ thuật khảm xà cừ tinh xảo, phố Hoa kiều Yaowarat rực rỡ ánh đèn neon và mùi thơm ẩm thực đường phố, tới phế tích đá đỏ rêu phong tại cố đô Ayutthaya.',
        'Từng viên gạch cổ và bóng tường vôi đều đang cất giữ những trang mật thư vô giá...',
      ],
      pages: [
        { day: page(watPho) },
        { day: page(yaowarat), night: page(yaowaratNight) },
        { day: page(ayutthaya) },
      ],
    },
    {
      id: 'chapter-03',
      title: 'Phương Bắc & Ánh Sáng Ước Nguyện',
      subtitle: 'The Lanna Rose & Floating Lanterns — Hồi Kết Kỳ Thú',
      prologue: [
        'Chặng đường cuối cùng đưa chúng ta đặt chân lên miền sơn cước Chiang Mai — kinh đô cổ của vương quốc Lanna.',
        'Dạo bước qua ngọn tháp đồ sộ Wat Chedi Luang, vượt cầu thang rồng Naga lên đỉnh núi thiêng Doi Suthep ngập trong biển mây bồng bềnh, và hòa mình vào đêm hội hoa đăng Loy Krathong huyền ảo trên dòng sông Ping.',
        'Bức màn bí mật cuối cùng của cuốn sổ ký họa sắp sửa hé lộ dưới đôi mắt tinh tường của bạn!',
      ],
      pages: [
        { day: page(chiangMai) },
        { day: page(doiSuthep), night: page(doiSuthepNight) },
        { day: page(loyKrathong) },
      ],
    },
  ],
  // The paintings (1760 × 1240, the open sketchbook on a transparent margin)
  art: {
    'wat-arun': require('../../../../assets/art/thailand/wat-arun.webp'),
    'damnoen-saduak': require('../../../../assets/art/thailand/damnoen-saduak.webp'),
    'grand-palace': require('../../../../assets/art/thailand/grand-palace.webp'),
    'wat-pho': require('../../../../assets/art/thailand/wat-pho.webp'),
    yaowarat: require('../../../../assets/art/thailand/yaowarat.webp'),
    ayutthaya: require('../../../../assets/art/thailand/ayutthaya.webp'),
    'chiang-mai': require('../../../../assets/art/thailand/chiang-mai.webp'),
    'doi-suthep': require('../../../../assets/art/thailand/doi-suthep.webp'),
    'loy-krathong': require('../../../../assets/art/thailand/loy-krathong.webp'),
  },
};
