import type { Mystery } from '../../../core/model';

/**
 * The questions of the Thailand chapters. The thread: the sketchbook was handed down — the architect
 * received it in Bangkok from their own teacher, long ago — and it is nearly a hundred years old.
 * The last chapter points home, to Vietnam.
 */

/** Chapter 1: the deerstalker, the paper umbrella and the teacher's letter. */
export const CHAO_PHRAYA: Mystery = {
  question: 'Cuốn sổ ký họa đã đến tay vị kiến trúc sư như thế nào?',
  options: [
    { text: 'Vị kiến trúc sư mua nó ở chợ nổi Damnoen Saduak', nudge: 'Chiếc ô giấy vẽ hai thầy trò cùng cầm chung một cuốn sổ, không phải một món hàng.' },
    { text: 'Người thầy của vị kiến trúc sư đã trao lại ở Bangkok, từ nhiều năm trước', correct: true },
    { text: 'Vị kiến trúc sư tự đóng nó từ những trang giấy cũ', nudge: 'Bức thư trong Hoàng Cung nói rõ: cuốn sổ được trao lại.' },
  ],
  epilogue: [
    'Chiếc mũ thêu “tặng trò nhỏ của thầy”, chiếc ô vẽ hai thầy trò, và bức thư dặn “khi tóc con bạc, hãy trao nó cho người xứng đáng”.',
    'Vị kiến trúc sư từng là một cô cậu học trò ở Bangkok. Giờ đến lượt ông bà đi tìm người xứng đáng.',
  ],
};

/** Chapter 2: the worn quill, the watch with three names and the yellowed sketch. */
export const HERITAGE_RUINS: Mystery = {
  question: 'Cuốn sổ ký họa này đã bao nhiêu tuổi?',
  options: [
    { text: 'Mới vài năm, từ chuyến đi gần đây của vị kiến trúc sư', nudge: 'Trang ký họa Ayutthaya đã ố vàng và ghi năm vẽ từ rất lâu.' },
    { text: 'Gần trăm năm, và đã qua tay nhiều người giữ sổ', correct: true },
    { text: 'Không ai biết, vì chỉ có một người từng vẽ trong đó', nudge: 'Chiếc đồng hồ khắc ba cái tên, mỗi tên một nét chữ.' },
  ],
  epilogue: [
    'Ngòi bút mòn vẹt, ba cái tên trên chiếc đồng hồ, trang ký họa gần trăm năm tuổi: cuốn sổ đã đi qua nhiều đời người giữ.',
    'Tên cuối cùng trên đồng hồ là của vị kiến trúc sư. Phía dưới còn một khoảng trống, như đang chờ một cái tên mới.',
  ],
};

/** Chapter 3: the conical hat, the compass pointing east and the toy cyclo lead home to Hà Nội. */
export const LANNA: Mystery = {
  question: 'Rời Thái Lan, vị kiến trúc sư sẽ đi đâu?',
  options: [
    { text: 'Ở lại Chiang Mai, sống giữa những ngôi chùa cổ', nudge: 'Chiếc nón lá thêu hai chữ “về nhà”. Chiang Mai không phải nhà của vị kiến trúc sư.' },
    { text: 'Sang Lào, theo dòng Mê Kông', nudge: 'Chiếc xích lô tí hon là đồ chơi quen thuộc của trẻ con phố cổ Hà Nội.' },
    { text: 'Về Việt Nam, về Hà Nội', correct: true },
  ],
  epilogue: [
    'Nón lá, la bàn chỉ hướng đông và chiếc xích lô gỗ của trẻ con Hà Nội: vị kiến trúc sư đang trên đường về quê.',
    'Dưới đáy chiếc krathong cuối cùng có dòng chữ nhòe nước: “Hà Nội, ngày 15 tháng 1. Hồ Gươm.”',
  ],
};
