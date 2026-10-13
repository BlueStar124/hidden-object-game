import type { Migrant } from '../core/migrants';

/**
 * Wandering creatures that travel between pages according to the date.
 */
export const MIGRANTS: Migrant[] = [
  {
    id: 'wandering-monkey',
    name: 'Khỉ Đuôi Dài Du Ngoạn',
    spriteType: 'monkey',
    story: 'Chú khỉ tò mò thích nhảy nhót giữa các danh thắng và khu vườn bách thảo.',
    spots: [
      {
        pageId: 'marina-bay-sands',
        spotId: 'mbs',
        x: 0.28,
        y: 0.58,
        radius: 0.035,
        scale: 0.6,
        clue: 'Chú khỉ đuôi dài đang nghịch ngợm vắt vẻo trên tán cây gần lối đi vịnh Marina.',
      },
      {
        pageId: 'merlion-park',
        spotId: 'merlion',
        x: 0.42,
        y: 0.62,
        radius: 0.035,
        scale: 0.6,
        clue: 'Chú khỉ ngồi quan sát du khách chụp hình từ góc lan can đá bên tượng Ngư Sư.',
      },
      {
        pageId: 'botanic-gardens-heritage',
        spotId: 'botanic',
        x: 0.35,
        y: 0.55,
        radius: 0.035,
        scale: 0.6,
        clue: 'Chú khỉ ẩn mình trong tán lá rậm rạp của Vườn Bách Thảo Singapore.',
      },
    ],
  },
];

