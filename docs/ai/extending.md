# Mở rộng và refactor — công thức theo từng loại việc

> Một phần của bộ quy định cho AI và người phát triển. Bắt đầu từ `AGENTS.md` ở gốc repo.

Mỗi công thức liệt kê **đủ các file phải đụng**, theo thứ tự nên làm. Xong việc nào cũng chạy `cd app && npm run check`.

## Mục lục
A. Đổi luật chơi, điểm, gợi ý, sao
B. Thêm trường mới cho vật ẩn (hành vi mới trong JSON)
C. Thêm kiểu ngụy trang (`CamoStyle`)
D. Thêm hiệu ứng vẽ trên cuốn sổ
E. Thêm hộp thoại
F. Thêm nút hoặc thông tin trên HUD / thẻ manh mối
G. Thêm âm thanh, rung
H. Thêm hoặc đổi dữ liệu lưu (progress)
I. Code riêng theo nền tảng
J. Thêm thư mục cấp một trong `src/`
K. Refactor an toàn

---

## A. Đổi luật chơi, điểm, gợi ý, sao

1. Sửa hàm thuần trong `core/` (`scoring.ts`, `caseFile.ts`, `hints.ts`, `detection.ts`). Hằng số có tên và comment
   đơn vị, đặt cạnh hàm dùng nó.
2. Hàm vẫn phải **thuần**: nhận state, trả về state mới. Không gọi `sound`, `progress`, React ở đây.
3. Side effect (âm thanh, thông báo, lưu) thêm trong `game/useCase.ts`, ngay nhánh tương ứng của `inspect`,
   `requestHint`…
4. Nếu luật mới cần dữ liệu trong `CaseState` thì thêm trường vào `core/model.ts` và khởi tạo trong `openCase`.
5. **Bắt buộc** thêm hoặc sửa test trong `app/test/rules.test.ts`, theo lối có sẵn (`object(id, extra)`, `atPhase`).
6. Luật đổi thì chữ hiển thị cũng phải đổi theo: `VictoryScreen` (sao, thưởng), `PauseMenu`, `README.md`.
7. Đổi cách tính `totalScore` hay ý nghĩa dữ liệu đã lưu → làm thêm mục H.

## B. Thêm trường mới cho vật ẩn

Ví dụ: vật "chớp tắt" ở trang đêm, vật chỉ hiện khi zoom ≥ 2×…

1. `core/model.ts`: thêm **trường tùy chọn** vào `HiddenObject` (hoặc một interface riêng như `ShyBehavior` /
   `RoamBehavior`), comment rõ đơn vị. Không có trường thì hành vi phải y như cũ, để JSON cũ vẫn chạy.
2. Nếu nó ảnh hưởng **lúc nào/ở đâu bắt được vật**: viết logic trong `core/motion.ts` (worklet) và dùng trong
   `core/detection.ts`. Renderer cũng gọi đúng hàm đó, nhờ vậy hình vẽ và vùng chạm luôn khớp nhau.
3. `app/test/content.test.ts`: thêm kiểm tra dữ liệu (khoảng giá trị, số điểm…). `rules.test.ts`: thêm test hành vi.
4. `board/scene/buildScene.ts`: chép trường sang `SceneSprite` (`board/render/types.ts`), tính sẵn mọi thứ có thể (path,
   paint, hằng số) ngay tại đây, trên JS thread.
5. `board/render/sprites.ts` (`spritePose`) hoặc `book.ts`: dùng trường đó trong worklet (đọc `docs/ai/performance-and-size.md` §2).
   Nếu làm sprite phải vẽ từ hình thay vì từ sheet thì cập nhật điều kiện trong `layOutAtlas` / `fromSheet`.
6. `screens/hud/QuestPanel.tsx` (`camoTrait`): thêm nhãn nếu người chơi cần được báo ("Di chuyển liên tục…").
7. Tài liệu: bảng trường trong `docs/ai/add-country.md`, và mục định dạng JSON trong `README.md`.

## C. Thêm kiểu ngụy trang (`CamoStyle`)

Đây là việc lớn, đụng cả pipeline sprite. Nên xác nhận với người dùng trước khi làm.

1. `core/model.ts`: thêm vào union `CamoStyle` (và comment mô tả).
2. `tools/sprites/sprites.css`: style `.camo-<tên>` cho biến thể.
3. `tools/generate-assets.mjs`: thêm vào `VARIANTS` và vào các key `buildArt` đọc ra.
4. `board/scene/spriteArt.ts` (`ArtPaint`) và `board/scene/spriteParts.ts` (`PaintVariant`, `pickPair`): đọc biến thể mới.
5. `board/render/types.ts`: hằng số `CAMO_<TÊN>`; `buildScene.ts`: ánh xạ `obj.camo` → hằng số, chọn biến thể và có
   đưa vào sheet hay không; `render/book.ts`: cách vẽ (paint lấy từ `scene/paints.ts`).
6. `QuestPanel.tsx` (`camoTrait`): nhãn và icon. `useWarmUp.ts`: thêm vào khung warm-up nếu nó có shader riêng.
7. Chạy `npm run generate`, commit file sinh ra. Đo lại hiệu năng trên web.

## D. Thêm hiệu ứng vẽ trên cuốn sổ

1. Dữ liệu tĩnh (path, shader, paint) → tạo trong `scene/paints.ts` (dùng chung) hoặc `buildScene.ts` (riêng từng
   trang), lưu vào `SceneData`.
2. Trạng thái thay đổi theo thời gian → shared value (như `useCaseMarks`: `radar`, `fogStart`, `nudge`) và thêm trường
   vào `FrameState`. Truyền vào `renderFrame` trong `Board.tsx`. Nhớ thêm vào dependency của `useDerivedValue` nếu nó
   không phải shared value.
3. Vẽ trong file `render/` đúng chỗ (`marks.ts` cho dấu/radar, `book.ts` cho thứ thuộc tranh, `loupe.ts` cho kính),
   đúng thứ tự lớp trong `frame.ts`. Thời gian lấy từ `F.now` (đồng hồ `motionNow`). Easing dùng `board/anim.ts`.
4. Thêm trạng thái "đang hiện hiệu ứng" vào `warmFrames()` (`useWarmUp.ts`).
5. Vật nằm trong kính lúp thì kính lúp vẽ lại cảnh: kiểm tra hiệu ứng trông đúng cả trong kính lẫn ngoài kính, và cả
   trang ngày lẫn trang đêm.

## E. Thêm hộp thoại

1. `screens/dialogs/<Ten>.tsx`: dùng `ModalShell`; nút chính để trong `footer` (luôn bấm được trên điện thoại nhỏ); chỉ
   bật `scroll` cho danh sách dài; gọn lại bằng `useCompact()`, chia 2 cột bằng `useShortLandscape()`; nút dùng
   `ui/Buttons`, màu và font lấy từ `ui/theme`, icon từ `ui/icons`. Mọi chữ, kể cả `accessibilityLabel`, viết tiếng
   Việt.
2. `screens/GameScreen.tsx`: state hiển thị, render có điều kiện, **thêm điều kiện vào `boardActive`** (nếu không,
   cử chỉ trên sổ vẫn chạy bên dưới), nếu cần thì thêm vào `playing` / `browsing` để đồng hồ dừng, và vào
   `closeTopSheet` nếu nút Back của Android phải đóng nó. Hộp thoại chỉ dùng lúc đang chơi thì render kèm `!home`
   (như Tạm Dừng, Thắng), để không hiện đè lên trang chủ.
3. `app/test/screens/Gallery.tsx`: thêm mục vào `SCREENS` với **nội dung dài nhất** có thể.
   `tools/test-screens.mjs`: thêm tên vào `DIALOGS` (và `SCROLLING` nếu là danh sách cuộn).
4. Chạy `npm run test:screens`, xem ảnh chụp trong `scratch/screens/`.

## F. Thêm nút hoặc thông tin trên HUD / thẻ manh mối

1. `screens/hud/HUD.tsx`: đặt vào component con `React.memo` phù hợp (`Actions`, `PageSwitcher`) hoặc tạo component con
   memo mới, để nó không render theo đồng hồ. Hỗ trợ cả 3 layout `'phoneLandscape' | 'phone' | 'wide'`, có tính safe
   area (`insetLeft/Right`, `topInset`).
2. Handler truyền từ `GameScreen` phải ổn định (`useCallback` / `useStableCallback`).
3. Hành động mới của game → thêm vào `Case` (`useCase`) hoặc `Navigation` (`useNavigation`), không viết logic trong HUD.
4. Chạy `npm run test:screens`: HUD được kiểm tra trên 13 cỡ màn hình.

## G. Thêm âm thanh, rung

1. `platform/synth/synth.ts`: thêm method `playX()` (nguồn gốc của âm). Giọng con vật thì xem `docs/ai/add-country.md` §5.
2. `platform/sound.d.ts`: thêm vào interface `GameSound`.
3. `platform/sound.web.ts`: gọi `synth.playX()`, kèm `haptics.x()` nếu có rung.
   `platform/sound.native.ts`: phát `SFX.x` (nếu cần phát ngay thì thêm vào danh sách `prepare` trong `init`).
4. `platform/haptics.ts`: thêm kiểu rung nếu cần, luôn dạng fire-and-forget.
5. `tools/generate-assets.mjs`: thêm `{ name: 'x', call: 'playX' }` vào `jobs` và `x: req('x')` vào `SFX` của file sinh
   ra. Rồi chạy `npm run generate` và commit WAV + `generated/sounds.ts`.
6. Gọi âm thanh từ `game/` (hoặc `screens/` cho âm giao diện), không gọi từ `core/`.

## H. Thêm hoặc đổi dữ liệu lưu (progress)

1. `core/model.ts`: thêm trường **tùy chọn** vào `GameProgress` / `PageResult`.
2. `core/progress.ts` → `readProgress`: đọc trường đó an toàn (dùng `strings`, `count`, `isRecord`); thiếu hoặc hỏng
   thì về giá trị rỗng. Trường lạ được giữ nguyên (`...data`), đừng xóa cơ chế này.
3. Nếu **ý nghĩa** dữ liệu cũ đổi: tăng `SCHEMA_VERSION`, chuyển bản lưu cũ trong `readProgress` (xem cách
   `totalScore` được tính lại ở bản 2), và ghi lại lịch sử phiên bản trong comment.
4. Ghi dữ liệu bằng một method mới trên object `progress` (module này là nơi ghi duy nhất). Không gọi `localStorage`
   ở chỗ khác.
5. `app/test/progress.test.ts`: test đọc bản lưu cũ, bản hỏng, và bản mới.
6. **Không bao giờ** đổi `STORAGE_KEY` hay đổi tên id trang/vật đã phát hành. Nếu buộc phải đổi tên thì viết đoạn
   chuyển id trong `readProgress`, kèm test.

## I. Code riêng theo nền tảng

1. Đặt trong `platform/`: `ten.ts` (mặc định / native) và `ten.web.ts`, hoặc `ten.native.ts` + `ten.web.ts` kèm
   `ten.d.ts` làm hợp đồng chung (như `sound`). Metro tự chọn file. Nơi dùng import `'../platform/ten'`.
2. Hai bản phải có **cùng API** (kiểu export trùng khớp); kiểu dùng chung đặt ở một file rồi import sang.
3. Rẽ nhánh nhỏ bằng `Platform.OS` chỉ dùng cho vài dòng (ví dụ `useDeviceBehaviour`, `RotatePrompt`). Đoạn dài hoặc
   có import riêng nền tảng thì tách file.
4. Đụng tới web thì chạy `npm run build:web`. API native mới thì kiểm tra nó có trong Expo Go không.

## J. Thêm thư mục cấp một trong `src/`

Hiếm khi cần, vì gần như mọi thứ đều vừa với 8 tầng có sẵn. Nếu vẫn cần: thêm vào `ALLOWED` trong
`tools/check-architecture.mjs` (ai được import ai), cập nhật bảng tầng trong `AGENTS.md` (gốc repo), `app/AGENTS.md` và mục Kiến
trúc trong `app/README.md`.

## K. Refactor an toàn

1. **Không trộn refactor với đổi hành vi** trong cùng một commit. Refactor xong thì test phải pass mà không cần sửa
   test (trừ đường dẫn import).
2. Giữ ranh giới tầng. Muốn dùng chung giữa `board/` và `screens/` thì đưa vào `ui/` (giao diện) hoặc `core/` (logic
   thuần).
3. Giữ nguyên API được dùng từ tầng khác (`content/index.ts`, `GameSound`, `Case`, `Navigation`, props của `Board`).
   Đổi thì sửa hết nơi dùng trong cùng commit. Tìm nơi dùng bằng Grep trước khi đổi.
4. File vượt ~400 dòng (hiện có `HUD.tsx` và `QuestPanel.tsx` ~540 dòng, `PageIndex.tsx` và `VictoryScreen.tsx` ~445
   dòng) thì tách component con vào cùng thư mục, mỗi phần là một `React.memo` với props rõ ràng.
5. Không tạo lớp trừu tượng "phòng khi sau này cần". Ba đoạn code giống nhau mới gom thành helper, đặt ở tầng thấp nhất
   có thể dùng nó.
6. Đổi bất cứ thứ gì được ghi trong `AGENTS.md` hay `docs/ai/` (tên file, hằng số, luồng) thì sửa tài liệu trong cùng commit.
