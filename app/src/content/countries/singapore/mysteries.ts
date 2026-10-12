import type { Mystery } from '../../../core/model';

/**
 * The questions of the Singapore chapters, answered from the clue fragments (`isClue` objects) hidden
 * on their pages. The thread of the whole story: the architect is not missing — they left the
 * sketchbook on purpose, to find someone worthy of taking it on.
 */

/** Chapter 1: the map, the paper crane and the red envelope all point to Chinatown. */
export const BAYFRONT: Mystery = {
  question: 'Rời Vịnh Marina, vị kiến trúc sư đã đi đâu?',
  options: [
    { text: 'Ra sân bay Changi, rời Singapore ngay trong đêm', nudge: 'Nửa tấm bản đồ không hề vẽ đường băng nào cả.' },
    { text: 'Vào khu phố người Hoa, nơi ngôi chùa cất giữ một chiếc răng thiêng', correct: true },
    { text: 'Ra đảo Sentosa với những bãi biển đầy nắng', nudge: 'Chiếc hạc giấy nhắc tới một chiếc răng thiêng. Bãi biển nào cất giữ thứ đó?' },
  ],
  epilogue: [
    'Bạn ghép ba mảnh lại với nhau: con đường trên nửa tấm bản đồ, lời nhắn trong chiếc hạc giấy và tấm thiệp mời trong phong bao đỏ đều chỉ về chùa Phật Nha ở Chinatown.',
    'Điều lạ là mọi dấu vết đều được giấu rất cẩn thận, như thể vị kiến trúc sư muốn có người lần theo.',
  ],
};

/** Chapter 2: the spyglass, the letter and the coins show the trail is a test. */
export const HERITAGE: Mystery = {
  question: 'Vì sao vị kiến trúc sư cố tình để lại những món đồ này?',
  options: [
    { text: 'Để đánh lạc hướng một kẻ đang đuổi theo', nudge: 'Bức thư chưa gửi viết cho “người sẽ nhận cuốn sổ”, không phải cho kẻ thù.' },
    { text: 'Vì vội vàng nên đánh rơi dọc đường', nudge: 'Món nào cũng được giấu rất kỹ. Chẳng ai đánh rơi mà lại giấu kỹ đến thế.' },
    { text: 'Để thử thách người sẽ nhận cuốn sổ ký họa', correct: true },
  ],
  epilogue: [
    'Ống nhòm, bức thư và túi tiền xu kể cùng một câu chuyện: vị kiến trúc sư không chạy trốn ai cả.',
    'Cuốn sổ là một bài kiểm tra. Ai lần theo được từng trang ký họa sẽ được giao lại một điều quan trọng. Nhưng đó là điều gì?',
  ],
};

/** Chapter 3: the compass, the krathong and the palm-leaf book lead on to Bangkok. */
export const RIVERSIDE: Mystery = {
  question: 'Dấu vết cuối cùng ở Singapore dẫn thám tử đi đâu?',
  options: [
    { text: 'Bangkok, nơi dòng Chao Phraya chảy qua Chùa Bình Minh', correct: true },
    { text: 'Hà Nội, theo hướng kim la bàn chỉ', nudge: 'Hà Nội cũng ở phía bắc, nhưng đèn hoa đăng và cuốn sách lá buông đều đến từ một đất nước khác.' },
    { text: 'Ở lại Singapore, vì vị kiến trúc sư chưa hề rời đi', nudge: 'Túi tiền xu ở chợ Lau Pa Sat đã có sẵn đồng baht. Vị kiến trúc sư đã lên đường.' },
  ],
  epilogue: [
    'Đèn hoa đăng krathong, cuốn sách lá buông và chiếc la bàn chỉ về hướng bắc: vị kiến trúc sư đã sang Thái Lan.',
    'Ở góc trang cuối, một dòng chữ viết bằng mực tàng hình hiện lên dưới kính lúp: “Hẹn gặp ở Bangkok, ngày 14 tháng 12.”',
  ],
};
