import type { Mystery } from '../../../core/model';

/**
 * The questions of the Vietnam chapters — the end of the journey. The architect, born in Hà Nội,
 * is the third keeper of a sketchbook first drawn in by a court painter of Huế; the clues lead the
 * player south to Mũi Cà Mau, where the architect waits to hand it on: the player is the fourth keeper.
 */

/** Chapter 1: the red envelope, the old map, the engraved loupe and the paper crane on the summit. */
export const NORTH: Mystery = {
  question: 'Vì sao hành trình của cuốn sổ quay về Việt Nam?',
  options: [
    { text: 'Vì cuốn sổ bị đánh cắp và mang sang đây', nudge: 'Bức thư ở Bangkok nói thầy đã trao cuốn sổ, không ai đánh cắp cả.' },
    { text: 'Vì đây là quê nhà của vị kiến trúc sư', correct: true },
    { text: 'Vì vị kiến trúc sư chọn bừa một nơi để đi tiếp', nudge: 'Tấm bản đồ Đông Dương đã vẽ sẵn cả lộ trình từ đầu.' },
  ],
  epilogue: [
    'Phong bao lì xì viết “Hà Nội, Tết năm ấy, trước khi theo thầy đi xa”: vị kiến trúc sư sinh ra ở đây, rời quê từ thuở nhỏ.',
    'Chiếc kính lúp khắc chữ giống hệt kính của bạn, và hạc giấy trên đỉnh Fansipan dặn: hãy đi tiếp về phía Nam.',
  ],
};

/** Chapter 2: the lunch tiffin, the oil lamp and the quill in the cave. */
export const HIGHLANDS: Mystery = {
  question: 'Vị kiến trúc sư muốn người giữ sổ tiếp theo học được điều gì?',
  options: [
    { text: 'Vẽ thật nhanh để đi được thật nhiều nơi', nudge: 'Cặp lồng cơm còn ấm: người vẽ đã ngồi rất lâu ở một chỗ.' },
    { text: 'Chỉ vẽ những nơi nổi tiếng, đông người', nudge: 'Ruộng bậc thang, hẻm vực Nho Quế, lòng hang tối: đâu phải chỗ đông người.' },
    { text: 'Kiên nhẫn và nhìn thật kỹ từng nét vẽ', correct: true },
  ],
  epilogue: [
    '“Vẽ cả khi trời tối, vì vẻ đẹp không chờ ai.” “Mỗi nét vẽ là một lần nhìn kỹ hơn.”',
    'Đó cũng là điều bạn đã làm suốt hành trình: soi kính lúp thật chậm, không bỏ sót một góc tranh nào.',
  ],
};

/** Chapter 3: the dried lotus, the older deerstalker, the abacus and the keeper's notes. */
export const KEEPERS: Mystery = {
  question: 'Những ai đã giữ cuốn sổ trước bạn?',
  options: [
    { text: 'Một họa sĩ cung đình Huế, một thương nhân phố Hội, rồi vị kiến trúc sư', correct: true },
    { text: 'Chỉ có vị kiến trúc sư, người đầu tiên vẽ trong sổ', nudge: 'Chiếc đồng hồ ở Yaowarat khắc ba cái tên, và tên vị kiến trúc sư đứng cuối.' },
    { text: 'Một tên trộm tranh nổi tiếng khắp Đông Dương', nudge: 'Những người giữ sổ đều đội mũ thám tử, đâu phải mũ của kẻ trộm.' },
  ],
  epilogue: [
    'Người thứ nhất là họa sĩ cung đình Huế. Người thứ hai là thương nhân phố Hội đã sang Bangkok và nhận vị kiến trúc sư làm học trò. Người thứ ba là vị kiến trúc sư.',
    'Cuốn sổ chép tay ở Ghềnh Đá Đĩa viết: “Người thứ tư đang đọc những dòng này.”',
  ],
};

/** Chapter 4: the unlit sky lantern, the kite flying south and the bell engraved with coordinates. */
export const COAST: Mystery = {
  question: 'Vị kiến trúc sư hẹn gặp bạn ở đâu?',
  options: [
    { text: 'Trên đỉnh Fansipan, nóc nhà Đông Dương', nudge: 'Cánh diều bay về phương Nam. Fansipan ở tận cực Bắc.' },
    { text: 'Ở Mũi Cà Mau, nơi đất liền kết thúc', correct: true },
    { text: 'Trên đảo Phú Quốc, giữa biển khơi', nudge: 'Chiếc đèn trời vẽ một mũi đất liền nhô ra biển, không phải một hòn đảo.' },
  ],
  epilogue: [
    'Mũi đất nơi mặt trời mọc và lặn trên cùng một vùng nước, “nơi đất liền kết thúc”, tọa độ 8°37′ Bắc: đó là Mũi Cà Mau.',
    'Chặng cuối cùng đang chờ ở phương Nam.',
  ],
};

/** Chapter 5: the clues of the south lead to the meeting at the end of the land. */
export const SOUTH: Mystery = {
  question: 'Vì sao vị kiến trúc sư để lại cuốn sổ cho bạn?',
  options: [
    { text: 'Để bạn mang nó trả cho một bảo tàng', nudge: 'Chiếc mũ thám tử ở Cà Mau mới tinh, và gói trong tờ giấy ghi đúng tên bạn.' },
    { text: 'Vì vị kiến trúc sư đã già và quên mất nó', nudge: 'Không ai quên một cuốn sổ mà lại để manh mối dẫn đường suốt ba đất nước.' },
    { text: 'Để bạn trở thành người giữ sổ thứ tư và vẽ tiếp những trang còn trống', correct: true },
  ],
  epilogue: [
    'Hoàng hôn ở Mũi Cà Mau. Một cụ già tóc bạc đứng bên cột mốc, tay cầm chiếc kính lúp giống hệt của bạn. “Con đã đến rồi.”',
    'Vị kiến trúc sư khắc tên bạn vào mặt sau chiếc đồng hồ, ngay dưới tên mình, rồi trao lại cuốn sổ. Phía sau trang cuối là rất nhiều trang giấy trắng.',
    '“Thầy của ta đã đi khắp Đông Dương. Ta đi qua ba đất nước. Còn con, những trang tiếp theo là của con.”',
  ],
};
