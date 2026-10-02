# 📱 The Lost Sketchbook — App iOS · Android · Web (Expo)

Bản React Native của game, viết **một lần cho cả ba nền tảng**: app iOS, app Android và bản web (react-native-web). Luật chơi, màn chơi và hình vẽ nằm trong **lõi dùng chung** ở `../src` (trước đây dùng chung với bản web Vite, nay đã nén vào `archive/web-vite.zip`).

---

## ✨ Khác gì so với bản web hiện tại?

| | Bản web (Vite) | App (thư mục `app/`) |
|---|---|---|
| Vẽ cuốn sổ | DOM + CSS (blend, filter, mask) | **Skia** — vẽ trên UI thread mỗi khung hình (web: CanvasKit/WebAssembly) |
| Zoom | Nút 1×–3×, trang cuộn trong khung | **Chụm 2 ngón** (pinch), nút +/− **từng 0.1×**, lăn chuột (web) — zoom quanh điểm chạm |
| Kính lúp | Kéo ở bất cứ đâu, **thả tay là soi** | Kéo bằng tròng **hoặc cán gỗ** (ngón tay không che kính), **thả là soi** tại tâm kính; hoặc **chạm** thẳng vào chỗ muốn soi |
| Kính lúp ngoài tranh | Thả ra lề vẫn tính click sai | Thả kính ra mặt bàn **không tính lần soi**, không bị trừ điểm; chạm ra mặt bàn cũng vậy |
| Khung nhìn | Cả khung ảnh 1760×1240 (có lề trong suốt) | Camera ôm sát **phần giấy** của cuốn sổ → tranh to hơn hẳn trên điện thoại |
| Hướng màn hình | Dọc/ngang | **Khóa ngang** (app); web hỏi xoay ngang khi cầm dọc |
| Gợi ý cấp 2 | (chưa nối dây) | Kính lúp **nhích về phía** vật cần tìm, như mô tả trong README |
| Gợi ý cấp 3 | Radar trên trang | Radar + **camera tự lướt tới** nếu vật đang khuất màn hình |
| Cảm giác | — | **Rung (haptics)** khi tìm thấy / soi sai / mờ kính / thắng; tự **tạm dừng** khi thoát app; nút Back Android mở Tạm dừng; giữ màn hình sáng |
| Cài đặt | — | iOS/Android qua EAS; web cài được như app (**PWA**, toàn màn hình) |

Tiến độ (sao, điểm, Sổ Tay Sinh Vật) lưu cùng định dạng và khóa `detective_sketchbook_progress_v1` như bản web (app: SQLite qua `expo-sqlite/localStorage`; web: localStorage) — deploy bản web mới lên đúng tên miền cũ thì người chơi giữ nguyên tiến độ.

---

## 🚀 Chạy thử

```bash
cd app
npm install          # tự chép canvaskit.wasm vào public/ cho bản web
npm start            # mở Metro; quét QR bằng app Expo Go (Android/iOS)
npm run android      # mở trên máy ảo / điện thoại Android đang cắm (Expo Go)
npm run web          # chạy bản web tại http://localhost:8081
```

- **Expo Go** (tải trên CH Play / App Store) là đủ để chơi thử — app chỉ dùng các module có sẵn trong Expo Go, không cần build native.
- Máy Windows dùng Android Emulator mà Expo Go kẹt ở *Bundling 99%*: chạy `adb reverse tcp:8081 tcp:8081` rồi mở `exp://127.0.0.1:8081` (tường lửa chặn IP LAN).

### Build & phát hành

```bash
npx eas-cli@latest build:configure          # lần đầu: tạo eas.json, đăng nhập tài khoản Expo
npx eas-cli@latest build --platform android   # .aab cho Google Play (build trên cloud, không cần Android Studio)
npx eas-cli@latest build --platform ios       # cần tài khoản Apple Developer
npm run build:web                             # bản web tĩnh → app/dist (deploy Vercel/Netlify)
```

`app.json` đang đặt mã định danh `com.bluestar124.lostsketchbook` (Android `package` / iOS `bundleIdentifier`) — đổi trước lần phát hành đầu tiên nếu bạn muốn tên khác.

**Vercel** đã được cấu hình sẵn bằng [`vercel.json`](../vercel.json) ở thư mục gốc (xem [README gốc](../README.md#-hướng-dẫn-deploy-lên-vercel-miễn-phí)): push là Vercel tự build bản web này. File JS trong `_expo/static/` và ảnh, font trong `assets/` có mã hash trong tên, nên được cache 1 năm (`immutable`). Host khác thì cần phục vụ `canvaskit.wasm` với `Content-Type: application/wasm` và bật nén gzip/brotli (Vercel tự làm cả hai).

---

## 🧱 Kiến trúc

```
hidden-object-game/
├── src/                     ← LÕI GAME DÙNG CHUNG (giao diện Vite cũ: archive/web-vite.zip)
│   ├── hooks/useGame.ts         luật chơi, điểm, combo, gợi ý, giờ, sương mờ… (dùng nguyên văn)
│   ├── game/                    DetectionEngine, ScoreEngine, HintEngine, SaveManager…
│   ├── levels/  data/  types/   12 trang (JSON), sổ tay sinh vật, kiểu dữ liệu
│   └── components/Sprites/      57 hình vẽ SVG — nguồn sinh ra hình vẽ cho app
├── public/assets/           ← tranh màu nước (app đọc trực tiếp, không nhân bản)
└── app/                     ← Expo (React Native) — iOS · Android · Web
    ├── metro.config.js          nối app với ../src, chuyển hướng module "song sinh"
    ├── scripts/                 sinh dữ liệu từ bản web (xem bên dưới)
    └── src/
        ├── board/               cuốn sổ: Skia renderer, cử chỉ, kính lúp, ban đêm
        ├── components/          HUD, bảng manh mối, các hộp thoại
        ├── game/                CreatureMotion (worklet), phân tích tranh (màu tắc kè, khung sổ)
        ├── platform/            âm thanh native/web, rung, ảnh
        └── sprites/             hình vẽ đã sinh (art.generated.ts)
```

**Module "song sinh"** (`metro.config.js`): code dùng chung import `../game/AudioManager` và `./CreatureMotion` — trong app, Metro trỏ hai import đó sang bản của app:

- `src/platform/AudioManager.native.ts` — phát âm thanh đã render sẵn + rung; `AudioManager.web.ts` giữ nguyên bộ tổng hợp Web Audio của bản web.
- `src/game/CreatureMotion.ts` — cùng công thức nhưng viết dạng *worklet*, để UI thread vẽ con vật nhút nhát/di chuyển **đúng đồng hồ** mà phát hiện va chạm dùng. Sửa `src/game/CreatureMotion.ts` (web) thì sửa luôn bản này.

**Renderer** (`src/board/renderer.ts`): mỗi khung hình vẽ lại toàn bộ cảnh thành một `SkPicture` trên UI thread — tranh, sprite ngụy trang (multiply + ma trận màu của CSS `filter`), mảnh tranh che (occluder), mặt nước, bóng đêm + đèn, dấu mộc, radar, lật trang, kính lúp. Thứ tự lớp bám theo `z-index` của bản web.

**Lật trang**: `useGame` báo trang đích và chiều lật (`turn`) ngay lúc bấm, rồi mở trang mới sau `PAGE_TURN_MS`. `Board` chụp trang cũ và trang mới thành hai `SkPicture` phẳng. Renderer vẽ tờ giấy quay quanh gáy sổ thành 7 dải, mỗi dải một ma trận phối cảnh 3×3, nên tờ giấy cong được. Mặt trước là trang cũ, mặt sau là nửa đối diện của trang mới, kèm bóng đổ lên trang bên dưới. Hai trang kế bên được giải mã (native: trên JS thread, không đợi lần vẽ đầu trên UI thread), phân tích và dựng sẵn sau khi trang hiện tại ổn định, và giữ trên GPU, nên lúc lật không phải chờ. Chỉ ảnh của vài trang quanh trang hiện tại được giữ trong bộ nhớ.

---

## 🛠️ Sinh dữ liệu từ bản web

Cần cài `npm install` ở **thư mục gốc** trước (dùng esbuild, react-dom và Playwright ở đó).

```bash
cd app
npm run generate        # hình vẽ + màu từng kiểu ngụy trang + âm thanh .wav
npm run generate:icons  # icon app, splash, favicon, icon PWA
```

- **Hình vẽ**: render `ObjectSprite.tsx` ra SVG rồi đo **màu thực tế** của từng biến thể (mực, tắc kè hoa, mực tàng hình, mắt phát sáng ban đêm) bằng Chromium với đúng `sprites.css` — nên mọi quirk CSS của bản web được giữ nguyên. Chạy lại mỗi khi thêm/sửa sprite hoặc CSS ngụy trang.
- **Âm thanh**: chạy bộ tổng hợp `AudioManager` + `CreatureVoices` trong `OfflineAudioContext` rồi xuất WAV (tăng đều +6 dB cho loa điện thoại). Chạy lại khi đổi âm thanh hoặc thêm `VOICE_OF`.
- **Thêm trang mới**: thêm ảnh vào `src/platform/assets.ts` (ánh xạ đường dẫn web → `require`).

---

## ✅ Kiểm tra

```bash
npm run typecheck       # tsc trên cả app lẫn phần lõi dùng chung
npm run build:web       # đảm bảo bản web build được
```
