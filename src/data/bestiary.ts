import { SpriteType } from '../types/level';

export interface BestiaryEntry {
  name: string;
  kind: 'creature' | 'object';
  fact: string;
}

/** Field-guide entries for the "Sổ Tay Sinh Vật" album — one per sprite type. */
export const BESTIARY: Record<Exclude<SpriteType, 'seal'>, BestiaryEntry> = {
  // Sinh vật
  cat: { name: 'Mèo tam thể', kind: 'creature', fact: 'Mèo dành khoảng hai phần ba cuộc đời để ngủ — nên chúng rất giỏi nằm im ẩn mình.' },
  dog: { name: 'Cún con', kind: 'creature', fact: 'Khứu giác của chó nhạy hơn con người hàng chục nghìn lần.' },
  owl: { name: 'Cú mèo', kind: 'creature', fact: 'Cú có thể xoay đầu khoảng 270 độ vì mắt chúng không đảo được trong hốc mắt.' },
  dove: { name: 'Chim bồ câu', kind: 'creature', fact: 'Bồ câu có thể tìm đường về tổ từ nơi cách xa hàng trăm cây số.' },
  butterfly: { name: 'Bướm ngọc', kind: 'creature', fact: 'Bướm "nếm" vị bằng chân — chúng đậu lên lá để biết lá có ăn được không.' },
  squirrel: { name: 'Sóc', kind: 'creature', fact: 'Sóc hay quên chỗ giấu hạt, và nhờ vậy vô tình trồng thêm rất nhiều cây.' },
  turtle: { name: 'Rùa', kind: 'creature', fact: 'Mai rùa gắn liền với xương sống, nên rùa không bao giờ "chui ra" khỏi mai được.' },
  gecko: { name: 'Thạch sùng', kind: 'creature', fact: 'Ở Singapore thạch sùng được gọi là "cicak" — đọc gần giống tiếng kêu chắc chắc của chúng.' },
  chameleon: { name: 'Tắc kè hoa', kind: 'creature', fact: 'Tắc kè hoa đổi màu chủ yếu để "nói chuyện" và điều chỉnh thân nhiệt, không chỉ để ngụy trang.' },
  frog: { name: 'Ếch', kind: 'creature', fact: 'Ếch hầu như không uống nước — chúng hấp thụ nước qua da.' },
  snail: { name: 'Ốc sên', kind: 'creature', fact: 'Lưỡi ốc sên có hàng nghìn chiếc răng siêu nhỏ xếp thành hàng.' },
  ladybug: { name: 'Bọ rùa', kind: 'creature', fact: 'Một con bọ rùa có thể ăn hàng nghìn con rệp trong đời — người làm vườn rất quý chúng.' },
  mouse: { name: 'Chuột nhắt', kind: 'creature', fact: 'Chuột nhắt có thể lách qua khe hở chỉ cỡ một chiếc bút chì.' },
  koi: { name: 'Cá koi', kind: 'creature', fact: 'Được chăm sóc tốt, cá koi có thể sống vài chục năm.' },
  crab: { name: 'Cua', kind: 'creature', fact: 'Cua bò ngang vì các khớp chân của chúng gập sang hai bên.' },
  otter: { name: 'Rái cá lông mượt', kind: 'creature', fact: 'Rái cá lông mượt từng gần như biến mất khỏi Singapore, nay đã quay về sống ngay giữa sông và vịnh thành phố.' },
  kingfisher: { name: 'Chim bói cá', kind: 'creature', fact: 'Bói cá khoang cổ phổ biến ở Singapore không chỉ ăn cá mà còn săn cả cua và côn trùng.' },
  bat: { name: 'Dơi quả', kind: 'creature', fact: 'Dơi là loài thú duy nhất thật sự biết bay.' },
  monkey: { name: 'Khỉ đuôi dài', kind: 'creature', fact: 'Ở Singapore, cho khỉ hoang ăn là vi phạm pháp luật — để chúng không phụ thuộc vào con người.' },
  moth: { name: 'Bướm đêm', kind: 'creature', fact: 'Nhiều loài bướm đêm có cánh giống hệt lá khô hay vỏ cây để trốn chim săn mồi.' },
  dragonfly: { name: 'Chuồn chuồn', kind: 'creature', fact: 'Chuồn chuồn có thể bay lùi và lơ lửng tại chỗ như trực thăng.' },
  spider: { name: 'Nhện', kind: 'creature', fact: 'Xét theo cùng trọng lượng, tơ nhện bền chẳng kém gì thép.' },
  heron: { name: 'Diệc xám', kind: 'creature', fact: 'Diệc có thể đứng bất động rất lâu bên mép nước để rình cá.' },
  hornbill: { name: 'Chim mỏ sừng', kind: 'creature', fact: 'Chim mỏ sừng Phương Đông từng biến mất khỏi Singapore và đã tự quay về đảo Pulau Ubin vào những năm 1990.' },
  pangolin: { name: 'Tê tê Sunda', kind: 'creature', fact: 'Tê tê là loài thú có vảy sừng; khi sợ hãi chúng cuộn tròn như một quả bóng.' },
  'monitor-lizard': { name: 'Kỳ đà nước', kind: 'creature', fact: 'Kỳ đà nước là loài bò sát lớn thường bơi dọc kênh rạch và sông ở Singapore.' },
  jellyfish: { name: 'Sứa', kind: 'creature', fact: 'Sứa không có não, không có tim, và phần lớn cơ thể là nước.' },
  seahorse: { name: 'Cá ngựa', kind: 'creature', fact: 'Ở loài cá ngựa, con đực mới là con mang trứng và sinh con.' },
  mantis: { name: 'Bọ ngựa', kind: 'creature', fact: 'Bọ ngựa có thể quay đầu gần như nửa vòng để dõi theo con mồi.' },
  firefly: { name: 'Đom đóm', kind: 'creature', fact: 'Đom đóm nhấp nháy để tìm bạn đời — mỗi loài có một "mật mã" ánh sáng riêng.' },
  civet: { name: 'Cầy vòi hương', kind: 'creature', fact: 'Cầy vòi hương (musang) sống về đêm, hay trú trên mái nhà cũ và rất mê trái cây chín.' },
  sunbird: { name: 'Chim hút mật', kind: 'creature', fact: 'Chim hút mật lưng ô liu thường làm tổ treo lủng lẳng ngay ngoài ban công nhà dân Singapore.' },
  'slow-loris': { name: 'Culi Sunda', kind: 'creature', fact: 'Culi là loài linh trưởng sống về đêm với đôi mắt to tròn giúp nhìn rõ trong bóng tối.' },
  colugo: { name: 'Chồn bay Sunda', kind: 'creature', fact: 'Chồn bay có thể lượn xa hàng chục mét giữa các thân cây nhờ lớp màng da như chiếc áo choàng.' },
  'stick-insect': { name: 'Bọ que', kind: 'creature', fact: 'Bọ que ngụy trang giỏi đến mức còn đung đưa theo gió cho giống một cành cây thật.' },
  // Đồ vật
  key: { name: 'Chìa khóa cổ', kind: 'object', fact: 'Chìa khóa cổ có phần răng được rèn thủ công, khớp với đúng một ổ khóa.' },
  compass: { name: 'La bàn', kind: 'object', fact: 'Kim la bàn luôn chỉ theo từ trường Trái Đất, dẫn đường cho thủy thủ suốt nhiều thế kỷ.' },
  letter: { name: 'Thư niêm sáp', kind: 'object', fact: 'Con dấu sáp từng dùng để niêm phong thư và chứng minh ai là người gửi.' },
  'pocket-watch': { name: 'Đồng hồ quả quýt', kind: 'object', fact: 'Đồng hồ bỏ túi rất phổ biến trước khi đồng hồ đeo tay thịnh hành vào đầu thế kỷ 20.' },
  quill: { name: 'Bút lông ngỗng', kind: 'object', fact: 'Bút lông ngỗng là cây bút viết phổ biến ở châu Âu suốt hơn một nghìn năm.' },
  teacup: { name: 'Tách trà Peranakan', kind: 'object', fact: 'Đồ sứ Peranakan (Nyonya ware) nổi bật với sắc hồng, xanh ngọc và họa tiết phượng hoàng.' },
  'coin-pouch': { name: 'Túi tiền xu', kind: 'object', fact: 'Thời thuộc địa, người Singapore tiêu "đô la eo biển" (Straits dollar).' },
  spyglass: { name: 'Ống nhòm viễn vọng', kind: 'object', fact: 'Kính viễn vọng khúc xạ ra đời ở Hà Lan vào đầu thế kỷ 17.' },
  vase: { name: 'Bình gốm men lam', kind: 'object', fact: 'Gốm men lam được vẽ hoa văn bằng màu cobalt rồi mới tráng men và nung.' },
  scroll: { name: 'Cuộn kinh cổ', kind: 'object', fact: 'Kinh sách thời xưa thường được chép tay trên những cuộn giấy dài.' },
  'magnifying-glass': { name: 'Kính lúp', kind: 'object', fact: 'Kính lúp trở thành "biểu tượng" của nghề thám tử nhờ những câu chuyện về Sherlock Holmes.' },
  'paper-crane': { name: 'Hạc giấy', kind: 'object', fact: 'Theo truyền thuyết Nhật Bản, ai gấp đủ 1.000 con hạc giấy sẽ được một điều ước.' },
  'paper-boat': { name: 'Thuyền giấy', kind: 'object', fact: 'Thuyền bumboat trên sông Singapore xưa được vẽ đôi mắt ở mũi để "nhìn đường" tránh hiểm nguy.' },
  durian: { name: 'Sầu riêng', kind: 'object', fact: 'Sầu riêng không được mang lên tàu điện MRT vì mùi quá nồng — còn nhà hát Esplanade thì có biệt danh "quả sầu riêng".' },
  'fortune-cat': { name: 'Mèo thần tài', kind: 'object', fact: 'Người ta tin mèo thần tài giơ tay phải để gọi tài lộc, giơ tay trái để mời khách.' },
  'red-envelope': { name: 'Bao lì xì', kind: 'object', fact: 'Bao lì xì (ang pow) màu đỏ tượng trưng cho may mắn, thường được tặng dịp Tết Nguyên Đán.' },
  tiffin: { name: 'Cà mèn tingkat', kind: 'object', fact: 'Cà mèn tingkat nhiều tầng từng là "hộp cơm" quen thuộc của các gia đình Peranakan.' },
  satay: { name: 'Xiên satay', kind: 'object', fact: 'Mỗi tối, một đoạn phố cạnh chợ Lau Pa Sat được đóng lại để thành "Phố Satay".' },
  kite: { name: 'Diều wau bulan', kind: 'object', fact: 'Wau bulan — diều "trăng khuyết" — là loại diều truyền thống nổi tiếng của người Mã Lai.' },
  'vintage-camera': { name: 'Máy ảnh cổ', kind: 'object', fact: 'Những chiếc máy ảnh đầu tiên cần tới vài phút phơi sáng để chụp một tấm hình.' },
  hourglass: { name: 'Đồng hồ cát', kind: 'object', fact: 'Đồng hồ cát từng được dùng trên tàu biển để đo thời gian và ước tính tốc độ.' },
  deerstalker: { name: 'Mũ thám tử', kind: 'object', fact: 'Chiếc mũ hai lưỡi trai gắn liền với Sherlock Holmes nhờ các bức tranh minh họa truyện.' },
};

export function isCreature(type?: SpriteType): boolean {
  return !!type && type !== 'seal' && BESTIARY[type].kind === 'creature';
}
