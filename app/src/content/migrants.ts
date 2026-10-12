import type { Migrant } from '../core/model';

/**
 * The travelling creatures (core/migrants): each day each one is on one of these pages. Their ids and
 * the page ids of their spots are saved with every find: once published, permanent.
 */
export const MIGRANTS: Migrant[] = [
  {
    id: 'swallow',
    name: 'Chim Én Lữ Hành',
    spriteType: 'swallow',
    greeting: 'Chú én lữ hành ghé qua trang này hôm nay. Mai chú sẽ bay sang một trang khác!',
    story:
      'Mỗi mùa, chú én bay dọc bờ biển từ Singapore lên Bangkok rồi về tới mũi đất phương Nam. Vị kiến trúc sư bảo: “Đi theo đàn én là không bao giờ lạc đường về nhà.”',
    spots: [
      { pageId: 'marina-bay-sands', x: 0.67, y: 0.3, clue: 'Hôm nay chú én chao liệng trên khoảng trời bên phải những tòa tháp.' },
      { pageId: 'wat-arun', x: 0.8, y: 0.42, clue: 'Hôm nay chú én đậu phía trên hàng cây bên phải ngôi chùa.' },
      { pageId: 'hoi-an', x: 0.86, y: 0.3, clue: 'Hôm nay chú én bay qua khoảng trời hồng phía trên bên phải phố cổ.' },
      { pageId: 'ca-mau', x: 0.82, y: 0.3, clue: 'Hôm nay chú én bay trên biển, phía trên rừng đước bên phải.' },
    ],
  },
  {
    id: 'architect-cat',
    name: 'Mèo Của Vị Kiến Trúc Sư',
    spriteType: 'cat',
    greeting: 'Chú mèo tam thể đeo vòng cổ có khắc hình chiếc kính lúp. Hình như nó đang đi theo ai đó…',
    story:
      'Chú mèo tam thể là bạn đồng hành của vị kiến trúc sư suốt ba đất nước. Ở Mũi Cà Mau, nó chạy tới dụi đầu vào chân bạn trước cả chủ của nó.',
    spots: [
      { pageId: 'gardens-by-the-bay', x: 0.235, y: 0.715, clue: 'Hôm nay chú mèo nằm bên mép nước, dưới chân siêu cây ngoài cùng bên trái.' },
      { pageId: 'damnoen-saduak', x: 0.43, y: 0.6, clue: 'Hôm nay chú mèo ngồi trên chiếc thuyền chở xoài giữa kênh.', flip: true },
      { pageId: 'ho-hoan-kiem', x: 0.37, y: 0.45, clue: 'Hôm nay chú mèo đi dạo trên con đường ven hồ bên trái.' },
      { pageId: 'duc-ba', x: 0.735, y: 0.735, clue: 'Hôm nay chú mèo ngồi trên bãi cỏ ở góc phải quảng trường trước nhà thờ.' },
    ],
  },
  {
    id: 'traveller-butterfly',
    name: 'Bướm Hoàng Hậu Đường Xa',
    spriteType: 'butterfly',
    greeting: 'Cánh bướm cam viền đen: loài bướm bay xa hàng nghìn cây số mỗi năm.',
    story:
      'Bướm hoàng hậu bay theo gió mùa qua nhiều đất nước. Người ta nói ai gặp nó ở đủ mọi nơi nó dừng chân sẽ có một chuyến đi may mắn.',
    spots: [
      { pageId: 'merlion-park', x: 0.7, y: 0.72, clue: 'Hôm nay cánh bướm bay là là trên mặt nước, cạnh bờ kè gạch tròn bên phải.' },
      { pageId: 'doi-suthep', x: 0.6, y: 0.74, clue: 'Hôm nay cánh bướm đậu trên sân chùa phía trước bảo tháp vàng.' },
      { pageId: 'da-lat', x: 0.4, y: 0.57, clue: 'Hôm nay cánh bướm đậu trên những bậc cỏ của quảng trường.' },
      { pageId: 'mu-cang-chai', x: 0.55, y: 0.52, clue: 'Hôm nay cánh bướm bay trên ruộng bậc thang vàng óng ở giữa trang.' },
    ],
  },
];
