# Thêm quốc gia, chương, trang, trang đêm, sinh vật

> Một phần của bộ quy định cho AI và người phát triển. Bắt đầu từ `AGENTS.md` ở gốc repo.

Thêm nội dung **không sửa** `core/`, `board/`, `screens/`. Ngoại lệ duy nhất là thêm sprite mới (§5). Số liệu "chuẩn"
dưới đây đo từ 12 trang của bộ Singapore. Giữ đúng các khoảng này để độ khó đồng đều giữa các nước.

## Mục lục
1. Checklist nhanh
2. Tranh (art)
3. Định nghĩa nước (`index.ts`) và đăng ký
4. File trang (JSON): trường, thứ tự vật, số liệu chuẩn
5. Sinh vật / đồ vật mới (sprite)
6. Trang đêm
7. Văn phong
8. Kiểm tra

---

## 1. Checklist nhanh

Ví dụ thêm Việt Nam, id nước `vietnam`:

- [ ] Tranh WebP 1760 × 1240 theo [art-style.md](art-style.md) → `app/assets/art/vietnam/<art-key>.webp` (§2)
- [ ] Mỗi trang một JSON → `app/src/content/countries/vietnam/chapter-N/<page-id>.json` (§4)
- [ ] `app/src/content/countries/vietnam/index.ts` export `vietnam: Country` (§3)
- [ ] Thêm vào **cuối** `COUNTRIES` trong `app/src/content/index.ts` (`COUNTRIES[0]` là cuốn mở đầu của người chơi mới)
- [ ] Sprite mới, nếu có (§5) → `npm run generate` ở gốc repo
- [ ] `cd app && npm run check && npm run test:screens`, rồi chơi thử `npm run web` (§8)
- [ ] Cập nhật `README.md` (danh sách nước/trang) nếu cần

## 2. Tranh (art)

**Đọc [art-style.md](art-style.md) trước khi tạo tranh**: khung hình đo chính xác, bố cục để giấu đồ, prompt mẫu cho
công cụ AI, hậu kỳ. **Phong cách và màu sắc tự do** theo từng nước (dịu hay rực, màu nước hay gouache…). Tóm tắt những
điều bắt buộc:

- **1760 × 1240**, giấy ở **x 88–1672 (±3 px), y 270–969**, gáy x ≈ 880; ngoài giấy trong suốt hoàn toàn, mép cứng,
  không bóng đổ. Lệch khung thì camera và hiệu ứng lật trang sai.
- **Dấu triện vẽ sẵn trong tranh**, ở góc phải dưới (`x 0.905, y 0.71`): đó là vật `artist-seal` (§4). Dòng ngày tùy.
- Có đủ chỗ nấp có màu cho ~10 vật (không đặt vật trên mảng gần đen), và một vùng giấy trắng cho vật mực tàng hình.
- Xuất WebP (`cwebp -q 90 -alpha_q 100 -m 6`), **≤ 300 KB**, không commit PNG. Tên file `art-key` dạng kebab-case,
  **không kèm đuôi** khi dùng trong JSON. Trang đêm **không cần tranh mới**.

## 3. Định nghĩa nước (`index.ts`) và đăng ký

Chép theo `countries/singapore/index.ts`:

```ts
import type { Country, Page } from '../../../core/model';
import hoiAnOldTown from './chapter-1/hoi-an-old-town.json';
import hoiAnOldTownNight from './chapter-1/hoi-an-old-town-night.json';
// …

// JSON imports are typed loosely (e.g. "camo": string): the files follow the Page shape
const page = (json: unknown) => json as Page;

/** Việt Nam — <một dòng mô tả cuốn sổ>. */
export const vietnam: Country = {
  id: 'vietnam',              // kebab-case, không đổi sau khi phát hành
  name: 'Việt Nam',           // hiện ở tab Mục Lục và trong Sổ Tay
  chapters: [
    {
      id: 'chapter-01',       // 'chapter-0N'
      title: 'Phố Cổ Hội An',
      subtitle: 'Lantern Town — Vụ Án Phố Đèn Lồng',   // "English — Tiếng Việt"
      prologue: ['Đoạn 1…', 'Đoạn 2…', 'Đoạn 3…'],     // 3–4 đoạn, hiện ở hồ sơ mở chương
      pages: [
        { day: page(hoiAnOldTown), night: page(hoiAnOldTownNight) },
        // { day: page(…) },
      ],
    },
  ],
  // The paintings (1760 × 1240, the open sketchbook on a transparent margin)
  art: {
    'hoi-an': require('../../../../assets/art/vietnam/hoi-an.webp'),
  },
};
```

Đăng ký trong `content/index.ts`: `import { vietnam } from './countries/vietnam';` rồi
`export const COUNTRIES: Country[] = [singapore, vietnam];`. Mọi thứ khác tự suy ra: tab nước trong Mục Lục, số trang
riêng từng nước ("Trang 3 / 9"), tên nước trong Sổ Tay. Singapore có 3 chương × 3 trang, 3 trang có bản đêm.

## 4. File trang (JSON)

### Trường của trang (`Page`)

| Trường | Bắt buộc | Quy ước |
|---|---|---|
| `id` | ✔ | kebab-case, **duy nhất trên mọi nước** (tiến độ lưu theo nó; trùng id thì app throw khi khởi động). Trang đêm: `<id-ngày>-night`. |
| `title` | ✔ | Tên trang ngắn, giàu hình ảnh, ≤ ~25 ký tự ("Bí Ẩn Vịnh Marina"). |
| `subtitle` | ✔ | `"Trang N — <địa danh>"`; trang đêm `"Trang N · Đêm — <…>"`. N là số trang trong cuốn sổ của nước đó. |
| `art` | ✔ | Khóa trong bảng `art` của nước. Trang đêm dùng **cùng** `art` với trang ngày. |
| `timeLimit` | ✔ | Số giây. Chuẩn: **240**. |
| `storyClue` | ✔ | 1–2 câu (~150–250 ký tự), hiện ở menu Tạm dừng và intro trang đêm. |
| `objects` | ✔ | Xem bên dưới. |
| `isNight`, `nightLights` | trang đêm | §6 |

### Thứ tự và thành phần `objects` (giữ đúng thứ tự: gợi ý đi theo thứ tự mảng)

1. **5 vật chính** (đôi khi 6): không có `isSecret` / `isBonus`. Gợi ý sẽ nhắm vào chúng theo đúng thứ tự này.
2. **`artist-seal`**, cũng là vật chính:
   `{"id":"artist-seal","name":"Dấu Triện Ký Họa","clue":"…vị trí…","x":…,"y":…,"radius":0.04,"score":150,"spriteType":"seal","foundText":"…"}`.
   Không có `camo` hay `scale`, vì nó là hình **vẽ sẵn trong tranh**.
3. **1 bí mật**: `"isSecret": true`, `"score": 300`, id `secret-<…>`, `clue` bắt đầu bằng `"[BÍ MẬT] "`. Thường dùng
   `invisible` hoặc `chameleon`. Mỗi trang **tối đa 1** (có test).
4. **Bonus**: `"isBonus": true`, `"score": 100`, id `bonus-<sprite>`. **3 cái ở trang ngày, 2 cái ở trang đêm.** Không bao
   giờ được gợi ý; chỉ người tinh mắt mới thấy.

Id vật chỉ cần **duy nhất trong trang** (các trang khác nhau được trùng, ví dụ `artist-seal`), nhưng **không được đổi
sau khi phát hành**. Vật ở trang đêm dùng tiền tố `night-`.

### Trường của vật (`HiddenObject`) và khoảng chuẩn

| Trường | Ý nghĩa | Chuẩn (Singapore) |
|---|---|---|
| `id`, `name`, `clue`, `foundText` | id; tên trên thẻ manh mối (≤ ~28 ký tự); gợi ý chỉ rõ vùng tìm (40–130 ký tự); lời khi tìm thấy, có kiến thức vui hoặc nối cốt truyện (≤ ~105 ký tự) | `foundText` có ở mọi vật |
| `x`, `y` | tọa độ 0–1 trên **cả ảnh**: `x = px / 1760`, `y = py / 1240` | phải nằm trên giấy: x ∈ [0.05, 0.95], y ∈ [0.22, 0.78]; thực tế x 0.115–0.906, y 0.275–0.73. Tránh sát gáy (x ≈ 0.5). |
| `radius` | vùng chạm, tính theo phần bề ngang trang. Đây là **vùng chạm cho ngón tay**, không phải kích thước hình | chính 0.026–0.04 · bonus 0.022–0.032 · seal 0.04. Test bắt buộc 0 < r < 0.2. Không nhỏ hơn 0.022. |
| `score` | điểm gốc | chính 100 / 120 / 150 (đôi khi 200) · seal 150 · bí mật 300 · bonus 100 |
| `spriteType` | hình vẽ (`SpriteType`) | Mỗi loại xuất hiện **tối đa 3 lần trong một nước** (seal không tính). Đổi đa dạng. |
| `scale` | 1 = 4.4% bề ngang trang | chính 0.36–0.85 · bonus 0.33–0.6 |
| `rotation`, `flip` | độ; lật ngang | xoay tự do −80…180 cho hợp chỗ nấp |
| `camo` | `"ink"` (mặc định) · `"chameleon"` (lấy màu tranh quanh vật) · `"invisible"` (chỉ thấy qua kính lúp) | chính: chủ yếu chameleon/ink, rất ít invisible · bí mật: hay dùng invisible/chameleon · bonus: chủ yếu chameleon |
| `shy` | `{period, offset?, from?}`: ló ra mỗi `period` giây; `from` là `below`/`above`/`left`/`right`/`jump` | period 6–8, mỗi vật một `offset` khác nhau để không cùng nhịp. **0–2 vật mỗi trang.** |
| `roam` | `{path:[[x,y],…], period, offset?, loop?, facing?, bob?}` | ≥ 2 điểm (test), period 13–22, `bob` cho vật bay. **0–2 vật mỗi trang.** `x/y` đặt bằng điểm đầu của `path`. |
| `occluder` | đa giác (≥ 3 điểm) phần tranh vẽ đè lên vật, để vật như nấp sau cột/thân cây | Thường 0–1 vật mỗi trang, và chỉ khi trong tranh có vật che thật |
| `waterline` | phần chiều cao sprite nằm dưới mặt nước (0–1) | 0.55–0.8, cho vật bơi/thuyền |
| `glow` | trang đêm: `false` để tắt mắt phát sáng | mặc định là phát sáng |
| `isSecret`, `isBonus` | xem ở trên | |

Mẫu một vật có đủ trường:

```jsonc
{
  "id": "wall-gecko", "name": "Thạch Sùng Tường Hồng",
  "clue": "Chú thạch sùng bám trên bức tường hồng cạnh khung cửa sổ tầng hai bên trái.",
  "x": 0.138, "y": 0.628, "radius": 0.032, "score": 150,
  "spriteType": "gecko", "scale": 0.55, "rotation": 4, "flip": false,
  "camo": "chameleon",
  "shy": { "period": 7, "offset": 1.5, "from": "below" },
  "occluder": [[0.25, 0.56], [0.28, 0.56], [0.29, 0.69], [0.25, 0.69]],
  "waterline": 0.55,
  "foundText": "Ở Singapore thạch sùng được gọi là \"cicak\"!"
}
```

(JSON thật không có comment. Chỉ ghi trường nào thật sự dùng.)

## 5. Sinh vật / đồ vật mới (sprite)

Chỉ làm khi trong 112 loại có sẵn (`SpriteType` trong `core/model.ts`) không có loại phù hợp. Ví dụ cho Việt Nam: nón lá,
đèn lồng, xích lô. Mỗi nước nên có bộ hình riêng (Thái Lan có 50 loại không dùng chung với Singapore) để người chơi không
gặp lại cùng một con vật, cùng một đồ vật ở mọi cuốn sổ.

1. **Vẽ** trong `tools/sprites/ObjectSprite.tsx`: thêm `case '<type>':` trả về
   `<svg viewBox="0 0 48 48" className="sprite-svg" fill="none">…</svg>`. Quy ước vẽ (comment đầu file):
   - viền là stroke màu mực `#2c241b` (`INK`), mảng màu là `fill`;
   - `.paint`: stroke có màu dùng như màu tô (đuôi, chân), được ngụy trang như fill; dùng `<Limb>` cho chi;
   - `.eye` (kèm `.pupil` bên trong): chớp mắt, phát sáng ban đêm; `.glow-spot`: đốm sáng ban đêm (đèn đom đóm);
   - `.wing` / `.tail` (`tail-cat`) / `.wave`: vỗ cánh, vẫy đuôi, vẫy tay khi đã tìm thấy;
   - phần tử có class hoạt ảnh **không được có `transform` riêng** (generator sẽ cảnh báo);
   - các biến thể ngụy trang không được đổi độ dày nét (generator sẽ throw).
2. **Khai báo** tên trong union `SpriteType` (`app/src/core/model.ts`), đặt đúng nhóm có comment.
3. **Mục Sổ Tay** trong `app/src/content/bestiary.ts`: `{ name, kind: 'creature' | 'object', fact }`, viết bằng tiếng Việt.
   Nếu thiếu, TypeScript sẽ báo lỗi. `kind: 'creature'` thì mắt phát sáng ở trang đêm.
4. **Tiếng kêu** (không bắt buộc): thêm `<type>: '<giọng>'` vào `VOICE_OF` (`app/src/platform/synth/voices.ts`). **Ưu
   tiên dùng lại giọng có sẵn**: mỗi giọng mới thêm một file WAV (~30–100 KB) cho bản app.
5. **Sinh lại**: `npm install` ở gốc repo (một lần) → `npm run generate` (gốc hoặc `app/`). Lệnh này ghi
   `app/src/generated/spriteArt.ts`, `app/src/generated/sounds.ts`, `app/assets/sounds/`. **Commit cả các file sinh ra.**
6. Xem lại icon của vật trên thẻ manh mối và trong Sổ Tay (`npm run web`).

## 6. Trang đêm

- File JSON riêng: `"id": "<id-ngày>-night"`, `"isNight": true`, **cùng `art`** với trang ngày (có test), có
  `"nightLights"`.
- `nightLights`: 10–13 đèn `{ "x", "y", "r", "color" }`; `r` là phần bề ngang (0.01–0.085), `color` dạng
  `"rgba(255, 190, 110, 0.55)"`. Đèn lớn cho đèn lồng/cửa sổ, đèn r ≈ 0.01 cho chuỗi bóng đèn.
- Bộ vật **khác** trang ngày (đặt id tiền tố `night-`), vẫn đủ `artist-seal` + 1 bí mật + 2 bonus. Hợp với ban đêm: cú,
  dơi, đom đóm (`roam` + `bob`), cầy, culi… Kính lúp thành đèn pin, sinh vật có mắt phát sáng (trừ khi `glow: false`
  hoặc `camo: invisible`).
- Ghép cặp trong `index.ts`: `{ day: page(x), night: page(xNight) }`. Trang đêm mở khóa khi trang ngày được ≥ 1 sao.
- `subtitle`: `"Trang N · Đêm — …"`; `storyClue` dùng làm lời mở đầu của trang đêm.

## 7. Văn phong

- Toàn bộ chữ trong game viết **tiếng Việt có dấu**; địa danh giữ tên gốc ("Lau Pa Sat", "Joo Chiat"). Giọng văn là hồ
  sơ thám tử, ấm áp, có kiến thức văn hóa thật (không bịa sự kiện lịch sử).
- `clue` chỉ ra **vùng** cần tìm (bên trái/phải, cạnh vật mốc trong tranh), không nói thẳng tọa độ.
- `foundText` là một câu: một kiến thức thú vị, hoặc một manh mối nối sang cốt truyện.
- `prologue` của chương: 3–4 đoạn, mở bằng bối cảnh, kết bằng lời mời điều tra.

## 8. Kiểm tra

```bash
cd app
npm run check        # content.test.ts soát mọi trang mới (tọa độ, radius, sprite, Sổ Tay, cặp ngày/đêm, id trùng…)
npm run web          # chơi thử: chạm đúng từng vật, xem vùng chạm có lệch không, ngụy trang có quá khó/dễ không
npm run test:screens # Mục Lục có thêm tab nước: kiểm tra trên 13 cỡ màn hình
```

Mẹo đặt tọa độ: mở tranh bằng trình xem ảnh có hiện tọa độ pixel, lấy `x = px / 1760`, `y = py / 1240` (làm tròn 3 chữ
số thập phân). Test chỉ bắt lỗi dữ liệu, không bắt được vật đặt sai chỗ trong tranh: luôn chơi thử.
