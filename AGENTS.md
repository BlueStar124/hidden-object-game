# The Lost Sketchbook — Quy định cho AI và người phát triển

File này dành cho **mọi trợ lý AI lập trình** (Codex, Cursor, GitHub Copilot, Windsurf, Gemini, Claude…) và người
trong nhóm. Đọc nó **thay cho việc đọc lại cả codebase**; chỉ mở file nguồn khi cần sửa đúng file đó.
Chi tiết nằm trong `docs/ai/`, đọc theo bảng ở mục 4. Các lệnh và lưu ý riêng của Expo: `app/AGENTS.md`.

## 1. Tổng quan

- Game tìm vật ẩn: một cuốn sổ ký họa màu nước, soi bằng kính lúp. **Một codebase Expo** (SDK 57, React Native 0.86,
  React 19, Skia 2.6, Reanimated 4 + worklets) trong `app/` chạy iOS, Android và web. Khóa màn hình ngang, chỉ có một
  màn hình chơi, **không dùng thư viện navigation**: trang chủ (`screens/home/`) và hộp thoại đều là lớp phủ.
- Dữ liệu: `Country → Chapter → PageSlot { day, night? } → Page → HiddenObject[]`. Mỗi trang là một file JSON cùng một
  bức tranh 1760 × 1240.
- `tools/` ở gốc repo: sinh sprite + âm thanh (`generate-assets.mjs`), icon, kiểm tra kiến trúc, test cỡ màn hình,
  benchmark. Cần chạy `npm install` ở **gốc repo** trước khi dùng.
- Ngôn ngữ: **comment code bằng tiếng Anh**, giải thích *vì sao*; **mọi chữ người chơi thấy** (kể cả
  `accessibilityLabel`) bằng **tiếng Việt**; README tiếng Việt; commit message tiếng Việt có tiền tố
  `feat:` / `fix:` / `chore:` / `refactor:`.

## 2. Bản đồ các tầng (`app/src`)

| Tầng | Vai trò | Được import |
|---|---|---|
| `core/` | Luật chơi thuần TS: `model.ts` (mọi kiểu dữ liệu), `caseFile.ts` (chuyển trạng thái vụ án), `detection.ts`, `scoring.ts`, `hints.ts`, `motion.ts` (worklet), `progress.ts` (lưu tiến độ) | chỉ `core` — **không package nào** |
| `content/` | Chỉ dữ liệu: `index.ts` (`COUNTRIES` + các view suy ra), `countries/<nước>/`, `bestiary.ts` | `core`, `content` — **không package nào** |
| `game/` | Một lượt chơi bằng hooks: `useGame` = `useNavigation` + `useCase` + `useNotices` | `core`, `content`, `platform`, `game` |
| `board/` | Cuốn sổ vẽ bằng Skia: hooks (camera, cử chỉ, lật trang, cache), `scene/` (dựng trang, JS thread), `render/` (vẽ từng khung, UI thread) | `core`, `content`, `platform`, `ui`, `generated`, `board` |
| `screens/` | `GameScreen`, `Desk`, `hud/`, `dialogs/` | mọi thứ |
| `platform/` | Theo thiết bị: `sound.native/.web` (+ `synth/`), `haptics`, `sceneImage(.web)` | `core`, `platform`, `generated` |
| `ui/` | Dùng chung: `theme`, `ModalShell`, `Buttons`, `SpriteIcon`, `icons`, `layout`, `format`, `useStableCallback` | `core`, `ui`, `generated` |
| `generated/` | `spriteArt.ts`, `sounds.ts` — sinh tự động, **không sửa tay** | `core`, `board`, `generated` |

`npm run check:architecture` (`tools/check-architecture.mjs`) bắt lỗi khi import sai chiều. Thêm thư mục cấp một mới
trong `src/` sẽ làm check này fail: phải khai báo vào `ALLOWED` trong tool **và** cập nhật bảng này.

Chi tiết từng file, luồng dữ liệu, hằng số: [docs/ai/architecture.md](docs/ai/architecture.md).

## 3. Luật bắt buộc

1. **Phụ thuộc một chiều** như bảng trên. `core` và `content` không import package (không React, RN, Skia).
2. **Luật chơi chỉ nằm trong `core/`**, viết thành hàm thuần, trả về object mới (bất biến), không có side effect.
   `game/useCase.ts` áp dụng chúng rồi mới thêm âm thanh, thông báo, lưu tiến độ. Không viết luật trong `screens/` hay
   `board/`. Đổi luật thì phải thêm/sửa test trong `app/test/rules.test.ts`.
3. **Nội dung là dữ liệu.** Thêm quốc gia hay trang **không được** sửa `core/`, `board/`, `screens/` (trừ khi thêm
   sprite mới: xem `docs/ai/add-country.md` §5).
4. **Không sửa tay** `src/generated/` (chạy `npm run generate`), `ios/`, `android/` (cấu hình native nằm trong
   `app.json` + config plugin).
5. **Không làm hỏng bản lưu của người chơi.** Khóa `detective_sketchbook_progress_v1`, **id trang** và **id vật** đã phát
   hành là vĩnh viễn (tiến độ lưu theo chúng). Đổi định dạng lưu = tăng `SCHEMA_VERSION`, chuyển đổi trong
   `readProgress`, kèm test trong `progress.test.ts`.
6. **Đường vẽ là worklet.** Mọi hàm gọi từ `board/render/`, `board/anim.ts`, `core/motion.ts` phải có `'worklet'` ở
   dòng đầu và không chạm tới React state. Paint, shader, path được tạo **một lần** trên JS thread (`scene/paints.ts`,
   `scene/buildScene.ts`), không tạo trong từng khung hình.
7. **Thứ tự các hook trong `Board.tsx` chính là thứ tự effect chạy**: không đảo.
8. **Thư viện:** chỉ dùng `npx expo install <pkg>`, chỉ module có sẵn trong Expo Go, ưu tiên module của Expo. Expo hay
   đổi API: đọc docs đúng phiên bản `https://docs.expo.dev/versions/v57.0.0/`, đừng đoán theo trí nhớ.
9. **Dung lượng:** tranh dùng WebP, sprite là vector sinh tự động, âm thanh tổng hợp bằng synth. Icon và font import
   từng file một. Không đưa ảnh PNG lớn, file âm thanh thu sẵn hay thư viện nặng vào app (xem
   `docs/ai/performance-and-size.md`).
10. **Tranh trang: khung cố định, phong cách tự do.** Phong cách và màu sắc (dịu hay rực, màu nước hay gouache…) đổi
    được theo từng nước, từng trang. Bắt buộc: khung sổ (giấy ở x 88–1672, y 270–969 của ảnh 1760 × 1240), dấu triện ở
    góc phải dưới, đủ chỗ giấu đồ (xem `docs/ai/art-style.md`).

## 4. Làm việc gì thì đọc gì

| Việc | Đọc |
|---|---|
| Thêm quốc gia, chương, trang, trang đêm; đặt vật ẩn trong JSON | [docs/ai/add-country.md](docs/ai/add-country.md) |
| Thêm sinh vật/đồ vật mới (sprite), mục Sổ Tay, tiếng kêu | [docs/ai/add-country.md](docs/ai/add-country.md) §5 |
| Đổi luật, điểm, gợi ý; thêm trường JSON, kiểu ngụy trang, hộp thoại, nút HUD, âm thanh, dữ liệu lưu, code theo nền tảng | [docs/ai/extending.md](docs/ai/extending.md) |
| Tạo hoặc sửa ảnh: tranh trang (phong cách, khung hình, bố cục, prompt AI), mặt bàn, sprite, icon | [docs/ai/art-style.md](docs/ai/art-style.md) |
| Bất cứ thứ gì chạy mỗi khung hình, mỗi giây, lúc lật trang; thêm tài nguyên/thư viện | [docs/ai/performance-and-size.md](docs/ai/performance-and-size.md) |
| Cần biết file nào làm gì, dữ liệu đi đâu, hằng số bao nhiêu | [docs/ai/architecture.md](docs/ai/architecture.md) |

## 5. Quy ước viết code (để dễ refactor, dễ mở rộng)

- **TypeScript strict**, import tương đối, **không dùng alias đường dẫn**. Mỗi file làm một việc, export chính đặt tên
  theo file (`useCamera.ts` → `useCamera`). Hook tên `useX.ts`, component PascalCase `.tsx`.
- **Kiểu dữ liệu chung khai báo trong `core/model.ts`**: trường mới là trường *tùy chọn* kèm comment đơn vị/ý nghĩa.
  Dùng union string (`'ink' | 'chameleon'`) thay cho enum. Hằng số đặt tên `UPPER_CASE` cạnh nơi dùng, kèm comment
  đơn vị (giây, ms, phần của bề ngang trang…).
- **Không lặp logic**: "vật chính" dùng `isMainObject`; "là sinh vật" dùng `isCreature`; vị trí vật lúc này dùng
  `objectPosition`; tranh của trang dùng `artOf` / `artIdOf`; danh sách trang dùng `pagesOf` / `allPages`. Tìm helper
  có sẵn trong `docs/ai/architecture.md` trước khi viết hàm mới.
- **Dữ liệu suy ra từ `COUNTRIES`**, không viết cứng danh sách trang/nước ở chỗ khác.
- **Component**: `GameScreen` render lại mỗi giây vì đồng hồ, nên component con nặng phải bọc `React.memo`. Callback
  truyền xuống dùng `useCallback` hoặc `useStableCallback`; mảng/object truyền xuống dùng `useMemo`.
  `const styles = StyleSheet.create(...)` đặt cuối file.
- **Màu, font, bóng** lấy từ `ui/theme` (`colors`, `fonts`, `gradients`, `shadow()`); icon chỉ lấy qua `ui/icons.ts`;
  nút dùng `ui/Buttons`; hộp thoại dùng `ui/ModalShell`; sprite tĩnh dùng `ui/SpriteIcon`.
- **Không bao giờ làm game crash vì phần phụ**: âm thanh, rung, localStorage đều bọc `try/catch` hoặc
  `.catch(() => {})`.
- ESLint chạy với `--max-warnings 0`. Chỉ tắt `react-hooks/exhaustive-deps` khi có lý do, ghi lý do trong comment
  (xem `useSceneLibrary.ts`).
- Comment theo phong cách sẵn có: JSDoc `/** … */` trên export, khối phân đoạn `/* ---- Tên ---- */`, viết ngắn,
  giải thích lý do chứ không diễn lại code.

## 6. Thế nào là xong

Chạy trong `app/`:

```bash
npm run check          # lint + typecheck + jest + check:architecture — BẮT BUỘC trước khi báo xong
npm run build:web      # khi đụng code riêng cho web, Skia hoặc tài nguyên
npm run test:screens   # khi đụng hộp thoại, HUD, QuestPanel, layout (Playwright, 13 cỡ màn hình)
npm run generate       # khi đổi sprite (tools/sprites) hoặc âm thanh (platform/synth); commit cả file sinh ra
npx expo-doctor        # khi đổi dependency hoặc app.json
```

CI (`.github/workflows/ci.yml`) chạy tất cả các bước trên ở mỗi lần push. `npm test` tự soát **mọi trang của mọi nước**.

## 7. Giữ tài liệu này đúng

Khi đổi kiến trúc, quy ước, định dạng JSON hay quy trình thêm nước, hãy sửa file này và `docs/ai/` (cùng `README.md`
nếu là tài liệu cho người) **trong cùng commit**. Nếu thấy code khác với những gì ghi ở đây thì tin code, rồi sửa tài
liệu. Các file `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` chỉ trỏ về đây: đừng chép nội dung sang đó.
