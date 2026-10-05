import type { Country, Page } from '../../../core/model';
import hoHoanKiem from './chapter-1/ho-hoan-kiem.json';
import haLong from './chapter-1/ha-long.json';
import haLongNight from './chapter-1/ha-long-night.json';
import trangAn from './chapter-1/trang-an.json';
import fansipan from './chapter-1/fansipan.json';

import muCangChai from './chapter-2/mu-cang-chai.json';
import nhoQue from './chapter-2/nho-que.json';
import nhoQueNight from './chapter-2/nho-que-night.json';
import phongNha from './chapter-2/phong-nha.json';

import hueCitadel from './chapter-3/hue-citadel.json';
import baNaHills from './chapter-3/ba-na-hills.json';
import hoiAn from './chapter-3/hoi-an.json';
import hoiAnNight from './chapter-3/hoi-an-night.json';
import ghenhDaDia from './chapter-3/ghenh-da-dia.json';

import ponagar from './chapter-4/ponagar.json';
import daLat from './chapter-4/da-lat.json';
import daLatNight from './chapter-4/da-lat-night.json';
import caoDai from './chapter-4/cao-dai.json';

import benThanh from './chapter-5/ben-thanh.json';
import benThanhNight from './chapter-5/ben-thanh-night.json';
import ducBa from './chapter-5/duc-ba.json';
import caiRang from './chapter-5/cai-rang.json';
import phuQuoc from './chapter-5/phu-quoc.json';
import caMau from './chapter-5/ca-mau.json';

// JSON imports are typed loosely (e.g. "camo": string): the files follow the Page shape
const page = (json: unknown) => json as Page;

/** Việt Nam — cuốn sổ ký họa dải đất hình chữ S: năm chương 19 trang ký họa và năm màn đêm huyền ảo. */
export const vietnam: Country = {
  id: 'vietnam',
  name: 'Việt Nam',
  chapters: [
    {
      id: 'chapter-01',
      title: 'Bắc Bộ — Đất Thăng Long & Non Nước Ngàn Năm',
      subtitle: 'The Northern Heritage — Cố Đô & Kỳ Quan Đá Vôi',
      prologue: [
        'Hà Nội, ngày 15 tháng 1...',
        'Cuốn sổ ký họa màu nước tiếp tục mở ra chuyến hành trình khám phá dải đất hình chữ S ngàn năm văn hiến.',
        'Từ Tháp Rùa cổ kính soi bóng hồ Gươm, kỳ quan vịnh Hạ Long với hàng ngàn đảo đá vôi kỳ vĩ, non nước Tràng An cõi tiên, tới nóc nhà Đông Dương Fansipan ngập trong biển mây.',
        'Hãy cầm kính lúp thám tử lên và bắt đầu giải mã những bí mật đầu tiên của đất Bắc!',
      ],
      pages: [
        { day: page(hoHoanKiem) },
        { day: page(haLong), night: page(haLongNight) },
        { day: page(trangAn) },
        { day: page(fansipan) },
      ],
    },
    {
      id: 'chapter-02',
      title: 'Miền Cao Tây Bắc & Đông Bắc — Kỳ Vĩ Mây Ngàn',
      subtitle: 'Highlands & Deep Canyons — Sóng Lúa & Hẻm Vực Tu Sản',
      prologue: [
        'Rời đồng bằng Bắc Bộ, dấu chân thám tử tiến sâu vào vùng núi rừng Tây Bắc và Đông Bắc hùng vĩ.',
        'Những dải sóng lúa bậc thang Mù Cang Chải vàng rực tận trời mây, dòng Nho Quế như sợi chỉ ngọc dưới chân đèo Mã Pí Lèng, và vương quốc thạch nhũ triệu năm kỳ bí trong lòng động Phong Nha.',
        'Những sinh vật quý hiếm nhất của đại ngàn đang ẩn mình chờ bạn tìm ra...',
      ],
      pages: [
        { day: page(muCangChai) },
        { day: page(nhoQue), night: page(nhoQueNight) },
        { day: page(phongNha) },
      ],
    },
    {
      id: 'chapter-03',
      title: 'Miền Trung — Di Sản Cố Đô & Phố Cổ Hoa Đăng',
      subtitle: 'Imperial Citadel & Ancient Lanterns — Dấu Tích Ngàn Năm',
      prologue: [
        'Bước qua dãy Hoành Sơn, hành trình đưa chúng ta đến miền Trung chan hòa nắng gió và trầm tích văn hóa.',
        'Từ lầu son gác tía uy nghiêm của Đại Nội Huế, dải lụa Cầu Vàng Bà Nà vươn giữa mây trời, phố cổ Hội An rực rỡ sắc màu đèn lồng và hoa đăng sông Hoài, tới ghềnh Đá Đĩa kỳ thú độc nhất vô nhị.',
        'Từng viên gạch cổ và bóng nước hoa đăng đều đang cất giữ những trang mật thư vô giá...',
      ],
      pages: [
        { day: page(hueCitadel) },
        { day: page(baNaHills) },
        { day: page(hoiAn), night: page(hoiAnNight) },
        { day: page(ghenhDaDia) },
      ],
    },
    {
      id: 'chapter-04',
      title: 'Duyên Hải & Cao Nguyên — Sương Mù & Tháp Cổ',
      subtitle: 'Cham Towers & Pine Mist — Biển Xanh & Phố Núi',
      prologue: [
        'Hành trình tiếp tục dọc theo dải duyên hải Nam Trung Bộ và vươn lên cao nguyên đất đỏ bazan lộng gió.',
        'Ngôi tháp Chăm Ponagar ngàn năm rực đỏ bên cửa sông, thành phố ngàn hoa Đà Lạt mờ ảo trong sương sớm và thông reo vi vu, cùng Tòa thánh Cao Đài rực rỡ biểu tượng vũ trụ linh thiêng.',
        'Bức tranh đa sắc của thiên nhiên và tín ngưỡng đang mở rộng trước mắt bạn!',
      ],
      pages: [
        { day: page(ponagar) },
        { day: page(daLat), night: page(daLatNight) },
        { day: page(caoDai) },
      ],
    },
    {
      id: 'chapter-05',
      title: 'Nam Bộ — Sài Gòn Hoa Lệ & Đất Rừng Phương Nam',
      subtitle: 'The Pearl of the Far East & Mekong Delta — Hồi Kết Hành Trình',
      prologue: [
        'Chặng đường cuối cùng của cuốn sổ ký họa đưa thám tử đặt chân lên vùng đất phương Nam trù phú và hào sảng!',
        'Từ nhịp sống sầm uất quanh tháp đồng hồ chợ Bến Thành và tường gạch đỏ Nhà thờ Đức Bà, bến sông chợ nổi Cái Răng tấp nập ghe xuồng, đảo ngọc Phú Quốc biển biếc cát vàng, tới cột mốc thiêng liêng nơi đất mũi Cà Mau tận cùng Tổ quốc.',
        'Trọn vẹn bức màn bí mật lớn nhất của cuốn sổ thất lạc đang chờ đợi bạn hé mở!',
      ],
      pages: [
        { day: page(benThanh), night: page(benThanhNight) },
        { day: page(ducBa) },
        { day: page(caiRang) },
        { day: page(phuQuoc) },
        { day: page(caMau) },
      ],
    },
  ],
  art: {
    'ho-hoan-kiem': require('../../../../assets/art/vietnam/ho-hoan-kiem.webp'),
    'ha-long': require('../../../../assets/art/vietnam/ha-long.webp'),
    'trang-an': require('../../../../assets/art/vietnam/trang-an.webp'),
    fansipan: require('../../../../assets/art/vietnam/fansipan.webp'),
    'mu-cang-chai': require('../../../../assets/art/vietnam/mu-cang-chai.webp'),
    'nho-que': require('../../../../assets/art/vietnam/nho-que.webp'),
    'phong-nha': require('../../../../assets/art/vietnam/phong-nha.webp'),
    'hue-citadel': require('../../../../assets/art/vietnam/hue-citadel.webp'),
    'ba-na-hills': require('../../../../assets/art/vietnam/ba-na-hills.webp'),
    'hoi-an': require('../../../../assets/art/vietnam/hoi-an.webp'),
    'ghenh-da-dia': require('../../../../assets/art/vietnam/ghenh-da-dia.webp'),
    ponagar: require('../../../../assets/art/vietnam/ponagar.webp'),
    'da-lat': require('../../../../assets/art/vietnam/da-lat.webp'),
    'cao-dai': require('../../../../assets/art/vietnam/cao-dai.webp'),
    'ben-thanh': require('../../../../assets/art/vietnam/ben-thanh.webp'),
    'duc-ba': require('../../../../assets/art/vietnam/duc-ba.webp'),
    'cai-rang': require('../../../../assets/art/vietnam/cai-rang.webp'),
    'phu-quoc': require('../../../../assets/art/vietnam/phu-quoc.webp'),
    'ca-mau': require('../../../../assets/art/vietnam/ca-mau.webp'),
  },
};
