# 📱 The Lost Sketchbook — App iOS · Android · Web (Expo)

Toàn bộ game, viết **một lần cho cả ba nền tảng**: app iOS, app Android và bản web (react-native-web). Ngoài thư mục này, repo chỉ còn công cụ sinh tài nguyên (`../tools`) và bản web Vite đầu tiên đã lưu trữ (`../archive`).

---

## ✨ Điểm chính

- Cuốn sổ vẽ bằng **Skia** trên UI thread mỗi khung hình (web: CanvasKit/WebAssembly).
- **Chụm 2 ngón** để zoom, nút +/− **từng 0.1×**, lăn chuột (web): zoom quanh điểm chạm. Camera ôm sát **phần giấy** của cuốn sổ.
- Kính lúp kéo bằng tròng **hoặc cán gỗ** (ngón tay không che kính), **thả là soi** tại tâm kính; hoặc **chạm** thẳng vào chỗ muốn soi. Thả kính hay chạm ra mặt bàn **không tính lần soi**, không bị trừ điểm.
- Gợi ý 3 cấp: nhắc lại manh mối → kính lúp **nhích về phía** vật cần tìm → radar, và camera **tự lướt tới** nếu vật đang khuất màn hình.
- **Lật trang như sổ thật**, theo chiều trước/sau; trang kế bên được dựng sẵn nên lật không khựng.
- **Rung (haptics)** khi tìm thấy / soi sai / mờ kính / thắng; tự **tạm dừng** khi thoát app; nút Back Android mở Tạm dừng; giữ màn hình sáng.
- **Khóa ngang** (app); bản web hỏi xoay ngang khi cầm dọc và cài được như app (**PWA**).

Tiến độ (sao, điểm, Sổ Tay Sinh Vật) lưu dưới khóa `detective_sketchbook_progress_v1` (app: SQLite qua `expo-sqlite/localStorage`; web: localStorage), cùng định dạng với bản web đầu tiên — người chơi cũ giữ nguyên tiến độ.

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
app/
├── App.tsx                  font, gesture root, safe area → screens/GameScreen
├── assets/art/              tranh: <nước>/ (trang sổ 1760 × 1240), desk/ (mặt bàn)
├── assets/sounds/           âm thanh .wav (sinh từ bộ tổng hợp, cho iOS/Android)
├── test/                    kiểm tra tự động: luật chơi, lưu tiến độ, dữ liệu từng trang (npm test)
└── src/
    ├── core/                luật chơi — TypeScript thuần, không React Native / Skia
    │   ├── model.ts             từ vựng: Country → Chapter → Page → HiddenObject, CaseState…
    │   ├── caseFile.ts          hồ sơ một trang: mở vụ án, đồng hồ, tìm thấy, đoán sai, gợi ý
    │   ├── detection.ts         chạm trúng vật nào (kể cả con đang di chuyển / đang trốn)
    │   ├── scoring.ts  hints.ts điểm, combo, sao · ba cấp gợi ý
    │   ├── motion.ts            đồng hồ sinh vật nhút nhát / di chuyển (worklet: chạy cả 2 thread)
    │   └── progress.ts          lưu tiến độ
    ├── content/             nội dung — dữ liệu, không logic
    │   ├── index.ts             danh mục quốc gia; mọi danh sách khác suy ra từ đây
    │   ├── countries/<nước>/    index.ts (chương, cốt truyện, bảng tranh) + chapter-N/*.json
    │   └── bestiary.ts          Sổ Tay Sinh Vật: tên & kiến thức từng loài / đồ vật
    ├── game/                một lượt chơi (React hooks)
    │   ├── useGame.ts           = useNavigation + useCase + useNotices
    │   ├── useNavigation.ts     nước, trang, ngày/đêm, lật trước/sau, nhảy trang
    │   ├── useCase.ts           vụ án của trang đang chơi: chạm, gợi ý, tạm dừng, kính mờ…
    │   └── useNotices.ts        điểm / lời nhắc bay lên từ chỗ chạm
    ├── board/               cuốn sổ (Skia)
    │   ├── Board.tsx            ghép các phần dưới + nút zoom
    │   ├── useSceneLibrary.ts   tranh đã giải mã, phân tích, dựng sẵn
    │   ├── useCamera.ts         zoom & khung nhìn, vị trí kính lúp
    │   ├── useCaseMarks.ts      trạng thái vụ án → UI thread (đã tìm, radar, mờ kính, gợi ý)
    │   ├── usePageTurn.ts       vòng đời một lần lật trang
    │   ├── usePagesAround.ts    dựng sẵn trang kế bên
    │   ├── useBoardGestures.ts  chạm, kéo, chụm, lăn chuột
    │   ├── scene/               dựng một trang, trên JS thread (phân tích tranh, sprite, paint)
    │   └── render/              vẽ từng khung, trên UI thread (frame, book, sprites, marks, pageTurn, loupe)
    ├── screens/             GameScreen, Desk, hud/ (HUD, bảng manh mối, điểm bay), dialogs/
    ├── platform/            theo thiết bị: sound.native/.web (+ synth/ bộ tổng hợp Web Audio),
    │                        haptics, sceneImage(.web) (giải mã tranh ngoài luồng vẽ)
    ├── ui/                  dùng chung: theme, format, nút, ModalShell, SpriteIcon, icons
    └── generated/           spriteArt.ts, sounds.ts — sinh bởi ../tools, không sửa tay
```

**Phụ thuộc một chiều**: `core` ← `content` ← `game` ← `screens`; `board` vẽ những gì `game` cho biết. `platform` là tầng thấp nhất cùng `core` (`npm run check:architecture` kiểm tra điều này). Không có alias đường dẫn hay cấu hình Metro đặc biệt.

**File theo nền tảng**: Metro chọn `sound.native.ts` hoặc `sound.web.ts` (giao diện chung khai báo trong `sound.d.ts`), tương tự `sceneImage.ts` / `sceneImage.web.ts`.

**Renderer** (`src/board/render/`): mỗi khung hình vẽ lại toàn bộ cảnh thành một `SkPicture` trên UI thread — tranh, sprite ngụy trang (multiply + ma trận màu của CSS `filter`), mảnh tranh che (occluder), mặt nước, bóng đêm + đèn, dấu mộc, radar, lật trang, kính lúp. Thứ tự lớp giữ theo `z-index` của bản web đầu tiên (ghi trong chú thích).

**Lật trang**: `useNavigation` báo trang đích và chiều lật (`turn`) ngay lúc bấm, rồi mở trang mới sau `PAGE_TURN_MS`. `usePageTurn` chụp trang cũ và trang mới thành hai `SkPicture` phẳng; `render/pageTurn.ts` vẽ tờ giấy quay quanh gáy sổ thành 7 dải, mỗi dải một ma trận phối cảnh 3×3, nên tờ giấy cong được. Mặt trước là trang cũ, mặt sau là nửa đối diện của trang mới, kèm bóng đổ lên trang bên dưới. Hai trang kế bên được giải mã (native: trên JS thread, không đợi lần vẽ đầu trên UI thread; web: trình duyệt giải mã ngoài luồng chính), phân tích và dựng sẵn sau khi trang hiện tại ổn định, và giữ trên GPU, nên lúc lật không phải chờ. Chỉ ảnh của vài trang quanh trang hiện tại được giữ trong bộ nhớ.

**Thêm quốc gia / trang mới**: xem [README gốc — Thêm Một Quốc Gia](../README.md#-thêm-một-quốc-gia-ví-dụ-việt-nam).

---

## 🛠️ Sinh tài nguyên (`../tools`)

Cần `npm install` ở **thư mục gốc** trước (esbuild, react-dom và Playwright nằm ở đó).

```bash
npm run generate        # hình vẽ + màu từng kiểu ngụy trang + âm thanh .wav   (gốc hoặc app/)
npm run generate:icons  # icon app, splash, favicon, icon PWA
```

- **Hình vẽ**: render `tools/sprites/ObjectSprite.tsx` ra SVG rồi đo **màu thực tế** của từng biến thể (mực, tắc kè hoa, mực tàng hình, mắt phát sáng ban đêm) bằng Chromium với đúng `sprites.css`. Chạy lại mỗi khi thêm/sửa sprite hoặc CSS ngụy trang → `src/generated/spriteArt.ts`.
- **Âm thanh**: chạy bộ tổng hợp `src/platform/synth/` trong `OfflineAudioContext` rồi xuất WAV (tăng đều +6 dB cho loa điện thoại). Chạy lại khi đổi âm thanh hoặc thêm `VOICE_OF` → `assets/sounds/` + `src/generated/sounds.ts`.

---

## ✅ Kiểm tra

```bash
npm run check           # tất cả các bước dưới đây trừ build — CI (.github/workflows/ci.yml) chạy mỗi lần push
npm run lint            # ESLint (eslint-config-expo)
npm run typecheck       # tsc trên toàn bộ app
npm test                # Jest (jest-expo): luật chơi, lưu tiến độ, dữ liệu từng trang trong test/
npm run check:architecture  # các tầng trong src/ chỉ phụ thuộc một chiều
npm run build:web       # đảm bảo bản web build được
```
