# Kế hoạch tính năng: giữ chân người chơi

> Viết 10/2026 dựa trên code nhánh `react-native`.
> Ràng buộc chung: **không có backend**, mobile chơi offline hoàn toàn, chỉ dùng module có trong Expo Go,
> tuân thủ `AGENTS.md` (luật chơi trong `core/`, nội dung là dữ liệu, không làm hỏng bản lưu).

## Trạng thái (13/10/2026)

Đã gộp `main` (nhánh `feature/bao_work`): 50 linh vật Việt Nam, sprite to hơn 30 %, gợi ý 2 bước (thẻ chỉ có hình
bóng; bước 1 đọc tên và `clue`, bước 2 chỉ chỗ). Phần `main` làm trùng (random, `resolvePage`, đồ nghề, di cư, sao lưu)
dùng bản của nhánh này.

| Mục | Trạng thái | Còn lại |
|---|---|---|
| 0.1–0.3 Nền tảng (seed, `layOutPage`, `spots`) | **Đã làm**: mọi vật chính đứng yên trên trang ngày và cả 11 trang đêm có ít nhất 1 chỗ nấp khác (trừ dấu triện và vật `dayTwin`), soát trên tranh; test chặn chỗ nấp đè lên vật khác hay chỗ ghé của sinh vật lữ hành | Chơi thử các chỗ nấp đêm mới trên máy thật qua Expo Go |
| 0.4 ErrorBoundary, lưu âm thanh, sao lưu | **Đã làm**: cả xuất/nhập bản lưu (gộp, không ghi đè), `storage.persist()`, chặn khóa `__proto__` (cả ở cấp ngoài cùng), header bảo mật web | |
| 1.1 Tranh lên màu dần | **Đã làm** theo phương án lớp phủ, đã đo trước/sau (không tụt fps); tắt được trong menu Tạm Dừng | |
| 1.2 Phản ứng sinh vật | **Đã làm**: 4 kiểu (nhảy, bò ngang, quẫy nước, vỗ cánh) cho mọi sinh vật, kể cả linh vật Việt Nam mới | |
| 2.3 Biến thể hiếm | **Đã làm**: sinh vật ánh vàng 1/25 lượt, Sổ Tay viền vàng | |
| 2.1 Đồ nghề | **Đã làm**: Kính Tia Tím (chương 3 Singapore, 9 lời nhắn mực tàng hình), Lăng Kính Pha Lê (chương 2 Thái Lan, 9 nét vẽ chỉ hiện trong dải cầu vồng), Kính Lúp Hai Tròng (chương 2 Việt Nam, 10 nét vẽ tí hon, phải phóng to từ ×2) | |
| 2.2 Sinh vật di cư | **Đã làm**: 3 sinh vật lữ hành, 12 chỗ ghé, theo dõi trong Hộ Chiếu | |
| 3 Mảnh manh mối + Bảng Suy Luận | **Đã làm**: 11 chương, 37 mảnh manh mối. Id chương nay là `<nước>-0N` (trước đó trùng giữa các nước, giải một chương là giải luôn chương cùng số của nước khác) | |
| 4.1 Trang của ngày | **Đã làm**, chọn từ mọi trang ngày, kể cả trang chưa mở | |
| 4.2 Hộ chiếu | **Đã làm**: tem vàng làm bưu thiếp của nước đó có viền vàng | |
| 5.1 Trang bìa | **Đã làm**, sticker cũng hiện trên mặt bàn khi chơi | |
| 5.2 Kiểu nhiệm vụ | **Đã làm**: câu đố (Merlion, Yaowarat, Hội An), theo dấu (Phú Quốc), ngày và đêm (Lau Pa Sat, Yaowarat, Hội An đêm: 3 món đồ ban ngày đã đổi chỗ, tìm được thì hiện đường chúng đã đi). Hình bóng: mọi thẻ nay chỉ có hình bóng tới khi đọc | |
| 6.1 Bưu thiếp | **Đã làm** (Skia, chia sẻ bằng `expo-sharing` / Web Share API) | |
| 6.2 Mã thử thách | **Đã làm**: tạo từ trang chủ bằng cách chọn trang đã chơi, gửi mã hoặc chơi lập kỷ lục; nhập mã và link `?c=` đều yêu cầu người nhận đã chơi đúng trang đó (ngày/đêm riêng) | Bản app gửi kèm link khi build có `EXPO_PUBLIC_WEB_URL`: chờ tên miền chính thức (câu 4, mục 9) |

Kịch bản tổng dùng theo đề xuất: vị kiến trúc sư cố ý để lại cuốn sổ để tìm người kế nghiệp, kết ở Mũi Cà Mau. Mục 9:
câu 1–3 đã chốt theo đề xuất (tô màu dần bật mặc định cho mọi trang, tắt được; trang của ngày chọn cả trang chưa mở),
còn câu 4 (tên miền).

Đợt bổ sung 13/10/2026: thêm 31 chỗ nấp cho 8 trang đêm còn thiếu (Vườn Siêu Cây, Yaowarat, Doi Suthep,
Hạ Long, Nho Quế, Hội An, Đà Lạt, Bến Thành), mỗi chỗ có gợi ý riêng. Dấu triện vẽ sẵn, vật `roam`/`shy` và
các món `dayTwin` giữ nguyên vị trí/hành vi. Test nội dung kiểm tra mọi vật chính đứng yên ở trang đêm đều có
chỗ thay thế, với các ngoại lệ trên. Các phần bên dưới là thiết kế ban đầu; trạng thái triển khai thực tế ở bảng trên.

Kiểm tra đường đi cũng bắt một chỗ nấp cũ của chồn bay ở sông Singapore quá gần đoạn khép vòng của đom đóm;
đã dời xuống dưới dầm cầu. Test kiểm tra khoảng cách tới toàn bộ đoạn đường đi, kể cả đoạn nối cuối vòng.

Kiểm chứng đợt này: `npm run check` qua 961 test, `npm run build:web` thành công, `npm run test:screens`
qua 264/264 trường hợp trên 13 cỡ màn hình. Playwright mở được cả 8 trang đêm bổ sung bằng mã thử thách,
không lỗi trình duyệt; gợi ý ở Vườn Siêu Cây hiển thị đúng chỗ thay thế. Chưa thử trên điện thoại thật qua Expo Go.

## Mục lục

0. [Nền tảng dùng chung](#0-nền-tảng-dùng-chung)
1. [Cảm giác khi tìm thấy: tranh lên màu dần, sinh vật phản ứng](#1-cảm-giác-khi-tìm-thấy)
2. [Lý do quay lại trang cũ: đồ nghề, sinh vật di cư, biến thể hiếm](#2-lý-do-quay-lại-trang-cũ)
3. [Câu chuyện: mảnh manh mối và màn suy luận](#3-câu-chuyện-mảnh-manh-mối-và-màn-suy-luận)
4. [Thói quen mỗi ngày: trang của ngày và hộ chiếu thám tử](#4-thói-quen-mỗi-ngày)
5. [Sưu tầm, trang trí và kiểu nhiệm vụ mới](#5-sưu-tầm-trang-trí-và-kiểu-nhiệm-vụ-mới)
6. [Lan truyền: bưu thiếp và mã thử thách](#6-lan-truyền-bưu-thiếp-và-mã-thử-thách)
7. [Lộ trình, thứ tự làm](#7-lộ-trình)
8. [Bản lưu: tổng hợp các trường mới](#8-bản-lưu-tổng-hợp-các-trường-mới)
9. [Rủi ro và câu hỏi còn mở](#9-rủi-ro-và-câu-hỏi-còn-mở)

Mỗi tính năng ghi theo cùng một khung: **mục tiêu**, **trải nghiệm người chơi**, **dữ liệu**, **luật (`core/`)**,
**giao diện và vẽ**, **bản lưu**, **test**, **ước lượng**. Ước lượng tính theo ngày công của một người đã quen
codebase, chỉ để so sánh tương đối giữa các việc.

---

## 0. Nền tảng dùng chung

Nhiều tính năng bên dưới cần cùng vài viên gạch. Làm chúng trước để khỏi viết lại nhiều lần.

### 0.1. Số ngẫu nhiên có seed (`core/random.ts`)

Trang của ngày (4), mã thử thách (6), sinh vật di cư và biến thể hiếm (2) đều cần **ngẫu nhiên nhưng tái lập
được**: cùng seed thì ra cùng kết quả trên mọi máy, không cần server.

- `hashString(s: string): number`: FNV-1a 32 bit.
- `rng(seed: number): () => number`: mulberry32, trả số trong [0, 1).
- `pick<T>(r, items: T[]): T`, `shuffle<T>(r, items: T[]): T[]`: trả mảng mới.
- `localDay(date: Date): string`: `'2026-10-11'` theo **giờ máy** (không dùng `toISOString`, vì nó là giờ UTC:
  người chơi Việt Nam sẽ sang "ngày mới" lúc 7 giờ sáng).

Test: cùng seed thì cùng dãy số; `localDay` đúng ở mốc nửa đêm.

### 0.2. Dựng trang cho một lượt chơi (`core/resolvePage.ts`)

Hiện `openCase(page)` dùng thẳng `Page` trong JSON. Thêm một bước thuần ở giữa:

```ts
/** The page as this visit plays it: chosen spots, visiting creatures, rare variants, tool-gated objects. */
export function resolvePage(page: Page, ctx: VisitContext): Page
```

`VisitContext` gồm: `seed`, `day`, `tools` (đồ nghề đã có), `migrants` (sinh vật di cư ghé trang này hôm nay).
Kết quả vẫn là một `Page` bình thường, nên `detection`, `hints`, `buildScene` và renderer **không cần biết** có bước
này. Không truyền `ctx` (hoặc ctx rỗng) thì trả đúng trang gốc, để mọi thứ cũ chạy y như trước.

Chỗ gọi: `game/useNavigation.ts` / `useCase.ts`, ngay trước `openCase`. **Lưu ý**: `Board` dựng scene theo id trang
(cache `scenes`). Trang đã resolve khác trang gốc thì khóa cache phải kèm seed, nếu không sẽ vẽ vị trí cũ. Đọc
`docs/ai/performance-and-size.md` §3 trước khi sửa cache.

### 0.3. Vị trí thay thế cho vật (`HiddenObject.spots`)

Đổi vị trí khi chơi lại, trang của ngày và mã thử thách đều dựa vào trường này:

```ts
export interface ObjectSpot {
  x: number;
  y: number;
  radius?: number;              // defaults to the object's radius
  rotation?: number;
  scale?: number;
  occluder?: [number, number][];
  clue: string;                 // the clue describes WHERE the object is, so each spot needs its own
}
// HiddenObject
spots?: ObjectSpot[];           // alternative hiding places; the object's own x/y is spot 0
```

`clue` là bắt buộc vì `clue` hiện đang mô tả vị trí ("nép trong tán siêu cây ngoài cùng bên phải…"). Gợi ý cấp 1
đọc lại `clue`, nên đổi chỗ mà giữ clue cũ là chỉ sai đường.

- **Id vật không đổi** dù ở chỗ nào: `discovered` và Sổ Tay vẫn đúng.
- Vật có `roam` hoặc `shy` thì không có `spots` ở bản đầu (đường đi và hướng trốn gắn với tranh). `content.test.ts`
  bắt lỗi nếu có.
- Chơi lại trang (lần thứ 2 trở đi): seed = `hashString(pageId + soLanChoi)`. **Lần đầu luôn dùng vị trí gốc**,
  để chữ và độ khó người viết nội dung đã cân chỉnh vẫn là trải nghiệm đầu tiên.
- **Khối lượng nội dung**: mỗi vật cần 1–3 chỗ thay thế đã kiểm tra trên tranh. Nên làm dần theo trang, không chặn
  tính năng: trang chưa có `spots` thì vật đứng yên.

Test: `rules.test.ts` kiểm tra `resolvePage` chọn spot đúng theo seed, giữ id, thay clue; `content.test.ts` kiểm tra
mọi spot nằm trong khung giấy (x 88–1672, y 270–969 của ảnh 1760 × 1240, quy về 0–1) và không đè lên vật khác.

### 0.4. Việc còn nợ từ đánh giá trước (nên làm trước mọi tính năng)

| Việc | Vì sao |
|---|---|
| `ErrorBoundary` bọc `GameScreen` | Không có server báo lỗi; tính năng mới nhiều thì cần lớp bảo vệ này |
| Lưu cài đặt âm thanh | `useGame.ts` đang `useState(true)` |
| Xuất/nhập bản lưu + `navigator.storage.persist()` | Safari xóa localStorage sau 7 ngày không vào; các tính năng dưới làm bản lưu quý hơn |
| `readProgress` chặn key `__proto__` | Cần trước khi cho nhập file từ người khác |

**Ước lượng mục 0**: 4–5 ngày (chưa tính viết `spots` cho từng trang).

---

## 1. Cảm giác khi tìm thấy

### 1.1. Tranh lên màu dần

**Mục tiêu.** Mỗi lần chạm đúng đều thấy rõ, và người chơi nhìn tranh là biết mình đã đi được bao xa.
Ưu tiên số một vì nó cải thiện mọi giây chơi trên mọi trang có sẵn, không cần nội dung mới.

**Trải nghiệm.**
- Mở trang: tranh nhạt màu như bản phác chì có chút màu nước (không xám hẳn, vì xám hẳn trông "chết" và khó soi).
- Tìm được một vật: màu loang ra từ chỗ đó trong khoảng 1 giây, mép loang không đều như màu nước thấm giấy.
- Tìm đủ vật chính: phần còn lại của trang bừng màu một lượt, rồi mới hiện hộp thoại thắng.
- Chế độ khám phá sau khi thắng, và mở lại trang đã xong: tranh đủ màu ngay.
- Trang đêm: tắt hiệu ứng ở bản đầu (bóng tối đã làm nhiệm vụ "chưa thấy").
- Có tùy chọn tắt trong cài đặt (một số người soi theo màu, hoặc thấy khó).

**Cách vẽ (đề xuất phương án A, phải làm thử và đo trước khi chốt).**

Tạo một lần trên JS thread (`scene/paints.ts` / `buildScene.ts`):
- `paints.washed`: paint có `ColorFilter` ma trận màu giảm bão hòa (giữ khoảng 15–25 % màu, ngả nâu nhẹ).
- `scene.colorShader`: image shader của tranh, gắn vào một paint, kèm `MaskFilter` blur cho mép mềm. Có thể thêm
  `RuntimeEffect` nhiễu để mép loang méo như màu nước.

Mỗi khung (`render/book.ts`, worklet):
1. Vẽ tranh bằng `paints.washed`.
2. Với mỗi vật đã tìm: `drawCircle(x, y, r(t), colorPaint)` với `r(t)` tăng theo `bloom` trong `board/anim.ts`.
   Không tạo path mỗi khung, không `saveLayer`.
3. Sprite đang ẩn: dùng **cùng ColorFilter** nếu tâm sprite nằm ngoài mọi vòng màu, dùng paint màu nếu nằm trong.
   Đây là phép kiểm tra khoảng cách rẻ trên CPU, làm trong vòng lặp `for` có sẵn.

**Rủi ro lớn nhất: ngụy trang `chameleon`.** Sprite chameleon lấy màu của tranh xung quanh (`scene/analyze.ts`).
Tranh nhạt đi mà sprite giữ màu thì nó lộ ngay. Bước 3 xử lý việc này; phải kiểm tra bằng mắt trên mọi kiểu ngụy
trang (`ink`, `chameleon`, `invisible`), trong và ngoài kính lúp, vì kính lúp vẽ lại cảnh.

**Việc cần làm.**
1. Thêm trạng thái vào `FrameState`: danh sách vật đã tìm kèm thời điểm (đã có `foundAt` và `FOUND_FADE_MS`, xem có
   dùng lại được không), cờ `reveal` (đang/không dùng hiệu ứng), thời điểm thắng (cho đợt bừng màu cuối).
2. `render/book.ts`: các bước trên. `render/loupe.ts`: kiểm tra kính lúp vẽ đúng.
3. `useWarmUp.ts`: thêm khung warm-up có vòng màu, để GPU biên dịch shader trước (xem performance §2.8).
4. `scene/snapshotPage.ts`: snapshot lúc lật trang phải chụp đúng trạng thái màu hiện tại.
5. Đo bằng `benchmark-render.cjs` và `benchmark-page-turn.cjs`, ghi số trước/sau (performance §5), trên cả web và
   điện thoại thật qua Expo Go.

**Phương án dự phòng.** Nếu phương án A tụt khung hình trên máy yếu: giảm bão hòa ít hơn và chỉ loang màu khi
tìm thấy (không cần lớp tranh nhạt), hoặc tắt mặc định trên web.

**Bản lưu.** Không đổi. **Test.** Không có luật mới; thêm ảnh chụp vào `test:screens` nếu được.
**Ước lượng.** 4–6 ngày, phần lớn là làm thử, chỉnh và đo.

### 1.2. Sinh vật phản ứng khi bị bắt

**Trải nghiệm.** Chạm trúng con mèo: nó giật mình nhảy lên một nhịp rồi ngồi lại. Bướm vỗ cánh nhanh, cua bò ngang
một bước, cá quẫy đuôi. Kèm tiếng kêu có sẵn (`VOICE_OF`). Sinh vật **về lại đúng chỗ** sau phản ứng vì dấu "đã tìm"
vẫn đánh dấu ở đó.

**Dữ liệu.** Thêm vào `BestiaryEntry` (`content/bestiary.ts`):
```ts
reaction?: 'hop' | 'flutter' | 'scurry' | 'splash' | 'spin'; // how the creature startles when caught
```
Đồ vật không có reaction thì dùng hiệu ứng nảy nhẹ mặc định.

**Vẽ.** `buildScene.ts` chép `reaction` thành hằng số trên `SceneSprite`. `render/sprites.ts` (`spritePose`) cộng
thêm độ dịch, xoay, co giãn theo thời gian từ lúc tìm thấy, trong khoảng 600 ms. Lưu ý performance §2.6: sprite
đang có hoạt ảnh bộ phận sẽ vẽ từ hình thay vì từ sheet. Phản ứng chỉ chạy 600 ms nên chấp nhận được, nhưng chỉ
dùng phép biến đổi cả sprite nếu có thể.

**Ước lượng.** 2–3 ngày.

---

## 2. Lý do quay lại trang cũ

### 2.1. Đồ nghề mới mở khóa bí mật cũ

**Mục tiêu.** Thêm nhiều giờ chơi mà không cần vẽ tranh mới: trang đã xong có thêm thứ để tìm.

**Trải nghiệm.**
- Giải xong bí ẩn chương (mục 3) hoặc xong một nước thì nhận một dụng cụ. Đề xuất bộ đầu:

  | Dụng cụ | Nhận khi | Thấy được gì |
  |---|---|---|
  | Kính tia tím | Xong Singapore | Chữ và dấu vết bằng mực vô hình |
  | Lăng kính | Xong Thái Lan | Vật chỉ hiện trong dải cầu vồng của lăng kính |
  | Kính lúp đồng | Xong Việt Nam | Côn trùng tí hon, cần phóng to hơn mức thường |

- Mục lục trang (`PageIndex`) gắn nhãn **"Có bí mật mới"** cho trang có vật cần dụng cụ vừa nhận.
- Đang chơi trang có vật như vậy: kính lúp đổi kiểu (ví dụ ánh tím), có nút đổi dụng cụ nếu có nhiều cái.

**Dữ liệu.**
```ts
// core/model.ts
export type ToolId = 'uv-lens' | 'prism' | 'brass-loupe';
// HiddenObject
requires?: ToolId;   // only there for players who own this tool (always optional: isBonus or isSecret)
// Country (hoặc Chapter)
rewardTool?: ToolId; // given when the country (chapter) is finished
```

**Luật.**
- `toolsOwned(progress, countries): ToolId[]` trong `core/`, **suy ra** từ `sceneResults` / bí ẩn đã giải.
  Không lưu thêm trường, nên không có chuyện dữ liệu lệch.
- `resolvePage` bỏ các vật `requires` mà người chơi chưa có dụng cụ. `detection` và `hints` vì vậy không cần sửa.
- **Bắt buộc**: vật có `requires` phải là `isBonus` hoặc `isSecret`. Như vậy trang đã xong vẫn là đã xong, sao và
  điểm cũ không đổi. `content.test.ts` kiểm tra điều này.

**Vẽ.** Kính tia tím dùng lại cơ chế `camo: 'invisible'` (đã chỉ hiện trong kính lúp), thêm paint tím cho kính.
Lăng kính và kính lúp đồng là kiểu hiển thị mới: theo `docs/ai/extending.md` mục C và D, nên làm từng cái một.

**Bản lưu.** Không đổi: vật tìm được vẫn ghi vào `discovered`.
**Nội dung.** Mỗi trang cũ thêm 1–2 vật `requires`. Có thể ra dần theo đợt cập nhật.
**Ước lượng.** 3–4 ngày cho cơ chế + kính tia tím; mỗi dụng cụ sau 2–3 ngày; nội dung tính riêng.

### 2.2. Sinh vật di cư

**Trải nghiệm.** Một số sinh vật "đi du lịch": hôm nay con khỉ ở trang 3 Singapore, mai ở trang 7 Thái Lan. Sổ Tay
ghi "Đã gặp ở 4/6 nơi", gặp đủ thì được một dòng chuyện riêng của con vật đó.

**Dữ liệu** (trong `content/`, ví dụ `content/migrants.ts`):
```ts
export interface Migrant {
  id: string;                  // 'wandering-monkey'
  spriteType: SpriteType;
  name: string;
  story: string;               // shown once every spot has been seen
  spots: { pageId: string; spotId: string; x: number; y: number; radius: number; scale?: number; clue: string }[];
}
```

**Luật.**
- `migrantsOn(pageId, day, migrants)`: mỗi sinh vật chọn một chỗ mỗi ngày theo `rng(hashString(id + day))`.
  Trả về các vật `isBonus` để `resolvePage` thêm vào trang.
- Id vật: `${migrant.id}@${spotId}`, cố định vĩnh viễn như mọi id vật khác.
- Đổi giờ máy để gặp sớm cũng được: game offline, không ảnh hưởng ai.

**Bản lưu.** Không đổi: dùng `discovered`. Sổ Tay đếm số id `${migrant.id}@…` đã thấy.
**Test.** Cùng ngày cùng chỗ; mọi `pageId` trong `spots` tồn tại (`content.test.ts`).
**Ước lượng.** 2–3 ngày + nội dung.

### 2.3. Biến thể hiếm

**Trải nghiệm.** Khoảng 1/40 lượt chơi, một sinh vật phụ (`isBonus`) xuất hiện bản ánh vàng. Bắt được thì Sổ Tay có
khung vàng cho loài đó, kèm âm thanh và rung riêng.

**Luật.** `resolvePage` gắn `rare: true` theo `rng(seed)`. Hằng số `RARE_CHANCE = 1 / 40` (xác suất mỗi lượt) đặt
trong `core/`. Chỉ áp dụng cho sinh vật phụ, không cho vật chính.

**Vẽ.** Một `ColorFilter` vàng tạo sẵn trong `paints.ts`, áp lên paint của sprite hiếm. Thêm lấp lánh nhẹ nếu đo
thấy rẻ.

**Bản lưu.** Trường mới `rareFound?: string[]` (các `SpriteType` đã bắt được bản hiếm), xem mục 8.
**Ước lượng.** 2 ngày.

---

## 3. Câu chuyện: mảnh manh mối và màn suy luận

**Mục tiêu.** Người chơi chơi tiếp vì tò mò, không chỉ vì điểm. Biến tên game, *The Lost Sketchbook*, thành một
vụ án xuyên suốt: ai đã làm mất cuốn sổ, và họ đang ở đâu?

**Trải nghiệm.**
- Mỗi trang giấu thêm một **mảnh manh mối**: vé tàu rách, nửa bức thư, dấu triện lạ, tấm ảnh cũ… Không bắt buộc để
  qua trang, nhưng mục lục ghi "Chương 2: 3/5 mảnh".
- Đủ mảnh của chương thì mở **bảng suy luận**: các mảnh ghim lên bảng gỗ như phim trinh thám, kèm một câu hỏi
  ("Người họa sĩ đã đi đâu sau Chợ Bến Thành?") và 3–4 lựa chọn.
- Chọn sai: không bị phạt, một mảnh liên quan sáng lên làm gợi ý. Chọn đúng: đoạn kết chương, nhận dụng cụ (2.1)
  nếu chương đó có.
- Các chương nối thành một mạch lớn; nước cuối cùng hé lộ người làm mất cuốn sổ.

**Dữ liệu.**
```ts
// HiddenObject
isClue?: boolean;            // a fragment of the chapter's mystery: optional, like a bonus critter
// Chapter
mystery?: {
  question: string;
  options: { text: string; correct?: boolean; nudge?: string }[]; // nudge: shown when this wrong answer is picked
  epilogue: string[];        // paragraphs revealed once solved
};
```
Sprite mới cho mảnh manh mối (`torn-note`, `train-ticket`, `old-photo`, `wax-seal`…): làm theo
`docs/ai/add-country.md` §5, chạy `npm run generate`.

**Luật** (`core/mystery.ts`):
- `cluesOf(chapter)`, `cluesFound(chapter, progress)`, `canDeduce(chapter, progress)`.
- Vật `isClue` xử lý giống `isBonus` trong `isMainObject`, `hints` (không gợi ý), `leftovers` (chế độ khám phá).
  Cần sửa các hàm này và thêm test trong `rules.test.ts`.

**Giao diện.**
- Hộp thoại mới `screens/dialogs/Deduction.tsx` theo `docs/ai/extending.md` mục E (dùng `ModalShell`, thêm vào
  `boardActive`, `closeTopSheet`, `Gallery.tsx`, `test-screens.mjs`).
- `PageIndex`: số mảnh của mỗi chương. `QuestPanel`: mảnh manh mối hiện như vật phụ.
- Đoạn kết hiển thị bằng giao diện có sẵn của `StoryPrologue`.

**Bản lưu.** `solvedMysteries?: string[]` (id chương). Mảnh đã tìm nằm sẵn trong `discovered`.

**Nội dung, phần tốn công nhất.** Cần một "kịch bản tổng" trước khi viết từng chương: nhân vật họa sĩ, lý do đi qua
từng nước, manh mối nào dẫn tới đâu. Nên viết kịch bản tổng **trước khi** làm code, vì nó quyết định số mảnh mỗi
chương và dụng cụ nào thưởng ở đâu.

**Ước lượng.** Code 4–5 ngày; kịch bản tổng 2–3 ngày; mỗi chương 1 ngày nội dung (chữ + đặt mảnh vào JSON).

---

## 4. Thói quen mỗi ngày

### 4.1. Trang của ngày (dạng màn ngắn)

**Mục tiêu.** Lý do mở game mỗi ngày, vừa một lần chờ xe buýt (khoảng 2 phút).

**Trải nghiệm.**
- Trang chủ có thẻ "Trang của ngày": một **góc** của một trang (khoảng 1/3 diện tích), giấu 3–5 vật đã đổi vị trí.
- Mọi người chơi cùng một đề trong cùng một ngày (seed theo ngày), không cần server.
- Không chọn trang theo tiến độ của từng người (sẽ làm mỗi người một đề, hỏng mã thử thách). Màn chỉ là một góc
  nhỏ với vị trí đã xáo, nên không làm lộ nhiều trang chưa chơi.
- Có đồng hồ đếm lên (để so thời gian), không giới hạn giờ.

**Luật** (`core/daily.ts`):
- `dailyChallenge(day, pages): { pageId, seed, crop, objectIds }`: chọn trang có đủ vật trong một vùng cắt, chọn
  vùng cắt và vật theo seed. Chỉ dùng trang ban ngày có `spots`.
- Thắng khi tìm đủ vật trong `objectIds`. Điểm tính như thường, không ảnh hưởng `sceneResults` của trang gốc.

**Vẽ và điều khiển.** `useCamera` cần chế độ giới hạn camera trong `crop` (zoom tối thiểu vừa khung cắt, không kéo
ra ngoài). Phần ngoài vùng cắt phủ mờ. Đây là thay đổi trong `board/`, cần đo lại hiệu năng.

**Ước lượng.** 4–5 ngày (cần mục 0.3 xong trước).

### 4.2. Hộ chiếu thám tử

**Trải nghiệm.**
- Mỗi ngày xong "Trang của ngày" thì được đóng một con dấu của nước có trang đó lên cuốn hộ chiếu.
- Đủ 7 dấu của một nước thì nhận một bưu thiếp vẽ tay của nước đó (dùng làm khung bưu thiếp ở mục 6).
- **Không có chuỗi bắt buộc**: lỡ một ngày chỉ là thiếu một dấu, không mất gì. Không hiện thông báo kiểu "Bạn sắp
  mất chuỗi!". Chủ đích: người chơi casual quay lại vì thích, không vì sợ mất.

**Giao diện.** Hộp thoại `Passport.tsx`: mỗi trang hộ chiếu là một tháng, dấu đóng lệch ngẫu nhiên (theo seed ngày)
cho giống thật. Con dấu là sprite vector mới (một con cho mỗi nước).

**Bản lưu.** `stamps?: Record<string, { pageId: string; time: number }>`: khóa là `localDay`, `time` tính bằng giây.
Giữ tối đa 400 ngày gần nhất để bản lưu không phình. Xem mục 8.

**Ước lượng.** 3 ngày.

---

## 5. Sưu tầm, trang trí và kiểu nhiệm vụ mới

### 5.1. Trang bìa của tôi (sticker)

**Trải nghiệm.**
- Mọi sinh vật và đồ vật đã tìm thấy trở thành **sticker**. Người chơi kéo thả, xoay, phóng to sticker lên "trang bìa
  trong" của cuốn sổ: một trang giấy trống của riêng họ.
- Sticker hiếm (2.3) có viền vàng; mảnh manh mối (3) và con dấu (4.2) cũng dán được.
- Bản 2: hiện vài sticker ở mép mặt bàn (`Desk`) trong lúc chơi.

**Kỹ thuật.**
- Làm bằng component React Native trong hộp thoại riêng `screens/dialogs/MyCover.tsx`, **không** vẽ trên Board.
  Như vậy không ảnh hưởng đường vẽ mỗi khung.
- Sticker dùng `ui/SpriteIcon` (sprite tĩnh có sẵn). Cử chỉ dùng `react-native-gesture-handler` (pan, pinch,
  rotation) có sẵn.
- Danh sách sticker có được **suy ra** từ `discovered` + nội dung trang (`allPages`), không lưu riêng.

**Bản lưu.** `cover?: { s: string; x: number; y: number; r: number; k: number }[]`: `s` là SpriteType, `x/y` là
0–1 trên trang bìa, `r` là độ xoay, `k` là tỉ lệ. Tối đa 60 sticker.

**Ước lượng.** 4 ngày.

### 5.2. Kiểu nhiệm vụ mới

Làm cho các trang không lặp một kiểu "đọc tên, tìm vật". Mỗi kiểu là một trường dữ liệu tùy chọn; không có trường
thì trang chạy như cũ.

| Kiểu | Trải nghiệm | Dữ liệu | Luật |
|---|---|---|---|
| Câu đố | Thẻ hiện câu đố thay cho tên: "Thứ gì kêu tích tắc mà không có tim?" | `HiddenObject.riddle?: string` | Không đổi; tìm được thì hiện tên thật |
| Hình bóng | Thẻ chỉ hiện bóng đen của vật | `Page.quest?: 'silhouette'` | Không đổi; `SpriteIcon` tô đen |
| Theo dấu | Lần theo dấu chân mèo qua 4 điểm theo thứ tự | `HiddenObject.order?: number` | Mới: chỉ vật kế tiếp bắt được; chạm vật sai thứ tự không tính lỗi mà hiện nhắc |
| Ngày và đêm | Tìm 3 thứ khác nhau giữa trang ngày và trang đêm | Cần thiết kế riêng | Để sau |

Lưu ý: câu đố khác `clue`. `clue` đang mô tả vị trí và được dùng cho gợi ý cấp 1, nên giữ nguyên vai trò đó.

Kiểu "theo dấu" đổi luật, phải sửa `caseFile.ts` / `detection.ts`, thêm test trong `rules.test.ts`, cập nhật chữ
trong `QuestPanel` (`camoTrait`).

**Ước lượng.** Câu đố + hình bóng 2 ngày; theo dấu 2–3 ngày.

---

## 6. Lan truyền: bưu thiếp và mã thử thách

### 6.1. Bưu thiếp chia sẻ

**Mục tiêu.** Kéo người chơi mới mà không tốn tiền: mỗi lần chia sẻ là một lần quảng cáo.

**Trải nghiệm.**
- Hộp thoại thắng (`VictoryScreen`) có nút "Gửi bưu thiếp".
- Bưu thiếp 1200 × 630 px: một góc tranh (quanh vật bí mật hoặc sinh vật hiếm vừa bắt), khung bưu thiếp của nước
  (mục 4.2), con dấu, số sao, thời gian, tên trang, đường link web.
- Kèm một dòng chữ kiểu Wordle để dán vào tin nhắn:
  `Sổ Ký Họa · Singapore trang 3 · ⭐⭐⭐ · 1:42 · 🦎×2 — <link>`

**Kỹ thuật.**
- Dựng ảnh bằng Skia offscreen (có thể học cách `scene/snapshotPage.ts` dùng surface), rồi
  `encodeToBase64(JPEG, 85)`. Chữ trên ảnh cần font hỗ trợ dấu tiếng Việt: Playfair Display và Lora đều có; nạp
  font cho Skia bằng `useFonts` của Skia (hoặc `Skia.TypefaceFontProvider`) từ các file font đang dùng.
- Chia sẻ theo nền tảng, tách file theo `docs/ai/extending.md` mục I:
  - `platform/share.native.ts`: ghi file tạm bằng `expo-file-system`, mở bảng chia sẻ bằng `expo-sharing`. Cả hai có
    trong Expo Go; cài bằng `npx expo install expo-sharing expo-file-system`, rồi chạy `npx expo-doctor`.
  - `platform/share.web.ts`: `navigator.share({ files })` khi `navigator.canShare` cho phép, nếu không thì tải ảnh về
    và chép dòng chữ vào clipboard.
- Bọc `try/catch`: chia sẻ lỗi thì báo nhẹ, không bao giờ làm game crash.

**Ước lượng.** 3–4 ngày.

### 6.2. Mã thử thách

**Quyết định bổ sung 13/10/2026.** Trang chủ → Thử thách → Tạo thử thách: chọn trong những trang đã vào chơi
trong sổ, tạo một bố trí mới có seed và gửi mã, hoặc chơi để lập kỷ lục trước. Người nhận cũng phải đã chơi đúng
trang đó; không thể bỏ qua bằng link. Ngày và đêm tính riêng. “Đã chơi” không yêu cầu thắng, nhưng xem trang chủ,
intro hay một góc Trang của ngày không tính. Bản lưu thêm `playedPages?: string[]`, gộp bằng hợp; bản lưu cũ dùng
màn đã hoàn thành và trang đang chơi gần nhất làm bằng chứng, không suy ra từ màn được mở khóa hay vật của trang ngày.

Kiểm chứng phần tạo/nhận: `npm run check` qua 968 test; `npm run build:web` thành công; `npm run test:screens`
qua 303/303 trường hợp trên 13 cỡ màn hình, gồm danh sách tạo, chưa có màn đã chơi và mã bị khóa. Playwright dùng
hai hồ sơ độc lập: người tạo vào chơi rồi tạo/gửi mã và chơi lập kỷ lục; người nhận bị chặn cả link lẫn mã trước
khi chơi màn, nhận được sau một lượt vào chơi, lịch sử còn sau khi tải lại. Chia sẻ được giả lập trong kiểm tra.

**Trải nghiệm.**
- Sau khi xong một trang (từ lần chơi lại thứ hai, khi vật đã đổi chỗ), hoặc xong trang của ngày: có mã như
  `SG3-7K2P-142`.
- Bạn bè nhập mã ở trang chủ ("Nhập mã thử thách") để chơi **đúng đề đó** (cùng vị trí vật) và so thời gian.
- Trên web, mã nằm trong link `https://<tên-miền>/?c=SG3-7K2P-142`: bấm link là vào thẳng thử thách. Dòng chữ của
  bưu thiếp (6.1) gắn link này, tạo thành một vòng lan truyền.

**Định dạng mã** (`core/challenge.ts`, thuần, có test):
- `<mã nước><số trang>-<seed base32, 4 ký tự>-<thời gian tính bằng giây>`.
- Có `encodeChallenge` / `decodeChallenge`. Mã sai, trang không còn, hay nước chưa có trong bản cài thì trả lỗi rõ
  ràng để giao diện hiện "Mã không hợp lệ".
- Thời gian trong mã có thể bị sửa: chấp nhận, vì đây là thử thách bạn bè, không phải bảng xếp hạng.

**Phụ thuộc.** Cần mục 0.2 và 0.3; trang chưa có `spots` thì mã chỉ so thời gian trên vị trí gốc.

**Ước lượng.** 3 ngày.

---

## 7. Lộ trình

Thứ tự dựa trên: giá trị cho người chơi, phụ thuộc giữa các việc, và rủi ro kỹ thuật (làm thử việc rủi ro sớm).

| Giai đoạn | Nội dung | Ước lượng | Vì sao đặt ở đây |
|---|---|---|---|
| **0** | ErrorBoundary, lưu cài đặt, xuất/nhập bản lưu, `random.ts`, `resolvePage` | ~1 tuần | Nền cho mọi thứ sau |
| **1** | 1.1 Tranh lên màu dần, 1.2 phản ứng sinh vật, 6.1 bưu thiếp | ~2 tuần | Giá trị cao nhất, không cần nội dung mới; bưu thiếp kéo người chơi mới ngay |
| **2** | 3 Câu chuyện + 2.1 Đồ nghề (kính tia tím) | ~2 tuần code + nội dung | Hai việc bổ trợ nhau: giải bí ẩn thì nhận dụng cụ |
| **3** | 0.3 `spots` cho các trang, 4.1 trang của ngày, 4.2 hộ chiếu, 6.2 mã thử thách | ~2 tuần + nội dung | Cùng dựa vào vị trí thay thế |
| **4** | 2.2 di cư, 2.3 hiếm, 5.1 trang bìa, 5.2 kiểu nhiệm vụ | ~2 tuần | Làm sâu thêm khi nền đã vững |

Mỗi giai đoạn kết thúc khi qua hết `npm run check`, cộng `build:web` / `test:screens` / `generate` / `expo-doctor`
tùy phần đụng tới (`AGENTS.md` §6), và đã thử trên máy thật qua Expo Go.

**Đo hiệu quả khi không có backend.** Không đo được tỉ lệ quay lại một cách chính xác. Nếu muốn có số liệu, xem
phương án gửi sự kiện ẩn danh lên Google Sheets (gửi ngầm, `.catch(() => {})`): đủ để biết bao nhiêu người mở trang
của ngày, bấm chia sẻ, giải bí ẩn.

---

## 8. Bản lưu: tổng hợp các trường mới

Mọi trường đều **tùy chọn** và chỉ thêm, không đổi ý nghĩa dữ liệu cũ, nên **không cần tăng `SCHEMA_VERSION`**.
Làm theo `docs/ai/extending.md` mục H: thêm vào `GameProgress` trong `core/model.ts`, đọc an toàn trong
`readProgress`, ghi qua method mới của object `progress`, test trong `progress.test.ts`.

| Trường | Kiểu | Tính năng | Gộp hai bản lưu (nếu sau này đồng bộ) |
|---|---|---|---|
| `solvedMysteries` | `string[]` | 3 | Hợp |
| `rareFound` | `string[]` | 2.3 | Hợp |
| `stamps` | `Record<day, { pageId, time }>` | 4.2 | Hợp theo ngày, cùng ngày lấy `time` nhỏ hơn |
| `cover` | mảng sticker | 5.1 | Lấy bản sửa sau cùng (cần thêm `coverUpdatedAt`) |
| `playCount` | `Record<pageId, number>` | 0.3 (seed khi chơi lại) | Lấy lớn hơn |
| `playedPages` | `string[]` | 6.2: lịch sử trang đã vào chơi trong sổ, ngày/đêm riêng | Hợp |

Những thứ **suy ra, không lưu**: dụng cụ đã có, sticker đã có, mảnh manh mối đã tìm (nằm trong `discovered`), số nơi
đã gặp sinh vật di cư.

Id mới phát hành cũng là vĩnh viễn như id trang và id vật: id chương trong `solvedMysteries`, `spotId` của sinh vật
di cư, `ToolId`.

---

## 9. Rủi ro và câu hỏi còn mở

| Rủi ro | Mức | Cách xử lý |
|---|---|---|
| Tranh lên màu dần làm tụt khung hình hoặc làm lộ sprite `chameleon` | Cao | Làm thử trên 1 trang, đo trước/sau, có phương án dự phòng (mục 1.1) |
| Khối lượng nội dung (`spots`, mảnh manh mối, kịch bản, vật cần dụng cụ) lớn hơn khối lượng code | Cao | Mọi tính năng chạy được khi nội dung còn thiếu; ra nội dung dần theo đợt |
| Cache scene theo id trang không biết trang đã resolve khác nhau | Trung bình | Khóa cache kèm seed; đọc kỹ performance §3 |
| Nhiều hộp thoại mới làm trang chủ rối | Trung bình | Gom Hộ chiếu, Trang bìa, Sổ Tay vào một khu "Bàn làm việc" trên trang chủ |
| Kịch bản bí ẩn viết dở dang thì mạch truyện hụt | Trung bình | Viết kịch bản tổng trước khi làm code mục 3 |

**Câu hỏi cần chủ dự án quyết định**

1. Tranh lên màu dần: bật mặc định cho mọi trang, hay để từng nước chọn (`Country.reveal?: boolean`)?
2. Kịch bản tổng: ai là người làm mất cuốn sổ, và cái kết ở nước nào? (quyết định cách chia mảnh và dụng cụ)
3. Trang của ngày có được chọn từ trang người chơi **chưa** mở không? (đề xuất: có, vì chỉ là một góc nhỏ đã xáo vị trí)
4. Tên miền chính thức của bản web, để gắn vào bưu thiếp và link mã thử thách.

---

Khi bắt đầu làm một mục, cập nhật `AGENTS.md`, `docs/ai/` (`add-country.md` cho trường JSON mới,
`architecture.md` cho file mới) và `README.md` **trong cùng commit**, theo `AGENTS.md` §7. Làm xong mục nào thì
đánh dấu ở đây hoặc xóa mục đó khỏi file.
