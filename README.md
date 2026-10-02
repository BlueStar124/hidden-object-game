# 🔍 The Lost Sketchbook — Detective Hidden Object Adventure

Một trò chơi phiêu lưu tìm vật thể ẩn (Hidden Object Game) lấy cảm hứng từ phong cách mỹ thuật ký họa màu nước Singapore và tương tác vật lý 3D của ThreeUI / Meng To.

---

## 🌟 Tính Năng Phiên Bản 0.1 (MVP)

- **Cơ chế Kính Lúp Quang Học (Interactive Loupe):** Kéo rê kính lúp để soi các chi tiết màu nước, với hiệu ứng phóng đại thực tế, khúc xạ viền tròn và phản quang.
- **Quyển Sổ 3D Lật Trang (3D Physics Sketchbook):** Nghiêng theo chuột (Perspective Tilt), bóng đổ tiếp xúc và lật trang 3D mượt mà khi hoàn thành màn chơi.
- **Hệ Thống Màn Chơi Theo Dữ Liệu (Data-Driven JSON Levels):**
  - **Tọa độ chuẩn hóa ($0.0 \rightarrow 1.0$):** Chơi mượt mà trên mọi kích cỡ màn hình (Desktop, Laptop, Tablet, Mobile).
  - **Chapter 1:** Gồm 3 màn chơi (Marina Bay Sands, Gardens by the Bay, Merlion Park).
  - **Mỗi màn:** 5 manh mối chính + 1 cổ vật bí mật (Secret Object).
- **Hệ Thống Điểm & Combo:**
  - Nhân đôi, nhân ba điểm khi tìm liên tiếp trong vòng 6 giây ($\times 2, \times 3$).
  - Trừ điểm nhẹ khi click sai kèm hiệu ứng rung màn hình (Screen shake).
- **Hệ Thống Gợi Ý 3 Cấp Độ (Hint System):**
  - Cấp 1: Gợi ý văn bản mở rộng.
  - Cấp 2: Kính lúp rung nhẹ định hướng về phía vật thể.
  - Cấp 3: Vòng sóng radar phát sáng trực tiếp trên bản đồ.
- **Âm Thanh Tự Nhiên (Web Audio API):**
  - Tiếng chuông tìm trúng vật phẩm (TING!), âm click sai, âm thanh sột soạt lật trang giấy, và nhạc chiến thắng.
- **Lưu Tiến Độ Tự Động (localStorage):**
  - Lưu màn chơi đã mở khóa, xếp hạng sao ($\bigstar\bigstar\bigstar$), kỷ lục điểm số và thời gian.

---

## 🦎 Phiên Bản 0.2 — Sinh Vật & Đồ Vật Ngụy Trang

Đồ vật và con vật không còn "dán" nổi bật lên tranh nữa mà được **vẽ lẫn vào bức màu nước**:

- **4 kiểu ngụy trang:**
  - **Hòa vào nét vẽ (`ink`)** — màu mực nhạt, hòa (multiply) vào giấy như một phần của bản ký họa.
  - **Đổi màu theo nền (`chameleon`)** — game tự lấy mẫu màu tranh quanh vật và tô lại vật bằng đúng màu đó; chỉ còn lại đường viền mờ.
  - **Mực tàng hình (`invisible`)** — vô hình trên trang, chỉ phát sáng khi soi qua kính lúp.
  - **Nhút nhát (`shy`)** — con vật trốn đi, thỉnh thoảng mới ló ra/nhảy lên trong vài giây. Click lúc nó đang trốn không bị trừ điểm.
- **Nấp sau vật (`occluder`):** một mảnh tranh được vẽ đè lên con vật, nên nó như đang núp sau thân cây, cột nhà, giỏ xe đạp…
- **Dưới nước (`waterline`):** phần thân dưới mặt nước mờ dần vào tranh (rái cá, rùa, thuyền giấy…).
- **Mắt chớp chớp:** sinh vật ẩn thỉnh thoảng chớp mắt — dấu hiệu tinh ý để phát hiện.
- **Khi tìm thấy:** vật "nở" màu trở lại kèm quầng màu nước, cánh bướm vỗ, đuôi vẫy.
- **Sinh vật ẩn nấp (bonus):** mỗi trang có 3–4 sinh vật tí hon không bắt buộc (thạch sùng, cua, ốc sên, bọ rùa, nhện…) — cộng điểm, không có gợi ý, được lưu vào tiến độ và hiện ở mục lục.
- **17 hình vẽ mới:** thạch sùng, tắc kè hoa, ếch, ốc sên, bọ rùa, chuột, cá koi, cua, rái cá, bói cá, dơi, khỉ, bướm đêm, chuồn chuồn, nhện, hạc giấy, thuyền giấy.
- Bảng manh mối chỉ hiện **hình bóng** của vật cần tìm và nhãn kiểu ngụy trang của nó.

### Khai báo một vật ẩn trong file màn chơi (`app/src/content/countries/<nước>/chapter-N/<id-trang>.json`)

```jsonc
{
  "id": "wall-gecko",
  "name": "Thạch Sùng Tường Hồng",
  "clue": "Gợi ý hiển thị trên thẻ manh mối",
  "x": 0.138, "y": 0.628,        // tọa độ chuẩn hóa 0–1 trên trang sách
  "radius": 0.032,               // bán kính vùng click (theo bề ngang trang)
  "score": 150,
  "spriteType": "gecko",
  "scale": 0.55,                 // 1 = 4.4% bề ngang trang
  "rotation": 4, "flip": false,
  "camo": "chameleon",           // "ink" (mặc định) | "chameleon" | "invisible"
  "shy": { "period": 7, "offset": 1.5, "from": "below" }, // below | above | left | right | jump
  "occluder": [[0.25, 0.56], [0.28, 0.56], [0.29, 0.69], [0.25, 0.69]], // đa giác tranh vẽ đè lên
  "waterline": 0.55,             // phần dưới 55% chiều cao sprite chìm dưới nước
  "isBonus": true,               // sinh vật tùy chọn (không bắt buộc để qua màn)
  "foundText": "Lời thoại khi tìm thấy"
}
```

> Mẹo: tọa độ là tỉ lệ trên **cả khung ảnh 1760 × 1240** (kể cả lề trong suốt quanh cuốn sổ): mở tranh bằng trình xem ảnh có hiện tọa độ pixel, rồi lấy `x = px / 1760`, `y = py / 1240`.

---

## 🌙 Phiên Bản 0.3 — Trang Đêm, Sổ Tay Sinh Vật & Tối Ưu Mobile

- **22 hình vẽ mới, bớt trùng lặp:** diệc xám, chim mỏ sừng, tê tê, kỳ đà nước, sứa, cá ngựa, bọ ngựa, đom đóm, cầy vòi hương, chim hút mật, culi, chồn bay, bọ que, sầu riêng, mèo thần tài, bao lì xì, cà mèn tingkat, xiên satay, diều wau bulan, máy ảnh cổ, đồng hồ cát, mũ thám tử. Tổng cộng 57 loại, mỗi loại xuất hiện tối đa 3 lần trên 12 trang.
- **Sinh vật di chuyển (`roam`):** đom đóm, sứa, chim mỏ sừng bay qua lại, bao lì xì trôi sông… Phải bắt đúng chỗ nó đang ở.
- **3 Trang Đêm** (Vườn Siêu Cây, Lau Pa Sat, Sông Singapore) — mở khóa khi hoàn thành trang ngày tương ứng. Kính lúp thành **đèn pin**, trang tối om, chỉ có đèn trang trí và **mắt thú phát sáng** giúp định hướng.
- **Tiếng kêu riêng** cho từng con vật/đồ vật khi tìm thấy (meo, ộp ộp, tiếng "chắc chắc" của thạch sùng, tiếng sứ ting…), tổng hợp bằng Web Audio.
- **Sổ Tay Sinh Vật:** bộ sưu tập mọi loài & cổ vật từng phát hiện, kèm kiến thức thú vị và các trang có loài đó.
- **Soi Tiếp:** thắng màn rồi vẫn có thể soi tìm nốt sinh vật/bí mật còn sót (không tính giờ, không trừ điểm, vẫn ghi vào Sổ Tay).
- **Chống click bừa:** click sai 4 lần trong 3 giây thì kính lúp mờ hơi nước 3 giây.
- **Màn hình Hết Giờ** (trước đây hết giờ game đứng yên, không báo gì).
- **Mobile:**
  - Modal mở đầu có nút bắt đầu luôn cố định ở đáy, phần nội dung cuộn được (trước đây bị đẩy khỏi màn hình). Màn chiến thắng cũng vậy.
  - Điện thoại dọc tự phóng to trang sách 2.2× (vuốt ngang để xem), điện thoại ngang 1.6×; có nút phóng to/thu nhỏ (1×–3×).
  - Kéo kính lúp sát mép màn hình thì trang tự cuộn theo.
  - HUD và bảng manh mối gọn lại cho màn nhỏ; dùng `100dvh` để không bị thanh địa chỉ che.

### Trường mới trong file màn chơi

```jsonc
{
  "roam": {
    "path": [[0.46, 0.63], [0.5, 0.6], [0.55, 0.61]], // đường đi (tọa độ chuẩn hóa)
    "period": 14,        // giây cho một vòng
    "loop": true,        // true: đi vòng khép kín; false: đi rồi quay lại
    "facing": "left",    // hướng hình vẽ gốc, sprite tự quay theo hướng đi
    "bob": true          // nhấp nhô khi bay
  },
  "glow": false          // trang đêm: tắt mắt phát sáng cho riêng vật này
}
```

Trang đêm là một file JSON riêng với `"isNight": true` và `"nightLights"` (danh sách `{ x, y, r, color }` các đèn trang trí). Nó dùng chung bức tranh (`"art"`) với trang ngày, và được ghép cặp với trang ngày trong file `index.ts` của nước đó: `{ day: …, night: … }`.

---

## 📱 Phiên Bản 0.4 — App iOS · Android · Web (React Native / Expo)

Thư mục [`app/`](app/README.md) là bản **Expo (React Native)** của game: một mã nguồn chạy thành app iOS, app Android và bản web. Từ bản 0.5 đây là bản duy nhất (bản web Vite đầu tiên đã nén vào `archive/`).

- Cuốn sổ vẽ bằng **Skia** trên UI thread (web: CanvasKit) — kéo kính lúp, zoom, sinh vật di chuyển đều mượt 60 khung hình/giây.
- **Chụm hai ngón** để zoom (nút +/− đi từng 0.1×), kéo để di chuyển quanh trang; cầm **cán kính lúp** để rê mà không che tròng kính.
- **Thả kính lúp ở đâu thì soi ngay tâm kính ở đó**, hoặc **chạm** thẳng vào chỗ muốn soi. Thả kính ra ngoài bức tranh (mặt bàn) thì không tính lần soi, không bị trừ điểm.
- Khóa **màn hình ngang**; rung khi tìm thấy/soi sai; tự tạm dừng khi rời app; cài được như app trên web (PWA).
- **Lật trang như sổ thật**: trang sau thì tờ bên phải lật qua trái, trang trước thì tờ bên trái lật qua phải. Tờ giấy cong theo phối cảnh, mặt sau in nửa trang mới, có bóng đổ lên trang bên dưới; camera lùi nhẹ cho tờ giấy không bị khung cắt. Trang kế bên được giải mã và dựng sẵn khi đang chơi, nên lúc lật không bị khựng.

```bash
cd app && npm install && npm start   # quét QR bằng Expo Go
```

Chi tiết cách chạy, kiến trúc và phát hành: [app/README.md](app/README.md).

---

## 🛠️ Cài Đặt & Chạy Game

Game chạy bằng bản app trong [`app/`](app/README.md) (iOS · Android · web):

```bash
cd app
npm install
npm run web          # bản web tại http://localhost:8081
npm start            # app trên điện thoại (Expo Go)
```

`npm install` ở thư mục gốc chỉ cần cho **công cụ** trong `tools/` (sinh lại hình vẽ, âm thanh, icon: `npm run generate`, `npm run generate:icons`).

Giao diện web cũ dựng bằng Vite không còn dùng: đã nén vào [`archive/web-vite.zip`](archive/web-vite.zip), kèm hướng dẫn khôi phục trong file `README-web-vite.md` bên trong.

---

## 🧱 Cấu Trúc Mã Nguồn (từ bản 0.5)

```
hidden-object-game/
├── app/                        ← game (Expo: iOS · Android · web) — mọi thứ được phát hành
│   ├── assets/art/             ← tranh: <nước>/ (các trang sổ), desk/ (mặt bàn)
│   └── src/
│       ├── core/               luật chơi, thuần TypeScript: mô hình dữ liệu, phát hiện, điểm,
│       │                       gợi ý, hồ sơ vụ án, chuyển động sinh vật, lưu tiến độ
│       ├── content/            nội dung: countries/<nước>/ (chương, trang JSON, tranh), Sổ Tay
│       ├── game/               một lượt chơi (React hooks): điều hướng trang, vụ án, thông báo
│       ├── board/              cuốn sổ vẽ bằng Skia: camera, lật trang, cử chỉ;
│       │                       scene/ dựng trang (JS thread), render/ vẽ từng khung (UI thread)
│       ├── screens/            màn hình chơi, HUD, bảng manh mối, các hộp thoại
│       ├── platform/           theo thiết bị: âm thanh (native/web), rung, tải tranh
│       ├── ui/                 giao diện dùng chung: màu, chữ, nút, hộp thoại, icon
│       └── generated/          hình vẽ & âm thanh sinh tự động (không sửa tay)
├── tools/                      công cụ: sprites/ (bản vẽ gốc của 57 hình), generate-assets, generate-icons
├── archive/web-vite.zip        bản web Vite cũ (không dùng)
└── vercel.json                 deploy bản web
```

Phụ thuộc đi một chiều: `core` không biết gì về giao diện; `content` chỉ là dữ liệu; `game` dùng `core` + `content`; `board` và `screens` hiển thị. Chi tiết từng phần: [app/README.md](app/README.md#-kiến-trúc).

---

## 🌏 Thêm Một Quốc Gia (ví dụ Việt Nam)

Mỗi nước là một cuốn sổ riêng trong `app/src/content/countries/<nước>/`. Thêm nước **không cần sửa** luật chơi, cuốn sổ hay giao diện:

1. **Tranh** — mỗi trang một ảnh PNG **1760 × 1240**: cuốn sổ mở hai trang trên nền trong suốt, giữ đúng khung sổ của bộ Singapore (phần giấy ở khoảng x 88–1672, y 270–969, gáy ở giữa x ≈ 880, góc bo ~50 px) để camera, bóng đổ và hiệu ứng lật trang khớp. Đặt vào `app/assets/art/<nước>/`.
2. **Màn chơi** — mỗi trang một file JSON `app/src/content/countries/<nước>/chapter-N/<id-trang>.json` (định dạng ở mục 0.2 và 0.3 phía trên; `"art"` là tên bức tranh, không kèm `.png`). Id trang **không được trùng** với nước khác: tiến độ lưu theo id.
3. **Định nghĩa nước** — `app/src/content/countries/<nước>/index.ts`: tên nước, các chương (tiêu đề, phụ đề, các đoạn mở đầu), trang của mỗi chương (`{ day }` hoặc `{ day, night }`) và bảng `art` (tên tranh → `require('…png')`). Lấy `countries/singapore/index.ts` làm mẫu.
4. **Đăng ký** — thêm nước vào `COUNTRIES` trong `app/src/content/index.ts`. Mục Lục tự hiện tab chọn nước, số trang tính riêng từng nước ("Trang 3 / 9"), Sổ Tay ghi tên nước cạnh số trang.
5. **Đồ vật / sinh vật mới** (nón lá, đèn lồng, xích lô…) — vẽ thêm trong `tools/sprites/ObjectSprite.tsx`, thêm tên vào `SpriteType` (`app/src/core/model.ts`) và một mục Sổ Tay (`app/src/content/bestiary.ts`), rồi chạy `npm run generate` ở thư mục gốc.
6. **Kiểm tra** — `cd app && npm run typecheck && npm run web`. Khi khởi động, danh mục tự báo lỗi nếu id trang bị trùng hoặc trang dùng tên tranh không có trong bảng `art`.

---

## 🚀 Hướng Dẫn Deploy Lên Vercel (Miễn Phí)

File [`vercel.json`](vercel.json) ở thư mục gốc cho Vercel deploy **bản app (Expo web)** trong `app/` thay cho bản Vite: cài `app/` bằng `npm ci`, chạy `expo export --platform web`, phục vụ thư mục `app/dist`. Cấu hình trong file ghi đè Project Settings, nên không phải chỉnh gì trên dashboard.

1. Đẩy mã nguồn lên GitHub, rồi trên [Vercel](https://vercel.com/) chọn **Add New Project** $\rightarrow$ **Import Git Repository** (giữ *Root Directory* là thư mục gốc của repo).
2. Mỗi nhánh được push lên có một bản **Preview** riêng để thử; push/merge vào `main` thì thay bản chính thức trên tên miền của project (xem ở mục *Domains* trên dashboard).
3. Cùng tên miền nên người chơi **giữ nguyên tiến độ** (app đọc đúng khóa lưu của bản Vite).
4. Cần quay về bản trước thì dùng **Instant Rollback** trên dashboard. (Bản Vite cũ nằm trong `archive/web-vite.zip`; muốn deploy lại nó phải giải nén và khôi phục `package.json` như hướng dẫn trong zip.)

`package.json` gốc ghi `"engines": { "node": "24.x" }`: Vercel tắt Node.js 20 từ 01/10/2026, và Expo SDK 57 cần Node ≥ 22.13 (hoặc 24.3).
