# Hiệu năng và dung lượng

> Một phần của bộ quy định cho AI và người phát triển. Bắt đầu từ `AGENTS.md` ở gốc repo.

Mục tiêu: **60 khung hình/giây** khi rê kính lúp, zoom, khi sinh vật di chuyển và khi lật trang, trên cả điện thoại
yếu lẫn web (CanvasKit/WebAssembly). Tải nhanh, bundle nhỏ.

## Mục lục
1. Mô hình luồng: cái gì chạy ở đâu
2. Luật cho đường vẽ (render, worklet)
3. Luật cho dựng trang, cache, lật trang
4. Luật cho React
5. Đo đạc
6. Dung lượng: ngân sách và luật

---

## 1. Mô hình luồng

| Luồng | Chạy gì |
|---|---|
| **UI thread** | Cử chỉ (react-native-gesture-handler, native), shared value của Reanimated, `renderFrame` (worklet) mỗi khung → **một `SkPicture`**, đưa thẳng vào picture-view API của `<Canvas>`; không ghi thêm picture bao ngoài. |
| **JS thread** | React, `useCase` (luật chơi), đồng hồ 1 s, dựng trang (`buildScene`, `analyzeScene`, sprite sheet), giải mã tranh (native). |
| **Trình duyệt (web)** | Giải mã tranh ngoài luồng chính (`createImageBitmap`). |

Hệ quả: **thứ gì đổi theo từng khung hình** (camera, kính lúp, hoạt ảnh, lật trang) phải là **shared value** hoặc tính
trong worklet, **không bao giờ** là React state. React state chỉ dùng cho sự kiện rời rạc: tìm thấy, gợi ý, đồng hồ
mỗi giây, mở hộp thoại.

## 2. Luật cho đường vẽ (`board/render/`, `board/anim.ts`, `core/motion.ts`)

1. Mỗi hàm có `'worklet';` ở dòng đầu, và chỉ gọi worklet khác. Không chạm React state, ref hay hàm của hook. Không
   dùng `console.log` ở đường nóng.
2. **Không tạo Paint, Shader, Path, ColorFilter trong khung hình.** Tạo một lần trên JS thread: dùng chung thì đặt ở
   `scene/paints.ts` (`createBoardPaints`, `createLoupePaints`), riêng từng trang thì ở `scene/buildScene.ts` (lưu vào
   `SceneData` / `SceneSprite`). Renderer chỉ đổi alpha hay màu của paint có sẵn.
3. Recorder và picture tạm trong một khung phải `.dispose()` ngay trong khung đó (xem `frame.ts`). Picture đầu ra
   giữ tới khi khung kế thay thế (`Board` sở hữu một buffer ổn định); snapshot lật trang/warm-up chỉ giải phóng sau
   khi worklet đã bỏ chúng. Không giải phóng tài nguyên còn được scene, kính lúp hay trang đang lật dùng.
4. Vòng lặp trong render dùng `for (let i = 0; i < a.length; i++)`. Không dùng `.map`, `.filter`, spread hay tạo
   object mới cho **từng sprite** mỗi khung.
5. **Bỏ qua thứ nằm ngoài khung nhìn** (`inView` trong `book.ts`). Thứ mới được vẽ thì cũng phải tôn trọng phép cắt
   này.
6. **Sprite sheet** (`scene/spriteAtlas.ts`, `layOutAtlas` trong `buildScene.ts`): sprite thường được vẽ từ một ô của
   sheet, tức là một quad có texture, kể cả khi đang di chuyển. Nó phải vẽ lại từ **hình** (đắt hơn nhiều) khi: nằm trong
   kính lúp; zoom vượt mật độ sheet × `SHEET_STRETCH` (1.15); đang chớp mắt; là mực tàng hình; có `waterline`; hoặc đã
   tìm thấy mà có bộ phận động (cánh, đuôi, đốm sáng). Thêm hoạt ảnh **theo từng bộ phận** (như chớp mắt) cho vật đang
   ẩn sẽ đẩy nó ra khỏi sheet. Cân nhắc kỹ, và đo lại (mục 5).
7. Trên web, `BlendMode.Multiply` có thể khiến CanvasKit sao chép cả vùng đích **cho mỗi sprite**. Ô trong sheet vì vậy
   được vẽ trên nền trắng rồi dùng **Modulate**; Multiply và `saveLayer` cho từng sprite chỉ dùng khi sprite phải vẽ
   từ hình. `saveLayer` rất đắt. Hiện nó chỉ có ở: bóng tối ban đêm (`book.ts`), kính mờ (`loupe.ts`), đốm sáng và
   sprite vẽ từ hình (`sprites.ts`). Đừng thêm layer cho thứ vẽ mỗi khung nếu không bắt buộc.
8. **Hiệu ứng mới xuất hiện "lần đầu"** (dấu mới, radar kiểu mới, hiệu ứng lật…) sẽ làm GPU biên dịch shader và khựng
   một khung. Hãy thêm trạng thái đó vào `warmFrames()` trong `useWarmUp.ts`, để nó được vẽ ẩn trước khi người chơi
   gặp.
9. Thứ tự lớp trong `frame.ts` giữ theo z-index của bản web gốc (đã ghi trong comment). Lớp mới thì ghi rõ z của nó.

## 3. Luật cho dựng trang, cache, lật trang

1. Việc nặng trên JS thread (`prepare`, `buildScene`, `analyzeScene`) **không chạy trong hoạt ảnh lật trang**.
   `usePagesAround` ưu tiên dựng đích chưa có cache trong lúc giữ trang cũ đứng yên, thử lại khi ảnh tới (`version`).
   `usePageTurn` chỉ đọc scene đã dựng; bắt đầu đồng hồ 900 ms khi đích sẵn sàng rồi gọi `completeTurn`.
   Trang lân cận hẹn sau khi ổn định (`PREPARE_MS = 120`), mỗi lần một trang; đồng hồ vụ án dừng khi chờ/lật.
2. Cache có sẵn, hãy dùng, đừng tạo cache song song:
   - tranh đã giải mã: `images` (module-level, khóa `artIdOf`, tối đa `MAX_IMAGES = 5`);
   - phân tích tranh: `analyses` (khóa id trang, đọc pixel một lần);
   - trang đã dựng: `scenes`, chỉ dựng lại khi `loupe`, `compact` hoặc `density` đổi. `atlasDensity` làm tròn theo bước
     0.25 để thay đổi layout nhỏ không dựng lại sheet. **Đừng thêm dependency hay đổi liên tục vào các memo này.**
3. Trang sắp tới được **preload** (`GameScreen.preload`). Mở đường điều hướng mới (nhảy trang, đổi nước…) thì thêm đích
   vào `preload` để lật không bị khựng.
4. Ảnh của trang lân cận được vẽ thành 1 pixel vô hình mỗi khung (`F.warm`) để luôn nằm trên GPU. Danh sách này phải
   giữ **cùng một mảng** khi nội dung không đổi (xem `warmRef` trong `usePagesAround`), nếu không worklet khung hình sẽ
   bị dựng lại.
5. Giải mã tranh: native dùng `makeNonTextureImage()` trên JS thread (tránh giải mã lười ngay trên UI thread giữa lúc
   lật); web dùng `createImageBitmap`, sau đó copy pixel đã giải mã qua canvas 2D vào SkImage (CanvasKit tự giải mã
   sẽ khựng khoảng 40 ms mỗi trang). Không dùng lazy texture source cho tranh: surface CPU của snapshot không vẽ
   được loại ảnh đó; ảnh pixel còn dùng được trên context GPU riêng của snapshot. Đừng "đơn giản hóa" chỗ này.
6. Thứ tự hook trong `Board.tsx` là thứ tự effect chạy: `usePageTurn` đọc camera trong effect của nó. Không đảo thứ tự.
7. `useSceneLibrary.releaseUnused` giải phóng scene/atlas/tranh bị loại khỏi cache trên UI thread, sau khi mapper
   cập nhật. Giữ cả scene nguồn/đích của lượt lật và ảnh warm; đóng `ImageBitmap` sau khi SkImage được giải phóng.
8. Callback mỗi khung giữ identity bằng `useCallback`. Board và cuộn sát mép dừng dưới lớp phủ, chỉ bật lại
   khi chơi, warm-up hoặc hoạt ảnh lật thực sự chạy.
9. `scene/snapshotPage` raster hóa hai mặt giấy **một lần trước khi lật**, tối đa 2048 px mỗi chiều,
   trên một surface GPU dùng lại suốt phiên (không tạo thêm context cho mỗi lượt).
   Picture của mỗi mặt chỉ chứa một ảnh: các dải uốn và kính lúp không vẽ lại toàn bộ sprite/layer của scene.
   Picture giữ ảnh tới lúc hết lượt lật; wrapper ảnh tạm được giải phóng ngay sau khi ghi. Ảnh snapshot đổi sang
   pixel trước khi đưa qua context của Canvas; không replay texture thuộc context khác. Không raster hóa cả trang
   bằng surface CPU: các phép blend và lọc ảnh sẽ chặn JS lâu trước lượt lật.

## 4. Luật cho React

1. `GameScreen` render lại **mỗi giây** vì đồng hồ. `Board`, `QuestPanel`, `Desk`, `FloatingScores`, `SpriteIcon`
   là `React.memo`. `HUD` thì không, vì nó hiện đồng hồ, nhưng các phần con `PageSwitcher` và `Actions` thì có. Vì vậy
   props phải ổn định:
   - handler đọc state vụ án → `useStableCallback(kase.inspect)` (như `inspect`, `requestHint`);
   - handler đơn giản → `useCallback`;
   - mảng/object → `useMemo` (như `preload`, `nudgeTarget`, `albumPages`);
   - **không** truyền object, mảng hay arrow function viết inline vào component memo.
2. Tách component con bằng `React.memo` khi chỉ một phần cần render theo đồng hồ (`HUD.tsx` có `PageSwitcher`,
   `Actions`).
3. Đọc tiến độ bằng `progress.*`, vì nó lấy từ bản trong bộ nhớ. Không đọc thẳng `localStorage` (trên app đó là
   SQLite).
4. Mọi `setTimeout` / `setInterval` / listener đều phải dọn trong cleanup của effect.
5. Hộp thoại không có animation khi đóng (nền mờ còn sót sẽ nuốt thao tác chạm). Đang có hộp thoại thì Board phải
   `active={false}` (thêm điều kiện vào `boardActive` trong `GameScreen`).
6. Âm thanh: `sound.prepareVoices(...)` nạp sẵn giọng của trang; web mở AudioContext ở lần chạm đầu. Không phát âm
   thanh nặng ở lần chạm đầu tiên.

## 5. Đo đạc

Thay đổi đường vẽ, lật trang hay cache thì **đo trước và sau**:

```bash
cd app && npm run build:web                    # → app/dist
npx serve dist -l 8093                         # hoặc bất kỳ server tĩnh nào
node ../tools/benchmark-render.cjs http://127.0.0.1:8093 ../scratch/render-after.json
THROTTLE=4 node ../tools/benchmark-page-turn.cjs http://127.0.0.1:8093 ../scratch/turn-after.json
# WIDTH / HEIGHT / DPR chỉnh viewport (vd. WIDTH=844 HEIGHT=390 DPR=2 cho điện thoại ngang)
```

Kết quả để trong `scratch/` (đã gitignore). Báo con số trước/sau khi kết luận "nhanh hơn". Trên máy thật thì thử trong
Expo Go bằng `npm start`.

## 6. Dung lượng

### Ngân sách hiện tại
| Thứ | Hiện tại | Ghi chú |
|---|---|---|
| Tranh Singapore | 9 file WebP, 140–305 KB, tổng ≈ 2.0 MB | ~0.25 MB mỗi trang ngày; trang đêm 0 KB |
| Mặt bàn | ≈ 0.55 MB (`paper-wash.jpg` + 2 WebP) | |
| Âm thanh | 44 WAV ≈ 2.5 MB, **chỉ bản app** | web tổng hợp trực tiếp, không tải WAV |
| `generated/spriteArt.ts` | ≈ 250 KB cho 57 sprite (~4.4 KB mỗi sprite) | vector |
| JSON trang | ≈ 8 KB mỗi trang | |
| Font | 8 file (4 Playfair, 4 Lora) | |

### Luật
1. **Tranh trang** (quy cách đầy đủ: `docs/ai/art-style.md`): WebP 1760 × 1240, `cwebp -q 90 -alpha_q 100 -m 6`, ≤ 300 KB. Trang đêm dùng lại tranh ngày. Không
   commit PNG tranh (commit `e0d2a98` đã đổi PNG → WebP và giảm 3–5 lần).
2. **Ảnh khác**: WebP (có alpha) hoặc JPG (không alpha), cắt đúng kích thước hiển thị. Icon app và splash thì sinh bằng
   `npm run generate:icons`, không vẽ tay.
3. **Sprite là vector** trong `tools/sprites/ObjectSprite.tsx`. Không dùng ảnh bitmap cho sinh vật hay đồ vật.
4. **Âm thanh** không dùng file thu sẵn. Hiệu ứng mới là một hàm trong `platform/synth/`, giọng con vật thì dùng lại
   giọng có trong `VOICE_OF` khi có thể (mỗi giọng mới thêm ~30–100 KB WAV cho bản app).
5. **Icon Lucide**: chỉ export qua `ui/icons.ts`, mỗi icon một đường dẫn
   `lucide-react-native/icons/<tên>`. **Cấm** `import … from 'lucide-react-native'`: index của gói kéo theo khoảng 3.700
   icon, nặng vài MB.
6. **Font**: import theo từng weight (`@expo-google-fonts/lora/400Regular`), không import index của gói (20 file). Chỉ
   thêm weight khi thật sự cần.
7. **Thư viện**: hỏi trước khi thêm. Dùng `npx expo install`, chỉ module chạy được trong Expo Go. Không thêm thư viện
   tiện ích nặng (lodash, moment, …): viết hàm nhỏ trong `ui/format.ts` hay `core/`. Import sâu để tree-shake được.
8. **Tách theo nền tảng** bằng `x.native.ts` / `x.web.ts` để code và tài nguyên của nền tảng này không vào bundle của
   nền tảng kia (WAV chỉ được `sound.native.ts` import).
9. Không commit `dist/`, `dist-screens/`, `scratch/`, `public/canvaskit.wasm` (đã gitignore). `archive/web-vite.zip` là
   bản lưu trữ, không đụng tới.
