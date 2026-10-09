# Quy định hình ảnh: phong cách, khung hình, bố cục, xuất file

> Một phần của bộ quy định cho AI và người phát triển. Bắt đầu từ `AGENTS.md` ở gốc repo.

**Phong cách và màu sắc được tự do** theo từng nước, từng trang. Chỉ **khung hình và bố cục để giấu đồ** là bắt buộc,
vì game cần chúng để chạy đúng. Số liệu khung đo từ 9 bức tranh Singapore (`app/assets/art/singapore/`). Bộ
này là **một ví dụ** phong cách (màu nước tông dịu), không phải khuôn bắt buộc. Muốn xem bố cục mẫu thì mở:
`marina-bay-sands.webp` (cảnh trải qua cả hai trang), `merlion.webp` (một trang vẽ, một trang nhật ký),
`botanic-gardens.webp` (có lá ép và ghi chú tay).

## Mục lục
1. Các loại ảnh trong game
2. Phong cách tranh trang
3. Khung hình (bắt buộc)
4. Bố cục để giấu đồ
5. Tranh có bản đêm
6. Prompt mẫu cho công cụ tạo ảnh AI
7. Hậu kỳ, xuất file, kiểm tra
8. Ảnh mặt bàn
9. Sprite vật ẩn và icon app

---

## 1. Các loại ảnh trong game

| Loại | Định dạng | Tạo bằng | Quy định |
|---|---|---|---|
| **Tranh trang** (mỗi trang sổ một bức) | WebP có alpha, 1760 × 1240, ≤ 300 KB | vẽ tay hoặc AI, rồi hậu kỳ | mục 2–7 |
| **Mặt bàn** (nền sau cuốn sổ) | JPG + WebP có alpha | vẽ tay hoặc AI | mục 8 — dùng chung cho mọi nước |
| **Sprite vật ẩn** (mèo, chìa khóa…) | **SVG vector** trong code | viết tay trong `tools/sprites/ObjectSprite.tsx` | mục 9 — **không dùng ảnh bitmap** |
| **Icon app, splash, favicon, PWA** | PNG | **sinh tự động**: `npm run generate:icons` | mục 9 — không vẽ tay |

## 2. Phong cách tranh trang

Mỗi tranh là **một trang đôi trong cuốn sổ ký họa** (đúng với tên game *The Lost Sketchbook*). Vẽ gì trên trang giấy, và
vẽ theo phong cách nào, là **tự do**.

### Được tự do chọn (theo từng nước, thậm chí từng trang)

- **Màu sắc:** từ tông dịu, ít màu (như bộ Singapore) đến **rực rỡ, nhiều màu, tương phản mạnh**.
- **Chất liệu và nét:** màu nước, gouache, bút chì màu, bút kim tô màu, mực nho, bút dạ… Nét có thể mảnh hay đậm, chi
  tiết hay giản lược.
- **Không khí, ánh sáng:** nắng gắt, hoàng hôn, mưa, sương mù, lễ hội… (trang có bản đêm thì xem mục 5).
- **Bố cục:** tranh tràn trang hay tan dần ra giấy trắng; một cảnh trải hai trang hay một trang vẽ, một trang nhật ký.
- **Đồ dán nhật ký** (vé dán băng keo, lá ép, ghi chú tay, tem…) có hay không đều được. Đây là chỗ tốt để giấu vật.

Gợi ý, không bắt buộc: các trang **trong cùng một nước** nên có phong cách gần nhau, để cuốn sổ của nước đó liền mạch.
Đổi phong cách giữa các nước lại giúp mỗi nước có cá tính riêng.

### Bắt buộc (để game chạy đúng)

1. **Khung sổ đúng thông số** (mục 3): giấy, gáy sổ, góc bo, lề trong suốt.
2. **Vẫn là tranh vẽ tay trên giấy sổ**, không dùng ảnh chụp hay hình render 3D.
3. **Góc phải dưới để trống.** Không vẽ **logo, con dấu, chữ ký, watermark hay dòng ngày** ở đó — cũng không vẽ ở bất
   kỳ góc nào khác. Công cụ AI rất hay tự thêm những thứ này, nhất là khi lấy tranh Singapore làm mẫu: phải xóa sạch
   khi hậu kỳ (mục 7).
4. **Bố cục đủ chỗ giấu đồ** (mục 4).
5. **Trang có bản đêm thì tranh phải là cảnh ngày** (mục 5).
6. **Cấm:** khung hay viền vẽ trên giấy, đoạn chữ dài. Công cụ AI hay sinh **chữ vô nghĩa**: chữ trong tranh phải
   ngắn, đọc được, đúng chính tả, hoặc bỏ hẳn. **Không vẽ sẵn con vật hay đồ vật trùng loại với vật ẩn của trang**
   (mèo, cú, chìa khóa…): người chơi sẽ chạm nhầm vào hình vẽ đó và bị trừ điểm. Không vẽ người thật nhận ra được.
### Lưu ý khi dùng màu đậm, rực

Vật đang ẩn được **nhân (multiply)** lên tranh (`board/scene/paints.ts`), nên nó chỉ làm tối màu bên dưới:
- **Trên nền rực, nhiều màu:** vẫn ổn. Vật `chameleon` lấy màu tranh quanh nó và hòa vào; vật `ink` thành một mảng
  nâu xám tối hơn nền.
- **Trên mảng rất tối, gần đen:** vật gần như **biến mất**, không ai tìm được. Đừng đặt vật ở đó, hoặc đừng để mảng tối
  quá lớn ở vùng giấu đồ.
- **Trên giấy trắng:** vật `ink` và `chameleon` lộ rõ, nên chỉ hợp cho vật mực tàng hình.
- Tranh càng nhiều màu và chi tiết thì vật càng khó tìm. Chơi thử rồi chỉnh `camo`, `scale`, `radius` của từng vật
  (`docs/ai/add-country.md` §4) cho độ khó tương đương các nước khác.
- Giao diện và mặt bàn giữ tông giấy kem cho mọi nước. Tranh rực màu vẫn hợp, không cần đổi giao diện.

## 3. Khung hình (bắt buộc)

Camera, bóng đổ và hiệu ứng lật trang đều dựa vào khung sổ. **Tranh lệch khung thì game hiển thị sai.**

| Thông số | Giá trị (đo từ 9 tranh) |
|---|---|
| Kích thước ảnh | **1760 × 1240 px**, sRGB, có kênh alpha |
| Giấy (vùng pixel đục) | **x 88–1672** (sai số ±3 px), **y 270–969** (chính xác) → 1584 × 700 px = `TEMPLATE_PAPER` trong `board/useCamera.ts` |
| Gáy sổ | chính giữa giấy, **x ≈ 880** (lật trang quay quanh tâm khung giấy) |
| Góc bo của giấy | ≈ 48 px (`PAPER_CORNER` trong `board/scene/buildScene.ts`) |
| **Hai mép ngoài (trái & phải)** | **Tuyệt đối KHÔNG có nét xếp chồng nhiều trang**: cả mép trái và mép phải đều là cạnh giấy đơn phẳng, sạch sẽ, không có bất kỳ dải sọc lớp giấy dày hay bìa sách thừa nào. |
| Ngoài giấy | **alpha = 0 hoàn toàn**; mép cứng (0 pixel bán trong suốt), **không có bóng đổ** (game tự vẽ bóng) |

Game tìm khung giấy bằng hình chữ nhật bao các pixel có alpha ≥ 128 (`board/scene/analyze.ts`). Một vệt bóng hay vết
bẩn nửa trong suốt ngoài giấy cũng đủ làm lệch camera.

**Quy định bắt buộc về hai mép ảnh:** Cả hai mép (trái và phải) của cuốn sổ mở đều là **mép đơn phẳng của tờ giấy**, sạch sẽ, cắt sắc nét và bo góc 48 px. **Tuyệt đối KHÔNG vẽ hiệu ứng xếp chồng nhiều trang giấy** ở bất kỳ mép nào (không có nét lớp giấy ở mép trái, cũng không có ở mép phải, không có bìa sách hay gáy nhô ra). Khi công cụ AI tự sinh các nét sọc xếp chồng nhiều trang hoặc vẽ bìa gồ ghề ở mép, phải làm sạch hoàn toàn khi hậu kỳ để đưa về mặt giấy phẳng thuần khiết trước khi cắt mép ra alpha = 0.

**Cách làm chắc nhất:** đừng bắt AI vẽ cả cuốn sổ từ đầu. Hãy **giữ nguyên cuốn sổ của một tranh có sẵn** và chỉ thay
bức vẽ trên giấy. Có hai cách:
- dùng chế độ **chỉnh sửa ảnh** của công cụ AI, đưa tranh mẫu vào và yêu cầu giữ nguyên cuốn sổ (prompt ở mục 6);
- hoặc tạo riêng bức vẽ (tỉ lệ ≈ 2.26 : 1, ≥ 1584 × 700), rồi ghép lên một tranh mẫu đã xóa trắng giấy bằng phần mềm
  chỉnh ảnh (chế độ Multiply để giữ vân giấy và nếp gáy).

## 4. Bố cục để giấu đồ

Mỗi trang ngày giấu khoảng **10 vật** (6 vật chính, 1 bí mật, 3 bonus). Mỗi sprite rộng **≈ 26–70 px** trên
tranh (`0.058 × scale × 1760`). Tranh phải có đủ chỗ cho chừng ấy vật.

- **Vùng đặt vật:** x 0.1–0.9, y 0.27–0.74 (= x 175–1585, y 335–920 px). Nên có chi tiết **trải đều cả hai trang**.
- **Chỗ nấp có màu:** vùng chi tiết vừa phải như tán lá, ô cửa sổ, mái ngói, gợn nước, lan can, bàn ghế, đám đông nhỏ.
  Vật `chameleon` lấy màu tranh ngay quanh nó, nên **ở đó phải có màu**. Đặt trên giấy trắng thì nó lộ ngay; đặt trên
  mảng gần đen thì nó biến mất (mục 2, "Lưu ý khi dùng màu đậm").
- **Có vật che:** cột, thân cây, lan can, giỏ xe, dùng cho `occluder` (vật nấp phía sau).
- **Có mặt nước** cho vật `waterline` (rùa, rái cá, thuyền giấy). **Có trời hoặc mặt nước thoáng** cho vật `roam`
  (chim bay, sứa trôi, đom đóm).
- **Chừa một vùng giấy trắng hoặc wash rất nhạt**, thường ở phía trên hoặc trên trang nhật ký, cho vật **mực tàng
  hình** (thường là bí mật).
- **Không đặt chi tiết quan trọng ngay trên gáy** (x ≈ 840–920 px): tờ giấy gập ở đó khi lật trang.
- **Góc phải dưới** (x ≈ 1510–1670, y ≈ 820–960 px): để trống hoặc chỉ là nền tranh, không logo, dấu, chữ ký, ngày
  tháng. Vẫn giấu vật ở đó được, miễn là có chỗ nấp có màu.
- Không vẽ dày đặc kín trang. Kính lúp phóng 2.4×, nên tranh cần chỗ thở để người chơi phân biệt được vật ẩn với nét
  vẽ.

## 5. Tranh có bản đêm

Trang đêm **dùng lại đúng tranh của trang ngày**. Code phủ bóng tối lên cả ảnh, khoét vùng sáng theo `nightLights` và
vùng đèn pin quanh kính lúp, rồi vẽ trăng sao. Vì vậy:
- tranh vẫn vẽ **ban ngày hoặc hoàng hôn**, không tự tô tối;
- cần có **nguồn sáng hợp lý** để đặt `nightLights`: đèn đường, đèn lồng, cửa sổ, quầy hàng, chuỗi bóng đèn;
- trăng và sao do code vẽ, chủ yếu ở lề phía trên cuốn sổ: **không vẽ trăng sao vào tranh**;
- nên có chỗ cho sinh vật đêm: tán cây (cú, culi, chồn bay), mái nhà (cầy), bụi cây (đom đóm).

## 6. Prompt mẫu cho công cụ tạo ảnh AI

Viết prompt bằng **tiếng Anh**, vì hầu hết mô hình tạo ảnh hiểu tiếng Anh tốt hơn. Đưa kèm **một tranh mẫu** từ
`app/assets/art/singapore/` (giữ khung sổ, mục 3) và thay các chỗ `<…>`:

```text
Edit this image. Keep the open sketchbook exactly as it is: same size and position, same page edges, spine,
rounded corners, paper texture and fully transparent background. Replace only the drawing on the paper.

New drawing: a hand-drawn sketchbook spread of <PLACE, CITY, COUNTRY>, <WHAT IS SEEN: view, landmarks, street
life>, <drawn across both pages | drawing on the right page, journal page on the left>.

Style: <STYLE — pick or write one, see below>. <LIGHT: e.g. bright daylight | golden hour | misty morning>.
Plenty of medium-detail, coloured areas (foliage, windows, roof tiles, water ripples, railings, market stalls)
spread over both pages, and some blank or very light paper left <at the top | on the journal page>.
<OPTIONAL: on the left page, a taped vintage ticket / a pressed leaf held by washi tape and a short handwritten
note reading "<SHORT TEXT>".>

Do not draw: any seal, stamp, logo, signature, watermark, monogram or date — the reference image has a red seal and
a date in the bottom-right corner, leave that corner free of them. Also do not draw: animals, <SPRITE TYPES HIDDEN ON
THIS PAGE>, <night scenes — if this page has a night variant>, frames or borders, any other text. No photographs or
3D renders; nothing outside the sketchbook.
```

Một số mẫu cho chỗ `<STYLE>` (tự viết phong cách khác cũng được):

| Mẫu | Đoạn `<STYLE>` |
|---|---|
| Màu nước dịu (bộ Singapore) | `loose fine-liner ink lines in warm black-brown with light hatching; transparent watercolour washes in muted earth tones (yellow ochre, raw sienna, warm sand, Payne's grey, greyish indigo, pale terracotta, sage green); vignette composition fading into blank cream paper with irregular wash edges` |
| Màu nước rực rỡ | `confident ink lines; vivid, saturated watercolour in bold tropical colours (turquoise, vermilion, golden yellow, emerald, magenta) with rich layered washes and strong light-and-shadow contrast; colour fills most of both pages` |
| Gouache | `flat, opaque gouache painting in bright harmonious colours with crisp shapes and minimal outlines, slightly naive travel-poster feel` |
| Bút chì màu | `coloured-pencil drawing with visible strokes and paper grain, warm and lively palette, soft cross-hatched shading` |
| Bút kim + màu marker | `bold black fine-liner outlines with marker colouring in saturated tones, clean flat shadows, lively urban-sketch energy` |

Ghi chú khi dùng:
- Tạo nhiều phương án, chọn bức đáp ứng mục 4 (đủ chỗ nấp, đủ vùng trắng). Đẹp mà không giấu được đồ thì vẫn hỏng.
- **Luôn soi lại góc phải dưới** của ảnh nhận được: mô hình thường chép con dấu và dòng ngày từ tranh mẫu dù prompt đã
  cấm. Thấy là xóa (mục 7).
- Nếu công cụ không giữ được khung thì dùng cách ghép thủ công (mục 3).
- Mô tả địa danh đúng thực tế: không bịa kiến trúc cho một công trình có thật.

## 7. Hậu kỳ, xuất file, kiểm tra

1. **Khung:** đúng 1760 × 1240; góc giấy trên-trái ≈ (88, 270), dưới-phải ≈ (1672, 969); ngoài giấy trong suốt hoàn
   toàn, không bóng, không viền mờ.
2. **Dọn tranh:** xóa mọi **logo, con dấu, chữ ký, watermark, dòng ngày** ở góc phải dưới và các góc khác — công cụ AI
   rất hay tự thêm, nhất là khi lấy tranh Singapore làm mẫu. Xóa chữ vô nghĩa và con vật/đồ vật trùng loại với vật ẩn.
   Xóa xong phải tô lại nền cho liền, không để vết mờ hay ô trắng.
3. **Xuất:** lưu PNG (có alpha), rồi chuyển WebP:
   `cwebp -q 90 -alpha_q 100 -m 6 trang.png -o <art-key>.webp`. Mục tiêu **≤ 300 KB** (Singapore: 140–305 KB).
   **Không commit PNG.**
4. **Đặt file:** `app/assets/art/<nước>/<art-key>.webp`, tên kebab-case. Khai báo trong bảng `art` của nước
   (`docs/ai/add-country.md` §3).
5. **Thử trong game** (`cd app && npm run web`): camera ôm đúng khung giấy; lật trang không lệch gáy; vật `chameleon`
   hòa màu tự nhiên; vật mực tàng hình chỉ hiện qua kính lúp; trang đêm có đèn đúng chỗ.

## 8. Ảnh mặt bàn

Mặt bàn hiện **dùng chung cho mọi nước** và được gắn cứng trong `app/src/screens/Desk.tsx`:

| File | Thông số | Hiển thị |
|---|---|---|
| `app/assets/art/desk/paper-wash.jpg` | 2400 × 1018, ≈ 245 KB, không alpha | phủ kín màn hình, opacity 0.88, có lớp gradient giấy đè lên |
| `app/assets/art/desk/botany-left.webp`, `botany-right.webp` | rộng 760 px, nền trong suốt, 80–210 KB | góc dưới hai bên, 220 × 300, opacity 0.45; chỉ hiện khi màn hình rộng > 800; trang đêm mờ còn 0.2 |

- Phong cách: hoa lá nhiệt đới màu nước (lan, monstera, dương xỉ, hoa sứ) ở hai mép; **phần giữa để trống** vì cuốn sổ
  nằm đè lên đó. Tông màu dịu để không tranh chỗ với tranh trang, dù tranh đó dịu hay rực.
- Muốn mặt bàn riêng cho từng nước thì phải thêm trường vào `Country` và sửa `Desk.tsx` (`docs/ai/extending.md` mục
  B). **Đừng thay file dùng chung.**
- Ảnh chỉ cần đủ lớn so với cỡ hiển thị: lá rộng ≤ 760 px, JPG hoặc WebP.

## 9. Sprite vật ẩn và icon app

**Sprite** (con vật, đồ vật được giấu) là **hình vector** vẽ bằng code trong `tools/sprites/ObjectSprite.tsx`, khung
48 × 48. Từ đó game sinh ra màu cho từng kiểu ngụy trang. Quy trình đầy đủ: `docs/ai/add-country.md` §5. Về hình ảnh:
- phong cách dễ thương, đơn giản, **nhận ra được ở cỡ ~28 px**; viền là nét mực `#2c241b`, mảng màu phẳng;
- chỉ dùng `path`, `circle`, `ellipse`, `rect`, `line`, `polygon`, `polyline` với màu phẳng (generator chỉ đo các thẻ
  này). Không dùng ảnh nhúng, chữ hay gradient;
- vẽ con vật **có mắt** (`.eye`) nếu là sinh vật: mắt chớp khi đang trốn và phát sáng ban đêm.

**Icon app, splash, favicon, icon PWA** được sinh bằng `npm run generate:icons` (`tools/generate-icons.mjs`) từ một bố
cục HTML: kính lúp đồng với chú mèo tam thể (lấy từ chính sprite `cat`) nhìn qua tròng kính. Muốn đổi icon thì sửa bố
cục trong tool rồi chạy lại. Không thay file PNG bằng tay.
